"use client";

import React, { useState, useRef, useEffect, useReducer, useCallback, useMemo } from "react";
import { ShoppingCart, Plus, Minus, X, Search, Home, ShoppingBag, Star, Truck, Shield, Clock, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/ollogo.svg";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../types";

import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import CheckoutModal from "./CheckoutModal";
import SkeletonLoader from "./SkeletonLoader";
import TestimonialSlider from "./Testimonialslider";
import { StatsStrip } from "./StatsStrip";
import UploadPrescriptionModal from "./UploadPrescriptionModal"; // Import the prescription modal

interface CartItem {
  productId: Product;
  quantity: number;
  bundleApplied?: boolean;
  originalPrice?: number;
  finalPrice?: number;
  discount?: number;
}

// Cart reducer types
type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "CLEAR_CART" }
  | { type: "CLEANUP_CART" };

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case "ADD_ITEM": {
      if (!action.payload?.productId?._id) {
        console.warn("Attempted to add item with invalid productId:", action.payload);
        return state;
      }
      const existingItem = state.find((item) => item?.productId?._id === action.payload.productId._id);
      if (existingItem) {
        return state.map((item) =>
          item?.productId?._id === action.payload.productId._id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      }
      return [...state, action.payload];
    }
    case "REMOVE_ITEM": {
      return state.filter((item) => item?.productId?._id !== action.payload);
    }
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return state.filter((item) => item?.productId?._id !== action.payload.id);
      }
      return state.map((item) =>
        item?.productId?._id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    }
    case "SET_CART": {
      return action.payload.filter((item) => item?.productId?._id);
    }
    case "CLEAR_CART": {
      return [];
    }
    case "CLEANUP_CART": {
      return state.filter((item) => item?.productId?._id);
    }
    default: {
      const _exhaustiveCheck: never = action;
      return state;
    }
  }
};

// Helper function for bundle pricing
const getProductBundleInfo = (productName: string, quantity: number, price: number) => {
  const lowerName = productName.toLowerCase();
  
  // Check for eggs
  if (lowerName.includes('egg')) {
    if (quantity >= 3) {
      const originalPrice = price * quantity;
      const discount = originalPrice * 0.05; // 5% off
      return {
        hasBundle: true,
        bundleName: "3 Eggs Bundle",
        discountPercentage: 5,
        originalPrice: originalPrice,
        finalPrice: originalPrice - discount,
        savedAmount: discount
      };
    }
  }
  
  // Check for noodles
  if (lowerName.includes('noodle')) {
    if (quantity >= 3) {
      const originalPrice = price * quantity;
      const discount = originalPrice * 0.05; // 5% off
      return {
        hasBundle: true,
        bundleName: "3 Noodles Bundle",
        discountPercentage: 5,
        originalPrice: originalPrice,
        finalPrice: originalPrice - discount,
        savedAmount: discount
      };
    }
  }
  
  // Check for sachet tomato
  if (lowerName.includes('tomato') && (lowerName.includes('sachet') || lowerName.includes('satchet'))) {
    if (quantity >= 10) {
      const originalPrice = price * quantity;
      const discount = originalPrice * 0.05; // 5% off
      return {
        hasBundle: true,
        bundleName: "10 Sachet Tomatoes Bundle",
        discountPercentage: 5,
        originalPrice: originalPrice,
        finalPrice: originalPrice - discount,
        savedAmount: discount
      };
    }
  }
  
  return {
    hasBundle: false,
    bundleName: "",
    discountPercentage: 0,
    originalPrice: price * quantity,
    finalPrice: price * quantity,
    savedAmount: 0
  };
};

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  prescription?: File | null;
  deliveryOption: "express" | "timeframe" | "pickup" | "" | "nil";
  pickupLocation: string;
  deliveryAddress: string;
  timeSlot: "12 PM" | "4 PM" | "9 PM" | "6 AM" | "" | "nil";
  isUIAddress: boolean;
  transactionNumber: string;
}

const supermarketCategories = [
  "All Products",
  "Supermarket"
];

const pharmacyCategories = [
  "Pain Reliever",
  "Anti Malaria",
  "Cough and Cold",
  "Digestive Health",
  "Skin Care",
  "Baby Care",
  "Sexual Health"
];

const PharmacyApp: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All Products");
  const [viewMode, setViewMode] = useState<"Pharmacy" | "Supermarket">("Supermarket");
  const [cart, cartDispatch] = useReducer(cartReducer, []);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    prescription: null,
    deliveryOption: "",
    pickupLocation: "",
    deliveryAddress: "",
    timeSlot: "",
    isUIAddress: false,
    transactionNumber: "",
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [orderComplete, setOrderComplete] = useState<boolean>(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All Products"]);
  const [isUnauthenticatedModalOpen, setIsUnauthenticatedModalOpen] = useState<boolean>(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  // State for prescription upload modal
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState<boolean>(false);

  const UnauthenticatedModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setIsUnauthenticatedModalOpen(false);
        }
      };

      if (isUnauthenticatedModalOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [isUnauthenticatedModalOpen]);

    if (!isUnauthenticatedModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Sign In Required</h2>
            <button
              onClick={() => setIsUnauthenticatedModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform duration-200"
              aria-label="Close modal"
            >
              <X size={24} className="text-red-500" />
            </button>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 mb-6">
            <p className="text-gray-700 text-lg text-center">
              Please sign in to add items to your cart and proceed with your purchase.
            </p>
          </div>
          <div className="flex justify-between space-x-4">
            <button
              onClick={() => setIsUnauthenticatedModalOpen(false)}
              className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 py-3.5 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 active:scale-[0.98] transition-all duration-200 shadow-sm"
              aria-label="Go back"
            >
              Back
            </button>
            <button
              onClick={() => {
                setIsUnauthenticatedModalOpen(false);
                router.push("/pages/signin");
              }}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3.5 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/25"
              aria-label="Sign in now"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openQuantityModal = (product: Product) => {
    if (!user) {
      setIsUnauthenticatedModalOpen(true);
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setIsQuantityModalOpen(true);
  };

  useEffect(() => {
    setCustomerInfo((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
    }));
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data }: { data: Product[] } = await api.get("/api/products");
        setProducts(data);

        const supermarketCategoriesSet = new Set<string>(
          data
            .filter((product) => supermarketCategories.includes(product.category || ""))
            .map((product) => product.category!)
        );
        
        const uniqueCategories = ["All Products", ...Array.from(supermarketCategoriesSet)];
        setCategories(uniqueCategories);

        // Set featured products (top 4)
        const featured = data
          .filter(p => p.category && supermarketCategories.includes(p.category))
          .slice(0, 4);
        setFeaturedProducts(featured);
      } catch (error: any) {
        console.error("Error fetching products:", error.message || "Unknown error");
      }
    };
    fetchProducts();
  }, []);

  const calculateDeliveryTime = (orderTime: Date, deliveryOption: string, timeSlot: string): string => {
    if (deliveryOption === "express") {
      const expressTime = new Date(orderTime.getTime() + 60 * 60 * 1000);
      return expressTime.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else if (deliveryOption === "timeframe" && timeSlot) {
      const currentDate = new Date(orderTime);
      const [hour, period] = timeSlot.split(" ");
      let hour24 = parseInt(hour);
      if (period === "PM" && hour24 !== 12) hour24 += 12;
      if (period === "AM" && hour24 === 12) hour24 = 0;

      const slotTime = new Date(currentDate);
      slotTime.setHours(hour24, 0, 0, 0);

      if (slotTime <= orderTime) {
        slotTime.setDate(slotTime.getDate() + 1);
      }

      return slotTime.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else if (deliveryOption === "pickup") {
      return "Pickup scheduled upon confirmation";
    }
    return "";
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (viewMode === "Supermarket") {
      result = products.filter(
        (product) => product.category && supermarketCategories.includes(product.category)
      );
    } else {
      result = products.filter(
        (product) => product.category && pharmacyCategories.includes(product.category)
      );
    }

    if (selectedCategory !== "All Products" && selectedCategory !== "All Category") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    return result;
  }, [products, viewMode, selectedCategory]);

  const searchedProducts = useMemo(() => {
    return searchQuery
      ? filteredProducts.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredProducts;
  }, [filteredProducts, searchQuery]);

  const cartTotal = cart.reduce((total, item) => {
    const bundleInfo = getProductBundleInfo(item.productId.name, item.quantity, item.productId.price);
    return total + bundleInfo.finalPrice;
  }, 0);

  const totalSavings = cart.reduce((total, item) => {
    const bundleInfo = getProductBundleInfo(item.productId.name, item.quantity, item.productId.price);
    return total + bundleInfo.savedAmount;
  }, 0);

  const deliveryFee = cartTotal > 0
    ? customerInfo.deliveryOption === "express"
      ? 1500
      : customerInfo.deliveryOption === "timeframe" && cartTotal < 5000
      ? 500
      : 0
    : 0;
  const grandTotal = cartTotal + deliveryFee;

  const handleAddToCart = async () => {
    if (selectedProduct && quantity > 0) {
      try {
        const bundleInfo = getProductBundleInfo(selectedProduct.name, quantity, selectedProduct.price);
        
        const { data } = await api.post("/api/cart/add", {
          productId: selectedProduct._id,
          quantity,
          bundleApplied: bundleInfo.hasBundle,
          originalPrice: bundleInfo.originalPrice,
          finalPrice: bundleInfo.finalPrice,
          discount: bundleInfo.savedAmount
        });
        
        cartDispatch({
          type: "ADD_ITEM",
          payload: { 
            productId: selectedProduct, 
            quantity,
            bundleApplied: bundleInfo.hasBundle,
            originalPrice: bundleInfo.originalPrice,
            finalPrice: bundleInfo.finalPrice,
            discount: bundleInfo.savedAmount
          },
        });
        
        setIsQuantityModalOpen(false);
        setSelectedProduct(null);
        setQuantity(1);
      } catch (error: any) {
        alert("Error: " + (error.message || "Failed to add to cart"));
      }
    }
  };

  const submitOrder = async (customerInfo: CustomerInfo) => {
    if (!user) {
      setIsUnauthenticatedModalOpen(true);
      return;
    }

    if (!customerInfo.deliveryOption || !customerInfo.phone || (!customerInfo.deliveryAddress && customerInfo.deliveryOption !== "pickup") || (customerInfo.deliveryOption === "timeframe" && !customerInfo.timeSlot) || !customerInfo.transactionNumber) {
      alert("Please complete all required checkout fields.");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    let prescriptionUrl = "";
    if (customerInfo.prescription) {
      const formData = new FormData();
      formData.append("prescription", customerInfo.prescription);
      try {
        const res = await fetch("https://ollanbackend.vercel.app/api/orders/upload-prescription", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to upload prescription");
        }
        prescriptionUrl = data.prescriptionUrl;
      } catch (error: any) {
        console.error("Prescription upload error:", error);
        alert("Error uploading prescription: " + (error.message || "Unknown error"));
        setIsProcessing(false);
        setIsCheckoutOpen(false);
        return;
      }
    }

    const orderTime = new Date();
    const estimatedDeliveryTime = calculateDeliveryTime(orderTime, customerInfo.deliveryOption, customerInfo.timeSlot);
    setEstimatedDelivery(estimatedDeliveryTime);

    const payload = {
      customerInfo: {
        ...customerInfo,
        estimatedDelivery: estimatedDeliveryTime,
      },
      items: cart.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
        bundleApplied: item.bundleApplied,
        finalPrice: getProductBundleInfo(item.productId.name, item.quantity, item.productId.price).finalPrice
      })),
      cartTotal,
      deliveryFee,
      grandTotal,
      totalSavings,
      prescriptionUrl,
    };

    try {
      const { data } = await api.post("/api/orders/create", payload);
      console.log("Order created successfully:", data);
      setIsProcessing(false);
      setOrderComplete(true);
      cartDispatch({ type: "CLEAR_CART" });
      setIsCheckoutOpen(false);
      setCustomerInfo({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        prescription: null,
        deliveryOption: "",
        pickupLocation: "",
        deliveryAddress: "",
        timeSlot: "",
        isUIAddress: false,
        transactionNumber: "",
      });
      alert("Order submitted successfully! We will verify your bank transfer and contact you.");
    } catch (error: any) {
      console.error("Create order error:", error);
      alert("Error creating order: " + (error.message || "Unknown error"));
      setIsProcessing(false);
      setIsCheckoutOpen(false);
    }
  };

  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleInputChange = useCallback(
    debounce((key: keyof CustomerInfo, value: string) => {
      setCustomerInfo((prev) => ({ ...prev, [key]: value }));
    }, 300),
    []
  );

  const handleSearchInputChange = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const QuantityModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setIsQuantityModalOpen(false);
          setSelectedProduct(null);
          setQuantity(1);
        }
      };

      if (isQuantityModalOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [isQuantityModalOpen]);

    if (!isQuantityModalOpen || !selectedProduct) return null;

    const bundleInfo = getProductBundleInfo(selectedProduct.name, quantity, selectedProduct.price);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div ref={modalRef} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add to Cart</h2>
            <button
              onClick={() => {
                setIsQuantityModalOpen(false);
                setSelectedProduct(null);
                setQuantity(1);
              }}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close modal"
            >
              <X size={24} className="text-red-500" />
            </button>
          </div>
          <div className="mb-6 flex items-center gap-6">
            <div className="h-28 w-28 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 shadow-inner">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{selectedProduct.description}</p>
              <p className="text-2xl font-bold text-red-500">
                ₦{selectedProduct.price.toLocaleString()}
              </p>
              {selectedProduct.stock > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">In Stock</span>
                </div>
              )}
            </div>
          </div>
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">Select Quantity:</p>
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded-full border-2 border-red-500 p-3 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus size={20} />
              </button>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{quantity}</div>
                <div className="text-sm text-gray-500 mt-1">items</div>
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="rounded-full bg-gradient-to-r from-red-500 to-orange-500 p-3 text-white hover:from-red-600 hover:to-orange-600 transition-all duration-200 active:scale-95 shadow-lg shadow-red-500/25"
                aria-label="Increase quantity"
              >
                <Plus size={20} />
              </button>
            </div>
            
            {/* Bundle Information */}
            {bundleInfo.hasBundle && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-bold text-green-700 text-sm">Bundle Offer Applied!</span>
                </div>
                <p className="text-green-600 text-sm mb-1">
                  {bundleInfo.bundleName} - {bundleInfo.discountPercentage}% OFF
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600 text-sm line-through">
                    ₦{bundleInfo.originalPrice.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-700 text-lg">
                      ₦{bundleInfo.finalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Save ₦{bundleInfo.savedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bundle Requirements */}
            {!bundleInfo.hasBundle && (
              <div className="mt-4">
                {selectedProduct.name.toLowerCase().includes('egg') && quantity < 3 && (
                  <p className="text-sm text-amber-600 text-center">
                    Add {3 - quantity} more egg(s) for 5% bundle discount
                  </p>
                )}
                {selectedProduct.name.toLowerCase().includes('noodle') && quantity < 3 && (
                  <p className="text-sm text-amber-600 text-center">
                    Add {3 - quantity} more noodle(s) for 5% bundle discount
                  </p>
                )}
                {selectedProduct.name.toLowerCase().includes('tomato') && 
                 (selectedProduct.name.toLowerCase().includes('sachet') || 
                  selectedProduct.name.toLowerCase().includes('satchet')) && 
                 quantity < 10 && (
                  <p className="text-sm text-amber-600 text-center">
                    Add {10 - quantity} more sachet tomato(es) for 5% bundle discount
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 py-4 rounded-xl font-bold text-white hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/25"
            aria-label={`Add ${selectedProduct.name} to cart`}
          >
            {bundleInfo.hasBundle ? (
              <>
                Add to Cart • <span className="line-through text-white/70 mr-1">
                  ₦{bundleInfo.originalPrice.toLocaleString()}
                </span>
                ₦{bundleInfo.finalPrice.toLocaleString()}
              </>
            ) : (
              `Add to Cart • ₦${(selectedProduct.price * quantity).toLocaleString()}`
            )}
          </button>
        </div>
      </div>
    );
  };

  const CartModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setIsCartOpen(false);
        }
      };

      if (isCartOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    const removeFromCart = async (productId: string) => {
      try {
        const { data } = await api.delete(`/api/cart/remove/${productId}`);
        cartDispatch({ type: "REMOVE_ITEM", payload: productId });
      } catch (error: any) {
        alert("Error: " + (error.message || "Failed to remove item"));
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex">
        <div className="ml-auto">
          <div ref={modalRef} className="bg-white h-full w-full max-w-lg overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </p>
                  {totalSavings > 0 && (
                    <p className="text-green-600 text-sm mt-1 font-medium">
                      Total Savings: ₦{totalSavings.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-full active:scale-95 transition-all duration-200"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <ShoppingCart size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-8">Add some items to get started!</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all duration-200"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {cart
                      .filter((item) => item?.productId)
                      .map((item) => {
                        const bundleInfo = getProductBundleInfo(item.productId.name, item.quantity, item.productId.price);
                        const displayPrice = bundleInfo.finalPrice;
                        
                        return (
                          <div key={item.productId._id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-2">
                                <img
                                  src={`${item?.productId?.image}`}
                                  alt={item?.productId?.name || "Product"}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-bold text-gray-900 mb-1">{item?.productId?.name || "Unknown Product"}</h3>
                                  {bundleInfo.hasBundle && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      Bundle Save
                                    </span>
                                  )}
                                </div>
                                
                                {bundleInfo.hasBundle ? (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500 text-sm line-through">
                                        ₦{bundleInfo.originalPrice.toLocaleString()}
                                      </span>
                                      <span className="text-red-500 font-bold text-lg">
                                        ₦{displayPrice.toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-xs text-green-600">
                                      You saved ₦{bundleInfo.savedAmount.toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-red-500 font-bold text-lg mb-3">
                                    ₦{displayPrice.toLocaleString()}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full px-4 py-2">
                                    <button
                                      onClick={() =>
                                        cartDispatch({
                                          type: "UPDATE_QUANTITY",
                                          payload: { id: item.productId._id, quantity: item.quantity - 1 },
                                        })
                                      }
                                      className="p-1 hover:bg-white rounded-full active:scale-95 transition-all duration-200"
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="font-bold text-gray-900 min-w-[24px] text-center">{item.quantity}</span>
                                    <button
                                      onClick={() =>
                                        cartDispatch({
                                          type: "UPDATE_QUANTITY",
                                          payload: { id: item.productId._id, quantity: item.quantity + 1 },
                                        })
                                      }
                                      className="p-1 hover:bg-white rounded-full active:scale-95 transition-all duration-200"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.productId._id)}
                                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl active:scale-95 transition-all duration-200"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                    <div className="space-y-4">
                      {totalSavings > 0 && (
                        <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                          <span className="text-green-600 font-medium">Total Savings</span>
                          <span className="font-bold text-green-700">-₦{totalSavings.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-bold text-gray-900">₦{cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-bold text-gray-900">
                          {deliveryFee === 0 ? "Free" : `₦${deliveryFee.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-red-500">₦{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/25"
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OrderCompleteModal = () => {
    if (!orderComplete) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-green-600 mb-3">Order Submitted!</h2>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4">
              Your order has been submitted successfully. We will verify your bank transfer and contact you to confirm your order.
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock size={16} />
              <span className="font-medium">
                {customerInfo.deliveryOption === "pickup" 
                  ? "Ready for pickup" 
                  : `Delivery: ${estimatedDelivery}`}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="flex-1">
              <button className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 py-3.5 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 active:scale-[0.98] transition-all duration-200">
                Continue Shopping
              </button>
            </Link>
            <Link href="/pages/orders" className="flex-1">
              <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3.5 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/25">
                View Orders
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between w-full">
            <Link href="/pages/home">
              <div className="p-2">
                <Image src={logo} alt="Ollan Logo" width={80} height={80} className="lg:w-20 w-12" />
              </div>
            </Link>
            <div className="flex gap-1 bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 rounded-full shadow-inner">
              <button
                className={`lg:px-8 lg:py-3 px-6 py-2.5 rounded-full font-bold transition-all duration-300 active:scale-95 ${
                  viewMode === "Supermarket"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-transparent text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
                onClick={() => {
                  setViewMode("Supermarket");
                  setSelectedCategory("All Products");
                }}
                aria-label="Switch to Supermarket view"
              >
                <span className="flex text-sm lg:text-base items-center gap-2">
                  <ShoppingBag size={18} />
                  <span className="hidden lg:inline">Supermarket</span>
                  <span className="lg:hidden">Market</span>
                </span>
              </button>
              <button
                className={`lg:px-8 lg:py-3 px-6 py-2.5 rounded-full font-bold transition-all duration-300 active:scale-95 ${
                  viewMode === "Pharmacy"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-transparent text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
                onClick={() => {
                  setViewMode("Pharmacy");
                  setSelectedCategory("All Category");
                }}
                aria-label="Switch to Pharmacy view"
              >
                <span className="flex text-sm lg:text-base items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="hidden lg:inline">Pharmacy</span>
                  <span className="lg:hidden">Pharm</span>
                </span>
              </button>
            </div>
            
            {/* Right side buttons - Cart and Prescription Upload */}
            <div className="flex items-center gap-3">
              {/* Prescription Upload Button - Only visible in Pharmacy mode */}
              {viewMode === "Pharmacy" && (
                <button
                  onClick={() => {
                    if (!user) {
                      setIsUnauthenticatedModalOpen(true);
                      return;
                    }
                    setIsPrescriptionModalOpen(true);
                  }}
                  className="relative group"
                  aria-label="Upload prescription"
                >
                 
                </button>
              )}
              
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30 group"
                aria-label="Open cart"
              >
                <div className="relative">
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg border-2 border-white">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-center">
            Your <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Groceries</span> Delivered
          </h1>
          <p className="text-gray-600 text-center text-lg max-w-2xl mx-auto">
            Fresh groceries and pharmacy essentials delivered to your doorstep in minutes
          </p>
        </div>

        <div>
          <StatsStrip/>
        </div>

        {/* Pharmacy Category Pills - Only show in Pharmacy mode */}
        {viewMode === "Pharmacy" && (
          <div className="mb-8">
            <div className="flex flex-col items-left justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Pharmacy Categories</h2>
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 my-5"
              >
                <FileText size={16} />
                Upload Prescription
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pharmacyCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {selectedCategory === "All Products" || selectedCategory === "All Category"
                ? "All Products"
                : selectedCategory}
            </h3>
            <span className="text-gray-500">{filteredProducts.length} items</span>
          </div>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {filteredProducts.map((product) => {
                const hasBundle = product.name.toLowerCase().includes('egg') || 
                  product.name.toLowerCase().includes('noodle') ||
                  (product.name.toLowerCase().includes('tomato') && 
                   (product.name.toLowerCase().includes('sachet') || 
                    product.name.toLowerCase().includes('satchet')));
                
                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 
                               border border-gray-100 hover:border-red-100 group
                               flex flex-col h-full"
                  >
                    {/* Image container - fixed height */}
                    <div className="w-full h-40 rounded-lg mb-4 flex items-center justify-center 
                                  group-hover:from-red-50 group-hover:to-orange-50 
                                  transition-all duration-300">
                      <img
                        src={`${product.image}`}
                        alt={product.name}
                        className="h-40 w-40 object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Content area - grows to push button down */}
                    <div className="flex flex-col flex-grow px-2 pb-4">
                      <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm lg:text-base">
                        {product.name}
                      </h4>

                      <div className="flex items-center justify-between mt-auto">
                        <p className="text-lg font-bold text-red-500">
                          ₦{product?.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {product.stock > 0 ? (
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          )}
                          {hasBundle && product.stock > 0 && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                          )}
                        </div>
                      </div>

                      {hasBundle && product.stock > 0 && (
                        <div className="mt-2">
                          {product.name.toLowerCase().includes('egg') && (
                            <p className="text-xs text-blue-600 font-medium">
                              🎁 Buy 3+ for 5% off
                            </p>
                          )}
                          {product.name.toLowerCase().includes('noodle') && (
                            <p className="text-xs text-blue-600 font-medium">
                              🎁 Buy 3+ for 5% off
                            </p>
                          )}
                          {(product.name.toLowerCase().includes('tomato') && 
                            (product.name.toLowerCase().includes('sachet') || 
                             product.name.toLowerCase().includes('satchet'))) && (
                            <p className="text-xs text-blue-600 font-medium">
                              🎁 Buy 10+ for 5% off
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Button always at bottom */}
                    <button
                      onClick={() => openQuantityModal(product)}
                      disabled={product.stock === 0}
                      className={`mx-2 mb-2 py-2.5 rounded-lg font-semibold text-sm 
                                  transition-all duration-300 active:scale-95 ${
                        product.stock > 0
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      aria-label={product.stock > 0 ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <SkeletonLoader/>
            </div>
          )}
        </div>

        <div>
          <TestimonialSlider/>
        </div>
      </main>
    
      <QuantityModal />
      <CartModal />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
        cartTotal={cartTotal}
        deliveryFee={deliveryFee}
        grandTotal={grandTotal}
        estimatedDelivery={estimatedDelivery}
        isProcessing={isProcessing}
        submitOrder={submitOrder}
        cart={cart}
      />
      <OrderCompleteModal />
      <UnauthenticatedModal />
      
      {/* Prescription Upload Modal */}
      <UploadPrescriptionModal 
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />
    </div>
  );
};

export default PharmacyApp;
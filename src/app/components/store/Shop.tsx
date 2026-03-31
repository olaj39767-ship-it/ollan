"use client";

import React, { useState, useRef, useEffect, useReducer, useCallback, useMemo } from "react";
import { ShoppingCart, Plus, Minus, X, ShoppingBag, Clock, FileText, Loader2, LogIn, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../../public/ollogo.svg";
import { useAuth } from "../../../context/AuthContext";
import { Product } from "../../../types";

import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import CheckoutModal from "./CheckoutModal";
import SkeletonLoader from "../SkeletonLoader";
import TestimonialSlider from "../Testimonialslider";
import { StatsStrip } from "../StatsStrip";
import UploadPrescriptionModal from "../UploadPrescriptionModal";

interface CartItem {
  productId: string;
  name?: string;
  price?: number;
  image?: string;
  quantity: number;
  unit?: "kg" | "congo";
  bundleApplied?: boolean;
  originalPrice?: number;
  finalPrice?: number;
  discount?: number;
}

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
      if (!action.payload?.productId) return state;
      const existingItem = state.find((item) => item.productId === action.payload.productId);
      if (existingItem) {
        return state.map((item) =>
          item.productId === action.payload.productId
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      }
      return [...state, action.payload];
    }
    case "REMOVE_ITEM": {
      return state.filter((item) => item.productId !== action.payload);
    }
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return state.filter((item) => item.productId !== action.payload.id);
      }
      return state.map((item) =>
        item.productId === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    }
    case "SET_CART": return action.payload.filter((item) => item.productId);
    case "CLEAR_CART": return [];
    case "CLEANUP_CART": return state.filter((item) => item.productId);
    default: return state;
  }
};

// Congo helpers
const CONGO_KG_MAP: { keyword: string; kgPerCongo: number }[] = [
  { keyword: "rice", kgPerCongo: 1.6 },
  { keyword: "garri", kgPerCongo: 1.1 },
  { keyword: "beans", kgPerCongo: 1.5 },
];

const getCongoKg = (productName: string): number | null => {
  const lower = productName.toLowerCase();
  for (const entry of CONGO_KG_MAP) {
    if (lower.includes(entry.keyword)) return entry.kgPerCongo;
  }
  return null;
};

const congoPriceFromKgPrice = (pricePerKg: number, kgPerCongo: number): number =>
  pricePerKg * kgPerCongo;

const SIGNED_IN_DISCOUNT = 0;

const applyUserDiscount = (price: number, isSignedIn: boolean): number => {
  if (!isSignedIn || SIGNED_IN_DISCOUNT === 0) return price;
  return price * (1 - SIGNED_IN_DISCOUNT);
};

const getProductBundleInfo = (productName: string, quantity: number, price: number) => {
  const lowerName = productName.toLowerCase();

  if (lowerName.includes("egg") && quantity >= 3) {
    const originalPrice = price * quantity;
    const discount = originalPrice * 0.05;
    return { hasBundle: true, bundleName: "3 Eggs Bundle", discountPercentage: 5, originalPrice, finalPrice: originalPrice - discount, savedAmount: discount };
  }
  if (lowerName.includes("noodle") && quantity >= 3) {
    const originalPrice = price * quantity;
    const discount = originalPrice * 0.05;
    return { hasBundle: true, bundleName: "3 Noodles Bundle", discountPercentage: 5, originalPrice, finalPrice: originalPrice - discount, savedAmount: discount };
  }
  if (lowerName.includes("tomato") && (lowerName.includes("sachet") || lowerName.includes("satchet")) && quantity >= 10) {
    const originalPrice = price * quantity;
    const discount = originalPrice * 0.05;
    return { hasBundle: true, bundleName: "10 Sachet Tomatoes Bundle", discountPercentage: 5, originalPrice, finalPrice: originalPrice - discount, savedAmount: discount };
  }
  return { hasBundle: false, bundleName: "", discountPercentage: 0, originalPrice: price * quantity, finalPrice: price * quantity, savedAmount: 0 };
};

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  prescription?: File | null;
  deliveryOption: "express" | "timeframe" | "pickup" | "" | "nil";
  pickupLocation: string;
  deliveryAddress: string;
  timeSlot?: "12 PM" | "4 PM" | "9 PM" | "6 AM" | "" | "nil";
  isUIAddress: boolean;
  transactionNumber: string;
  orderId?: string;
  paymentScreenshot?: File | null;
  referralCode?: string;
  promoCode?: string;
  storeCreditUsed?: number;
  [key: string]: any;
}

const supermarketCategories = ["All Products", "Supermarket"];

const pharmacyCategories = [
  "Pain Reliever", "Anti Malaria", "Cough and Cold", "Digestive Health",
  "Skin Care", "Baby Care", "Sexual Health", "Vitamins and Supplements",
];

// Business Hours Helper Functions
const isWithinBusinessHours = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;
  
  if (isWeekend) {
    // Weekend: 8am (8:00) to 6pm (18:00)
    const weekendStart = 8 * 60; // 8:00 AM
    const weekendEnd = 18 * 60; // 6:00 PM
    return currentTimeInMinutes >= weekendStart && currentTimeInMinutes < weekendEnd;
  } else {
    // Weekday: 8am (8:00) to 10pm (22:00)
    const weekdayStart = 8 * 60; // 8:00 AM
    const weekdayEnd = 22 * 60; // 10:00 PM
    return currentTimeInMinutes >= weekdayStart && currentTimeInMinutes < weekdayEnd;
  }
};

const getBusinessStatusMessage = (): string => {
  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  
  if (isWeekend) {
    return "⏰ Open: Weekends 8am - 6pm";
  } else {
    return "⏰ Open: Weekdays 8am - 10pm";
  }
};

const PharmacyApp: React.FC = () => {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All Products");
  const [viewMode, setViewMode] = useState<"Pharmacy" | "Supermarket">("Supermarket");
  const [cart, cartDispatch] = useReducer(cartReducer, []);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<"kg" | "congo">("kg");
  const nextSectionRef = useRef<HTMLDivElement | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "", email: "", phone: "", prescription: null,
    deliveryOption: "", pickupLocation: "", deliveryAddress: "",
    timeSlot: "", isUIAddress: false, transactionNumber: "",
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [orderComplete, setOrderComplete] = useState<boolean>(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All Products"]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState<boolean>(false);

  // Store Credit
  const [useStoreCredit, setUseStoreCredit] = useState<boolean>(false);
  user?.name ? user.name.split(" ")[0] : "Guest";
  const isLoggedIn = !!user;

  // Business Hours State
  const [isOpen, setIsOpen] = useState<boolean>(isWithinBusinessHours());
  const [businessStatusMessage, setBusinessStatusMessage] = useState<string>(getBusinessStatusMessage());

  // Check business hours every minute
  useEffect(() => {
    const checkBusinessHours = () => {
      setIsOpen(isWithinBusinessHours());
      setBusinessStatusMessage(getBusinessStatusMessage());
    };
    
    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Open quantity modal
  const openQuantityModal = (product: Product) => {
    if (!isOpen) {
      alert(`Sorry, we're currently closed. ${businessStatusMessage}`);
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedUnit("kg");
    setIsQuantityModalOpen(true);
  };

  useEffect(() => {
    setCustomerInfo((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
    }));
  }, [user]);

  // Add this useEffect in PharmacyApp, after the existing useEffects:
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const fetchFreshCredit = async () => {
      try {
        const { data } = await api.get("/api/user/me");
        const updated = {
          ...user!,
          storeCredit: data.storeCredit ?? 0,
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to refresh store credit:", err);
      }
    };

    fetchFreshCredit();
  }, [isLoggedIn]); // runs once when logged-in status is known

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data }: { data: Product[] } = await api.get("/api/products");
        setProducts(data);

        const supermarketSet = new Set(
          data
            .filter((p) => supermarketCategories.includes(p.category || ""))
            .map((p) => p.category!)
        );
        setCategories(["All Products", ...Array.from(supermarketSet)]);

        setFeaturedProducts(
          data.filter((p) => p.category && supermarketCategories.includes(p.category)).slice(0, 4)
        );
      } catch (error: any) {
        console.error("Error fetching products:", error.message || "Unknown error");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  
  const availableStoreCredit = user?.storeCredit || 0;
  const displayName = user?.name ? user.name.split(" ")[0] : "Guest";

  const calculateDeliveryTime = (orderTime: Date, deliveryOption: string): string => {
    if (deliveryOption === "express") {
      const expressTime = new Date(orderTime.getTime() + 60 * 60 * 1000);
      return expressTime.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, day: "numeric", month: "short", year: "numeric" });
    } else if (deliveryOption === "timeframe") {
      return "Delivery scheduled within your selected timeframe";
    } else if (deliveryOption === "pickup") {
      return "Pickup scheduled upon confirmation";
    }
    return "";
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (viewMode === "Supermarket") {
      result = products.filter((p) => p.category && supermarketCategories.includes(p.category));
    } else {
      result = products.filter((p) => p.category && pharmacyCategories.includes(p.category));
    }
    if (selectedCategory !== "All Products" && selectedCategory !== "All Category") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    return result;
  }, [products, viewMode, selectedCategory]);

  const searchedProducts = useMemo(() => {
    return searchQuery
      ? filteredProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : filteredProducts;
  }, [filteredProducts, searchQuery]);

  const cartTotal = cart.reduce((total, item) => {
    const bundleInfo = getProductBundleInfo(item.name || "", item.quantity, item.price || 0);
    return total + (bundleInfo.finalPrice || 0);
  }, 0);

  const finalGrandTotal = useMemo(() => {
    let total = cartTotal;
    if (useStoreCredit && availableStoreCredit > 0) {
      total = Math.max(0, total - availableStoreCredit);
    }
    return total;
  }, [cartTotal, useStoreCredit, availableStoreCredit]);

  const totalSavings = cart.reduce((total, item) => {
    const bundleInfo = getProductBundleInfo(item.name || "", item.quantity, item.price || 0);
    return total + (bundleInfo.savedAmount || 0);
  }, 0);

  const deliveryFee = 0;

  const handleAddToCart = async () => {
    if (!isOpen) {
      alert(`Sorry, we're currently closed. ${businessStatusMessage}`);
      setIsQuantityModalOpen(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedUnit("kg");
      return;
    }
    
    if (!selectedProduct || quantity <= 0 || isAddingToCart) return;
    setIsAddingToCart(true);

    try {
      const congoKg = getCongoKg(selectedProduct.name);
      const effectiveUnitPrice =
        selectedUnit === "congo" && congoKg !== null
          ? congoPriceFromKgPrice(selectedProduct.price, congoKg)
          : selectedProduct.price;

      const bundleInfo = getProductBundleInfo(selectedProduct.name, quantity, effectiveUnitPrice);
      const discountedFinal = applyUserDiscount(bundleInfo.finalPrice, isLoggedIn);

      cartDispatch({
        type: "ADD_ITEM",
        payload: {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          price: effectiveUnitPrice,
          image: selectedProduct.image,
          quantity,
          unit: selectedUnit,
          bundleApplied: bundleInfo.hasBundle,
          originalPrice: bundleInfo.originalPrice,
          finalPrice: discountedFinal,
          discount: bundleInfo.savedAmount,
        },
      });

      setIsQuantityModalOpen(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedUnit("kg");
    } catch (error: any) {
      alert("Error: " + (error.message || "Failed to add to cart"));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    cartDispatch({ type: "REMOVE_ITEM", payload: productId });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    cartDispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity: newQuantity } });
  };

  const submitOrder = async (info: CustomerInfo) => {
    if (!isOpen) {
      alert(`Sorry, we're currently closed. ${businessStatusMessage}`);
      return;
    }
    
    setIsSubmittingOrder(true);
    setIsProcessing(true);

    try {
      const orderTime = new Date();
      const estimatedDeliveryTime = calculateDeliveryTime(orderTime, info.deliveryOption);
      setEstimatedDelivery(estimatedDeliveryTime);

      // ✅ Use info.storeCreditUsed which is computed and passed in from CheckoutModal
      const storeCreditToUse = info.storeCreditUsed ?? 0;

      const payload = {
        customerInfo: {
          name: info.name?.trim() || user?.name || "Guest",
          email: info.email?.trim() || user?.email || "",
          phone: info.phone.trim(),
          deliveryOption: info.deliveryOption,
          deliveryAddress: info.deliveryOption !== "pickup"
            ? info.deliveryAddress?.trim() || null
            : null,
          pickupLocation: info.pickupLocation?.trim() || null,
          timeSlot: info.timeSlot?.trim() || null,
          transactionNumber: info.transactionNumber.trim(),
          estimatedDelivery: estimatedDeliveryTime,
        },
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        prescriptionUrl: "",
        referralCode: info.referralCode || undefined,
        storeCreditApplied: useStoreCredit, // boolean — backend reads the real amount from DB
      };

      const response = await api.post("/api/orders/create", payload);
      if (response.data.storeCreditApplied) {
        try {
          const { data: freshUser } = await api.get("/api/users/me");
          const updated = {
            id: freshUser._id,
            name: freshUser.name,
            email: freshUser.email,
            role: freshUser.role,
            referralCode: freshUser.referralCode,
            storeCredit: freshUser.storeCredit,  // ← fresh from DB
          };
          setUser(updated);                                    // update context
          localStorage.setItem('user', JSON.stringify(updated)); // sync localStorage
        } catch (err) {
          console.error('Failed to refresh user:', err);
        }
      }
      if (storeCreditToUse > 0) {
        alert(`✅ Order placed!\n\n₦${storeCreditToUse.toLocaleString()} store credit deducted.`);
      } else {
        alert("✅ Order submitted! We will verify your payment.");
      }

      setOrderComplete(true);
      cartDispatch({ type: "CLEAR_CART" });
      setIsCheckoutOpen(false);
      setUseStoreCredit(false);

    } catch (error: any) {
      console.error("Order error:", error.response?.data || error);
      alert("Error: " + (error.response?.data?.message || error.message || "Unknown error"));
    } finally {
      setIsSubmittingOrder(false);
      setIsProcessing(false);
    }
  };

  // Quantity Modal (your original)
  const QuantityModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setIsQuantityModalOpen(false);
          setSelectedProduct(null);
          setQuantity(1);
          setSelectedUnit("kg");
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

    const congoKg = getCongoKg(selectedProduct.name);
    const supportsCongo = congoKg !== null;
    const effectiveUnitPrice = selectedUnit === "congo" && congoKg !== null
      ? congoPriceFromKgPrice(selectedProduct.price, congoKg)
      : selectedProduct.price;

    const bundleInfo = getProductBundleInfo(selectedProduct.name, quantity, effectiveUnitPrice);
    const discountedFinal = applyUserDiscount(bundleInfo.finalPrice, isLoggedIn);
    const userDiscountSaving = bundleInfo.finalPrice - discountedFinal;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div ref={modalRef} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add to Cart</h2>
            <button
              onClick={() => { setIsQuantityModalOpen(false); setSelectedProduct(null); setQuantity(1); setSelectedUnit("kg"); }}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
              disabled={isAddingToCart}
            >
              <X size={24} className="text-red-500" />
            </button>
          </div>

          <div className="mb-6 flex items-center gap-6">
            <div className="h-28 w-28 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 shadow-inner">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-contain" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{selectedProduct.description}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-red-500">₦{effectiveUnitPrice.toLocaleString()}</p>
                <span className="text-sm text-gray-500">per {selectedUnit === "congo" ? "congo" : "kg"}</span>
              </div>
              {selectedProduct.stock > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">In Stock</span>
                </div>
              )}
            </div>
          </div>

          {supportsCongo && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Measure by:</p>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setSelectedUnit("kg")} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedUnit === "kg" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"}`} disabled={isAddingToCart}>Kg</button>
                <button onClick={() => setSelectedUnit("congo")} className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedUnit === "congo" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow" : "text-gray-500 hover:text-gray-700"}`} disabled={isAddingToCart}>Congo</button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">Select Quantity{selectedUnit === "congo" ? " (in congos)" : " (in kg)"}:</p>
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-full border-2 border-red-500 p-3 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isAddingToCart || quantity <= 1}><Minus size={20} /></button>
              <div className="text-4xl font-bold text-gray-900">{quantity}</div>
              <button onClick={() => setQuantity(quantity + 1)} className="rounded-full bg-gradient-to-r from-red-500 to-orange-500 p-3 text-white hover:from-red-600 hover:to-orange-600 transition-all duration-200 active:scale-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isAddingToCart}><Plus size={20} /></button>
            </div>

            {/* Bundle and discount UI - kept as original */}
            {bundleInfo.hasBundle && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-bold text-green-700 text-sm">Bundle Offer Applied!</span>
                </div>
                <p className="text-green-600 text-sm mb-1">{bundleInfo.bundleName} — {bundleInfo.discountPercentage}% OFF</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600 text-sm line-through">₦{bundleInfo.originalPrice.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-700 text-lg">₦{discountedFinal.toLocaleString()}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Save ₦{bundleInfo.savedAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isOpen}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 py-4 rounded-xl font-bold text-white hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAddingToCart ? <><Loader2 size={20} className="animate-spin" />Adding to Cart...</> : `Add to Cart • ₦${discountedFinal.toLocaleString()}`}
          </button>
        </div>
      </div>
    );
  };

  // Cart Modal (your original)
  const CartModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) setIsCartOpen(false);
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

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex">
        <div className="ml-auto">
          <div ref={modalRef} className="bg-white h-full w-full max-w-lg overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart</h2>
                  <p className="text-gray-500 text-sm mt-1">{cart.length} {cart.length === 1 ? "item" : "items"}</p>
                  {totalSavings > 0 && <p className="text-green-600 text-sm mt-1 font-medium">Total Savings: ₦{totalSavings.toLocaleString()}</p>}
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-gray-100 rounded-full active:scale-95 transition-all duration-200">
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
                  <button onClick={() => setIsCartOpen(false)} className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all duration-200">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8">
                    {cart.map((item) => {
                      const bundleInfo = getProductBundleInfo(item.name || "", item.quantity, item.price || 0);
                      const displayPrice = applyUserDiscount(bundleInfo.finalPrice || 0, isLoggedIn);

                      return (
                        <div key={item.productId} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-2">
                              <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                              {bundleInfo.hasBundle ? (
                                <div className="mb-3 mt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm line-through">₦{bundleInfo.originalPrice?.toLocaleString()}</span>
                                    <span className="text-red-500 font-bold text-lg">₦{displayPrice.toLocaleString()}</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-red-500 font-bold text-lg mb-3 mt-1">₦{displayPrice.toLocaleString()}</p>
                              )}

                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full px-4 py-2">
                                  <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1 hover:bg-white rounded-full active:scale-95"><Minus size={16} /></button>
                                  <span className="font-bold text-gray-900">{item.quantity}</span>
                                  <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} className="p-1 hover:bg-white rounded-full active:scale-95"><Plus size={16} /></button>
                                </div>
                                <button onClick={() => handleRemoveFromCart(item.productId)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl active:scale-95"><X size={20} /></button>
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
                          <span className="text-green-600 font-medium">Bundle Savings</span>
                          <span className="font-bold text-green-700">-₦{totalSavings.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-bold text-gray-900">₦{cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-red-500">₦{cartTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { 
                      if (!isOpen) {
                        alert(`Sorry, we're currently closed. ${businessStatusMessage}`);
                        return;
                      }
                      setIsCartOpen(false); 
                      setIsCheckoutOpen(true); 
                    }}
                    disabled={cart.length === 0 || !isOpen}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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

const OrderCompleteModal = ({ setOrderComplete }: { setOrderComplete: (value: boolean) => void }) => {
    if (!orderComplete) return null;
    
   const handleWhatsAppRedirect = () => {
        const phoneNumber = "09040788398";
        const whatsappUrl = `https://wa.me/${phoneNumber}`;
        window.open(whatsappUrl, '_blank');
    };
    
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
          <h2 className="text-3xl font-bold text-green-600 mb-3">Order Submitted.</h2>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4">Your order has been submitted successfully. We will verify your bank transfer and contact you to confirm.</p>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock size={16} />
              <span className="font-medium">{customerInfo.deliveryOption === "pickup" ? "Ready for pickup" : `Delivery: ${estimatedDelivery}`}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setOrderComplete(false)}
              className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 py-3.5 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 active:scale-[0.98] transition-all duration-200"
            >
           close
            </button>
            <button 
              onClick={handleWhatsAppRedirect}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-green-500/25"
            >
              Contact on WhatsApp
            </button>
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

        

            {/* Supermarket / Pharmacy Toggle - RESTORED */}
            <div className="flex gap-1 bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 rounded-full shadow-inner">
              <button
                className={`lg:px-8 lg:py-3 px-6 py-2.5 rounded-full font-bold transition-all duration-300 active:scale-95 ${
                  viewMode === "Supermarket"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-transparent text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
                onClick={() => { setViewMode("Supermarket"); setSelectedCategory("All Products"); }}
                disabled={isSubmittingOrder}
              >
                <span className="flex text-sm lg:text-base items-center gap-2">
                  <ShoppingBag size={18} />
                  <span className="hidden lg:inline">Supermarket</span>
                  <span className="lg:hidden text-[8px]">Market</span>
                </span>
              </button>
              <button
                className={`lg:px-8 lg:py-3 px-6 py-2.5 rounded-full font-bold transition-all duration-300 active:scale-95 ${
                  viewMode === "Pharmacy"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-transparent text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
                onClick={() => { setViewMode("Pharmacy"); setSelectedCategory("All Category"); }}
                disabled={isSubmittingOrder}
              >
                <span className="flex text-sm lg:text-base items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="hidden lg:inline">Pharmacy</span>
                  <span className="lg:hidden text-[8px]">Pharm</span>
                </span>
              </button>
            </div>

            {/* User Info + Store Credit */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
           
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="relative overflow-hidden py-16 lg:py-5">
          {/* Background Glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-400/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-400/20 blur-[120px] rounded-full" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* LEFT SIDE - Text Content */}
              <div>
                <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                  Fresh 
                  <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-gradient">
                     Groceries
                  </span>{" "}
                  Delivered Fast
                </h1>

                <p className="mt-6 text-gray-600 text-lg max-w-xl">
                  Groceries and pharmacy essentials delivered to your doorstep in minutes — safe, fresh, and reliable.
                </p>

                <div className="mt-8 flex items-center gap-4">
                  {!isLoggedIn && (
                    <button
                      onClick={() => router.push("/pages/signin")}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <LogIn size={18} />
                      Get Started
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE - User Card */}
              <div className="flex justify-center lg:justify-end">
                <div className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-2xl rounded-3xl p-6 w-full max-w-sm transition hover:scale-[1.02] duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-md">
                      <UserIcon size={22} />
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        {isLoggedIn ? `Welcome back 👋 ${displayName}` : "You're not logged in"}
                      </p>

                      {isLoggedIn && availableStoreCredit && (
                        <p className="text-sm text-emerald-600 font-semibold mt-1">
                          ₦{availableStoreCredit.toLocaleString()} Store Credit
                        </p>
                      )}
                    </div>
                  </div>

                  {!isLoggedIn && (
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        onClick={() => router.push("/pages/signin")}
                        className="w-full bg-gray-900 text-white py-3 rounded-2xl font-medium hover:bg-black transition"
                      >
                        Log in
                      </button>

                      <button
                        onClick={() => {
                          nextSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                        className="w-full border border-gray-300 py-3 rounded-2xl font-medium hover:bg-gray-100 transition"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        <div ref={nextSectionRef}>
          <StatsStrip />
        </div>

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
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {selectedCategory === "All Products" || selectedCategory === "All Category" ? "All Products" : selectedCategory}
            </h3>
            <span className="text-gray-500">{filteredProducts.length} items</span>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonLoader key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {filteredProducts.map((product) => {
                const hasBundle = product.name.toLowerCase().includes("egg") || 
                                  product.name.toLowerCase().includes("noodle") || 
                                  (product.name.toLowerCase().includes("tomato") && 
                                   (product.name.toLowerCase().includes("sachet") || product.name.toLowerCase().includes("satchet")));

                const congoKg = getCongoKg(product.name);

                return (
                  <div key={product._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-red-100 group flex flex-col h-full">
                    <div className="w-full h-40 rounded-lg mb-4 flex items-center justify-center group-hover:from-red-50 group-hover:to-orange-50 transition-all duration-300">
                      <img src={product.image} alt={product.name} className="h-40 w-40 object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>

                    <div className="flex flex-col flex-grow px-2 pb-4">
                      <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm lg:text-base">{product.name}</h4>

                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="text-lg font-bold text-red-500">₦{product.price.toLocaleString()}</p>
                          {congoKg !== null && (
                            <p className="text-xs text-orange-600 font-medium">₦{congoPriceFromKgPrice(product.price, congoKg).toLocaleString()}/congo</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {product.stock > 0 ? <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div> : <div className="h-2 w-2 rounded-full bg-red-500"></div>}
                          {hasBundle && product.stock > 0 && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>}
                        </div>
                      </div>

                      {hasBundle && product.stock > 0 && (
                        <div className="mt-2">
                          {product.name.toLowerCase().includes("egg") && <p className="text-xs text-blue-600 font-medium">🎁 Buy 3+ for 5% off</p>}
                          {product.name.toLowerCase().includes("noodle") && <p className="text-xs text-blue-600 font-medium">🎁 Buy 3+ for 5% off</p>}
                          {product.name.toLowerCase().includes("tomato") && (product.name.toLowerCase().includes("sachet") || product.name.toLowerCase().includes("satchet")) && (
                            <p className="text-xs text-blue-600 font-medium">🎁 Buy 10+ for 5% off</p>
                          )}
                        </div>
                      )}

                      {congoKg !== null && product.stock > 0 && <p className="text-xs text-orange-500 font-medium mt-1">📏 Available by congo</p>}
                    </div>

                    <button
                      onClick={() => openQuantityModal(product)}
                      disabled={product.stock === 0 || isAddingToCart || isSubmittingOrder || !isOpen}
                      className={`mx-2 mb-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
                        product.stock > 0 && isOpen ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {product.stock > 0 ? (
                        !isOpen ? "Store Closed" : (isAddingToCart && selectedProduct?._id === product._id ? <><Loader2 size={16} className="animate-spin" />Adding...</> : "Add to Cart")
                      ) : "Out of Stock"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12"><SkeletonLoader /></div>
          )}
        </div>

        <div><TestimonialSlider /></div>
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
        grandTotal={finalGrandTotal}
        estimatedDelivery={estimatedDelivery}
        isProcessing={isProcessing}
        submitOrder={submitOrder}
        cart={cart}
        isSubmittingOrder={isSubmittingOrder}
        availableStoreCredit={availableStoreCredit}
        useStoreCredit={useStoreCredit}
        setUseStoreCredit={setUseStoreCredit}
      />
      <OrderCompleteModal setOrderComplete={setOrderComplete} />

      <UploadPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />
    </div>
  );
};

export default PharmacyApp;
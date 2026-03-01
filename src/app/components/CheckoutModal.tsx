"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, User, Phone, Home, CreditCard, ChevronRight, ChevronLeft, ShoppingBag, MapPin, Clock } from "lucide-react";

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  prescription?: File | null;
  deliveryOption: "express" | "timeframe" | "pickup" | "" | "nil";
  pickupLocation: string;
  deliveryAddress: string;
  timeSlot?: "12 PM" | "4 PM" | "9 PM" | "6 AM" | "" | "nil"; // Made optional
  isUIAddress: boolean;
  transactionNumber: string;
  discountCode?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  estimatedDelivery: string;
  isProcessing: boolean;
  isSubmittingOrder?: boolean;
  submitOrder: (customerInfo: CustomerInfo) => void;
  cart: { productId: { _id: string; price: number; category?: string }; quantity: number }[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  setIsOpen,
  customerInfo,
  setCustomerInfo,
  cartTotal,
  deliveryFee,
  grandTotal,
  estimatedDelivery,
  isProcessing,
  isSubmittingOrder = false,
  submitOrder,
  cart,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const customAddressInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [addressError, setAddressError] = useState<string>("");
  const [discountError, setDiscountError] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [showCustomAddress, setShowCustomAddress] = useState<boolean>(false);

  const deliveryAreas = ["University of Ibadan", "Agbowo Area"];
  const uiPickupLocations = [
    "School Gate",
    "Tedder",
    "Zik",
    "Tech TLT",
    "Social Sciences",
    "Law",
    "Education LLLT",
    "Awo Junction",
    "Amina Way",
    "Abadina",
    "Benue Road",
    "SUB",
    "Saint Annes",
  ];
  const uchPickupLocations = ["ABH", "First Gate", "Second Gate", "UCH School"];
  const storeLocation = "Inependence Hall, University of ibadan"; // Store pickup location for non-UI/UCH deliveries

  // Promo codes for 10% discount on supermarket items
  const discountPromoCodes = ["OllAN10", "MUIZAT10", "ABDUL10", "OYIN10", "WEST10", "BLESS10", "EMMA10"];
  // Promo codes for free delivery
  const freeDeliveryPromoCodes = ["WASIU10", "DELIVERFREE"];
  const supermarketCategories = ["Baby Care", "Groceries", "Beverages", "Household"];
  const validPromoAreas = ["University of Ibadan", "UCH"];

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      // Reset timeSlot to nil when modal opens
      setCustomerInfo(prev => ({ ...prev, timeSlot: "nil" }));
    }
  }, [isOpen, setCustomerInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !customAddressInputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, setIsOpen]);

  const handleDeliveryAreaChange = (area: string) => {
    const isUIAddress = area === "University of Ibadan" || area === "UCH";
    const isOtherArea = area === "Other";
    
    setShowCustomAddress(isOtherArea);
    
    setCustomerInfo({
      ...customerInfo,
      deliveryAddress: isOtherArea ? "" : area,
      isUIAddress,
      deliveryOption: isUIAddress ? customerInfo.deliveryOption || "express" : "express",
      pickupLocation: isUIAddress && customerInfo.deliveryOption === "pickup" ? customerInfo.pickupLocation : isOtherArea ? "" : area,
      timeSlot: "nil", // Always set to nil
    });
    setAddressError("");
  };

  const handleCustomAddressChange = (address: string) => {
    setCustomerInfo({
      ...customerInfo,
      deliveryAddress: address,
      pickupLocation: address,
    });
    if (address.trim()) {
      setAddressError("");
    } else {
      setAddressError("Custom address is required when 'Other' is selected");
    }
  };

  const handlePickupLocationChange = (location: string) => {
    const concatenatedLocation = customerInfo.deliveryAddress && location && customerInfo.deliveryOption === "pickup"
      ? `${customerInfo.deliveryAddress} - ${location}`
      : location || customerInfo.deliveryAddress || "";
    setCustomerInfo({
      ...customerInfo,
      pickupLocation: concatenatedLocation,
    });
  };

  const applyDiscountCode = () => {
    const code = customerInfo.discountCode?.trim().toLowerCase();
    
    // Reset states
    setDiscountError("");
    setAppliedDiscount(0);

    if (!code) {
      setDiscountError("Please enter a discount code");
      return;
    }

    // Check if delivery area is UI or UCH
    if (!validPromoAreas.includes(customerInfo.deliveryAddress)) {
      setDiscountError("Discount codes are only valid for UI and UCH deliveries");
      return;
    }

    // Calculate total for supermarket items only
    const supermarketTotal = cart.reduce((total, item) => {
      if (item.productId.category && supermarketCategories.includes(item.productId.category)) {
        return total + item.productId.price * item.quantity;
      }
      return total;
    }, 0);

    if (discountPromoCodes.map(c => c.toLowerCase()).includes(code)) {
      // Apply 10% discount only to supermarket items
      if (supermarketTotal > 0) {
        setAppliedDiscount(supermarketTotal * 0.1);
        setDiscountError("");
      } else {
        setDiscountError("Discount code only applies to supermarket items");
      }
    } else if (freeDeliveryPromoCodes.map(c => c.toLowerCase()).includes(code)) {
      // Apply free delivery
      if (deliveryFee > 0) {
        setAppliedDiscount(deliveryFee);
        setDiscountError("");
      } else {
        setDiscountError("Free delivery code cannot be applied when delivery is already free");
      }
    } else {
      setDiscountError("Invalid discount code");
    }
  };

  const validateStep1 = (): boolean => {
    const errors: string[] = [];
    
    if (!customerInfo.phone.trim()) errors.push("Phone Number is required");
    if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil") {
      errors.push("Delivery Option is required");
    }
    if (!customerInfo.deliveryAddress && customerInfo.deliveryOption !== "pickup") {
      errors.push("Delivery Address is required for non-pickup options");
    }
    if (showCustomAddress && !customerInfo.deliveryAddress.trim() && customerInfo.deliveryOption !== "pickup") {
      errors.push("Custom address is required when 'Other' is selected");
    }
    if (customerInfo.deliveryOption === "pickup" && (!customerInfo.pickupLocation || customerInfo.pickupLocation === "nil")) {
      errors.push("Pickup Location is required for pickup option");
    }
    if (customerInfo.deliveryOption === "pickup" && customerInfo.deliveryAddress && !customerInfo.pickupLocation.includes(customerInfo.deliveryAddress)) {
      errors.push("Pickup Location must include the selected Delivery Area");
    }

    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join("\n")}`);
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!customerInfo.name.trim()) errors.push("Full Name is required");
    if (!customerInfo.email.trim()) errors.push("Email is required");
    if (!customerInfo.transactionNumber.trim()) errors.push("Bank Transaction Number is required");

    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join("\n")}`);
      return;
    }

    const sanitizedCustomerInfo: CustomerInfo = {
      name: customerInfo.name.trim(),
      email: customerInfo.email.trim(),
      phone: customerInfo.phone.trim(),
      prescription: customerInfo.prescription || null,
      deliveryOption: customerInfo.deliveryOption,
      pickupLocation:
        customerInfo.deliveryOption === "pickup"
          ? customerInfo.pickupLocation
          : customerInfo.deliveryAddress.trim(),
      deliveryAddress: customerInfo.isUIAddress ? "nil" : customerInfo.deliveryAddress.trim(),
      timeSlot: "nil",
      isUIAddress: customerInfo.isUIAddress,
      transactionNumber: customerInfo.transactionNumber.trim(),
      discountCode: customerInfo.discountCode?.trim() || "",
    };

    console.log("Submitting Customer Info:", {
      ...sanitizedCustomerInfo,
      isUIAddress: sanitizedCustomerInfo.isUIAddress ? "true" : "false",
    });

    submitOrder(sanitizedCustomerInfo);
  };

  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a JPEG, PNG, or PDF file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        return;
      }
      setCustomerInfo({ ...customerInfo, prescription: file });
    }
  };

  if (!isOpen) return null;

  const discountedTotal = grandTotal - appliedDiscount;

  // Step indicator - Mobile responsive
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-4 md:mb-6">
      <div className="flex items-center w-full max-w-xs">
        <div className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm ${
          currentStep >= 1 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
        }`}>
          1
        </div>
        <div className={`flex-1 h-1 mx-1 md:mx-2 ${currentStep >= 2 ? "bg-red-500" : "bg-gray-200"}`} />
        <div className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm ${
          currentStep >= 2 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
        }`}>
          2
        </div>
      </div>
    </div>
  );

  // Order Summary Component - Mobile responsive
  const OrderSummary = () => (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 md:p-4 rounded-xl mb-4 md:mb-6 border border-red-100">
      <div className="flex items-center gap-2 mb-2 md:mb-3">
        <ShoppingBag size={18} className="text-red-500 md:w-5 md:h-5" />
        <h3 className="font-bold text-gray-900 text-sm md:text-base">Order Summary</h3>
      </div>
      <div className="space-y-1.5 md:space-y-2">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">₦{cartTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-gray-600">Delivery Fee:</span>
          <span className="font-medium">
            {customerInfo.deliveryOption && customerInfo.discountCode && freeDeliveryPromoCodes.map(c => c.toLowerCase()).includes(customerInfo.discountCode.toLowerCase())
              ? "Free"
              : customerInfo.deliveryOption && customerInfo.deliveryOption !== "nil"
              ? customerInfo.deliveryOption === "express"
                ? "₦500"
                : customerInfo.deliveryOption === "pickup"
                ? "Free"
                : cartTotal >= 5000
                ? "Free"
                : "₦500"
              : "N/A"}
          </span>
        </div>
        {appliedDiscount > 0 && (
          <div className="flex justify-between text-xs md:text-sm text-green-600">
            <span>Discount:</span>
            <span>-₦{appliedDiscount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-red-200 pt-1.5 md:pt-2 mt-1.5 md:mt-2">
          <div className="flex justify-between font-bold text-red-600 text-sm md:text-base">
            <span>Total:</span>
            <span>₦{discountedTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white rounded-xl md:rounded-2xl w-full max-w-4xl max-h-[98vh] md:max-h-[95vh] overflow-y-auto shadow-2xl transform transition-all"
      >
        {/* Header - Sticky with mobile optimizations */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Complete Your Order</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
                Step {currentStep} of 2: {currentStep === 1 ? "Delivery Details" : "Payment & Confirmation"}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform flex-shrink-0"
              aria-label="Close checkout modal"
              disabled={isProcessing || isSubmittingOrder}
            >
              <X size={20} className="text-gray-500 md:w-6 md:h-6" />
            </button>
          </div>
          <StepIndicator />
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8">
          {/* Order Summary at the top of both steps */}
          <OrderSummary />

          {currentStep === 1 ? (
            /* Step 1: Delivery Details - Mobile optimized */
            <div className="space-y-4 md:space-y-5">
              {/* Phone Number */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                  <Phone size={16} className="mr-1.5 md:mr-2 text-red-500" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your phone number"
                  aria-label="Phone number"
                  disabled={isProcessing || isSubmittingOrder}
                />
              </div>

              {/* Delivery Area */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                  <MapPin size={16} className="mr-1.5 md:mr-2 text-red-500" />
                  Delivery Area *
                </label>
                <select
                  required
                  value={showCustomAddress ? "Other" : customerInfo.deliveryAddress}
                  onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
                  aria-label="Delivery area"
                  disabled={isProcessing || isSubmittingOrder}
                >
                  <option value="" disabled>
                    Select a delivery area
                  </option>
                  {deliveryAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {showCustomAddress && (
                  <div className="mt-2 md:mt-3">
                    <input
                      ref={customAddressInputRef}
                      type="text"
                      required
                      value={customerInfo.deliveryAddress}
                      onChange={(e) => handleCustomAddressChange(e.target.value)}
                      className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                      placeholder="Enter your full address"
                      aria-label="Custom delivery address"
                      onClick={(e) => e.stopPropagation()}
                      disabled={isProcessing || isSubmittingOrder}
                    />
                    {addressError && <p className="text-xs text-red-600 mt-1.5">{addressError}</p>}
                  </div>
                )}
                {customerInfo.deliveryOption === "express" && customerInfo.deliveryAddress && !showCustomAddress && (
                  <p className="text-xs text-gray-600 mt-2">
                    Our rider will contact you to confirm your exact location in {customerInfo.deliveryAddress}.
                  </p>
                )}
              </div>

              {/* Delivery Options */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-2 md:mb-3 text-gray-700">
                  Delivery Option *
                </label>
                <div className="space-y-2 md:space-y-3">
                  {/* Express Delivery */}
                  <label className="flex items-start p-2.5 md:p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="express"
                      checked={customerInfo.deliveryOption === "express"}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          deliveryOption: e.target.value as "express",
                          pickupLocation: customerInfo.deliveryAddress || "",
                        })
                      }
                      className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
                      disabled={isProcessing || isSubmittingOrder}
                    />
                    <div className="ml-2 md:ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm md:text-base font-medium text-gray-800">Express Delivery</span>
                        <span className="text-xs md:text-sm font-semibold text-red-600">₦500</span>
                      </div>
                      <span className="text-xs text-gray-500">Within 1 hour</span>
                    </div>
                  </label>

                  {/* Pickup - Only show for UI/UCH addresses */}
                  {customerInfo.isUIAddress && (
                    <label className="flex items-start p-2.5 md:p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="pickup"
                        checked={customerInfo.deliveryOption === "pickup"}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            deliveryOption: e.target.value as "pickup",
                            pickupLocation: customerInfo.isUIAddress ? customerInfo.pickupLocation : customerInfo.deliveryAddress || storeLocation,
                          })
                        }
                        className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
                        disabled={isProcessing || isSubmittingOrder}
                      />
                      <div className="ml-2 md:ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm md:text-base font-medium text-gray-800">Pickup</span>
                          <span className="text-xs md:text-sm font-semibold text-green-600">Free</span>
                        </div>
                        <span className="text-xs text-gray-500">At store or UI/UCH location</span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Estimated Delivery - Only for express */}
                {estimatedDelivery && customerInfo.deliveryOption === "express" && (
                  <p className="text-xs text-gray-600 mt-3 bg-red-50 p-2 rounded-md flex items-center gap-1.5">
                    <Clock size={14} className="text-red-500" />
                    <span className="font-medium">Estimated Delivery:</span> {estimatedDelivery}
                  </p>
                )}
              </div>

              {/* Pickup Location - Only for pickup option */}
              {customerInfo.isUIAddress && customerInfo.deliveryOption === "pickup" && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                    <MapPin size={16} className="mr-1.5 md:mr-2 text-red-500" />
                    Pickup Location *
                  </label>
                  <select
                    required
                    value={customerInfo.pickupLocation.includes(customerInfo.deliveryAddress) ? customerInfo.pickupLocation.split(" - ")[1] || customerInfo.pickupLocation : customerInfo.pickupLocation}
                    onChange={(e) => handlePickupLocationChange(e.target.value)}
                    className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
                    aria-label="Pickup location"
                    disabled={isProcessing || isSubmittingOrder}
                  >
                    <option value="" disabled>
                      Select a pickup location
                    </option>
                    <option value={storeLocation}>{storeLocation}</option>
                    {customerInfo.deliveryAddress === "University of Ibadan" &&
                      uiPickupLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    {customerInfo.deliveryAddress === "UCH" &&
                      uchPickupLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Next Button - Mobile optimized */}
              <div className="flex justify-end pt-3 md:pt-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isProcessing || isSubmittingOrder}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base shadow-lg"
                >
                  Next: Payment Details
                  <ChevronRight size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Payment & Confirmation - Mobile optimized */
            <div className="space-y-4 md:space-y-5">
              {/* Full Name */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                  <User size={16} className="mr-1.5 md:mr-2 text-red-500" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your full name"
                  aria-label="Full name"
                  disabled={isProcessing || isSubmittingOrder}
                />
              </div>

              {/* Email Address */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                  <User size={16} className="mr-1.5 md:mr-2 text-red-500" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  disabled={isProcessing || isSubmittingOrder}
                />
              </div>

              {/* Discount Code */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">Discount Code</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customerInfo.discountCode || ""}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, discountCode: e.target.value })}
                    className="flex-1 p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                    placeholder="Enter discount code"
                    aria-label="Discount code"
                    disabled={isProcessing || isSubmittingOrder}
                  />
                  <button
                    type="button"
                    onClick={applyDiscountCode}
                    disabled={isProcessing || isSubmittingOrder || !customerInfo.discountCode}
                    className="w-full sm:w-auto px-4 py-2.5 md:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Apply
                  </button>
                </div>
                {discountError && <p className="text-xs text-red-600 mt-1.5">{discountError}</p>}
                {appliedDiscount > 0 && (
                  <p className="text-xs text-green-600 mt-1.5">
                    Discount applied! You saved ₦{appliedDiscount.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Bank Transaction Number */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                  <CreditCard size={16} className="mr-1.5 md:mr-2 text-red-500" />
                  Bank Transaction Number *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.transactionNumber}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, transactionNumber: e.target.value })}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter bank transaction number"
                  aria-label="Bank transaction number"
                  disabled={isProcessing || isSubmittingOrder}
                />
                <div className="mt-2 md:mt-3 p-2.5 md:p-3 bg-red-50 rounded-lg">
                  <p className="text-xs md:text-sm font-medium text-gray-800">Bank Account Details:</p>
                  <p className="text-xs text-gray-600">Bank: Opay</p>
                  <p className="text-xs text-gray-600">Account Name: Ollan Pharmacy Ltd</p>
                  <p className="text-xs text-gray-600">Account Number: 7019312514</p>
                  <p className="text-xs text-gray-500 mt-1.5">Please make the bank transfer and enter the transaction number above.</p>
                </div>
              </div>

              {/* Prescription Upload */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700">Prescription (Optional)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handlePrescriptionUpload}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white file:mr-2 file:py-1 file:px-2 file:text-xs file:bg-red-50 file:text-red-600 file:border-0 file:rounded-md hover:file:bg-red-100"
                  aria-label="Upload prescription"
                  disabled={isProcessing || isSubmittingOrder}
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: JPEG, PNG, PDF (Max 5MB)</p>
              </div>

              {/* Navigation and Submit Buttons - Mobile optimized */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isProcessing || isSubmittingOrder}
                  className="w-full sm:flex-1 bg-gray-100 text-gray-700 px-4 md:px-6 py-3 md:py-3.5 rounded-xl font-bold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base order-2 sm:order-1"
                >
                  <ChevronLeft size={18} className="md:w-5 md:h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || isSubmittingOrder || !!addressError}
                  className="w-full sm:flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white py-3 md:py-3.5 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base shadow-lg order-1 sm:order-2"
                  aria-label="Submit order"
                >
                  {isProcessing || isSubmittingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-1"></div>
                      <span className="text-sm md:text-base">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} className="md:w-5 md:h-5" />
                      <span className="text-sm md:text-base">Submit Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-center text-gray-500 mt-4 md:mt-6">
            Your personal data will be used to process your order and for other purposes described in our privacy policy.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
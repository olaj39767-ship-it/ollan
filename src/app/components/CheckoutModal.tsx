"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, User, Phone, Home, CreditCard, ChevronRight, ChevronLeft, ShoppingBag, MapPin, Clock, Store } from "lucide-react";

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
  discountCode?: string;
  [key: string]: any;
}

interface CheckoutModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<any>>;
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  estimatedDelivery: string;
  isProcessing: boolean;
  isSubmittingOrder?: boolean;
  submitOrder: (info: any) => Promise<void> | void;
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
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [deliveryAddressError, setDeliveryAddressError] = useState<string>("");

  // Delivery areas
  const deliveryAreas = ["Agbowo", "University of Ibadan"];
  
  // Reset to step 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setCustomerInfo((prev: CustomerInfo) => ({ ...prev, timeSlot: "nil" }));
    }
  }, [isOpen, setCustomerInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
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
    const isUIAddress = area === "University of Ibadan";
    
    setCustomerInfo((prev: CustomerInfo) => ({
      ...prev,
      deliveryAddress: area,
      isUIAddress,
      timeSlot: "nil",
    }));
  };

  const validateStep1 = (): boolean => {
    const errors: string[] = [];
    
    if (!customerInfo.phone.trim()) errors.push("Phone Number is required");
    if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil") {
      errors.push("Delivery Option is required");
    }
    
    // Check if delivery option is express
    const isExpress = customerInfo.deliveryOption === "express";
    
    // Only validate delivery address for express delivery
    if (isExpress) {
      if (!customerInfo.deliveryAddress) {
        errors.push("Delivery Area is required");
        setDeliveryAddressError("Please select a delivery area");
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!customerInfo.name.trim()) errors.push("Full Name is required");
    if (!customerInfo.email.trim()) errors.push("Email is required");
    if (!customerInfo.transactionNumber.trim()) errors.push("Bank Transaction Number is required");

    if (errors.length > 0) {
      alert(`Please fix the following errors:\n${errors.join("\n")}`);
      return;
    }

    // Check if delivery option is express or pickup
    const isExpress = customerInfo.deliveryOption === "express";

    const sanitizedCustomerInfo: CustomerInfo = {
      name: customerInfo.name.trim(),
      email: customerInfo.email.trim(),
      phone: customerInfo.phone.trim(),
      prescription: null,
      deliveryOption: customerInfo.deliveryOption,
      pickupLocation: "",
      deliveryAddress: isExpress ? customerInfo.deliveryAddress.trim() : "nil",
      timeSlot: "nil",
      isUIAddress: isExpress ? customerInfo.isUIAddress : false,
      transactionNumber: customerInfo.transactionNumber.trim(),
      discountCode: "",
    };

    console.log("Submitting Customer Info:", sanitizedCustomerInfo);

    await submitOrder(sanitizedCustomerInfo);
  };

  if (!isOpen) return null;

  const discountedTotal = grandTotal;

  // Helper functions to check delivery option
  const isExpressOption = (): boolean => {
    return customerInfo.deliveryOption === "express";
  };

  const isPickupOption = (): boolean => {
    return customerInfo.deliveryOption === "pickup";
  };

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
  const OrderSummary = () => {
    const getDeliveryFeeText = (): string => {
      if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil") return "N/A";
      if (customerInfo.deliveryOption === "express") return "₦500";
      if (customerInfo.deliveryOption === "pickup") return "Free";
      return "₦500";
    };

    return (
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
            <span className="font-medium">{getDeliveryFeeText()}</span>
          </div>
          <div className="border-t border-red-200 pt-1.5 md:pt-2 mt-1.5 md:mt-2">
            <div className="flex justify-between font-bold text-red-600 text-sm md:text-base">
              <span>Total:</span>
              <span>₦{discountedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isExpress = isExpressOption();
  const isPickup = isPickupOption();

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
                  onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your phone number"
                  aria-label="Phone number"
                  disabled={isProcessing || isSubmittingOrder}
                />
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
                      onChange={(e) => {
                        setCustomerInfo((prev: CustomerInfo) => ({
                          ...prev,
                          deliveryOption: e.target.value as "express",
                          deliveryAddress: "",
                        }));
                        setDeliveryAddressError("");
                      }}
                      className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
                      disabled={isProcessing || isSubmittingOrder}
                    />
                    <div className="ml-2 md:ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm md:text-base font-medium text-gray-800">Express Delivery</span>
                        <span className="text-xs md:text-sm font-semibold text-red-600">₦500</span>
                      </div>
                      <span className="text-xs text-gray-500">Within 1 hour to your location</span>
                    </div>
                  </label>

                  {/* Pickup */}
                  <label className="flex items-start p-2.5 md:p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="pickup"
                      checked={customerInfo.deliveryOption === "pickup"}
                      onChange={(e) => {
                        setCustomerInfo((prev: CustomerInfo) => ({
                          ...prev,
                          deliveryOption: e.target.value as "pickup",
                          deliveryAddress: "",
                          isUIAddress: false,
                        }));
                        setDeliveryAddressError("");
                      }}
                      className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
                      disabled={isProcessing || isSubmittingOrder}
                    />
                    <div className="ml-2 md:ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm md:text-base font-medium text-gray-800">Pickup</span>
                        <span className="text-xs md:text-sm font-semibold text-green-600">Free</span>
                      </div>
                      <span className="text-xs text-gray-500">Pick up at our store location</span>
                    </div>
                  </label>
                </div>

                {/* Estimated Delivery - Only for express */}
                {estimatedDelivery && customerInfo.deliveryOption === "express" && (
                  <p className="text-xs text-gray-600 mt-3 bg-red-50 p-2 rounded-md flex items-center gap-1.5">
                    <Clock size={14} className="text-red-500" />
                    <span className="font-medium">Estimated Delivery:</span> {estimatedDelivery}
                  </p>
                )}
              </div>

              {/* Delivery Area - Only show if Express is selected */}
              {isExpress && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
                    <MapPin size={16} className="mr-1.5 md:mr-2 text-red-500" />
                    Delivery Area *
                  </label>
                  <select
                    required={isExpress}
                    value={customerInfo.deliveryAddress || ""}
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
                  {deliveryAddressError && <p className="text-xs text-red-600 mt-1.5">{deliveryAddressError}</p>}
                  {customerInfo.deliveryAddress && (
                    <p className="text-xs text-gray-600 mt-2">
                      Our rider will contact you to confirm your exact location in {customerInfo.deliveryAddress}.
                    </p>
                  )}
                </div>
              )}

              {/* No location field for Pickup - just a message */}
              {isPickup && (
                <div className="bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
                  <div className="flex items-center gap-2">
                    <Store size={18} className="text-green-600" />
                    <p className="text-sm text-gray-700">
                      You can pick up your order at:<br />
                      <span className="font-semibold">Store (1 Fadare Close, Iwo Road)</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Pickup available during business hours (9AM - 6PM, Monday - Saturday)
                  </p>
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
                  onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  disabled={isProcessing || isSubmittingOrder}
                />
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
                  onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, transactionNumber: e.target.value }))}
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
                  disabled={isProcessing || isSubmittingOrder || (isExpress && !customerInfo.deliveryAddress)}
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


"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, User, Phone, Home, CreditCard } from "lucide-react";

export interface CustomerInfo {
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
  submitOrder,
  cart,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const customAddressInputRef = useRef<HTMLInputElement>(null);
  const [addressError, setAddressError] = useState<string>("");
  const [discountError, setDiscountError] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [showCustomAddress, setShowCustomAddress] = useState<boolean>(false);

  const deliveryAreas = ["UCH", "Bodija", "Orogun", "Basorun", "University of Ibadan", "Other"];
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
  const storeLocation = "Store (1 Fadare Close, Iwo Road)";

  // Promo codes for 10% discount on supermarket items
 const discountPromoCodes = ["OllAN10", "MUIZAT10", "ABDUL10", "OYIN10", "WEST10", "BLESS10", "EMMA10"];   ;
  // Promo codes for free delivery
  const freeDeliveryPromoCodes = ["WASIU10", "DELIVERFREE"];
  const supermarketCategories = ["Baby Care", "Groceries", "Beverages", "Household"];
  const validPromoAreas = ["University of Ibadan", "UCH"];

  const getNextDeliverySlot = (): "12 PM" | "4 PM" | "9 PM" | "6 AM" => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;

    const slots = [
      { time: "12 PM", minutes: 12 * 60 },
      { time: "4 PM", minutes: 16 * 60 },
      { time: "9 PM", minutes: 21 * 60 },
      { time: "6 AM", minutes: 6 * 60 },
    ];

    for (const slot of slots) {
      if (currentTimeInMinutes < slot.minutes - 30) {
        return slot.time as "12 PM" | "4 PM" | "9 PM" | "6 AM";
      }
    }
    return "6 AM";
  };

  useEffect(() => {
    if (customerInfo.deliveryOption === "timeframe" && !customerInfo.timeSlot) {
      const nextSlot = getNextDeliverySlot();
      setCustomerInfo({ ...customerInfo, timeSlot: nextSlot });
    }
  }, [customerInfo.deliveryOption, customerInfo.timeSlot, setCustomerInfo]);

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
      pickupLocation: isUIAddress && (customerInfo.deliveryOption === "pickup" || customerInfo.deliveryOption === "timeframe") ? customerInfo.pickupLocation : isOtherArea ? "" : area,
      timeSlot: isUIAddress && customerInfo.deliveryOption === "timeframe" ? customerInfo.timeSlot || getNextDeliverySlot() : "nil",
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
    const concatenatedLocation = customerInfo.deliveryAddress && location && (customerInfo.deliveryOption === "pickup" || customerInfo.deliveryOption === "timeframe")
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!customerInfo.name.trim()) errors.push("Full Name is required");
    if (!customerInfo.email.trim()) errors.push("Email is required");
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
    if (customerInfo.deliveryOption === "timeframe" && (!customerInfo.timeSlot || customerInfo.timeSlot === "nil")) {
      errors.push("Time Slot is required for timeframe delivery");
    }
    if ((customerInfo.deliveryOption === "pickup" || (customerInfo.isUIAddress && customerInfo.deliveryOption === "timeframe")) && customerInfo.deliveryAddress && !customerInfo.pickupLocation.includes(customerInfo.deliveryAddress)) {
      errors.push("Pickup Location must include the selected Delivery Area");
    }
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
        customerInfo.deliveryOption === "pickup" || (customerInfo.isUIAddress && customerInfo.deliveryOption === "timeframe")
          ? customerInfo.pickupLocation
          : customerInfo.deliveryAddress.trim(),
      deliveryAddress: customerInfo.isUIAddress ? "nil" : customerInfo.deliveryAddress.trim(),
      timeSlot: customerInfo.deliveryOption === "timeframe" && customerInfo.isUIAddress ? customerInfo.timeSlot : "nil",
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl transform transition-all"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Order</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in your details and transaction number to submit your order</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
              aria-label="Close checkout modal"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <User size={18} className="mr-2 text-red-500" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your full name"
                  aria-label="Full name"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <User size={18} className="mr-2 text-red-500" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <Phone size={18} className="mr-2 text-red-500" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your phone number"
                  aria-label="Phone number"
                />
              </div>

            
            </div>

            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <Home size={18} className="mr-2 text-red-500" />
                  Delivery Area *
                </label>
                <select
                  required
                  value={showCustomAddress ? "Other" : customerInfo.deliveryAddress}
                  onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
                  aria-label="Delivery area"
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
                  <div className="mt-3">
                    <input
                      ref={customAddressInputRef}
                      type="text"
                      required
                      value={customerInfo.deliveryAddress}
                      onChange={(e) => handleCustomAddressChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                      placeholder="Enter your full address (e.g., 123 Main St, Ibadan)"
                      aria-label="Custom delivery address"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {addressError && <p className="text-sm text-red-600 mt-2">{addressError}</p>}
                  </div>
                )}
                {customerInfo.deliveryOption === "express" && customerInfo.deliveryAddress && !showCustomAddress && (
                  <p className="text-sm text-gray-600 mt-2">
                    Our rider will contact you to confirm your exact location in {customerInfo.deliveryAddress}.
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Delivery Option * (Fee: {customerInfo.deliveryOption === "express" ? "₦500" : customerInfo.deliveryOption === "timeframe" ? (cartTotal >= 5000 || (customerInfo.discountCode && freeDeliveryPromoCodes.map(c => c.toLowerCase()).includes(customerInfo.discountCode.toLowerCase())) ? "Free" : "₦500") : customerInfo.deliveryOption === "pickup" ? "Free" : "Select an option"})
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
                    <input
                      type="radio"
                      id="express"
                      name="deliveryOption"
                      value="express"
                      checked={customerInfo.deliveryOption === "express"}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          deliveryOption: e.target.value as "express",
                          pickupLocation: customerInfo.deliveryAddress || "",
                          timeSlot: "nil",
                        })
                      }
                      className="h-4 w-4 text-red-600 focus:ring-red-500"
                      aria-label="Express delivery"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-800">Express Delivery</span>
                      <span className="block text-xs text-gray-500">Within 1 hour (₦500)</span>
                    </div>
                  </label>
                  {customerInfo.isUIAddress && (
                    <>
           
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
                        <input
                          type="radio"
                          id="pickup"
                          name="deliveryOption"
                          value="pickup"
                          checked={customerInfo.deliveryOption === "pickup"}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              deliveryOption: e.target.value as "pickup",
                              timeSlot: "nil",
                              pickupLocation: customerInfo.isUIAddress ? customerInfo.pickupLocation : customerInfo.deliveryAddress || storeLocation,
                            })
                          }
                          className="h-4 w-4 text-red-600 focus:ring-red-500"
                          aria-label="Pickup"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-800">Pickup</span>
                          <span className="block text-xs text-gray-500">Free (At store or UI/UCH location)</span>
                        </div>
                      </label>
                    </>
                  )}
                </div>
                {estimatedDelivery && customerInfo.deliveryOption !== "pickup" && customerInfo.deliveryOption !== "nil" && (
                  <p className="text-sm text-gray-600 mt-3 bg-red-50 p-2 rounded-md">
                    <span className="font-medium">Estimated Delivery:</span> {estimatedDelivery}
                  </p>
                )}
              </div>

              {customerInfo.isUIAddress && customerInfo.deliveryOption === "timeframe" && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                    <Home size={18} className="mr-2 text-red-500" />
                    Delivery Time Slot *
                  </label>
                  <select
                    required
                    value={customerInfo.timeSlot}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        timeSlot: e.target.value as "12 PM" | "4 PM" | "9 PM" | "6 AM" | "nil",
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
                    aria-label="Delivery time slot"
                  >
                    <option value="" disabled>
                      Select a time slot
                    </option>
                    {["12 PM", "4 PM", "9 PM", "6 AM"].map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(customerInfo.isUIAddress || customerInfo.deliveryOption === "pickup") && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                    <Home size={18} className="mr-2 text-red-500" />
                    {customerInfo.deliveryOption === "pickup" ? "Pickup Location *" : "Dropoff Location *"}
                  </label>
                  <select
                    required
                    value={customerInfo.pickupLocation.includes(customerInfo.deliveryAddress) ? customerInfo.pickupLocation.split(" - ")[1] || customerInfo.pickupLocation : customerInfo.pickupLocation}
                    onChange={(e) => handlePickupLocationChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
                    aria-label={customerInfo.deliveryOption === "pickup" ? "Pickup location" : "Dropoff location"}
                  >
                    <option value="" disabled>
                      Select a {customerInfo.deliveryOption === "pickup" ? "pickup" : "dropoff"} location
                    </option>
                    {customerInfo.deliveryOption === "pickup" && <option value={storeLocation}>{storeLocation}</option>}
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

           

              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <CreditCard size={18} className="mr-2 text-red-500" />
                  Bank Transaction Number *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.transactionNumber}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, transactionNumber: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter bank transaction number"
                  aria-label="Bank transaction number"
                />
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">Bank Account Details:</p>
                  <p className="text-sm text-gray-600">Bank: Opay</p>
                  <p className="text-sm text-gray-600">Account Name: Ollan Pharmacy Ltd</p>
                  <p className="text-sm text-gray-600">Account Number: 7019312514</p>
                  <p className="text-xs text-gray-500 mt-2">Please make the bank transfer and enter the transaction number above.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-black">
                <span>Subtotal:</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Delivery Fee:</span>
                <span>
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
                <div className="flex justify-between text-green-600">
                  <span>
                    {discountPromoCodes.map(c => c.toLowerCase()).includes(customerInfo.discountCode?.toLowerCase() || "")
                      ? "Discount (10% on supermarket items)"
                      : "Free Delivery Discount"}
                  </span>
                  <span>-₦{appliedDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-red-600">
                <span>Total:</span>
                <span>₦{discountedTotal.toLocaleString()}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isProcessing || !!addressError}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-red-200"
              aria-label="Submit order"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting Order...
                </>
              ) : (
                <>
                  <CreditCard size={20} className="mr-2" />
                  Submit Order (₦{discountedTotal.toLocaleString()})
                </>
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">
              Your personal data will be used to process your order and for other purposes described in our privacy policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
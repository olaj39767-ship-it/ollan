// "use client";

// import React, { useRef, useEffect, useState } from "react";
// import { X, User, Phone, Home, CreditCard, ChevronRight, ChevronLeft, ShoppingBag, MapPin, Clock, Store } from "lucide-react";
// import { Copy, Check } from "lucide-react";

// export interface CustomerInfo {
//   name: string;
//   email: string;
//   phone: string;
//   prescription?: File | null;
//   deliveryOption: "express" | "timeframe" | "pickup" | "" | "nil";
//   pickupLocation: string;
//   deliveryAddress: string;
//   timeSlot?: "12 PM" | "4 PM" | "9 PM" | "6 AM" | "" | "nil";
//   isUIAddress: boolean;
//   transactionNumber: string;
//   discountCode?: string;
//   [key: string]: any;
// }

// interface CheckoutModalProps {
//   isOpen: boolean;
//   setIsOpen: (isOpen: boolean) => void;
//   customerInfo: CustomerInfo;
//   setCustomerInfo: React.Dispatch<React.SetStateAction<any>>;
//   cartTotal: number;
//   deliveryFee: number;
//   grandTotal: number;
//   estimatedDelivery: string;
//   isProcessing: boolean;
//   isSubmittingOrder?: boolean;
//   submitOrder: (info: any) => Promise<void> | void;
//   cart: { productId: { _id: string; price: number; category?: string }; quantity: number }[];
// }

// const CheckoutModal: React.FC<CheckoutModalProps> = ({
//   isOpen,
//   setIsOpen,
//   customerInfo,
//   setCustomerInfo,
//   cartTotal,
//   deliveryFee,
//   grandTotal,
//   estimatedDelivery,
//   isProcessing,
//   isSubmittingOrder = false,
//   submitOrder,
//   cart,
// }) => {
//   const modalRef = useRef<HTMLDivElement>(null);
//   const [currentStep, setCurrentStep] = useState<1 | 2>(1);
//   const [deliveryAreaError, setDeliveryAreaError] = useState<string>("");
//   const [deliveryLocationError, setDeliveryLocationError] = useState<string>("");
  

//   // Delivery areas
//   const deliveryAreas = ["Agbowo", "University of Ibadan"];
  
//   // Delivery locations for Agbowo
//   const agbowoLocations = [
//     "Agbowo - First Gate",
//     "Agbowo - Second Gate", 
//     "Agbowo - UCH School",
//     "Agbowo - Shopping Complex",
//     "Agbowo - Market Area",
//     "Agbowo - Police Station",
//     "Agbowo - Baptist Church",
//   ];

//   // Delivery locations for University of Ibadan
//   const uiLocations = [
//     "UI - School Gate",
//     "UI - Tedder",
//     "UI - Zik",
//     "UI - Tech TLT",
//     "UI - Social Sciences",
//     "UI - Law",
//     "UI - Education LLLT",
//     "UI - Awo Junction",
//     "UI - Amina Way",
//     "UI - Abadina",
//     "UI - Benue Road",
//     "UI - SUB",
//     "UI - Saint Annes",
//     "UI - Indy Hall",
//   ];

//   // Reset to step 1 when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       setCurrentStep(1);
//       setCustomerInfo((prev: CustomerInfo) => ({ ...prev, timeSlot: "nil" }));
//     }
//   }, [isOpen, setCustomerInfo]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         modalRef.current &&
//         !modalRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//       document.body.style.overflow = "hidden";
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.body.style.overflow = "unset";
//     };
//   }, [isOpen, setIsOpen]);

//   const handleDeliveryAreaChange = (area: string) => {
//     const isUIAddress = area === "University of Ibadan";
    
//     setCustomerInfo((prev: CustomerInfo) => ({
//       ...prev,
//       deliveryAddress: area,
//       isUIAddress,
//       // Clear the specific location when area changes
//       pickupLocation: "",
//       timeSlot: "nil",
//     }));
//     setDeliveryAreaError("");
//   };

//   const handleDeliveryLocationChange = (location: string) => {
//     setCustomerInfo((prev: CustomerInfo) => ({
//       ...prev,
//       pickupLocation: location,
//     }));
//     setDeliveryLocationError("");
//   };

//   const validateStep1 = (): boolean => {
//     const errors: string[] = [];
    
//     if (!customerInfo.phone.trim()) errors.push("Phone Number is required");
//     if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil") {
//       errors.push("Delivery Option is required");
//     }
    
//     // Check if delivery option is express
//     const isExpress = customerInfo.deliveryOption === "express";
    
//     // Only validate for express delivery
//     if (isExpress) {
//       if (!customerInfo.deliveryAddress) {
//         errors.push("Delivery Area is required");
//         setDeliveryAreaError("Please select a delivery area");
//       }
      
//       if (!customerInfo.pickupLocation) {
//         errors.push("Delivery Location is required");
//         setDeliveryLocationError("Please select a specific delivery location");
//       }
//     }

//     if (errors.length > 0) {
//       alert(`Please fix the following errors:\n${errors.join("\n")}`);
//       return false;
//     }

//     return true;
//   };

//   const handleNextStep = () => {
//     if (validateStep1()) {
//       setCurrentStep(2);
//     }
//   };

//   const handlePrevStep = () => {
//     setCurrentStep(1);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const errors: string[] = [];
//     if (!customerInfo.name.trim()) errors.push("Full Name is required");
//     if (!customerInfo.email.trim()) errors.push("Email is required");
//     if (!customerInfo.transactionNumber.trim()) errors.push("Bank Transaction Number is required");

//     if (errors.length > 0) {
//       alert(`Please fix the following errors:\n${errors.join("\n")}`);
//       return;
//     }

//     // Check if delivery option is express or pickup
//     const isExpress = customerInfo.deliveryOption === "express";

//     const sanitizedCustomerInfo: CustomerInfo = {
//       name: customerInfo.name.trim(),
//       email: customerInfo.email.trim(),
//       phone: customerInfo.phone.trim(),
//       prescription: null,
//       deliveryOption: customerInfo.deliveryOption,
//       pickupLocation: isExpress ? customerInfo.pickupLocation : "",
//       deliveryAddress: isExpress ? customerInfo.deliveryAddress.trim() : "nil",
//       timeSlot: "nil",
//       isUIAddress: isExpress ? customerInfo.isUIAddress : false,
//       transactionNumber: customerInfo.transactionNumber.trim(),
//       discountCode: "",
//     };

//     console.log("Submitting Customer Info:", sanitizedCustomerInfo);

//     await submitOrder(sanitizedCustomerInfo);
//   };

//   if (!isOpen) return null;

//   const discountedTotal = grandTotal;

//   // Helper functions to check delivery option
//   const isExpressOption = (): boolean => {
//     return customerInfo.deliveryOption === "express";
//   };

//   const isPickupOption = (): boolean => {
//     return customerInfo.deliveryOption === "pickup";
//   };

//   // Get locations based on selected delivery area
//   const getDeliveryLocations = (): string[] => {
//     if (customerInfo.deliveryAddress === "Agbowo") {
//       return agbowoLocations;
//     } else if (customerInfo.deliveryAddress === "University of Ibadan") {
//       return uiLocations;
//     }
//     return [];
//   };

//   // Step indicator - Mobile responsive
//   const StepIndicator = () => (
//     <div className="flex items-center justify-center mb-4 md:mb-6">
//       <div className="flex items-center w-full max-w-xs">
//         <div className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm ${
//           currentStep >= 1 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
//         }`}>
//           1
//         </div>
//         <div className={`flex-1 h-1 mx-1 md:mx-2 ${currentStep >= 2 ? "bg-red-500" : "bg-gray-200"}`} />
//         <div className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm ${
//           currentStep >= 2 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
//         }`}>
//           2
//         </div>
//       </div>
//     </div>
//   );

//   // Order Summary Component - Mobile responsive
//   const OrderSummary = () => {
//     const getDeliveryFeeText = (): string => {
//       if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil") return "N/A";
//       if (customerInfo.deliveryOption === "express") return "₦500";
//       if (customerInfo.deliveryOption === "pickup") return "Free";
//       return "₦500";
//     };

//     return (
//       <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 md:p-4 rounded-xl mb-4 md:mb-6 border border-red-100">
//         <div className="flex items-center gap-2 mb-2 md:mb-3">
//           <ShoppingBag size={18} className="text-red-500 md:w-5 md:h-5" />
//           <h3 className="font-bold text-gray-900 text-sm md:text-base">Order Summary</h3>
//         </div>
//         <div className="space-y-1.5 md:space-y-2">
//           <div className="flex justify-between text-xs md:text-sm">
//             <span className="text-gray-600">Subtotal:</span>
//             <span className="font-medium">₦{cartTotal.toLocaleString()}</span>
//           </div>
//           <div className="flex justify-between text-xs md:text-sm">
//             <span className="text-gray-600">Delivery Fee:</span>
//             <span className="font-medium">{getDeliveryFeeText()}</span>
//           </div>
//           <div className="border-t border-red-200 pt-1.5 md:pt-2 mt-1.5 md:mt-2">
//             <div className="flex justify-between font-bold text-red-600 text-sm md:text-base">
//               <span>Total:</span>
//               <span>₦{discountedTotal.toLocaleString()}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const isExpress = isExpressOption();
//   const isPickup = isPickupOption();
//   const deliveryLocations = getDeliveryLocations();
//   const hasSelectedArea = !!customerInfo.deliveryAddress;

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
//       <div
//         ref={modalRef}
//         className="bg-white rounded-xl md:rounded-2xl w-full max-w-4xl max-h-[98vh] md:max-h-[95vh] overflow-y-auto shadow-2xl transform transition-all"
//       >
//         {/* Header - Sticky with mobile optimizations */}
//         <div className="sticky top-0 z-10 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 p-4 md:p-6">
//           <div className="flex items-start justify-between gap-2">
//             <div className="flex-1">
//               <h2 className="text-lg md:text-2xl font-bold text-gray-900">Complete Your Order</h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
//                 Step {currentStep} of 2: {currentStep === 1 ? "Delivery Details" : "Payment & Confirmation"}
//               </p>
//             </div>
//             <button
//               onClick={() => setIsOpen(false)}
//               className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform flex-shrink-0"
//               aria-label="Close checkout modal"
//               disabled={isProcessing || isSubmittingOrder}
//             >
//               <X size={20} className="text-gray-500 md:w-6 md:h-6" />
//             </button>
//           </div>
//           <StepIndicator />
//         </div>

//         <form onSubmit={handleSubmit} className="p-4 md:p-8">
//           {/* Order Summary at the top of both steps */}
//           <OrderSummary />

//           {currentStep === 1 ? (
//             /* Step 1: Delivery Details - Mobile optimized */
//             <div className="space-y-4 md:space-y-5">
//               {/* Phone Number */}
//               <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                 <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
//                   <Phone size={11} className="mr-1.5 md:mr-2 text-red-500" />
//                   Phone Number *
//                 </label>
//                <input
//   type="tel"
//   required
//   value={customerInfo.phone}
//   onChange={(e) => {
//     const numericOnly = e.target.value.replace(/[^0-9+\-\s()]/g, '');
//     setCustomerInfo((prev: CustomerInfo) => ({ ...prev, phone: numericOnly }));
//   }}
//   onKeyDown={(e) => {
//     if (/[a-zA-Z]/.test(e.key)) e.preventDefault();
//   }}
//   className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
//   placeholder="Enter your phone number"
//   aria-label="Phone number"
//   disabled={isProcessing || isSubmittingOrder}
// />
//               </div>

//               {/* Delivery Options */}
//               <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                 <label className="block text-xs md:text-sm font-medium mb-2 md:mb-3 text-gray-700">
//                   Delivery Option *
//                 </label>
//                 <div className="space-y-2 md:space-y-3">
//                   {/* Express Delivery */}
//                   <label className="flex items-start p-2.5 md:p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="deliveryOption"
//                       value="express"
//                       checked={customerInfo.deliveryOption === "express"}
//                       onChange={(e) => {
//                         setCustomerInfo((prev: CustomerInfo) => ({
//                           ...prev,
//                           deliveryOption: e.target.value as "express",
//                           deliveryAddress: "",
//                           pickupLocation: "",
//                         }));
//                         setDeliveryAreaError("");
//                         setDeliveryLocationError("");
//                       }}
//                       className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
//                       disabled={isProcessing || isSubmittingOrder}
//                     />
//                     <div className="ml-2 md:ml-3 flex-1">
//                       <div className="flex items-center justify-between">
//                         <span className="text-sm md:text-base font-medium text-gray-800">Express Delivery</span>
//                         <span className="text-xs md:text-sm font-semibold text-red-600">₦500</span>
//                       </div>
//                       <span className="text-xs text-gray-500">Within 1 hour to your location</span>
//                     </div>
//                   </label>

//                   {/* Pickup */}
//                   <label className="flex items-start p-2.5 md:p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
//                     <input
//                       type="radio"
//                       name="deliveryOption"
//                       value="pickup"
//                       checked={customerInfo.deliveryOption === "pickup"}
//                       onChange={(e) => {
//                         setCustomerInfo((prev: CustomerInfo) => ({
//                           ...prev,
//                           deliveryOption: e.target.value as "pickup",
//                           deliveryAddress: "",
//                           pickupLocation: "",
//                           isUIAddress: false,
//                         }));
//                         setDeliveryAreaError("");
//                         setDeliveryLocationError("");
//                       }}
//                       className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
//                       disabled={isProcessing || isSubmittingOrder}
//                     />
//                     <div className="ml-2 md:ml-3 flex-1">
//                       <div className="flex items-center justify-between">
//                         <span className="text-sm md:text-base font-medium text-gray-800">Pickup</span>
//                         <span className="text-xs md:text-sm font-semibold text-green-600">Free</span>
//                       </div>
//                       <span className="text-xs text-gray-500">Pick up at our store location</span>
//                     </div>
//                   </label>
//                 </div>

//                 {/* Estimated Delivery - Only for express */}
//                 {estimatedDelivery && customerInfo.deliveryOption === "express" && (
//                   <p className="text-xs text-gray-600 mt-3 bg-red-50 p-2 rounded-md flex items-center gap-1.5">
//                     <Clock size={14} className="text-red-500" />
//                     <span className="font-medium">Estimated Delivery:</span> {estimatedDelivery}
//                   </p>
//                 )}
//               </div>

//               {/* Delivery Area - Only show if Express is selected */}
//               {isExpress && (
//                 <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                   <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
//                     <MapPin size={16} className="mr-1.5 md:mr-2 text-red-500" />
//                     Delivery Area *
//                   </label>
//                   <select
//                     required={isExpress}
//                     value={customerInfo.deliveryAddress || ""}
//                     onChange={(e) => handleDeliveryAreaChange(e.target.value)}
//                     className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
//                     aria-label="Delivery area"
//                     disabled={isProcessing || isSubmittingOrder}
//                   >
//                     <option value="" disabled>
//                       Select a delivery area
//                     </option>
//                     {deliveryAreas.map((area) => (
//                       <option key={area} value={area}>
//                         {area}
//                       </option>
//                     ))}
//                   </select>
//                   {deliveryAreaError && <p className="text-xs text-red-600 mt-1.5">{deliveryAreaError}</p>}
//                 </div>
//               )}

//               {/* Delivery Location - Only show if Express is selected AND an area is selected */}
//               {isExpress && hasSelectedArea && (
//                 <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                   <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
//                     <MapPin size={16} className="mr-1.5 md:mr-2 text-red-500" />
//                     Delivery Location *
//                   </label>
//                   <select
//                     required={isExpress}
//                     value={customerInfo.pickupLocation || ""}
//                     onChange={(e) => handleDeliveryLocationChange(e.target.value)}
//                     className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white appearance-none"
//                     aria-label="Delivery location"
//                     disabled={isProcessing || isSubmittingOrder}
//                   >
//                     <option value="" disabled>
//                       Select a specific location in {customerInfo.deliveryAddress}
//                     </option>
//                     {deliveryLocations.map((location) => (
//                       <option key={location} value={location}>
//                         {location}
//                       </option>
//                     ))}
//                   </select>
//                   {deliveryLocationError && <p className="text-xs text-red-600 mt-1.5">{deliveryLocationError}</p>}
//                   <p className="text-xs text-gray-600 mt-2">
//                     Our rider will deliver to this specific location in {customerInfo.deliveryAddress}.
//                   </p>
//                 </div>
//               )}

//               {/* No location field for Pickup - just a message */}
//               {isPickup && (
//                 <div className="bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
//                   <div className="flex items-center gap-2">
//                     <Store size={18} className="text-green-600" />
//                     <p className="text-sm text-gray-700">
//                       You can pick up your order at:<br />
//                       <span className="font-semibold">Indy Hall, University of Ibadan</span>
//                     </p>
//                   </div>
//                   <p className="text-xs text-gray-500 mt-2">
//                     Pickup available during business hours (*AM - 10PM, Monday - Sunday)
//                   </p>
//                 </div>
//               )}

//               {/* Next Button - Mobile optimized */}
//               <div className="flex justify-end pt-3 md:pt-4">
//                 <button
//                   type="button"
//                   onClick={handleNextStep}
//                   disabled={isProcessing || isSubmittingOrder}
//                   className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base shadow-lg"
//                 >
//                   Next: Payment Details
//                   <ChevronRight size={18} className="md:w-5 md:h-5" />
//                 </button>
//               </div>
//             </div>
//           ) : (
//             /* Step 2: Payment & Confirmation - Mobile optimized */
//             <div className="space-y-4 md:space-y-5">
//               {/* Full Name */}
//               <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                 <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
//                   <User size={16} className="mr-1.5 md:mr-2 text-red-500" />
//                   Full Name *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={customerInfo.name}
//                   onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, name: e.target.value }))}
//                   className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
//                   placeholder="Enter your full name"
//                   aria-label="Full name"
//                   disabled={isProcessing || isSubmittingOrder}
//                 />
//               </div>

//               {/* Email Address */}
//               <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                 <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
//                   <User size={16} className="mr-1.5 md:mr-2 text-red-500" />
//                   Email Address *
//                 </label>
//                 <input
//                   type="email"
//                   required
//                   value={customerInfo.email}
//                   onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, email: e.target.value }))}
//                   className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
//                   placeholder="Enter your email address"
//                   aria-label="Email address"
//                   disabled={isProcessing || isSubmittingOrder}
//                 />
//               </div>

//               {/* Bank Transaction Number */}
//               <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
//                 <label className="block text-xs md:text-sm font-medium mb-1.5 md:mb-2 text-gray-700 flex items-center">
//                   <CreditCard size={16} className="mr-1.5 md:mr-2 text-red-500" />
//                   Bank Transaction Number *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={customerInfo.transactionNumber}
//                   onChange={(e) => setCustomerInfo((prev: CustomerInfo) => ({ ...prev, transactionNumber: e.target.value }))}
//                   className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
//                   placeholder="Enter bank transaction number"
//                   aria-label="Bank transaction number"
//                   disabled={isProcessing || isSubmittingOrder}
//                 />
//                 <div className="mt-2 md:mt-3 p-2.5 md:p-3 bg-red-50 rounded-lg">
//                   <p className="text-xs md:text-sm font-medium text-gray-800">Bank Account Details:</p>
//                   <p className="text-xs text-gray-600">Bank: Moniepoint</p>
//                   <p className="text-xs text-gray-600">Account Name: Ollan Essentials</p>
//                   <p className="text-xs text-gray-600">Account Number: 6617900839</p>
//                   <p className="text-xs text-gray-500 mt-1.5">Please make the bank transfer and enter the transaction number above.</p>
//                 </div>
//               </div>

//               {/* Navigation and Submit Buttons - Mobile optimized */}
//               <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4">
//                 <button
//                   type="button"
//                   onClick={handlePrevStep}
//                   disabled={isProcessing || isSubmittingOrder}
//                   className="w-full sm:flex-1 bg-gray-100 text-gray-700 px-4 md:px-6 py-3 md:py-3.5 rounded-xl font-bold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base order-2 sm:order-1"
//                 >
//                   <ChevronLeft size={18} className="md:w-5 md:h-5" />
//                   Back
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isProcessing || isSubmittingOrder || (isExpress && (!customerInfo.deliveryAddress || !customerInfo.pickupLocation))}
//                   className="w-full sm:flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white py-3 md:py-3.5 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base shadow-lg order-1 sm:order-2"
//                   aria-label="Submit order"
//                 >
//                   {isProcessing || isSubmittingOrder ? (
//                     <>
//                       <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-1"></div>
//                       <span className="text-sm md:text-base">Submitting...</span>
//                     </>
//                   ) : (
//                     <>
//                       <CreditCard size={18} className="md:w-5 md:h-5" />
//                       <span className="text-sm md:text-base">Submit Order</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           )}

//           <p className="text-xs text-center text-gray-500 mt-4 md:mt-6">
//             Your personal data will be used to process your order and for other purposes described in our privacy policy.
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CheckoutModal;


"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X, User, Phone, CreditCard, ChevronRight, ChevronLeft,
  ShoppingBag, MapPin, Clock, Store, Upload, Image as ImageIcon,
  CheckCircle, AlertCircle
} from "lucide-react";

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
  paymentScreenshot?: File | null;
  orderId?: string;
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

// ─── Unique Order ID ───────────────────────────────────────────────────────────
const generateOrderId = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

// ─── Send email via your API route ────────────────────────────────────────────
const fileToBase64 = (file: File): Promise<{ base64: string; mime: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(",");
      const mime = header.replace("data:", "").replace(";base64", "");
      resolve({ base64, mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const sendPaymentEmail = async (info: CustomerInfo, grandTotal: number) => {
  let screenshotBase64: string | null = null;
  let screenshotMime: string | null = null;

  if (info.paymentScreenshot) {
    const result = await fileToBase64(info.paymentScreenshot);
    screenshotBase64 = result.base64;
    screenshotMime = result.mime;
  }

  const res = await fetch("/api/send-payment-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: info.orderId,
      name: info.name,
      email: info.email,
      phone: info.phone,
      deliveryOption: info.deliveryOption,
      pickupLocation: info.pickupLocation,
      deliveryAddress: info.deliveryAddress,
      transactionNumber: info.transactionNumber,
      grandTotal,
      screenshotBase64,
      screenshotMime,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Email API error:", err);
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen, setIsOpen, customerInfo, setCustomerInfo,
  cartTotal, deliveryFee, grandTotal, estimatedDelivery,
  isProcessing, isSubmittingOrder = false, submitOrder, cart,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [deliveryAreaError, setDeliveryAreaError] = useState("");
  const [deliveryLocationError, setDeliveryLocationError] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"manual" | "screenshot">("screenshot");

  const deliveryAreas = ["Agbowo", "University of Ibadan"];

  const agbowoLocations = [
    "Agbowo - First Gate", "Agbowo - Second Gate", "Agbowo - UCH School",
    "Agbowo - Shopping Complex", "Agbowo - Market Area",
    "Agbowo - Police Station", "Agbowo - Baptist Church",
  ];

  const uiLocations = [
    "UI - School Gate", "UI - Tedder", "UI - Zik", "UI - Tech TLT",
    "UI - Social Sciences", "UI - Law", "UI - Education LLLT",
    "UI - Awo Junction", "UI - Amina Way", "UI - Abadina",
    "UI - Benue Road", "UI - SUB", "UI - Saint Annes", "UI - Indy Hall",
  ];

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setScreenshotPreview(null);
      setPaymentMode("screenshot");
      const newOrderId = generateOrderId();
      setCustomerInfo((prev: CustomerInfo) => ({
        ...prev, timeSlot: "nil", orderId: newOrderId,
        paymentScreenshot: null, transactionNumber: "",
      }));
    }
  }, [isOpen, setCustomerInfo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setIsOpen(false);
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

  // ── Screenshot handlers ──────────────────────────────────────────────────────
  const handleScreenshotFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { alert("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Screenshot must be under 5 MB"); return; }

    const uniqueId = customerInfo.orderId ?? generateOrderId();
    setCustomerInfo((prev: CustomerInfo) => ({
      ...prev,
      paymentScreenshot: file,
      transactionNumber: `screenshot_${uniqueId}`,
    }));

    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [customerInfo.orderId, setCustomerInfo]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleScreenshotFile(file);
  }, [handleScreenshotFile]);

  const clearScreenshot = () => {
    setScreenshotPreview(null);
    setCustomerInfo((prev: CustomerInfo) => ({
      ...prev, paymentScreenshot: null, transactionNumber: "",
    }));
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
  };

  // ── Delivery helpers ─────────────────────────────────────────────────────────
  const handleDeliveryAreaChange = (area: string) => {
    setCustomerInfo((prev: CustomerInfo) => ({
      ...prev, deliveryAddress: area,
      isUIAddress: area === "University of Ibadan",
      pickupLocation: "", timeSlot: "nil",
    }));
    setDeliveryAreaError("");
  };

  const getDeliveryLocations = (): string[] => {
    if (customerInfo.deliveryAddress === "Agbowo") return agbowoLocations;
    if (customerInfo.deliveryAddress === "University of Ibadan") return uiLocations;
    return [];
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const errors: string[] = [];
    if (!customerInfo.phone.trim()) errors.push("Phone Number is required");
    if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil")
      errors.push("Delivery Option is required");
    if (customerInfo.deliveryOption === "express") {
      if (!customerInfo.deliveryAddress) {
        errors.push("Delivery Area is required");
        setDeliveryAreaError("Please select a delivery area");
      }
      if (!customerInfo.pickupLocation) {
        errors.push("Delivery Location is required");
        setDeliveryLocationError("Please select a specific delivery location");
      }
    }
    if (errors.length > 0) { alert(`Please fix:\n${errors.join("\n")}`); return false; }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!customerInfo.name.trim()) errors.push("Full Name is required");
    if (!customerInfo.email.trim()) errors.push("Email is required");
    if (paymentMode === "screenshot" && !customerInfo.paymentScreenshot)
      errors.push("Please upload your payment screenshot");
    if (paymentMode === "manual" && !customerInfo.transactionNumber.trim())
      errors.push("Bank Transaction Number is required");

    if (errors.length > 0) { alert(`Please fix:\n${errors.join("\n")}`); return; }

    const isExpress = customerInfo.deliveryOption === "express";
    const sanitized: CustomerInfo = {
      name: customerInfo.name.trim(),
      email: customerInfo.email.trim(),
      phone: customerInfo.phone.trim(),
      prescription: null,
      deliveryOption: customerInfo.deliveryOption,
      pickupLocation: isExpress ? customerInfo.pickupLocation : "",
      deliveryAddress: isExpress ? customerInfo.deliveryAddress.trim() : "nil",
      timeSlot: "nil",
      isUIAddress: isExpress ? customerInfo.isUIAddress : false,
      transactionNumber: customerInfo.transactionNumber.trim(),
      discountCode: "",
      orderId: customerInfo.orderId,
      paymentScreenshot: customerInfo.paymentScreenshot ?? null,
    };

    // Send email fire-and-forget (don't block order submission)
    sendPaymentEmail(sanitized, grandTotal).catch(console.error);

    await submitOrder(sanitized);
  };

  if (!isOpen) return null;

  const isExpress = customerInfo.deliveryOption === "express";
  const isPickup = customerInfo.deliveryOption === "pickup";
  const hasSelectedArea = !!customerInfo.deliveryAddress;
  const deliveryLocations = getDeliveryLocations();
  const orderId = customerInfo.orderId ?? "";

  // ── Sub-components ───────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-4 md:mb-6">
      <div className="flex items-center w-full max-w-xs">
        {[1, 2].map((step, i) => (
          <React.Fragment key={step}>
            {i > 0 && <div className={`flex-1 h-1 mx-1 md:mx-2 transition-colors ${currentStep >= step ? "bg-red-500" : "bg-gray-200"}`} />}
            <div className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-bold transition-colors ${currentStep >= step ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"}`}>
              {step}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const OrderSummary = () => {
    const feeText = !customerInfo.deliveryOption || customerInfo.deliveryOption === "nil" ? "N/A"
      : customerInfo.deliveryOption === "express" ? "₦500" : "Free";
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 md:p-4 rounded-xl mb-4 md:mb-6 border border-red-100">
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <ShoppingBag size={18} className="text-red-500" />
          <h3 className="font-bold text-gray-900 text-sm md:text-base">Order Summary</h3>
          <span className="ml-auto text-[10px] md:text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 select-all">
            {orderId}
          </span>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₦{cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Delivery Fee:</span>
            <span className="font-medium">{feeText}</span>
          </div>
          <div className="border-t border-red-200 pt-1.5 md:pt-2 flex justify-between font-bold text-red-600 text-sm md:text-base">
            <span>Total:</span>
            <span>₦{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div ref={modalRef} className="bg-white rounded-xl md:rounded-2xl w-full max-w-4xl max-h-[98vh] md:max-h-[95vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-50 to-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Complete Your Order</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                Step {currentStep} of 2: {currentStep === 1 ? "Delivery Details" : "Payment & Confirmation"}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
              disabled={isProcessing || isSubmittingOrder}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <StepIndicator />
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8">
          <OrderSummary />

          {currentStep === 1 ? (
            /* ── Step 1: Delivery ── */
            <div className="space-y-4 md:space-y-5">
              {/* Phone */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 text-gray-700 flex items-center gap-1.5">
                  <Phone size={14} className="text-red-500" /> Phone Number *
                </label>
                <input
                  type="tel" required value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, phone: e.target.value.replace(/[^0-9+\-\s()]/g, "") }))}
                  onKeyDown={(e) => { if (/[a-zA-Z]/.test(e.key)) e.preventDefault(); }}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your phone number"
                  disabled={isProcessing || isSubmittingOrder}
                />
              </div>

              {/* Delivery Options */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-2 md:mb-3 text-gray-700">Delivery Option *</label>
                <div className="space-y-2 md:space-y-3">
                  {[
                    { value: "express", label: "Express Delivery", sub: "Within 1 hour to your location", price: "₦500", priceClass: "text-red-600" },
                    { value: "pickup", label: "Pickup", sub: "Pick up at our store location", price: "Free", priceClass: "text-green-600" },
                  ].map(({ value, label, sub, price, priceClass }) => (
                    <label key={value} className="flex items-start p-2.5 md:p-3 border border-gray-300 rounded-lg hover:border-red-300 cursor-pointer">
                      <input
                        type="radio" name="deliveryOption" value={value}
                        checked={customerInfo.deliveryOption === value}
                        onChange={(e) => {
                          setCustomerInfo((p: CustomerInfo) => ({
                            ...p, deliveryOption: e.target.value as any,
                            deliveryAddress: "", pickupLocation: "", isUIAddress: false,
                          }));
                          setDeliveryAreaError(""); setDeliveryLocationError("");
                        }}
                        className="h-4 w-4 mt-0.5 text-red-600 focus:ring-red-500"
                        disabled={isProcessing || isSubmittingOrder}
                      />
                      <div className="ml-2 md:ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm md:text-base font-medium text-gray-800">{label}</span>
                          <span className={`text-xs md:text-sm font-semibold ${priceClass}`}>{price}</span>
                        </div>
                        <span className="text-xs text-gray-500">{sub}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {estimatedDelivery && customerInfo.deliveryOption === "express" && (
                  <p className="text-xs text-gray-600 mt-3 bg-red-50 p-2 rounded-md flex items-center gap-1.5">
                    <Clock size={14} className="text-red-500" />
                    <span className="font-medium">Estimated:</span> {estimatedDelivery}
                  </p>
                )}
              </div>

              {/* Delivery Area */}
              {isExpress && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <label className="block text-xs md:text-sm font-medium mb-1.5 text-gray-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-500" /> Delivery Area *
                  </label>
                  <select
                    value={customerInfo.deliveryAddress || ""}
                    onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                    className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-800 bg-white"
                    disabled={isProcessing || isSubmittingOrder}
                  >
                    <option value="" disabled>Select a delivery area</option>
                    {deliveryAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {deliveryAreaError && <p className="text-xs text-red-600 mt-1.5">{deliveryAreaError}</p>}
                </div>
              )}

              {/* Delivery Location */}
              {isExpress && hasSelectedArea && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <label className="block text-xs md:text-sm font-medium mb-1.5 text-gray-700 flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-500" /> Delivery Location *
                  </label>
                  <select
                    value={customerInfo.pickupLocation || ""}
                    onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, pickupLocation: e.target.value }))}
                    className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-800 bg-white"
                    disabled={isProcessing || isSubmittingOrder}
                  >
                    <option value="" disabled>Select location in {customerInfo.deliveryAddress}</option>
                    {deliveryLocations.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {deliveryLocationError && <p className="text-xs text-red-600 mt-1.5">{deliveryLocationError}</p>}
                  <p className="text-xs text-gray-500 mt-2">Our rider will deliver to this spot in {customerInfo.deliveryAddress}.</p>
                </div>
              )}

              {/* Pickup info */}
              {isPickup && (
                <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200 flex items-start gap-2">
                  <Store size={18} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">Pickup at: <span className="font-semibold">Indy Hall, University of Ibadan</span></p>
                    <p className="text-xs text-gray-500 mt-1">*AM – 10 PM, Monday – Sunday</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="button" onClick={() => { if (validateStep1()) setCurrentStep(2); }}
                  disabled={isProcessing || isSubmittingOrder}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-sm shadow-lg"
                >
                  Next: Payment Details <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 2: Payment ── */
            <div className="space-y-4 md:space-y-5">
              {/* Full Name */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 text-gray-700 flex items-center gap-1.5">
                  <User size={14} className="text-red-500" /> Full Name *
                </label>
                <input
                  type="text" required value={customerInfo.name}
                  onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, name: e.target.value }))}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your full name"
                  disabled={isProcessing || isSubmittingOrder}
                />
              </div>

              {/* Email */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <label className="block text-xs md:text-sm font-medium mb-1.5 text-gray-700 flex items-center gap-1.5">
                  <User size={14} className="text-red-500" /> Email Address *
                </label>
                <input
                  type="email" required value={customerInfo.email}
                  onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, email: e.target.value }))}
                  className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                  placeholder="Enter your email address"
                  disabled={isProcessing || isSubmittingOrder}
                />
              </div>

              {/* Bank Details Banner */}
              <div className="bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-xl">
                <p className="text-xs md:text-sm font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-amber-600" />
                  Transfer to this account first:
                </p>
                <div className="space-y-0.5">
                  <p className="text-xs text-amber-700"><span className="font-semibold">Bank:</span> Moniepoint</p>
                  <p className="text-xs text-amber-700"><span className="font-semibold">Account Name:</span> Ollan Essentials</p>
                  <p className="text-xs text-amber-700"><span className="font-semibold">Account Number:</span>5235008468</p>
                  <p className="text-xs text-amber-600 mt-1">Amount: <span className="font-bold">₦{grandTotal.toLocaleString()}</span></p>
                </div>
              </div>

              {/* Payment Mode Toggle */}
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                <p className="text-xs md:text-sm font-medium text-gray-700 mb-2">After paying, verify with:</p>
                <div className="flex gap-2">
                  {(["screenshot", "manual"] as const).map((mode) => (
                    <button
                      key={mode} type="button"
                      onClick={() => {
                        setPaymentMode(mode);
                        if (mode === "manual") clearScreenshot();
                        if (mode === "screenshot")
                          setCustomerInfo((p: CustomerInfo) => ({ ...p, transactionNumber: "" }));
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-medium border transition-all ${
                        paymentMode === mode
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-white text-gray-600 border-gray-300 hover:border-red-300"
                      }`}
                    >
                      {mode === "screenshot" ? "📸 Upload Screenshot" : "✍️ Enter Txn Number"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screenshot Upload */}
              {paymentMode === "screenshot" && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <label className="block text-xs md:text-sm font-medium mb-2 text-gray-700 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-red-500" /> Payment Screenshot *
                  </label>

                  {!screenshotPreview ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => screenshotInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all ${
                        isDragging ? "border-red-400 bg-red-50 scale-[1.02]" : "border-gray-300 hover:border-red-300 hover:bg-red-50/30"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-red-100" : "bg-gray-100"}`}>
                          <Upload size={22} className={isDragging ? "text-red-500" : "text-gray-400"} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {isDragging ? "Drop it here!" : "Upload payment screenshot"}
                        </p>
                        <p className="text-xs text-gray-500">Drag & drop or click to browse · PNG, JPG up to 5 MB</p>
                      </div>
                      <input
                        ref={screenshotInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScreenshotFile(f); }}
                        disabled={isProcessing || isSubmittingOrder}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border-2 border-green-300 bg-green-50">
                      <img src={screenshotPreview} alt="Payment proof" className="w-full max-h-52 object-contain" />
                      <div className="flex items-center justify-between p-2 bg-white border-t border-green-200">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Screenshot uploaded</span>
                        </div>
                        <button type="button" onClick={clearScreenshot}
                          className="text-xs text-red-500 hover:text-red-700 underline"
                          disabled={isProcessing || isSubmittingOrder}>
                          Remove
                        </button>
                      </div>
                      <div className="px-2 pb-2 bg-white">
                        <p className="text-[10px] text-gray-400">
                          Ref: <span className="font-mono text-gray-600">{customerInfo.transactionNumber}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-start gap-1.5 text-xs text-gray-500">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <span>
                      Your screenshot will be emailed to our team with reference{" "}
                      <span className="font-mono font-medium text-gray-700">{orderId}</span>.
                      We'll confirm your order within minutes.
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Txn Number */}
              {paymentMode === "manual" && (
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <label className="block text-xs md:text-sm font-medium mb-1.5 text-gray-700 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-red-500" /> Bank Transaction Number *
                  </label>
                  <input
                    type="text" required={paymentMode === "manual"}
                    value={customerInfo.transactionNumber}
                    onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, transactionNumber: e.target.value }))}
                    className="w-full p-2.5 md:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 bg-white"
                    placeholder="e.g. T250301XXXXXX"
                    disabled={isProcessing || isSubmittingOrder}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Find this in your bank transfer confirmation SMS or app notification.</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4">
                <button type="button" onClick={() => setCurrentStep(1)}
                  disabled={isProcessing || isSubmittingOrder}
                  className="w-full sm:flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-sm order-2 sm:order-1">
                  <ChevronLeft size={18} /> Back
                </button>
                <button type="submit"
                  disabled={
                    isProcessing || isSubmittingOrder ||
                    (isExpress && (!customerInfo.deliveryAddress || !customerInfo.pickupLocation)) ||
                    (paymentMode === "screenshot" && !screenshotPreview)
                  }
                  className="w-full sm:flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white py-3 rounded-xl font-bold hover:from-red-700 hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg order-1 sm:order-2">
                  {isProcessing || isSubmittingOrder ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Submitting...</>
                  ) : (
                    <><CreditCard size={18} /> Submit Order</>
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

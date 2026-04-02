"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X, User, Phone, ChevronRight, ChevronLeft,
  ShoppingBag, Clock, Store,
  CheckCircle, AlertCircle, Check, Zap, ShieldCheck
} from "lucide-react";

// ─── Flutterwave script loader ─────────────────────────────────────────────
const FLW_PUBLIC_KEY = "FLWPUBK-5af0fa3d04fe058583fd4d3f8087c8f2-X";

const loadFlutterwaveScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if ((window as any).FlutterwaveCheckout) return resolve();
    const existing = document.getElementById("flw-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "flw-script";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Flutterwave"));
    document.head.appendChild(script);
  });

// ─── Backend verification ──────────────────────────────────────────────────
const verifyPaymentWithBackend = async (
  transactionId: string | number,
  expectedAmount: number
): Promise<{ verified: boolean; message?: string }> => {
  const res = await fetch("https://ollanback.vercel.app/api/orders/verify-payment-real", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      transaction_id: transactionId,
      expected_amount: expectedAmount,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { verified: false, message: err.message || "Verification request failed" };
  }

  const data = await res.json();
  return { verified: !!data.verified, message: data.message };
};

// ─── Types ─────────────────────────────────────────────────────────────────
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
  flwTransactionId?: string;
  flwTxRef?: string;
  [key: string]: any;
}

interface CheckoutPageProps {
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  estimatedDelivery: string;
  isProcessing: boolean;
  isSubmittingOrder?: boolean;
  submitOrder: (info: CustomerInfo) => Promise<void> | void;
  cart: { productId: string; quantity: number }[];
  availableStoreCredit: number;
  useStoreCredit: boolean;
  setUseStoreCredit: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const generateOrderId = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const computeDiscountedTotal = (
  grandTotal: number,
  promoDiscount: { type: "percent" | "fixed"; value: number } | null
): number => {
  if (!promoDiscount) return grandTotal;
  if (promoDiscount.type === "percent")
    return Math.max(0, grandTotal - (grandTotal * promoDiscount.value) / 100);
  return Math.max(0, grandTotal - promoDiscount.value);
};

const handleReferralApply = async (
  code: string,
  setReferralStatus: React.Dispatch<React.SetStateAction<"idle" | "valid" | "invalid" | "checking">>,
  setReferralMessage: React.Dispatch<React.SetStateAction<string>>
) => {
  if (!code.trim()) return;
  setReferralStatus("checking");
  setReferralMessage("");
  try {
    setReferralStatus("valid");
    setReferralMessage("Referral code applied! Referrer will get 3% store credit after payment is verified.");
  } catch {
    setReferralStatus("invalid");
    setReferralMessage("Could not apply referral code. Please try again.");
  }
};

const redeemCodeAfterOrder = async (promoCode: string, usedBy: string) => {
  if (!promoCode.trim()) return;
  try {
    await fetch("/api/discount/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode.trim().toUpperCase(), usedBy }),
    });
  } catch (err) {
    console.error("Failed to redeem promo code:", err);
  }
};

// ─── Main Checkout Page Component ─────────────────────────────────────────
const CheckoutPage: React.FC<CheckoutPageProps> = ({
  customerInfo,
  setCustomerInfo,
  cartTotal,
  deliveryFee,
  grandTotal,
  estimatedDelivery,
  isProcessing,
  isSubmittingOrder = false,
  submitOrder,
  availableStoreCredit,
  useStoreCredit,
  setUseStoreCredit,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [deliveryAreaError, setDeliveryAreaError] = useState("");
  const [deliveryLocationError, setDeliveryLocationError] = useState("");

  // Payment state
  const [flwLoading, setFlwLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Referral / Promo
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [referralMessage, setReferralMessage] = useState("");
  const [promoCode] = useState("");
  const [promoStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [promoDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null);

  const STORE_CREDIT_MIN = 2500;
  const canUseStoreCredit = cartTotal >= STORE_CREDIT_MIN;
  const finalTotal = computeDiscountedTotal(grandTotal, promoDiscount);

  const deliveryAreas = ["Agbowo", "University of Ibadan"];
  const agbowoLocations = [
    "Agbowo - First Gate", "Agbowo - Second Gate", "Agbowo - UCH School",
    "Agbowo - Shopping Complex", "Agbowo - Market Area", "Agbowo - Police Station",
    "Agbowo - Baptist Church",
  ];
  const uiLocations = [
    "UI - School Gate", "UI - Tedder", "UI - Zik", "UI - Tech TLT",
    "UI - Social Sciences", "UI - Law", "UI - Education LLLT", "UI - Awo Junction",
    "UI - Amina Way", "UI - Abadina", "UI - Benue Road", "UI - SUB",
    "UI - Saint Annes", "UI - Indy Hall",
  ];

  useEffect(() => {
    loadFlutterwaveScript().catch(console.error);
  }, []);

  // Reset form when component mounts
  useEffect(() => {
    const newOrderId = generateOrderId();
    setCustomerInfo((prev) => ({
      ...prev,
      name: prev.name || "",
      email: prev.email || "",
      phone: prev.phone || "",
      deliveryOption: prev.deliveryOption || "",
      pickupLocation: "",
      deliveryAddress: "",
      timeSlot: "nil",
      isUIAddress: false,
      transactionNumber: "",
      orderId: newOrderId,
      paymentScreenshot: null,
      flwTransactionId: undefined,
      flwTxRef: undefined,
    }));
    setCurrentStep(1);
    setPaymentSuccess(false);
    setPaymentError("");
    setVerifyingPayment(false);
    setReferralCode("");
    setReferralStatus("idle");
    setReferralMessage("");
  }, [setCustomerInfo]);

  const handleDeliveryAreaChange = (area: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      deliveryAddress: area,
      isUIAddress: area === "University of Ibadan",
      pickupLocation: "",
      timeSlot: "nil",
    }));
    setDeliveryAreaError("");
  };

  const getDeliveryLocations = (): string[] => {
    if (customerInfo.deliveryAddress === "Agbowo") return agbowoLocations;
    if (customerInfo.deliveryAddress === "University of Ibadan") return uiLocations;
    return [];
  };

  const validateStep1 = (): boolean => {
    const errors: string[] = [];
    if (!customerInfo.phone.trim()) errors.push("Phone Number is required");
    if (!customerInfo.deliveryOption || customerInfo.deliveryOption === "nil")
      errors.push("Delivery Option is required");
    if (customerInfo.deliveryOption === "express") {
      if (!customerInfo.deliveryAddress.trim()) {
        errors.push("Delivery Area is required");
        setDeliveryAreaError("Please select a delivery area");
      }
      if (!customerInfo.pickupLocation.trim()) {
        errors.push("Delivery Location is required");
        setDeliveryLocationError("Please select a specific delivery location");
      }
    }
    if (errors.length > 0) {
      alert(`Please fix:\n${errors.join("\n")}`);
      return false;
    }
    return true;
  };

  const validateStep2Fields = (): boolean => {
    const errors: string[] = [];
    if (!customerInfo.name.trim()) errors.push("Full Name is required");
    if (!customerInfo.email.trim()) errors.push("Email is required");
    if (errors.length > 0) {
      alert(`Please fix:\n${errors.join("\n")}`);
      return false;
    }
    return true;
  };

  // ── Flutterwave payment handler with refresh on success ─────────────────
  const handleFlutterwavePayment = useCallback(async () => {
    if (!validateStep2Fields()) return;
    setPaymentError("");

    try {
      await loadFlutterwaveScript();
    } catch {
      setPaymentError("Could not load payment provider. Please check your connection.");
      return;
    }

    const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
    if (!FlutterwaveCheckout) {
      setPaymentError("Payment provider unavailable. Please refresh and try again.");
      return;
    }

    setFlwLoading(true);

    const txRef = `${customerInfo.orderId ?? generateOrderId()}-${Date.now()}`;

    FlutterwaveCheckout({
      public_key: FLW_PUBLIC_KEY,
      tx_ref: txRef,
      amount: finalTotal,
      currency: "NGN",
      payment_options: "banktransfer,opay",
      customer: {
        email: customerInfo.email.trim(),
        phone_number: customerInfo.phone.trim(),
        name: customerInfo.name.trim(),
      },
      customizations: {
        title: "Ollan Essentials",
        description: `Order ${customerInfo.orderId}`,
        logo: "",
      },
      meta: {
        order_id: customerInfo.orderId,
        delivery_option: customerInfo.deliveryOption,
        delivery_address: customerInfo.deliveryAddress,
        pickup_location: customerInfo.pickupLocation,
      },

      callback: async (response: any) => {
        if (response.status === "successful" || response.status === "completed") {
          setFlwLoading(false);
          setVerifyingPayment(true);
          setPaymentError("");

          let verified = false;
          try {
            const result = await verifyPaymentWithBackend(
              response.transaction_id,
              finalTotal
            );
            verified = result.verified;
            if (!verified) {
              setPaymentError(
                result.message || "Payment could not be confirmed by our server."
              );
            }
          } catch {
            setPaymentError("Network error while confirming payment. Please contact support.");
          } finally {
            setVerifyingPayment(false);
          }

          if (!verified) return;

          // Payment verified → Submit order
          setPaymentSuccess(true);

          const sanitized: CustomerInfo = {
            name: customerInfo.name.trim(),
            email: customerInfo.email.trim(),
            phone: customerInfo.phone.trim(),
            prescription: null,
            deliveryOption: customerInfo.deliveryOption,
            pickupLocation: customerInfo.pickupLocation.trim(),
            deliveryAddress: customerInfo.deliveryAddress.trim(),
            timeSlot: customerInfo.timeSlot || "nil",
            isUIAddress: customerInfo.isUIAddress,
            transactionNumber: String(response.transaction_id ?? txRef),
            orderId: customerInfo.orderId,
            paymentScreenshot: null,
            referralCode: referralCode.trim().toUpperCase() || undefined,
            promoCode: promoStatus === "valid" ? promoCode.trim().toUpperCase() : "",
            storeCreditUsed: canUseStoreCredit && useStoreCredit
              ? Math.min(availableStoreCredit, cartTotal)
              : 0,
            flwTransactionId: String(response.transaction_id),
            flwTxRef: response.tx_ref,
          };

          await submitOrder(sanitized);

          if (promoStatus === "valid" && promoCode) {
            await redeemCodeAfterOrder(
              promoCode,
              sanitized.email || sanitized.orderId || "anonymous"
            );
          }

          // Refresh the page after successful payment to ensure order is fully processed
          setTimeout(() => {
            window.location.reload(); // Full refresh to clear cart/state if needed
          }, 1800); // Small delay so user can see success message

        } else {
          setFlwLoading(false);
          setPaymentError("Payment was not completed. Please try again.");
        }
      },

      onclose: () => {
        setFlwLoading(false);
        setVerifyingPayment(false);
      },
    });
  }, [
    customerInfo, finalTotal, referralCode, promoCode, promoStatus,
    canUseStoreCredit, useStoreCredit, availableStoreCredit, cartTotal, submitOrder,
  ]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setCurrentStep(2);
  };

  const isExpress = customerInfo.deliveryOption === "express";
  const isPickup = customerInfo.deliveryOption === "pickup";
  const hasSelectedArea = !!customerInfo.deliveryAddress.trim();
  const deliveryLocations = getDeliveryLocations();
  const orderId = customerInfo.orderId ?? "";

  const inputCls = "w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all";
  const inputWithIconCls = "w-full pl-9 pr-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all";

  const isBusy = isProcessing || isSubmittingOrder || flwLoading || verifyingPayment;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-50 px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {currentStep === 2 && !paymentSuccess && (
              <button
                onClick={() => setCurrentStep(1)}
                disabled={isBusy}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="font-bold text-xl text-gray-900">
                {paymentSuccess ? "Order Confirmed" : currentStep === 1 ? "Checkout" : "Review & Pay"}
              </h1>
              {!paymentSuccess && (
                <p className="text-sm text-gray-500">Step {currentStep} of 2</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Order ID</div>
            <div className="font-mono text-sm font-semibold text-gray-700">{orderId}</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Verifying Payment */}
        {verifyingPayment && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldCheck size={48} className="text-blue-500 animate-pulse mb-4" />
            <h3 className="text-xl font-bold">Verifying Payment...</h3>
            <p className="text-gray-500 mt-2">Please wait while we confirm your payment</p>
          </div>
        )}

        {/* Success State */}
        {paymentSuccess && !verifyingPayment && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={60} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your order <span className="font-mono font-semibold">#{orderId}</span> has been placed successfully.
            </p>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full mb-8">
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="text-4xl font-black text-gray-900 mt-1">₦{finalTotal.toLocaleString()}</p>
            </div>

            <p className="text-sm text-gray-500 mb-8">
              A confirmation email has been sent to {customerInfo.email}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg transition-all"
            >
              Refresh Page
            </button>
          </div>
        )}

        {/* Main Checkout Flow */}
        {!paymentSuccess && !verifyingPayment && (
          <>
            {/* Total Card */}
            <div className="bg-white rounded-3xl shadow-sm border p-5 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="text-red-500" />
                  <div>
                    <p className="font-semibold text-lg">₦{finalTotal.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total to pay</p>
                  </div>
                </div>
                {promoDiscount && (
                  <span className="text-emerald-600 text-sm font-medium">Discount Applied</span>
                )}
              </div>
            </div>

            {/* Step 1: Delivery Details */}
            {currentStep === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">PHONE NUMBER *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value.replace(/[^0-9+\s-]/g, "") }))}
                      className={inputWithIconCls}
                      placeholder="08012345678"
                      disabled={isBusy}
                    />
                  </div>
                </div>

                {/* Delivery Option */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-3">DELIVERY OPTION *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "express", label: "Express Delivery", sub: "~1 hour", icon: Clock },
                      { value: "pickup", label: "Store Pickup", sub: "Indy Hall", icon: Store },
                    ].map(({ value, label, sub, icon: Icon }) => (
                      <label
                        key={value}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${customerInfo.deliveryOption === value ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-200"}`}
                      >
                        <input
                          type="radio"
                          name="deliveryOption"
                          value={value}
                          checked={customerInfo.deliveryOption === value}
                          onChange={(e) => setCustomerInfo(p => ({ ...p, deliveryOption: e.target.value as any }))}
                          className="sr-only"
                        />
                        <Icon size={24} className={customerInfo.deliveryOption === value ? "text-red-500" : "text-gray-400"} />
                        <p className="font-bold mt-3">{label}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Express Delivery Fields */}
                {isExpress && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">DELIVERY AREA *</label>
                      <select
                        value={customerInfo.deliveryAddress}
                        onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                        className={inputCls}
                        disabled={isBusy}
                      >
                        <option value="">Select Area</option>
                        {deliveryAreas.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    {hasSelectedArea && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">DROP-OFF LOCATION *</label>
                        <select
                          value={customerInfo.pickupLocation}
                          onChange={(e) => setCustomerInfo(p => ({ ...p, pickupLocation: e.target.value }))}
                          className={inputCls}
                          disabled={isBusy}
                        >
                          <option value="">Choose specific location</option>
                          {deliveryLocations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {isPickup && (
                  <div className="bg-green-50 border border-green-200 p-5 rounded-2xl">
                    <p className="font-semibold">Pickup Location:</p>
                    <p className="text-sm text-gray-600">Indy Hall, University of Ibadan</p>
                  </div>
                )}

                {/* Store Credit & Referral */}
                {availableStoreCredit > 0 && canUseStoreCredit && (
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-emerald-800">Store Credit</p>
                        <p className="text-2xl font-bold text-emerald-700">₦{availableStoreCredit.toLocaleString()}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useStoreCredit}
                          onChange={(e) => setUseStoreCredit(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-7 bg-gray-300 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">REFERRAL CODE (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl font-mono uppercase"
                      placeholder="ENTER CODE"
                      disabled={referralStatus === "valid"}
                    />
                    <button
                      type="button"
                      onClick={() => handleReferralApply(referralCode, setReferralStatus, setReferralMessage)}
                      disabled={!referralCode.trim() || referralStatus === "valid"}
                      className="px-8 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-lg mt-6"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* Step 2: Review & Pay */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">FULL NAME *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))}
                      className={inputWithIconCls}
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">EMAIL ADDRESS *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(p => ({ ...p, email: e.target.value }))}
                      className={inputWithIconCls}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white border rounded-3xl p-6 space-y-3">
                  <p className="font-semibold text-gray-500 text-sm">ORDER SUMMARY</p>
                  <div className="flex justify-between"><span>Subtotal</span><span>₦{cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>₦{deliveryFee.toLocaleString()}</span></div>
                  {useStoreCredit && <div className="flex justify-between text-emerald-600"><span>Store Credit</span><span>-₦{Math.min(availableStoreCredit, cartTotal).toLocaleString()}</span></div>}
                  <div className="pt-3 border-t font-bold text-lg flex justify-between">
                    <span>Total</span>
                    <span>₦{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-600 text-sm">
                    {paymentError}
                  </div>
                )}

                <button
                  onClick={handleFlutterwavePayment}
                  disabled={isBusy}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {flwLoading ? "Processing..." : `Pay ₦${finalTotal.toLocaleString()} Securely`}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Secured by Flutterwave • Bank Transfer & OPay
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
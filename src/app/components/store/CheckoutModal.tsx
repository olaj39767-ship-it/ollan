
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
    credentials: "include", // sends cookies/auth headers
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
  submitOrder: (info: CustomerInfo) => Promise<void> | void;
cart: { productId: string; quantity: number; unit?: "kg" | "congo" }[];
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

// ─── Main Component ────────────────────────────────────────────────────────
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
  availableStoreCredit,
  useStoreCredit,
  setUseStoreCredit,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [deliveryAreaError, setDeliveryAreaError] = useState("");
  const [deliveryLocationError, setDeliveryLocationError] = useState("");

  // Payment state
  const [flwLoading, setFlwLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  // Verification state shown to user
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Referral / Promo
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [referralMessage, setReferralMessage] = useState("");
  const [promoCode] = useState("");
  const [promoStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [promoDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null);

  // Store credit
  const STORE_CREDIT_MIN = 2500;
  const canUseStoreCredit = cartTotal >= STORE_CREDIT_MIN;

  useEffect(() => {
    if (!canUseStoreCredit && useStoreCredit) setUseStoreCredit(false);
  }, [canUseStoreCredit, useStoreCredit, setUseStoreCredit]);

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
    if (!isOpen) return;
    const style = document.createElement("style");
    style.id = "checkout-modal-no-zoom";
    style.textContent = `
      #checkout-modal input,
      #checkout-modal select,
      #checkout-modal textarea { font-size: 16px !important; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("checkout-modal-no-zoom")?.remove(); };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) loadFlutterwaveScript().catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setPaymentSuccess(false);
      setPaymentError("");
      setVerifyingPayment(false);
      setReferralCode("");
      setReferralStatus("idle");
      setReferralMessage("");
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
    }
  }, [isOpen, setCustomerInfo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node))
        setIsOpen(false);
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

  // ── Flutterwave payment handler ─────────────────────────────────────────
const handleFlutterwavePayment = useCallback(async () => {
  if (!validateStep2Fields()) return;
  setPaymentError('');
  setFlwLoading(true);

  try {
    await loadFlutterwaveScript();
  } catch {
    setPaymentError('Could not load payment provider. Please check your connection.');
    setFlwLoading(false);
    return;
  }

  // ── Step 1: Create pending order on backend ──────────────────
  let backendOrderId: string;
  let payableAmount: number;

  try {
    const res = await fetch('https://ollanback.vercel.app/api/orders/create-pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        customerInfo: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim(),
          deliveryOption: customerInfo.deliveryOption,
          deliveryAddress: customerInfo.deliveryAddress,
          pickupLocation: customerInfo.pickupLocation,
          timeSlot: customerInfo.timeSlot || 'nil',
          referralCode: referralCode.trim() || undefined,
        },
items: cart.map((item) => ({
  ...item,
  unit: item.unit ?? "kg",  // already on cart items, but make explicit
})),
        storeCreditApplied: canUseStoreCredit && useStoreCredit,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setPaymentError(err.message || 'Could not create order. Please try again.');
      setFlwLoading(false);
      return;
    }

    const data = await res.json();
    backendOrderId = data.orderId;
    payableAmount =   data.finalPayable;

    // Keep customerInfo in sync with what backend calculated
    setCustomerInfo((p) => ({ ...p, orderId: backendOrderId }));

  } catch {
    setPaymentError('Network error. Please check your connection and try again.');
    setFlwLoading(false);
    return;
  }

  // ── Step 2: Open Flutterwave with the real order ID ──────────
  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  if (!FlutterwaveCheckout) {
    setPaymentError('Payment provider unavailable. Please refresh and try again.');
    setFlwLoading(false);
    return;
  }

  // tx_ref embeds your orderId so webhook can find it
  const txRef = `${backendOrderId}-flw-${Date.now()}`;

  FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: txRef,
    amount: payableAmount,
    currency: 'NGN',
    payment_options: 'banktransfer,opay',
    customer: {
      email: customerInfo.email.trim(),
      phone_number: customerInfo.phone.trim(),
      name: customerInfo.name.trim(),
    },
    customizations: {
      title: 'Ollan Essentials',
      description: `Order ${backendOrderId}`,
      logo: '',
    },
    meta: {
      order_id: backendOrderId,
      delivery_option: customerInfo.deliveryOption,
      delivery_address: customerInfo.deliveryAddress,
      pickup_location: customerInfo.pickupLocation,
    },

callback: async (response: any) => {
  if (response.status === 'successful' || response.status === 'completed') {
    setFlwLoading(false);
    setPaymentSuccess(true);
    // ✅ Webhook handles everything — nothing to do here except show success
  } else {
    setFlwLoading(false);
    setPaymentError('Payment was not completed. Please try again.');
  }
},

    onclose: () => {
      setFlwLoading(false);
      // Note: pending order exists in DB with reserved stock.
      // You may want a cleanup job for orders stuck in 'pending' > 30 mins.
    },
  });

}, [customerInfo, cart, referralCode, canUseStoreCredit, useStoreCredit,
    availableStoreCredit, cartTotal, submitOrder]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setCurrentStep(2);
  };

  if (!isOpen) return null;

  const isExpress = customerInfo.deliveryOption === "express";
  const isPickup = customerInfo.deliveryOption === "pickup";
  const hasSelectedArea = !!customerInfo.deliveryAddress.trim();
  const deliveryLocations = getDeliveryLocations();
  const orderId = customerInfo.orderId ?? "";

  const inputCls =
    "w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all";
  const inputWithIconCls =
    "w-full pl-9 pr-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all";

  // Busy = any loading/processing state active
  const isBusy = isProcessing || isSubmittingOrder || flwLoading || verifyingPayment;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div
        id="checkout-modal"
        ref={modalRef}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95dvh] flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: "95dvh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {currentStep === 2 && !paymentSuccess && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={isBusy}
                className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {paymentSuccess
                  ? "Order Confirmed!"
                  : verifyingPayment
                  ? "Verifying Payment…"
                  : currentStep === 1
                  ? "Delivery Details"
                  : "Review & Pay"}
              </h2>
              {!paymentSuccess && !verifyingPayment && (
                <p className="text-[11px] text-gray-400">Step {currentStep} of 2</p>
              )}
            </div>
          </div>

          {!paymentSuccess && (
            <div className="flex items-center gap-1.5 mx-auto">
              <div className="h-1.5 w-8 rounded-full bg-red-500" />
              <div
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  currentStep === 2 ? "bg-red-500" : "bg-gray-200"
                }`}
              />
            </div>
          )}

          <button
            onClick={() => setIsOpen(false)}
            disabled={isBusy}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ── VERIFYING STATE ───────────────────────────────────── */}
          {verifyingPayment && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-5">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <ShieldCheck size={36} className="text-blue-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirming your payment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Securely verifying with our server. Please don't close this window.
                </p>
              </div>
              <svg className="animate-spin h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}

          {/* ── SUCCESS STATE ─────────────────────────────────────────── */}
          {paymentSuccess && !verifyingPayment && (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your order{" "}
                  <span className="font-mono font-semibold text-gray-700">{orderId}</span>{" "}
                  has been placed.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 w-full text-left">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                  Amount Paid
                </p>
                <p className="text-2xl font-black text-gray-900">
                  ₦{finalTotal.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                A confirmation will be sent to {customerInfo.email || "your email"}.
              </p>
            </div>
          )}

          {/* ── NORMAL FLOW ───────────────────────────────────────────── */}
          {!paymentSuccess && !verifyingPayment && (
            <>
              {/* Order total pill */}
              <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-red-500" />
                  <span className="text-sm font-semibold text-gray-800">
                    ₦{finalTotal.toLocaleString()}
                    {promoDiscount && (
                      <span className="text-xs text-emerald-600 ml-1">(Discount Applied)</span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white border border-red-200 text-red-600 px-2 py-1 rounded-full select-all">
                  {orderId}
                </span>
              </div>

              <div className="px-4 py-4 space-y-4">

                {/* ── STEP 1 ─────────────────────────────────────────── */}
                {currentStep === 1 && (
                  <form onSubmit={handleStep1Submit} id="checkout-form" noValidate>
                    {/* Phone */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={customerInfo.phone}
                          onChange={(e) =>
                            setCustomerInfo((p) => ({
                              ...p,
                              phone: e.target.value.replace(/[^0-9+\-\s()]/g, ""),
                            }))
                          }
                          className={inputWithIconCls}
                          placeholder="08012345678"
                          disabled={isBusy}
                          maxLength={15}
                        />
                      </div>
                    </div>

                    {/* Delivery Option */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Delivery Option *
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { value: "express", label: "Express", sub: "~1 hour delivery", icon: <Clock size={18} className="text-red-500" /> },
                          { value: "pickup", label: "Pickup", sub: "Collect in store", icon: <Store size={18} className="text-green-500" /> },
                        ].map(({ value, label, sub, icon }) => {
                          const selected = customerInfo.deliveryOption === value;
                          return (
                            <label
                              key={value}
                              className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.97] ${
                                selected ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-red-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryOption"
                                value={value}
                                checked={selected}
                                onChange={(e) =>
                                  setCustomerInfo((p) => ({
                                    ...p,
                                    deliveryOption: e.target.value as any,
                                    deliveryAddress: "",
                                    pickupLocation: "",
                                    isUIAddress: false,
                                  }))
                                }
                                className="sr-only"
                                disabled={isBusy}
                              />
                              {selected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                              {icon}
                              <span className="text-sm font-bold text-gray-800">{label}</span>
                              <span className="text-[11px] text-gray-500 text-center">{sub}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {estimatedDelivery && isExpress && (
                      <div className="flex items-center gap-2 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2 rounded-xl mb-4">
                        <Clock size={13} className="flex-shrink-0" />
                        <span><span className="font-semibold">Est. delivery:</span> {estimatedDelivery}</span>
                      </div>
                    )}

                    {isExpress && (
                      <>
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Delivery Area *
                          </label>
                          <select
                            value={customerInfo.deliveryAddress || ""}
                            onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                            className={inputCls}
                            disabled={isBusy}
                          >
                            <option value="" disabled>Select a delivery area</option>
                            {deliveryAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                          {deliveryAreaError && <p className="text-xs text-red-500 mt-1.5">{deliveryAreaError}</p>}
                        </div>

                        {hasSelectedArea && (
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Drop-off Spot *
                            </label>
                            <select
                              value={customerInfo.pickupLocation || ""}
                              onChange={(e) =>
                                setCustomerInfo((p) => ({ ...p, pickupLocation: e.target.value }))
                              }
                              className={inputCls}
                              disabled={isBusy}
                            >
                              <option value="" disabled>Choose spot in {customerInfo.deliveryAddress}</option>
                              {deliveryLocations.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                            {deliveryLocationError && (
                              <p className="text-xs text-red-500 mt-1.5">{deliveryLocationError}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {isPickup && (
                      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4">
                        <Store size={16} className="text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Indy Hall, University of Ibadan</p>
                          <p className="text-xs text-gray-500 mt-0.5">*AM – 10 PM · Mon – Sun</p>
                        </div>
                      </div>
                    )}

                    {/* Store Credit */}
                    {availableStoreCredit > 0 && (
                      <div className={`border rounded-2xl p-4 mb-4 transition-colors ${canUseStoreCredit ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-semibold ${canUseStoreCredit ? "text-emerald-800" : "text-gray-500"}`}>
                              Store Credit Available
                            </p>
                            <p className={`text-lg font-bold ${canUseStoreCredit ? "text-emerald-700" : "text-gray-400"}`}>
                              ₦{availableStoreCredit.toLocaleString()}
                            </p>
                            {!canUseStoreCredit && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Only available on orders ₦{STORE_CREDIT_MIN.toLocaleString()} and above
                              </p>
                            )}
                          </div>
                          <label className={`relative inline-flex items-center ${canUseStoreCredit ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                            <input
                              type="checkbox"
                              checked={useStoreCredit}
                              onChange={(e) => { if (canUseStoreCredit) setUseStoreCredit(e.target.checked); }}
                              className="sr-only peer"
                              disabled={isBusy || !canUseStoreCredit}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                          </label>
                        </div>
                        {useStoreCredit && canUseStoreCredit && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            ₦{Math.min(availableStoreCredit, cartTotal).toLocaleString()} store credit will be deducted
                          </p>
                        )}
                      </div>
                    )}

                    {/* Referral Code */}
                    <div className="mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Referral Code <span className="font-normal normal-case text-gray-400">(optional)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => {
                            setReferralCode(e.target.value.toUpperCase());
                            if (referralStatus !== "idle") { setReferralStatus("idle"); setReferralMessage(""); }
                          }}
                          className={`flex-1 px-4 py-3.5 text-base border rounded-xl focus:ring-2 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all font-mono tracking-widest uppercase ${
                            referralStatus === "valid" ? "border-green-400 focus:ring-green-300"
                            : referralStatus === "invalid" ? "border-red-400 focus:ring-red-300"
                            : "border-gray-200 focus:ring-red-400"
                          }`}
                          placeholder="Enter referral code"
                          disabled={isBusy || referralStatus === "valid"}
                          maxLength={10}
                        />
                        <button
                          type="button"
                          onClick={() => handleReferralApply(referralCode, setReferralStatus, setReferralMessage)}
                          disabled={!referralCode.trim() || referralStatus === "valid" || referralStatus === "checking" || isBusy}
                          className={`px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${referralStatus === "valid" ? "bg-green-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                        >
                          {referralStatus === "checking" ? "..." : referralStatus === "valid" ? "Applied" : "Apply"}
                        </button>
                      </div>
                      {referralMessage && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${referralStatus === "valid" ? "text-green-600" : "text-red-500"}`}>
                          {referralStatus === "valid" ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                          {referralMessage}
                        </p>
                      )}
                    </div>
                  </form>
                )}

                {/* ── STEP 2 ─────────────────────────────────────────── */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo((p) => ({ ...p, name: e.target.value }))}
                          className={inputWithIconCls}
                          placeholder="Enter your full name"
                          disabled={isBusy}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo((p) => ({ ...p, email: e.target.value }))}
                          className={inputWithIconCls}
                          placeholder="you@example.com"
                          disabled={isBusy}
                        />
                      </div>
                    </div>

                    {/* Order summary */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order Summary</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-800">₦{cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-semibold text-gray-800">₦{deliveryFee.toLocaleString()}</span>
                      </div>
                      {useStoreCredit && canUseStoreCredit && availableStoreCredit > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Store Credit</span>
                          <span className="font-semibold text-emerald-600">
                            −₦{Math.min(availableStoreCredit, cartTotal).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-black text-gray-900 text-base">₦{finalTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Payment method badge */}
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-500" />
                        <span className="text-[11px] text-gray-400 font-medium">
                          Powered by <span className="font-bold text-amber-500">Flutterwave</span>
                        </span>
                      </div>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] text-gray-500 font-semibold">Bank Transfer &amp; OPay</span>
                    </div>

                    {/* Error message */}
                    {paymentError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600">{paymentError}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {!paymentSuccess && !verifyingPayment && (
          <div className="px-4 pt-3 pb-5 border-t border-gray-100 bg-white">
            {currentStep === 1 ? (
              <button
                type="submit"
                form="checkout-form"
                disabled={isBusy}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-red-200"
              >
                Continue to Payment <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFlutterwavePayment}
                disabled={isBusy}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-red-200"
              >
                {flwLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Opening payment…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Pay ₦{finalTotal.toLocaleString()} securely
                  </>
                )}
              </button>
            )}
            <p className="text-[10px] text-center text-gray-400 mt-2">
              {currentStep === 2
                ? "Bank Transfer or OPay via Flutterwave's secure checkout."
                : "Your data is used only to process this order."}
            </p>
          </div>
        )}

        {/* Post-success close */}
        {paymentSuccess && (
          <div className="px-4 pt-3 pb-5 border-t border-gray-100 bg-white">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-green-200"
            >
              <CheckCircle size={18} /> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
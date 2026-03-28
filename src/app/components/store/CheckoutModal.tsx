"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X, User, Phone, CreditCard, ChevronRight, ChevronLeft,
  ShoppingBag, Clock, Store, Upload,
  CheckCircle, AlertCircle, Copy, Check
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
  orderId?: string;
  paymentScreenshot?: File | null;
  referralCode?: string;
  promoCode?: string;
  storeCreditUsed?: number;
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
  cart: { productId: string; quantity: number }[];
  availableStoreCredit: number;
  useStoreCredit: boolean;
  setUseStoreCredit: React.Dispatch<React.SetStateAction<boolean>>;
}

const generateOrderId = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

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

const sendPaymentEmail = async (info: CustomerInfo, finalTotal: number) => {
  let screenshotBase64: string | null = null;
  let screenshotMime: string | null = null;

  if (info.paymentScreenshot) {
    try {
      const result = await fileToBase64(info.paymentScreenshot);
      screenshotBase64 = result.base64;
      screenshotMime = result.mime;
    } catch (err) {
      console.error("Failed to convert screenshot to base64:", err);
    }
  }

  try {
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
        grandTotal: finalTotal,
        screenshotBase64,
        screenshotMime,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Email API error:", err);
    }
  } catch (err) {
    console.error("Failed to send payment email:", err);
  }
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
  } catch (err) {
    setReferralStatus("invalid");
    setReferralMessage("Could not apply referral code. Please try again.");
  }
};

const computeDiscountedTotal = (
  grandTotal: number,
  promoDiscount: { type: "percent" | "fixed"; value: number } | null
): number => {
  if (!promoDiscount) return grandTotal;
  if (promoDiscount.type === "percent") {
    return Math.max(0, grandTotal - (grandTotal * promoDiscount.value) / 100);
  }
  return Math.max(0, grandTotal - promoDiscount.value);
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

// ─── CopyField ────────────────────────────────────────────────────────────────
const CopyField: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded-lg ${
        highlight ? "bg-amber-100 border border-amber-300" : "bg-white border border-amber-200"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold truncate ${highlight ? "text-amber-900" : "text-amber-800"}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={`ml-2 flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
          copied ? "bg-green-500 text-white" : "bg-amber-200 hover:bg-amber-300 text-amber-800"
        }`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [deliveryAreaError, setDeliveryAreaError] = useState("");
  const [deliveryLocationError, setDeliveryLocationError] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"manual" | "screenshot">("screenshot");

  // Referral Code
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [referralMessage, setReferralMessage] = useState("");

  // Promo Code
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid" | "checking">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null);

  // ── Store credit: only allowed when cart total ≥ ₦2,500 ──────────────────
  const STORE_CREDIT_MIN = 2500;
  const canUseStoreCredit = cartTotal >= STORE_CREDIT_MIN;

  // Auto-disable store credit if cart drops below threshold
  useEffect(() => {
    if (!canUseStoreCredit && useStoreCredit) {
      setUseStoreCredit(false);
    }
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

  // ── Prevent zoom on input focus (iOS / Android) ───────────────────────────
  // Sets font-size ≥ 16px on all inputs inside the modal while it's open,
  // which suppresses the browser auto-zoom behaviour.
  useEffect(() => {
    if (!isOpen) return;

    const style = document.createElement("style");
    style.id = "checkout-modal-no-zoom";
    style.textContent = `
      #checkout-modal input,
      #checkout-modal select,
      #checkout-modal textarea {
        font-size: 16px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById("checkout-modal-no-zoom")?.remove();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setScreenshotPreview(null);
      setPaymentMode("screenshot");
      setReferralCode("");
      setReferralStatus("idle");
      setReferralMessage("");
      setPromoCode("");
      setPromoStatus("idle");
      setPromoMessage("");
      setPromoDiscount(null);

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
      }));
    }
  }, [isOpen, setCustomerInfo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
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

  const handleScreenshotFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Screenshot must be under 5 MB");
      return;
    }

    const uniqueId = customerInfo.orderId ?? generateOrderId();

    setCustomerInfo((prev) => ({
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
    setCustomerInfo((prev) => ({
      ...prev,
      paymentScreenshot: null,
      transactionNumber: "",
    }));
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      validateStep1() && setCurrentStep(2);
      return;
    }

    const errors: string[] = [];
    if (!customerInfo.name.trim()) errors.push("Full Name is required");
    if (!customerInfo.email.trim()) errors.push("Email is required");
    if (paymentMode === "screenshot" && !customerInfo.paymentScreenshot) {
      errors.push("Please upload your payment screenshot");
    }
    if (paymentMode === "manual" && !customerInfo.transactionNumber.trim()) {
      errors.push("Bank Transaction Number is required");
    }

    if (errors.length > 0) {
      alert(`Please fix:\n${errors.join("\n")}`);
      return;
    }

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
      transactionNumber: customerInfo.transactionNumber.trim(),
      orderId: customerInfo.orderId,
      paymentScreenshot: customerInfo.paymentScreenshot ?? null,
      referralCode: referralCode.trim().toUpperCase() || undefined,
      promoCode: promoStatus === "valid" ? promoCode.trim().toUpperCase() : "",
      // Only record store credit if the feature was actually eligible and toggled on
      storeCreditUsed: canUseStoreCredit && useStoreCredit
        ? Math.min(availableStoreCredit, cartTotal)
        : 0,
    };

    sendPaymentEmail(sanitized, finalTotal).catch(console.error);
    await submitOrder(sanitized);

    if (promoStatus === "valid" && promoCode) {
      await redeemCodeAfterOrder(promoCode, sanitized.email || sanitized.orderId || "anonymous");
    }
  };

  if (!isOpen) return null;

  const isExpress = customerInfo.deliveryOption === "express";
  const isPickup = customerInfo.deliveryOption === "pickup";
  const hasSelectedArea = !!customerInfo.deliveryAddress.trim();
  const deliveryLocations = getDeliveryLocations();
  const orderId = customerInfo.orderId ?? "";

  // Shared input class — font-size 16px prevents iOS zoom
  const inputCls =
    "w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all";
  const inputWithIconCls =
    "w-full pl-9 pr-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div
        id="checkout-modal"
        ref={modalRef}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95dvh] flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: "95dvh" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={isProcessing || isSubmittingOrder}
                className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {currentStep === 1 ? "Delivery Details" : "Payment & Confirmation"}
              </h2>
              <p className="text-[11px] text-gray-400">Step {currentStep} of 2</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mx-auto">
            <div className="h-1.5 w-8 rounded-full bg-red-500" />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${currentStep === 2 ? "bg-red-500" : "bg-gray-200"}`} />
          </div>

          <button
            onClick={() => setIsOpen(false)}
            disabled={isProcessing || isSubmittingOrder}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={handleSubmit} id="checkout-form" noValidate>

            {/* Order total pill */}
            <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-red-500" />
                <span className="text-sm font-semibold text-gray-800">
                  ₦{finalTotal.toLocaleString()}
                  {(promoDiscount || (useStoreCredit && availableStoreCredit > 0 && canUseStoreCredit)) && (
                    <span className="text-xs text-emerald-600 ml-1">(Discount Applied)</span>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-white border border-red-200 text-red-600 px-2 py-1 rounded-full select-all">
                {orderId}
              </span>
            </div>

            <div className="px-4 py-4 space-y-4">

              {/* ── STEP 1 ─────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <>
                  {/* Phone */}
                  <div>
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
                        disabled={isProcessing || isSubmittingOrder}
                        maxLength={15}
                      />
                    </div>
                  </div>

                  {/* Delivery Option */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Delivery Option *
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        {
                          value: "express",
                          label: "Express",
                          sub: "~1 hour delivery",
                          icon: <Clock size={18} className="text-red-500" />,
                        },
                        {
                          value: "pickup",
                          label: "Pickup",
                          sub: "Collect in store",
                          icon: <Store size={18} className="text-green-500" />,
                        },
                      ].map(({ value, label, sub, icon }) => {
                        const selected = customerInfo.deliveryOption === value;
                        return (
                          <label
                            key={value}
                            className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.97] ${
                              selected
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200 bg-gray-50 hover:border-red-200"
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
                              disabled={isProcessing || isSubmittingOrder}
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
                    <div className="flex items-center gap-2 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2 rounded-xl">
                      <Clock size={13} className="flex-shrink-0" />
                      <span>
                        <span className="font-semibold">Est. delivery:</span> {estimatedDelivery}
                      </span>
                    </div>
                  )}

                  {/* Delivery Area & Location */}
                  {isExpress && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Delivery Area *
                        </label>
                        <select
                          value={customerInfo.deliveryAddress || ""}
                          onChange={(e) => handleDeliveryAreaChange(e.target.value)}
                          className={inputCls}
                          disabled={isProcessing || isSubmittingOrder}
                        >
                          <option value="" disabled>Select a delivery area</option>
                          {deliveryAreas.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                        {deliveryAreaError && (
                          <p className="text-xs text-red-500 mt-1.5">{deliveryAreaError}</p>
                        )}
                      </div>

                      {hasSelectedArea && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Drop-off Spot *
                          </label>
                          <select
                            value={customerInfo.pickupLocation || ""}
                            onChange={(e) =>
                              setCustomerInfo((p) => ({ ...p, pickupLocation: e.target.value }))
                            }
                            className={inputCls}
                            disabled={isProcessing || isSubmittingOrder}
                          >
                            <option value="" disabled>
                              Choose spot in {customerInfo.deliveryAddress}
                            </option>
                            {deliveryLocations.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                          {deliveryLocationError && (
                            <p className="text-xs text-red-500 mt-1.5">{deliveryLocationError}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {isPickup && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                      <Store size={16} className="text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Indy Hall, University of Ibadan</p>
                        <p className="text-xs text-gray-500 mt-0.5">*AM – 10 PM · Mon – Sun</p>
                      </div>
                    </div>
                  )}

                  {/* ── Store Credit ─────────────────────────────────────── */}
                  {availableStoreCredit > 0 && (
                    <div
                      className={`border rounded-2xl p-4 transition-colors ${
                        canUseStoreCredit
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              canUseStoreCredit ? "text-emerald-800" : "text-gray-500"
                            }`}
                          >
                            Store Credit Available
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              canUseStoreCredit ? "text-emerald-700" : "text-gray-400"
                            }`}
                          >
                            ₦{availableStoreCredit.toLocaleString()}
                          </p>
                          {!canUseStoreCredit && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Only available on orders ₦{STORE_CREDIT_MIN.toLocaleString()} and above
                            </p>
                          )}
                        </div>

                        {/* Toggle */}
                        <label
                          className={`relative inline-flex items-center ${
                            canUseStoreCredit ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={useStoreCredit}
                            onChange={(e) => {
                              if (canUseStoreCredit) setUseStoreCredit(e.target.checked);
                            }}
                            className="sr-only peer"
                            disabled={isProcessing || isSubmittingOrder || !canUseStoreCredit}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                      </div>

                      {useStoreCredit && canUseStoreCredit && (
                        <p className="text-xs text-emerald-600 mt-2 font-medium">
                          ₦{Math.min(availableStoreCredit, cartTotal).toLocaleString()} store credit
                          will be deducted from your balance
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Referral Code ─────────────────────────────────────── */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Referral Code{" "}
                      <span className="font-normal normal-case text-gray-400">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          setReferralCode(e.target.value.toUpperCase());
                          if (referralStatus !== "idle") {
                            setReferralStatus("idle");
                            setReferralMessage("");
                          }
                        }}
                        className={`flex-1 px-4 py-3.5 text-base border rounded-xl focus:ring-2 focus:border-transparent bg-gray-50 text-gray-800 outline-none transition-all font-mono tracking-widest uppercase ${
                          referralStatus === "valid"
                            ? "border-green-400 focus:ring-green-300"
                            : referralStatus === "invalid"
                            ? "border-red-400 focus:ring-red-300"
                            : "border-gray-200 focus:ring-red-400"
                        }`}
                        placeholder="Enter referral code"
                        disabled={isProcessing || isSubmittingOrder || referralStatus === "valid"}
                        maxLength={10}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleReferralApply(referralCode, setReferralStatus, setReferralMessage)
                        }
                        disabled={
                          !referralCode.trim() ||
                          referralStatus === "valid" ||
                          referralStatus === "checking" ||
                          isProcessing ||
                          isSubmittingOrder
                        }
                        className={`px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                          referralStatus === "valid"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                      >
                        {referralStatus === "checking"
                          ? "..."
                          : referralStatus === "valid"
                          ? "Applied"
                          : "Apply"}
                      </button>
                    </div>
                    {referralMessage && (
                      <p
                        className={`text-xs mt-1.5 flex items-center gap-1 ${
                          referralStatus === "valid" ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {referralStatus === "valid" ? (
                          <CheckCircle size={11} />
                        ) : (
                          <AlertCircle size={11} />
                        )}
                        {referralMessage}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── STEP 2 ─────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <>
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
                        onChange={(e) =>
                          setCustomerInfo((p) => ({ ...p, name: e.target.value }))
                        }
                        className={inputWithIconCls}
                        placeholder="Enter your full name"
                        disabled={isProcessing || isSubmittingOrder}
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
                        onChange={(e) =>
                          setCustomerInfo((p) => ({ ...p, email: e.target.value }))
                        }
                        className={inputWithIconCls}
                        placeholder="you@example.com"
                        disabled={isProcessing || isSubmittingOrder}
                      />
                    </div>
                  </div>

                  {/* Bank transfer details */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard size={15} className="text-amber-600" />
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Transfer to this account
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        Moniepoint: Ollan Essentials
                      </p>
                      <CopyField label="Account Number" value="5235008468" highlight />
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-xs text-amber-700">Amount to transfer:</span>
                        <span className="text-base font-black text-amber-900">
                          ₦{finalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment mode selector */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      After paying, confirm with
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {["screenshot", "manual"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setPaymentMode(mode as "manual" | "screenshot");
                            if (mode === "manual") clearScreenshot();
                            if (mode === "screenshot")
                              setCustomerInfo((p) => ({ ...p, transactionNumber: "" }));
                          }}
                          className={`py-3 px-2 rounded-xl text-xs font-semibold border-2 transition-all active:scale-[0.97] ${
                            paymentMode === mode
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-red-200"
                          }`}
                        >
                          {mode === "manual" ? "✍️ Enter Txn No." : "📸 Upload Screenshot"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Screenshot upload */}
                  {paymentMode === "screenshot" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Payment Screenshot *
                      </label>
                      {!screenshotPreview ? (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => screenshotInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                            isDragging
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200 hover:border-red-300 bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                isDragging ? "bg-red-100" : "bg-gray-100"
                              }`}
                            >
                              <Upload size={22} className={isDragging ? "text-red-500" : "text-gray-400"} />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              {isDragging ? "Drop it!" : "Upload screenshot"}
                            </p>
                            <p className="text-xs text-gray-400">Tap to browse · PNG, JPG · max 5 MB</p>
                          </div>
                          <input
                            ref={screenshotInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              e.target.files?.[0] && handleScreenshotFile(e.target.files[0])
                            }
                            disabled={isProcessing || isSubmittingOrder}
                          />
                        </div>
                      ) : (
                        <div className="rounded-2xl overflow-hidden border-2 border-green-300">
                          <img
                            src={screenshotPreview}
                            alt="Payment proof"
                            className="w-full max-h-48 object-contain bg-gray-50"
                          />
                          <div className="flex items-center justify-between p-3 bg-white border-t border-green-100">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle size={14} className="text-green-500" />
                              <span className="text-xs text-green-700 font-semibold">Screenshot ready</span>
                            </div>
                            <button
                              type="button"
                              onClick={clearScreenshot}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                              disabled={isProcessing || isSubmittingOrder}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual transaction number */}
                  {paymentMode === "manual" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Bank Transaction Number *
                      </label>
                      <div className="relative">
                        <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={customerInfo.transactionNumber}
                          onChange={(e) =>
                            setCustomerInfo((p) => ({ ...p, transactionNumber: e.target.value }))
                          }
                          className={inputWithIconCls}
                          placeholder="e.g. T250301XXXXXX"
                          disabled={isProcessing || isSubmittingOrder}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        </div>

        {/* Footer CTA */}
        <div className="px-4 pt-3 pb-5 border-t border-gray-100 bg-white">
          {currentStep === 1 ? (
            <button
              type="submit"
              form="checkout-form"
              disabled={isProcessing || isSubmittingOrder}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-red-200"
            >
              Continue to Payment <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              form="checkout-form"
              disabled={isProcessing || isSubmittingOrder}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-red-200"
            >
              {isProcessing || isSubmittingOrder ? (
                <>Processing...</>
              ) : (
                <>Confirm Order — ₦{finalTotal.toLocaleString()}</>
              )}
            </button>
          )}
          <p className="text-[10px] text-center text-gray-400 mt-2">
            Your data is used only to process this order.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
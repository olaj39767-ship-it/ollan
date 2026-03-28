"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Sparkles,
  Loader2, ChevronDown, ChevronUp, Tag, Clock,
  TrendingUp, Lock, Gift
} from "lucide-react";
import api from "@/src/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transaction {
  _id?: string;
  type: "referral_earning" | "manual_credit" | "manual_debit" | "redemption";
  amount: number;
  description: string;
  createdAt: string;
  referralCode?: string;
}

interface ReferralCode {
  code: string;
  totalUses: number;
  verifiedPurchases: number;
  totalCreditEarned: number;
  isActive: boolean;
}

interface StoreCreditData {
  balance: number;
  transactions: Transaction[];
  referralCodes: ReferralCode[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const txMeta = (type: Transaction["type"]) => {
  switch (type) {
    case "referral_earning": return { label: "Referral Earned", color: "emerald", sign: "+" };
    case "manual_credit":    return { label: "Credit Added",    color: "emerald", sign: "+" };
    case "manual_debit":     return { label: "Deducted",        color: "red",     sign: "−" };
    case "redemption":       return { label: "Used at Checkout",color: "orange",  sign: "−" };
  }
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface StoreCreditWidgetProps {
  userId: string;
  /** compact mode: smaller inline display for product/quantity modals */
  compact?: boolean;
  className?: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
const StoreCreditWidget: React.FC<StoreCreditWidgetProps> = ({
  userId,
  compact = false,
  className = "",
}) => {
  const [data, setData]             = useState<StoreCreditData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/api/user/me/store-credit");
      setData(res.data);
    } catch {
      // silently fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return (
    <div className={`flex items-center gap-2 text-xs text-gray-400 py-1 ${className}`}>
      <Loader2 size={12} className="animate-spin" /> Loading credit…
    </div>
  );

  if (!data) return null;

  const { balance, transactions, referralCodes } = data;
  const hasBalance = balance > 0;
  const recentTxs  = transactions?.slice(0, 6) ?? [];

  // ── COMPACT MODE (used inside quantity / product modal) ───────────────────
  if (compact) {
    return (
      <div className={`${className}`}>
        {hasBalance ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles size={11} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-800 leading-tight">
                {fmt(balance)} store credit available
              </p>
              <p className="text-[10px] text-emerald-600">Usable at checkout</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <Wallet size={14} className="text-gray-300 flex-shrink-0" />
            <p className="text-xs text-gray-400">No store credit yet</p>
          </div>
        )}
      </div>
    );
  }

  // ── FULL MODE (standalone widget / account page) ──────────────────────────
  return (
    <div className={`w-full ${className}`}>
      {/* Main Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a00] via-[#1f0f00] to-[#0f0800] border border-orange-900/30 shadow-2xl">
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Wallet size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Store Credit</p>
                <p className="text-white/30 text-[10px] font-mono">Your Ollan balance</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-white/20 hover:text-white/50 transition-colors p-1"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Balance Display */}
          <div className="mb-5">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold mb-1">Available Balance</p>
            <div className="flex items-end gap-2">
              <p className={`text-4xl font-black tabular-nums leading-none ${hasBalance ? "text-white" : "text-white/20"}`}>
                {fmt(balance)}
              </p>
              {hasBalance && (
                <span className="text-xs text-emerald-400 font-semibold pb-1 flex items-center gap-0.5">
                  <Sparkles size={10} /> ready to use
                </span>
              )}
            </div>
          </div>

          {/* Status Pill */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold ${
            hasBalance
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
              : "bg-white/5 border border-white/5 text-white/30"
          }`}>
            {hasBalance ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                Apply at checkout to reduce your order total
              </>
            ) : (
              <>
                <Gift size={12} className="flex-shrink-0" />
                Earn credit by sharing your referral code with friends
              </>
            )}
          </div>
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="border-t border-white/5 p-6 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">

            {/* How it works */}
            <div>
              <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-3">How It Works</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <Tag size={14} />,        label: "Get Code",    sub: "Admin assigns you a referral code" },
                  { icon: <Gift size={14} />,        label: "Friends Buy", sub: "They enter your code at checkout" },
                  { icon: <TrendingUp size={14} />,  label: "Earn 3%",    sub: "You get 3% of their verified order" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-3 text-center">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-2 text-orange-400">
                      {s.icon}
                    </div>
                    <p className="text-xs font-bold text-white/60 mb-1">{s.label}</p>
                    <p className="text-[9px] text-white/20 leading-tight">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Codes */}
            {referralCodes?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-3">Your Referral Codes</p>
                <div className="space-y-2">
                  {referralCodes.map((c, i) => (
                    <div key={i} className={`bg-white/5 border rounded-xl px-4 py-3 ${c.isActive ? "border-orange-500/20" : "border-white/5 opacity-40"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-white font-mono tracking-widest text-sm">{c.code}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/20"}`}>
                          {c.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-black text-white tabular-nums">{c.totalUses}</p>
                          <p className="text-[9px] text-white/20">Uses</p>
                        </div>
                        <div>
                          <p className="text-sm font-black text-white tabular-nums">{c.verifiedPurchases}</p>
                          <p className="text-[9px] text-white/20">Verified</p>
                        </div>
                        <div>
                          <p className="text-sm font-black text-emerald-400 tabular-nums">{fmt(c.totalCreditEarned)}</p>
                          <p className="text-[9px] text-white/20">Earned</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            {recentTxs.length > 0 && (
              <div>
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center justify-between w-full text-[10px] text-white/20 uppercase tracking-widest font-bold mb-3 hover:text-white/40 transition-colors"
                >
                  Recent Activity
                  {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showHistory && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {recentTxs.map((tx, i) => {
                      const meta = txMeta(tx.type);
                      return (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-${meta.color}-500/15`}>
                              {meta.sign === "+"
                                ? <ArrowDownLeft size={10} className={`text-${meta.color}-400`} />
                                : <ArrowUpRight size={10} className={`text-${meta.color}-400`} />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white/50 leading-tight">{tx.description || meta.label}</p>
                              <p className="text-[9px] text-white/20 flex items-center gap-1">
                                <Clock size={7} /> {timeAgo(tx.createdAt)} ago
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-black tabular-nums text-${meta.color}-400`}>
                            {meta.sign}{fmt(Math.abs(tx.amount))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!referralCodes?.length && recentTxs.length === 0 && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Tag size={18} className="text-white/20" />
                </div>
                <p className="text-sm text-white/30 font-semibold">No referral codes yet</p>
                <p className="text-xs text-white/15 mt-1">Contact admin to get your personal code</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreCreditWidget;

// ── Guest / Logged-out Teaser ─────────────────────────────────────────────────
export const StoreCreditTeaser: React.FC<{ onSignIn?: () => void; className?: string }> = ({
  onSignIn,
  className = "",
}) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 px-4 py-3.5 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
        <Lock size={14} className="text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-orange-200 leading-tight">Unlock Store Credit</p>
        <p className="text-xs text-orange-400/60 mt-0.5">Sign in to earn & use credit on orders</p>
      </div>
      {onSignIn && (
        <button
          onClick={onSignIn}
          className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-xs font-bold text-white hover:from-orange-400 hover:to-red-400 transition-all active:scale-95"
        >
          Sign In
        </button>
      )}
    </div>
  </div>
);
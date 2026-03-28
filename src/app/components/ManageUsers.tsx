"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, RefreshCw, Tag, CheckCircle, XCircle,
  Clock, Copy, Check, AlertTriangle, X, Loader2
} from "lucide-react";

// ── Set this to your ADMIN_SECRET from .env.local ────────────────────────────
// In production, fetch this from a secure session/cookie instead of hardcoding.
const ADMIN_SECRET = "Admin123";

interface DiscountCode {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  expiresAt?: string;
  createdAt: string;
  createdBy?: string;
}

const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });

// ── CopyBadge ─────────────────────────────────────────────────────────────────
const CopyBadge: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
    >
      {value}
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
};

// ── StatusPill ────────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ code: DiscountCode }> = ({ code }) => {
  const expired = code.expiresAt && new Date() > new Date(code.expiresAt);

  if (code.isUsed)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        <XCircle size={10} /> Used
      </span>
    );
  if (expired)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
        <Clock size={10} /> Expired
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      <CheckCircle size={10} /> Active
    </span>
  );
};

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function DiscountAdminPanel() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Form state
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    expiresAt: "",
    createdBy: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/discount/admin");
      if (!res.ok) throw new Error("Failed to fetch codes");
      const data = await res.json();
      setCodes(data.codes ?? []);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.code.trim()) return setFormError("Code is required.");
    if (!form.discountValue || isNaN(Number(form.discountValue)))
      return setFormError("Discount value must be a number.");

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/discount/admin", {
        method: "POST",
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          expiresAt: form.expiresAt || null,
          createdBy: form.createdBy.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create code");

      setSuccessMsg(`Code "${data.code.code}" created!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm({ code: "", discountType: "percent", discountValue: "", expiresAt: "", createdBy: "" });
      setShowForm(false);
      fetchCodes();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete code "${code}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await apiFetch("/api/discount/admin", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      fetchCodes();
    } finally {
      setDeleting(null);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setForm((p) => ({ ...p, code: result }));
  };

  const active = codes.filter((c) => !c.isUsed && (!c.expiresAt || new Date() < new Date(c.expiresAt)));
  const used = codes.filter((c) => c.isUsed);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Tag size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Discount Codes</h1>
            <p className="text-[11px] text-slate-400">
              {active.length} active · {used.length} used · {codes.length} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCodes}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={`text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-all active:scale-95"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Cancel" : "New Code"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Success toast */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl">
            <CheckCircle size={15} /> {successMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Create New Discount Code</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Code input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-slate-50 text-slate-800 outline-none font-mono tracking-widest uppercase transition-all"
                    placeholder="e.g. SUMMER10"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all whitespace-nowrap"
                  >
                    Random
                  </button>
                </div>
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Type *
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as any }))}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 bg-slate-50 text-slate-800 outline-none appearance-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Value *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                      {form.discountType === "percent" ? "%" : "₦"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={form.discountType === "percent" ? 100 : undefined}
                      value={form.discountValue}
                      onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 bg-slate-50 text-slate-800 outline-none transition-all"
                      placeholder={form.discountType === "percent" ? "10" : "500"}
                    />
                  </div>
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Expires At <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 bg-slate-50 text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Admin Note <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.createdBy}
                  onChange={(e) => setForm((p) => ({ ...p, createdBy: e.target.value }))}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 bg-slate-50 text-slate-800 outline-none transition-all"
                  placeholder="e.g. For influencer campaign"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating...</>
                ) : (
                  <><Plus size={16} /> Create Code</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Code List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" /> Loading codes...
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Tag size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No codes yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {codes.map((c) => (
              <div
                key={c._id}
                className={`bg-white border rounded-2xl px-4 py-3.5 flex items-start justify-between gap-3 transition-all ${
                  c.isUsed ? "opacity-60 border-slate-100" : "border-slate-200"
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CopyBadge value={c.code} />
                    <StatusPill code={c} />
                    <span className="text-xs font-semibold text-slate-600">
                      {c.discountType === "percent"
                        ? `${c.discountValue}% off`
                        : `₦${c.discountValue.toLocaleString()} off`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {c.createdBy && (
                      <p className="text-[11px] text-slate-400">📝 {c.createdBy}</p>
                    )}
                    {c.expiresAt && (
                      <p className="text-[11px] text-slate-400">
                        ⏰ Expires {new Date(c.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                    {c.isUsed && c.usedBy && (
                      <p className="text-[11px] text-slate-400">
                        👤 Used by {c.usedBy} on {new Date(c.usedAt!).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-300">
                      Created {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(c._id, c.code)}
                  disabled={deleting === c._id}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex-shrink-0 disabled:opacity-40"
                >
                  {deleting === c._id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
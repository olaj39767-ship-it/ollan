"use client";

import { useState, KeyboardEvent, useRef } from "react";

type Step = "email" | "reset";
type Status = "idle" | "loading" | "success" | "error";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: Send OTP ────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) return showMsg("error", "Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return showMsg("error", "Please enter a valid email address.");

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) return showMsg("error", data.message || "Something went wrong.");

      showMsg("success", data.message);
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
        setStep("reset");
      }, 1200);
    } catch {
      showMsg("error", "Unable to connect. Check your connection and try again.");
    }
  };

  // ── Step 2: Verify OTP + reset password ────────────────────
  const handleReset = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 6) return showMsg("error", "Please enter the 6-digit code.");
    if (!password) return showMsg("error", "Please enter a new password.");
    if (password.length < 6) return showMsg("error", "Password must be at least 6 characters.");
    if (password !== confirmPassword) return showMsg("error", "Passwords do not match.");

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue, password }),
      });
      const data = await res.json();

      if (!res.ok) return showMsg("error", data.message || "Something went wrong.");
      showMsg("success", "Password reset successful! Redirecting to login…");
      setTimeout(() => { window.location.href = "/pages/login"; }, 2000);
    } catch {
      showMsg("error", "Unable to connect. Check your connection and try again.");
    }
  };

  const showMsg = (type: "error" | "success", msg: string) => {
    setStatus(type);
    setMessage(msg);
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
    if (e.key === "Enter") handleReset();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  return (
    <main className="relative min-h-screen bg-[#09090f] flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 w-[60vw] h-[50vh] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-violet-600/[0.05] rounded-full blur-[100px]" />
      </div>

      <div
        className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/[0.07] bg-[#111118] p-10 shadow-2xl"
        style={{ animation: "fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Top shimmer */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-full" />

        {/* ── STEP 1: Email ── */}
        {step === "email" && (
          <>
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <KeyIcon />
            </div>

            <h1
              className="mb-2 text-[26px] font-bold tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Forgot password?
            </h1>
            <p className="mb-8 text-sm font-light leading-relaxed text-[#6b6878]">
              Enter your email and we&apos;ll send you a 6-digit reset code.
            </p>

            <div className="mb-5">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-[#6b6878]">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  disabled={status === "loading"}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-[#f0ede8] placeholder-[#6b6878]/60 outline-none transition-all focus:border-amber-500/40 focus:bg-amber-500/[0.03] disabled:opacity-50"
                />
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6878]" />
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={status === "loading"}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-sm font-medium text-[#09090f] transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? <><Spinner />Sending&hellip;</> : "Send reset code"}
            </button>

            <Alert status={status} message={message} />

            <a
              href="/pages/login"
              className="mt-7 flex items-center justify-center gap-1.5 text-xs text-[#6b6878] transition-colors hover:text-[#f0ede8]"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to login
            </a>
          </>
        )}

        {/* ── STEP 2: OTP + New Password ── */}
        {step === "reset" && (
          <>
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <ShieldIcon />
            </div>

            <h1
              className="mb-2 text-[26px] font-bold tracking-tight text-[#f0ede8]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Check your email
            </h1>
            <p className="mb-1 text-sm font-light leading-relaxed text-[#6b6878]">
              We sent a 6-digit code to
            </p>
            <p className="mb-7 text-sm font-medium text-amber-400">{email}</p>

            {/* OTP boxes */}
            <div className="mb-6">
              <label className="mb-3 block text-[11px] font-medium uppercase tracking-widest text-[#6b6878]">
                Reset code
              </label>
              <div className="flex gap-2.5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-12 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] text-center text-lg font-semibold text-[#f0ede8] outline-none transition-all focus:border-amber-500/40 focus:bg-amber-500/[0.04] caret-transparent"
                  />
                ))}
              </div>
            </div>

            {/* New password */}
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-[#6b6878]">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setStatus("idle"); }}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-3 pl-10 pr-10 text-sm text-[#f0ede8] placeholder-[#6b6878]/60 outline-none transition-all focus:border-amber-500/40 focus:bg-amber-500/[0.03]"
                />
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6878]" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6878] transition-colors hover:text-[#f0ede8]"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="mb-5">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-[#6b6878]">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setStatus("idle"); }}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-[#f0ede8] placeholder-[#6b6878]/60 outline-none transition-all focus:border-amber-500/40 focus:bg-amber-500/[0.03]"
                />
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6878]" />
              </div>
            </div>

            <button
              onClick={handleReset}
              disabled={status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-sm font-medium text-[#09090f] transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? <><Spinner />Resetting&hellip;</> : "Reset password"}
            </button>

            <Alert status={status} message={message} />

            <button
              onClick={() => {
                setStep("email");
                setOtp(["", "", "", "", "", ""]);
                setStatus("idle");
                setMessage("");
              }}
              className="mt-7 flex w-full items-center justify-center gap-1.5 text-xs text-[#6b6878] transition-colors hover:text-[#f0ede8]"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Use a different email
            </button>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

// ── Alert ────────────────────────────────────────────────────
function Alert({ status, message }: { status: Status; message: string }) {
  if (!message || status === "idle" || status === "loading") return null;
  const isError = status === "error";
  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/20 bg-red-500/[0.07] text-red-400"
          : "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400"
      }`}
      style={{ animation: "fadeUp 0.35s ease both" }}
    >
      {isError
        ? <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        : <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────
function KeyIcon() {
  return <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
}
function ShieldIcon() {
  return <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
}
function MailIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
}
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
}
function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function EyeOffIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>;
}
function AlertIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ArrowLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
}
function Spinner() {
  return <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}
// pages/verify-email-otp/page.js
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";
import { CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "../../../context/AuthContext"; // Adjust path if needed

const VerifyEmailOTP = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ otp: "" });

  useEffect(() => {
    // Parse email from query parameters client-side
    const queryParams = new URLSearchParams(window.location.search);
    const emailParam = queryParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setStatus("error");
      setMessage("No email provided. Please sign up again.");
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ otp: "" });
    setStatus("loading");

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setErrors({ otp: "Please enter a valid 6-digit code" });
      setStatus("idle");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ollanbackend-jr1d3g.fly.dev";
      const res = await fetch(`${apiUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }
      setStatus("success");
      setMessage("Email verified successfully! Redirecting to shop...");
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Verification failed. Please try again.");
    }
  };

  const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://ollanbackend-jr1d3g.fly.dev";
      const res = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend verification code");
      }
      setStatus("idle");
      setMessage("Verification code resent! Please check your inbox.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to resend verification code");
    }
  };

  return (
    <div className="min-h-screen text-black bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === "success" ? "Email Verified!" : status === "error" ? "Verification Failed" : "Verify Your Email"}
          </h1>
          <p className="text-gray-600">
            {status === "idle" || status === "loading" ? `Enter the 6-digit code sent to ${email}` : message}
          </p>
        </div>

        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              {errors.otp && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.otp}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                "Verify Code"
              )}
            </button>
          </form>
        )}

        {(status === "success" || status === "error") && (
          <div className="text-center">
            {status === "success" && <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />}
            {status === "error" && <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status !== "success" && (
          <div className="text-center mt-4">
            <button
              onClick={handleResend}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Resend Verification Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailOTP;
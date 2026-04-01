"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Step 1: Load from localStorage immediately so user sees their data fast
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      // Genuinely not logged in
      setTimeout(() => router.push("/pages/signin"), 1500);
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    } catch {
      // corrupted localStorage
    }

    setIsLoading(false);

    // Step 2: Silently refresh store credit from DB in the background
    const refreshCredit = async () => {
      try {
        const { data } = await api.get("/api/user/me");
        const updated = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          referralCode: data.referralCode,
          storeCredit: data.storeCredit ?? 0,
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (err) {
        // Silently fail — user still sees cached data, no redirect
        console.error("Background credit refresh failed:", err);
      }
    };

    refreshCredit();
  }, []);

  const copyReferralCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>

        <div className="space-y-6">
          <div>
            <p className="text-gray-500 text-sm">Name</p>
            <p className="text-xl font-semibold">{user.name}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Email</p>
            <p className="text-xl font-semibold">{user.email}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Role</p>
            <p className="text-lg font-medium capitalize">{user.role}</p>
          </div>

          {/* Store Credit — refreshed from DB in background */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <p className="text-gray-500 text-sm">Store Credit</p>
            <p className="text-3xl font-bold text-green-600">
              ₦{(user.storeCredit ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Live balance from your account</p>
          </div>

          {/* Referral Code */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-500 text-sm mb-2">Your Referral Code</p>

            <div className="flex items-center gap-3 bg-white border rounded-lg p-4">
              <code className="flex-1 font-mono text-2xl font-semibold tracking-wider text-blue-700">
                {user.referralCode || "N/A"}
              </code>

              <button
                onClick={copyReferralCode}
                disabled={!user.referralCode}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-3">
              Share this code with friends and earn 3% store credit when they order!
            </p>
          </div> */}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            router.push("/pages/signin");
          }}
          className="mt-8 w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition active:scale-[0.98]"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation"; 
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Lock, Mail, UserRound, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type AuthFormProps = {
  type: "signup" | "signin" | "forgot-password" | "reset-password";
};

type FormData = {
  email: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  token?: string;
};

type NotificationState = {
  type: "success" | "error" | "info" | null;
  message: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
};

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const router = useRouter();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState<FormData>({ email: "", password: "", confirmPassword: "", name: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ type: null, message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const titles = {
    signup: "Create Account",
    signin: "Welcome Back",
    "forgot-password": "Reset Password",
    "reset-password": "Set New Password",
  };

  const submitLabels = {
    signup: "Create Account",
    signin: "Sign In",
    "forgot-password": "Send Reset Link",
    "reset-password": "Update Password",
  };

  useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (type !== "reset-password") {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (type === "signup" || type === "signin" || type === "reset-password") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if ((type === "signup" || type === "reset-password") && formData.password) {
        if (!/(?=.*[a-z])/.test(formData.password)) {
          newErrors.password = "Password must contain at least one lowercase letter";
        } else if (!/(?=.*[A-Z])/.test(formData.password)) {
          newErrors.password = "Password must contain at least one uppercase letter";
        } else if (!/(?=.*\d)/.test(formData.password)) {
          newErrors.password = "Password must contain at least one number";
        }
      }
    }

    if (type === "signup" && !formData.name) {
      newErrors.name = "Name is required";
    } else if (type === "signup" && formData.name && formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if ((type === "signup" || type === "reset-password") && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    setIsLoading(true);

    try {
      if (type === "signup") {
        const res = await fetch("https://ollanbackend-jr1d3g.fly.dev/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Signup failed");
        }
        showNotification("success", "Signup successful! Please check your email for the verification code.");
        setTimeout(() => router.push(`/pages/verify-email-otp?email=${encodeURIComponent(formData.email)}`), 2000);
      } else if (type === "signin") {
        const res = await fetch("https://ollanbackend-jr1d3g.fly.dev/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.message === "Please verify your email before signing in.") {
            setErrors({ email: data.message });
          } else {
            throw new Error(data.message || "Signin failed");
          }
        } else {
          console.log("Signin response:", JSON.stringify(data, null, 2));
          if (data.token && data.user) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            showNotification("success", "Welcome back!");
            setTimeout(() => router.push("/"), 1000);
          }
        }
      }
    }catch (error) {
  // Type guard to ensure error is an Error object
  if (error instanceof Error) {
    console.error("Auth error:", { message: error.message });
    const errorMessage = error.message || "Something went wrong. Please try again.";
    showNotification("error", errorMessage);
    if (error.message !== "Please verify your email before signing in.") {
      setErrors({ email: errorMessage });
    }
  } else {
    // Fallback for non-Error objects (e.g., string or other thrown types)
    console.error("Auth error:", { message: String(error) });
    const errorMessage = String(error) || "Something went wrong. Please try again.";
    showNotification("error", errorMessage);
    setErrors({ email: errorMessage });
  }
} finally {
  setIsLoading(false);
  setIsSubmitting(false);
}
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || "",
    };
  };

  const passwordStrength = type === "signup" || type === "reset-password" ? getPasswordStrength(formData.password || "") : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br text-black from-blue-50 via-white to-purple-50 flex lg:items-center lg:justify-center p-4">
      <div className="w-full max-w-md">
        {/* Notification */}
        {notification.type && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : notification.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{titles[type]}</h1>
            <p className="text-gray-600">
              {type === "signup" && "Join us and start your journey"}
              {type === "signin" && "Sign in to your account"}
              {type === "forgot-password" && "Enter your email to reset your password"}
              {type === "reset-password" && "Enter your new password"}
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            {type === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserRound className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            {type !== "reset-password" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            {(type === "signup" || type === "signin" || type === "reset-password") && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {passwordStrength && formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.strength ? passwordStrength.color : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {type === "signin" && errors.email === "Please verify your email before signing in." && (
  <div className="text-center mt-4">
    <button
      onClick={async () => {
        try {
          const res = await fetch("https://ollanbackend-jr1d3g.fly.dev/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Failed to resend verification email");
          }
          showNotification("success", "Verification email resent! Please check your inbox.");
        } catch (error: any) {
          showNotification("error", error.message || "Failed to resend verification email");
        }
      }}
      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
    >
      Resend Verification Email
    </button>
  </div>
)}

            {/* Confirm Password Field */}
            {(type === "signup" || type === "reset-password") && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword || ""}
                    onChange={handleInputChange}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {submitLabels[type]}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-8 text-center space-y-4">
            {type === "signin" && (
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/forgot-password")}
                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                >
                  Forgot your password?
                </button>
                <div className="text-gray-600 text-sm">
                  Don't have an account?{" "}
                  <button
                    onClick={() => router.push("/pages/signup")}
                    className="text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            )}

            {type === "signup" && (
              <div className="text-gray-600 text-sm">
                Already have an account Stuart
                <button
                  onClick={() => router.push("/pages/signin")}
                  className="text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}

            {type === "forgot-password" && (
              <div className="text-gray-600 text-sm">
                Remember your password?{" "}
                <button
                  onClick={() => router.push("/pages/signin")}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
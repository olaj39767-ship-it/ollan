"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Heart,
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  Gift,
} from "lucide-react";
import logo from "../../../public/ollogo.svg";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/pages/about" }
];

const categories = [
  "All Categories",
  "Anti-malaria",
  "Vitamins and Supplements",
  "Pain reliever",
  "Anti Biotics",
  "Anti-Asthma",
  "Baby care",
  "First Aid",
  "Skincare",
  "Dental Care",
];

const Navbar: React.FC<{ links?: { name: string; href: string }[] }> = ({
  links = navLinks,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const { user, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      router.push("/pages/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(
          searchQuery
        )}&category=${encodeURIComponent(selectedCategory)}`
      );
    }
  };

  const getUserInitials = (name?: string): string => {
    if (!name) return "";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex items-center justify-between lg:py-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="p-2 rounded-lg transition-transform hover:scale-105">
                <Image
                  src={logo}
                  alt="Ollan Logo"
                  width={80}
                  height={80}
                  className="lg:w-20 w-12 h-auto"
                  priority
                />
              </div>
            </Link>
          </div>

       

       

          {/* Right Icons */}
          <div className="hidden md:flex items-center space-x-4">
           
            {user ? (
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Shopping cart"
              >
                <Link href="/pages/orders">
                  <ShoppingBag className="w-6 h-6 text-gray-600 hover:text-red-500 transition-colors" />
                </Link>
              </button>
            ) : (
              <></>
            )}

            {/* User Dropdown */}
            <div className="relative group">
              <button className="flex items-center cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-2 flex items-center justify-center shadow-sm">
                  {user ? (
                    <span className="text-white font-medium text-sm">
                      {getUserInitials(user.name)}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-gray-700 font-medium hidden lg:block">
                  {user ? user.name || "Profile" : "Account"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600 ml-1 transition-transform group-hover:rotate-180" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                <div className="py-2">
                  {user ? (
                    <>
                      <Link
                        href="/pages/profile"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        href="/pages/orders"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                      {user.role === "admin" && (
                        <>
                          <Link
                            href="/admin/update-product"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Manage Products
                          </Link>
                          <Link
                            href="/admin/add-product"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Add Products
                          </Link>
                        </>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/pages/signin"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/pages/signup"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {/* <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
              <input
                type="text"
                placeholder="Search medicine, medical products..."
                className="bg-transparent border-none outline-none flex-1 text-sm placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full ml-2 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div> */}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav
            ref={dropdownRef}
            className="md:hidden bg-white border-t border-gray-200 animate-in slide-in-from-top duration-200"
          >
            <div className="py-4 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 font-medium transition-colors rounded-md mx-2"
                  onClick={toggleMobileMenu}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Icons */}
              <div className="flex items-center space-x-4 px-4 py-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="w-6 h-6 text-gray-600 hover:text-red-500 transition-colors" />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Shopping cart"
                >
                  <ShoppingBag className="w-6 h-6 text-gray-600 hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Mobile User Menu */}
              <div className="px-4 py-2 border-t border-gray-100 mt-2">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-3 flex items-center justify-center shadow-sm">
                    {user ? (
                      <span className="text-white font-medium text-sm">
                        {getUserInitials(user.name)}
                      </span>
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <span className="text-gray-700 font-medium">
                    {user ? user.name || "Profile" : "Account"}
                  </span>
                </div>

                <div className="space-y-1">
                  {user ? (
                    <>
                      <Link
                        href="/pages/profile"
                        className="flex items-center px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={toggleMobileMenu}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        href="/pages/orders"
                        className="flex items-center px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={toggleMobileMenu}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                      {user.role === "admin" && (
                        <>
                          <Link
                            href="/admin/update-product"
                            className="flex items-center px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors"
                            onClick={toggleMobileMenu}
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Manage Products
                          </Link>
                          <Link
                            href="/admin/add-product"
                            className="flex items-center px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors"
                            onClick={toggleMobileMenu}
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Add Products
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/pages/signin"
                        className="block px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={toggleMobileMenu}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/pages/signup"
                        className="block px-3 py-2 text-gray-700 hover:text-red-500 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={toggleMobileMenu}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;

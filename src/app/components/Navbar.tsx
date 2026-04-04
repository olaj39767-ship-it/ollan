"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
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
import { useRouter, usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/pages/about" },
];

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/pages/signin");
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={logo}
              alt="Ollan Logo"
              width={80}
              height={80}
              className="lg:w-20 w-12 h-auto"
              priority
            />
          </Link>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user && (
              <>
                    <Link
                href="/pages/orders"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-gray-600 hover:text-red-500" />
              </Link>
              <Link
                href="/pages/orders"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-gray-600 hover:text-red-500" />
              </Link>
              </>
        
            )}

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-2 flex items-center justify-center">
                  {user ? (
                    <span className="text-white text-sm font-medium">
                      {getUserInitials(user.name)}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-gray-700 hidden xl:block">
                  {user ? user.name : "Account"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 ml-1 transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 z-20 ${
                  isUserMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
              >
                <div className="py-2">
                  {user ? (
                    <>
                     

                      <Link
                        href="/pages/profile"
                        className="flex items-center px-4 py-2 hover:bg-gray-50"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                       Profile
                      </Link>
                      <Link
                        href="/pages/orders"
                        className="flex items-center px-4 py-2 hover:bg-gray-50"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>

                      {user.role === "admin" && (
                        <>
                          <Link
                            href="/admin/seller"
                            className="flex items-center px-4 py-2 hover:bg-gray-50"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Manage Products
                          </Link>

                          <Link
                            href="/admin/add-product"
                            className="flex items-center px-4 py-2 hover:bg-gray-50"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Add Products
                          </Link>
                        </>
                      )}

                      <hr className="my-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/pages/signin"
                        className="block px-4 py-2 hover:bg-gray-50"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/pages/signup"
                        className="block px-4 py-2 hover:bg-gray-50"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Hamburger */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Menu */}
        {isMobileMenuOpen && (
          <nav
            ref={mobileMenuRef}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-2 hover:bg-gray-50"
                >
                  {link.name}
                </Link>
              ))}

              <div className="border-t mt-2 pt-2 px-4">
                {user ? (
                  <>
                   
                    <Link href="/pages/profile" className="block py-2">
                      Profile
                    </Link>
                    <Link href="/pages/orders" className="block py-2">
                      My Orders
                    </Link>

                    {user.role === "admin" && (
                      <>
                        <Link href="/admin/seller" className="block py-2">
                          Manage Products
                        </Link>
                        <Link href="/admin/add-product" className="block py-2">
                          Add Products
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block py-2 text-red-600"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/pages/signin" className="block py-2">
                      Sign In
                    </Link>
                    <Link href="/pages/signup" className="block py-2">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  Upload,
  Star,
  Shield,
  Truck,
  Smartphone,
  User,
  Rabbit,
  PackageCheck,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  X,
  File,
  Loader2,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ShopByCategory from './ShopByCategory';
import Navbar from './Navbar';
import UploadPrescriptionModal from './UploadPrescriptionModal';

// Assuming these imports point to valid paths
import logo from '../../../public/ollogo.svg';
import i1 from '../../../public/ol1.png';
import as from '../../../public/assets/as.png';
import gp from '../../../public/assets/gp.png';

interface UploadPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
}



const PharmacyWebsite = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">30,000+ customers</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                Welcome to Ollan Pharmacy – Your <span className="text-red-500">One-Stop Online Pharmacy & Supermarket</span> in Ibadan
              </h1>

              <h2 className="text-gray-600 mb-8 text-md lg:text-lg lg:leading-relaxed">
                Welcome to Ollan Pharmacy, your trusted source for authentic
                medications, health supplements, and everyday supermarket items
                – now available online! Established in 1985 and proudly serving
                Ibadan, we combine professional pharmaceutical care with the
                convenience of fast, reliable delivery. Whether you’re a student
                at the University of Ibadan, a patient or visitor at UCH, or a
                busy family in the city, we bring the pharmacy and supermarket
                to your fingertips. From prescription drugs, pain relievers, and
                vitamins to Milo, tissues, and personal care essentials –
                everything you need is just a few clicks away. Enjoy secure
                payments, pharmacist support, and free delivery on qualifying
                orders. Ollan Pharmacy – The Right Medicine, because everyone
                deserves the right medicine.
              </h2>

              <div className="flex space-x-4 mb-8">
                <Link href="/">
                  <button
                    className="bg-red-500 text-white p-2 lg:px-6 lg:py-3 rounded-full font-semibold flex items-center hover:bg-red-600 transition-colors"
                  >
                    Shop now →
                  </button>
                </Link>
                <button
                  onClick={handleOpenModal}
                  className="border-2 border-red-500 text-red-500 p-2 lg:px-6 lg:py-3 rounded-full font-semibold flex items-center hover:bg-red-50 transition-colors"
                >
                  <Upload size={18} className="mr-2" />
                  Upload a prescription
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <Image
                src={i1}
                alt="Happy Ollan woman using phone"
                className=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Why <span className="text-red-500">Choose Us</span> ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Prescription Made Simple */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-black">
                Prescription Made Simple
              </h3>
              <p className="text-gray-600 text-sm">
                Upload A Picture Of Your Prescription And We Handle The Rest.
              </p>
            </div>

            {/* 100% Genuine */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-black">
                100% Genuine
              </h3>
              <p className="text-gray-600 text-sm">
                All Medications Are Sourced From Verified Suppliers.
              </p>
            </div>

            {/* Fast Delivery */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-black">
                Fast Delivery
              </h3>
              <p className="text-gray-600 text-sm">
                Same-Day Delivery Available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center lg:text-left mb-12 lg:mb-16">
            <span className="inline-block px-3 py-1 text-sm font-semibold text-red-600 bg-red-50 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Get Your Meds In Minutes With <br className="hidden lg:block" />
              <span className="text-red-600">4 Easy Steps</span>
            </h2>
            <p className="max-w-2xl mx-auto lg:mx-0 text-lg text-gray-600">
              From prescription to doorstep in just a few taps. No stress, no
              queues — just seamless care.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#F0F9FF] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Search or Upload
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Find medication in our catalog or upload your doctor's
                    prescription.
                  </p>
                </div>
              </div>
              <div className="mt-4 text-blue-600 font-medium text-sm">
                Step 1
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F5F3FF] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                  <Rabbit className="text-purple-600 font-bold text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Fast Delivery
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Your meds arrive safely and fast — same day delivery in
                    major cities.
                  </p>
                </div>
              </div>
              <div className="mt-4 text-purple-600 font-medium text-sm">
                Step 2
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FFF1F2] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                  <PackageCheck className="text-red-600 font-bold text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirm Order
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Review your order details and confirm your delivery
                    preferences.
                  </p>
                </div>
              </div>
              <div className="mt-4 text-red-600 font-medium text-sm">
                Step 3
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#FFFBEB] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                  <Smartphone className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Easy Refills
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Tap once on our app to reorder. We'll remind you before you
                    run out.
                  </p>
                </div>
              </div>
              <div className="mt-4 text-yellow-600 font-medium text-sm">
                Step 4
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop with Category */}
      <section className="py-16 bg-gray-50">
        <div>
          <ShopByCategory />
        </div>
      </section>

      {/* Footer */}
   

      <UploadPrescriptionModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default PharmacyWebsite;
"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: File | null;
}

interface ApiError {
  message?: string;
}

const AddProductForm: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
  

useEffect(() => {
  let isMounted = true;

  // Early return if user state is still loading (null or undefined)
  if (user === null || user === undefined) {
    // Optional: Set a loading state for UI feedback
    setLoading(true); // Assuming you have a setLoading state
    return;
  }

  // Redirect if no user or user is not an admin
  if (!user || user.role !== "admin") {
    if (isMounted) {
      router.push("/pages/signin");
    }
    return;
  }

  // If user is authenticated and an admin, proceed with any additional logic here
  setLoading(false); // Clear loading state if needed

  return () => {
    isMounted = false; // Prevent state updates after unmount
  };
}, [user, router]);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Optional: Validate that the file is an image
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        return;
      }
      // Optional: Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      setError("Name, price, and stock are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("category", formData.category);
    if (formData.image) {
      data.append("image", formData.image);
      console.log("FormData image:", formData.image); // Debug
    }

    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://ollanbackend.vercel.app";

      const response = await fetch(`${baseURL}/api/products/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Product response:", result); // Debug

      alert("Product created successfully!");
      setFormData({ name: "", description: "", price: "", stock: "", category: "", image: null });
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create product";
      setError(errorMessage);
      console.error("Product creation error:", error); // Debug
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Add New Drug (Admin: {user.name || "Unknown"})
      </h2>
      {error && (
        <p className="text-red-500 mb-4 flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="Enter Product name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            rows={4}
            placeholder="Enter Product description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Price (₦) *</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="Enter price"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Stock Quantity *</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            required
            min="0"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
            placeholder="Enter stock quantity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
          >
            <option value="">Select a category</option>
            <option value="Pain reliever">Pain reliever</option>
            <option value="Anti Malaria">Anti Malaria</option>
                        <option value="Cough and Cold">Cough and Cold</option>

            <option value="Sexual Health">Sexual Health</option>
            <option value="Vitamins and Supplements">Vitamins and Supplements</option>
            <option value="Baby care">Baby care</option>
            <option value="Prescription">Prescription</option>
            <option value="Supermarket">Supermarket</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Image (Any Image Type)</label>
          <div className="relative">
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full p-3 border rounded-lg text-black"
            />
            {preview && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {preview && (
            <div className="mt-2">
              <img src={preview} alt="Preview" className="w-32 h-32 object-contain rounded" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Drug"}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;
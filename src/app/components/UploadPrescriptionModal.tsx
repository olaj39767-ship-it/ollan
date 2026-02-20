// components/UploadPrescriptionModal.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';

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

const UploadPrescriptionModal: React.FC<UploadPrescriptionModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Clean up image previews to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach((uploadedFile) => {
        if (uploadedFile.preview) {
          URL.revokeObjectURL(uploadedFile.preview);
        }
      });
    };
  }, [files]);

  const handleFileChange = (selectedFiles: FileList | null) => {
    setError(null);
    setSuccess(false);
    if (selectedFiles) {
      const validFiles: UploadedFile[] = [];
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      Array.from(selectedFiles).forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
          setError('Only JPEG, PNG, PDF, and DOCX files are allowed');
          return;
        }
        if (file.size > maxSize) {
          setError('File size must be less than 5MB');
          return;
        }
        validFiles.push({
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        });
      });

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removedFile = newFiles.splice(index, 1)[0];
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return newFiles;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Valid email is required';
    if (!formData.phone.match(/^\+?\d{10,15}$/)) return 'Valid phone number is required';
    if (!formData.location.trim()) return 'Location is required';
    return null;
  };

 // components/UploadPrescriptionModal.tsx
const handleUpload = async () => {
  const formError = validateForm();
  if (formError) {
    setError(formError);
    return;
  }
  if (files.length === 0) {
    setError('Please upload at least one file');
    return;
  }

  setUploading(true);
  setError(null);
  setSuccess(false);

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('location', formData.location);
    files.forEach((uploadedFile) => {
      formDataToSend.append('files', uploadedFile.file);
    });

    const response = await axios.post('https://ollanbackend.vercel.app/api/orders/send-prescription', formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.status === 200) {
      setSuccess(true);
      setFiles([]);
      setFormData({ name: '', email: '', phone: '', location: '' });
    } else {
      setError('Failed to upload files. Please try again.');
    }
  } catch (err) {
    setError('Failed to upload files. Please try again.');
  } finally {
    setUploading(false);
  }
};

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full mx-4 shadow-xl animate-fadeIn border border-white/20"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Upload Prescription</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your location"
            />
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center ${
            dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Drag and drop your prescription files here, or
          </p>
          <button
            onClick={openFilePicker}
            className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Select Files
          </button>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="mb-6 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Files:</h4>
            <div className="grid gap-4">
              {files.map((uploadedFile, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {uploadedFile.preview ? (
                      <Image
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <File className="w-8 h-8 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-700 truncate max-w-xs">
                      {uploadedFile.file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label={`Remove ${uploadedFile.file.name}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 flex items-center space-x-2">
            <X className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <p>Prescription uploaded successfully! Our agents will reach out to you shortly.</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span>{uploading ? 'Uploading...' : 'Upload Prescription'}</span>
        </button>
      </div>
    </div>
  );
};

export default UploadPrescriptionModal;
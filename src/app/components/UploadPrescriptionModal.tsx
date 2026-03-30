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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    location: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Cleanup previews
  useEffect(() => {
    return () => {
      files.forEach((uploadedFile) => {
        if (uploadedFile.preview) URL.revokeObjectURL(uploadedFile.preview);
      });
    };
  }, [files]);

  const handleFileChange = (selectedFiles: FileList | null) => {
    setError(null);
    setSuccess(false);

    if (!selectedFiles) return;

    const validFiles: UploadedFile[] = [];

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const maxSize = 5 * 1024 * 1024;

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
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      });
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
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

  const handleDragLeave = () => setDragActive(false);

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removed = newFiles.splice(index, 1)[0];

      if (removed.preview) URL.revokeObjectURL(removed.preview);

      return newFiles;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return 'Valid email is required';
    if (!formData.phone.match(/^\+?\d{10,15}$/))
      return 'Valid phone number is required';
    if (!formData.location.trim()) return 'Location is required';

    return null;
  };

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
        formDataToSend.append('prescription', uploadedFile.file);
      });

      const response = await axios.post(
        'https://ollanback.vercel.app/api/orders/upload-prescription',
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data?.success) {
        setSuccess(true);

        setTimeout(() => {
          setFiles([]);
          setFormData({
            name: '',
            email: '',
            phone: '',
            location: '',
          });

          setSuccess(false);
          onClose();
        }, 2500);
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          'Failed to upload files. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-start justify-center overflow-y-auto z-50 py-10">

      <div
        ref={modalRef}
        className="bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 shadow-xl border border-white/20 max-h-[90vh] overflow-y-auto"
      >

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Upload Prescription
          </h3>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Full name"
            className="w-full p-2 border rounded-lg"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="w-full p-2 border rounded-lg"
          />

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Phone"
            className="w-full p-2 border rounded-lg"
          />

          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Location"
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Drag & Drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center ${
            dragActive
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >

          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

          <p className="text-gray-600 mb-4">
            Drag and drop your prescription files here
          </p>

          <button
            onClick={openFilePicker}
            className="bg-red-500 text-white px-6 py-2 rounded-lg"
          >
            Select Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </div>

        {/* Files */}
        {files.length > 0 && (
          <div className="mb-6 space-y-3">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
              >

                <div className="flex items-center gap-3">

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

                  <span className="text-sm truncate max-w-xs">
                    {uploadedFile.file.name}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Prescription uploaded successfully
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-red-500 text-white py-3 rounded-lg flex justify-center items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}

          {uploading ? 'Uploading...' : 'Upload Prescription'}
        </button>
      </div>
    </div>
  );
};

export default UploadPrescriptionModal;
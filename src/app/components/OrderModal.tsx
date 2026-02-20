'use client';

import { useState } from "react";
import { Order, Rider } from "../../types/order";
import {
  UserPlus,
  X,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Receipt,
  FileText,
  Truck,
  CheckCircle2,
  AlertCircle,
  Timer,
  Loader2,
} from "lucide-react";
import { verifyPayment } from "@/src/lib/api2";

interface OrderModalProps {
  order: Order;
  onClose: () => void;
  riders?: Rider[];
  onAssignRider?: (orderId: string, action: "assign-rider", riderId: string) => Promise<void>;
  isRider: boolean;
}

export default function OrderModal({ order, onClose, riders = [], onAssignRider, isRider }: OrderModalProps) {
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignRider = async () => {
    if (selectedRiderId && onAssignRider) {
      setIsAssigning(true);
      try {
        await onAssignRider(order._id, "assign-rider", selectedRiderId);
        setSelectedRiderId("");
      } catch (err) {
        console.error("Error assigning rider:", err);
      } finally {
        setIsAssigning(false);
      }
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentDetails.trim()) {
      setError("Please provide payment details");
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      await verifyPayment(order._id, paymentDetails);
      onClose(); // Close modal on success to refresh the dashboard
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify payment");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-transit":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Timer className="w-4 h-4" />;
      case "processing":
        return <CheckCircle2 className="w-4 h-4" />;
      case "accepted":
        return <User className="w-4 h-4" />;
      case "assigned":
        return <User className="w-4 h-4" />;
      case "in-transit":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 p-2 hover:bg-white/20 rounded-full transition-colors"
            disabled={isVerifying || isAssigning}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-blue-100">ID: {order._id}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-6 right-16">
            <div
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${getStatusColor(
                order.status
              )} bg-white`}
            >
              {getStatusIcon(order.status)}
              <span className="font-semibold text-sm">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{order.customerInfo.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{order.customerInfo.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{order.customerInfo.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  Delivery Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                    <p className="font-medium text-gray-900">{order.customerInfo.pickupLocation}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                    <p className="font-medium text-gray-900">{order.customerInfo.deliveryAddress}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm text-gray-500">Delivery Option</p>
                      <p className="font-medium text-gray-900">{order.customerInfo.deliveryOption}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <p className="font-medium text-gray-900">{order.customerInfo.estimatedDelivery || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Verification */}
              {!isRider && order.status === "pending" && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-yellow-600" />
                    Manual Payment Verification
                    {isVerifying && (
                      <Loader2 className="w-4 h-4 ml-2 text-yellow-600 animate-spin" />
                    )}
                  </h3>
                  <div className="space-y-3">
                   <div className="flex gap-4">
  <label className="flex items-center text-sm">
    <input
      type="radio"
      name="paymentStatus"
      value="Verified"
      checked={paymentDetails === "Verified"}
      onChange={(e) => setPaymentDetails(e.target.value)}
      className="mr-2 focus:ring-yellow-500"
    />
    Verified
  </label>
  <label className="flex items-center text-sm">
    <input
      type="radio"
      name="paymentStatus"
      value="Not Verified"
      checked={paymentDetails === "Not Verified"}
      onChange={(e) => setPaymentDetails(e.target.value)}
      className="mr-2 focus:ring-yellow-500"
    />
    Not Verified
  </label>
</div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button
                      onClick={handleVerifyPayment}
                      disabled={isVerifying || !paymentDetails.trim()}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Verify Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Rider Assignment */}
              {!isRider && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-orange-600" />
                    Rider Assignment
                    {isAssigning && (
                      <Loader2 className="w-4 h-4 ml-2 text-orange-600 animate-spin" />
                    )}
                  </h3>

                  {order.rider ? (
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-orange-200">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assigned Rider</p>
                        <p className="font-semibold text-gray-900">{order.rider.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {riders.length === 0 ? (
                        <div className="text-center py-4">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No riders available</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <select
                            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            value={selectedRiderId}
                            onChange={(e) => setSelectedRiderId(e.target.value)}
                            disabled={isAssigning}
                          >
                            <option value="">Select a rider</option>
                            {riders.map((rider) => (
                              <option key={rider._id} value={rider._id}>
                                {rider.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={handleAssignRider}
                            disabled={!selectedRiderId || isAssigning}
                            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {isAssigning ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Assigning...</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-5 h-5" />
                                <span>Assign Rider</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Items & Summary */}
            <div className="space-y-6">
              {/* Items */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  Order Items
                </h3>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.productId._id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productId.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₦{item.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescription */}
              {order.prescriptionUrl && (
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-cyan-600" />
                    Prescription
                  </h3>
                  <a
                    href={order.prescriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Prescription</span>
                  </a>
                </div>
              )}

              {/* Payment Details */}
              {order.paymentDetails && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-gray-600" />
                    Payment Details
                  </h3>
                  <p className="text-gray-700">{order.paymentDetails}</p>
                </div>
              )}

              {/* Order Total */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₦{(order.totalAmount - (order.deliveryFee || 0)).toLocaleString()}</span>
                  </div>

                  {order.deliveryFee && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">₦{order.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 rounded-lg border border-blue-100">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            disabled={isVerifying || isAssigning}
            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
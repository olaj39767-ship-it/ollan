'use client';

import { useState } from 'react';
import { Order } from '../../types/order';
import { Package, Eye, Check, X, MapPin, DollarSign, Truck, Users, CheckCircle2 } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onView: () => void;
  onAction: (
    orderId: string,
    action: 'accept' | 'reject' | 'en_route' | 'delivered' | 'assign-rider' | 'verify-payment',
    riderId?: string,
    paymentDetails?: string
  ) => Promise<void>;
  isRider: boolean;
  actionLoading: { [key: string]: boolean };
}

export default function OrderCard({ order, onView, onAction, isRider, actionLoading }: OrderCardProps) {
  const [paymentDetails, setPaymentDetails] = useState('');

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      // Admin statuses
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      // Rider statuses
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'en_route':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const currentStatus = isRider ? (order.deliveryStatus || 'assigned') : order.status;

  const handleVerifyPayment = async () => {
    if (!paymentDetails.trim()) {
      alert('Please enter payment details');
      return;
    }
    await onAction(order._id, 'verify-payment', undefined, paymentDetails);
    setPaymentDetails('');
  };

  const actionKey = (action: string, riderId?: string) =>
    `${order._id}-${action}${riderId ? `-${riderId}` : ''}${action === 'verify-payment' ? '-verify' : ''}`;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Order #{order._id.slice(-6)}</h3>
            <p className="text-slate-500 text-sm">Click to view details</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(currentStatus)}`}>
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      </div>

      {/* Order Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-500">Customer</p>
            <p className="font-semibold text-slate-800">{order.customerInfo.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-500">Pickup Location</p>
            <p className="font-semibold text-slate-800">{order.customerInfo.pickupLocation}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-500">transaction Number</p>
            <p className="font-semibold text-slate-800">{order.customerInfo.transactionNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-500">Total Amount</p>
            <p className="font-bold text-slate-800 text-lg">₦{order.totalAmount.toLocaleString()}</p>
          </div>
        </div>
        {order?.rider?.name ? (
          <div className="flex items-center space-x-3">
            <Users className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Assigned Rider</p>
              <p className="font-semibold text-slate-800">{order.rider.name}</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500">Assign rider: no rider assigned</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-col gap-2">
        <button
          onClick={onView}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex-1 justify-center"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
        {isRider && order.deliveryStatus !== 'delivered' && (
          <>
            <button
              onClick={() => onAction(order._id, 'en_route')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={order.deliveryStatus === 'en_route' || actionLoading[actionKey('en_route')]}
            >
              <Truck className="w-4 h-4" />
              <span>{actionLoading[actionKey('en_route')] ? 'Processing...' : 'En Route'}</span>
            </button>
            <button
              onClick={() => onAction(order._id, 'delivered')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={actionLoading[actionKey('delivered')]}
            >
              <Check className="w-4 h-4" />
              <span>{actionLoading[actionKey('delivered')] ? 'Processing...' : 'Delivered'}</span>
            </button>
          </>
        )}
        {!isRider && order.status === 'processing' && (
          <div className="w-full justify-between flex gap-2">
            <button
              onClick={() => onAction(order._id, 'accept')}
              className="flex items-center space-x-2 lg:px-9 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={actionLoading[actionKey('accept')]}
            >
              <Check className="w-4 h-4" />
              <span>{actionLoading[actionKey('accept')] ? 'Processing...' : 'Accept'}</span>
            </button>
            <button
              onClick={() => onAction(order._id, 'reject')}
              className="flex items-center space-x-2 lg:px-9 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={actionLoading[actionKey('reject')]}
            >
              <X className="w-4 h-4" />
              <span>{actionLoading[actionKey('reject')] ? 'Processing...' : 'Reject'}</span>
            </button>
          </div>
        )}
        {!isRider && order.status === 'pending' && (
          <div className="space-y-2">
            <textarea
              className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter payment details (e.g., bank transfer reference)"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              rows={3}
            />
            <button
              onClick={handleVerifyPayment}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
              disabled={actionLoading[actionKey('verify-payment')] || !paymentDetails.trim()}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLoading[actionKey('verify-payment')] ? 'Verifying...' : 'Verify Payment'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Order, Rider } from '../../types/order';
import { Eye, Check, X, UserPlus, CheckCircle2 } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  onView: (order: Order) => void;
  onAction: (
    orderId: string,
    action: 'accept' | 'reject' | 'en_route' | 'delivered' | 'assign-rider' | 'verify-payment',
    riderId?: string,
    paymentDetails?: string
  ) => Promise<void>;
  actionLoading: { [key: string]: boolean };
  riders?: Rider[];
}

export default function OrderTable({ orders, onView, onAction, actionLoading, riders = [] }: OrderTableProps) {
  const [paymentDetails, setPaymentDetails] = useState<{[key: string]: string}>({});
  const [selectedRiderForOrder, setSelectedRiderForOrder] = useState<{[key: string]: string}>({});

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700';
      case 'en_route':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!paymentDetails[orderId]?.trim()) {
      alert('Please enter payment details');
      return;
    }
    await onAction(orderId, 'verify-payment', undefined, paymentDetails[orderId]);
    setPaymentDetails(prev => ({...prev, [orderId]: ''}));
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    await onAction(orderId, 'assign-rider', riderId);
    setSelectedRiderForOrder(prev => ({...prev, [orderId]: ''}));
  };

  const actionKey = (orderId: string, action: string, riderId?: string) =>
    `${orderId}-${action}${riderId ? `-${riderId}` : ''}${action === 'verify-payment' ? '-verify' : ''}`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Order ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const needsPaymentVerification = order.status === 'pending';
            const canAcceptReject = order.status === 'processing';
            const canAssignRider = order.status === 'accepted' && !order.rider;
            
            return (
              <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-800">#{order._id.slice(-6)}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{order.customerInfo.name}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">₦{order.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => onView(order)}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Payment Verification */}
                    {needsPaymentVerification && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Payment details"
                          className="p-1.5 border border-gray-200 rounded text-sm w-32"
                          value={paymentDetails[order._id] || ''}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            [order._id]: e.target.value
                          }))}
                        />
                        <button
                          onClick={() => handleVerifyPayment(order._id)}
                          className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
                          disabled={actionLoading[actionKey(order._id, 'verify-payment')] || !paymentDetails[order._id]?.trim()}
                          title="Verify Payment"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Accept/Reject Buttons */}
                    {canAcceptReject && (
                      <>
                        <button
                          onClick={() => onAction(order._id, 'accept')}
                          className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          disabled={actionLoading[actionKey(order._id, 'accept')]}
                          title="Accept Order"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAction(order._id, 'reject')}
                          className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                          disabled={actionLoading[actionKey(order._id, 'reject')]}
                          title="Reject Order"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Assign Rider */}
                    {canAssignRider && (
                      <div className="flex items-center gap-2">
                        <select
                          className="p-1.5 border border-gray-200 rounded text-sm"
                          value={selectedRiderForOrder[order._id] || ''}
                          onChange={(e) => setSelectedRiderForOrder(prev => ({
                            ...prev,
                            [order._id]: e.target.value
                          }))}
                        >
                          <option value="">Select Rider</option>
                          {riders.map((rider) => (
                            <option key={rider._id} value={rider._id}>
                              {rider.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignRider(order._id, selectedRiderForOrder[order._id])}
                          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                          disabled={!selectedRiderForOrder[order._id] || actionLoading[actionKey(order._id, 'assign-rider', selectedRiderForOrder[order._id])]}
                          title="Assign Rider"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
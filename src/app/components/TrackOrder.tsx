'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, DollarSign, Users, CheckCircle2, Loader2 } from 'lucide-react';

interface Order {
  orderId: string;
  transactionNumber: string;
  status: string;
  deliveryStatus: string;
  riderName: string | null;
  items: { productName: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryFee: number;
  createdAt: string;
  statusHistory: { status: string; timestamp: string; description: string }[];
}

export default function TrackOrder() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Get orderId from query parameter
  const orderId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('orderId') : null;

  // Fetch order details
  const fetchOrder = async () => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://ollanbackend.vercel.app/api/orders/track?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch order');
      }
      const data = await response.json();
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSocket
  useEffect(() => {
    if (!orderId) return;

    const websocket = new WebSocket('wss://ollan-websocket.fly.dev');
    setWs(websocket);

    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    websocket.onmessage = (event) => {
      const { event: eventType, data } = JSON.parse(event.data);
      if (eventType === 'order_update' && data.order._id === orderId) {
        setOrder(data.order); // Update order with new data
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      websocket.close();
    };
  }, [orderId]);

  // Fetch order on mount
  useEffect(() => {
    fetchOrder();
  }, []);

  // Status color for timeline
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500';
      case 'processing':
        return 'bg-blue-500';
      case 'accepted':
        return 'bg-emerald-500';
      case 'rejected':
        return 'bg-red-500';
      case 'en_route':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Order #{order.orderId}</h1>
              <p className="text-slate-500 text-sm">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="font-bold text-slate-800 text-lg">₦{order.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Transaction Number</p>
              <p className="font-semibold text-slate-800">{order.transactionNumber}</p>
            </div>
          </div>
          {order.riderName && (
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Assigned Rider</p>
                <p className="font-semibold text-slate-800">{order.riderName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Current Status</p>
              <p className="font-semibold text-slate-800 capitalize">
                {order.deliveryStatus || order.status}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Items</h2>
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between text-sm">
                <span>{item.productName} (x{item.quantity})</span>
                <span>₦{(item.price * item.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm mt-2">
            <span>Delivery Fee</span>
            <span>₦{order.deliveryFee.toLocaleString()}</span>
          </div>
        </div>

        {/* Status History Timeline */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Order Status History</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            {order.statusHistory.map((status, index) => (
              <div key={index} className="relative flex items-start mb-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`}></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-slate-800 capitalize">{status.status}</p>
                  <p className="text-sm text-slate-500">{status.description}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
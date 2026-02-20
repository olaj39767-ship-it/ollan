"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchRiderOrders, updateDeliveryStatus } from "../../lib/api2";
import { Order, Rider } from "../../types/order";
import OrderCard from "./OrderCard2";
import OrderModal from "./OrderModal";
import {
  Bell,
  Search,
  Filter,
  LogOut,
  Package,
  Truck,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { AxiosError } from "axios";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar2";

interface ApiErrorResponse {
  message?: string;
}

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [webSocketConnected, setWebSocketConnected] = useState<boolean>(false);
  const [hasNewOrder, setHasNewOrder] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [silentMode, setSilentMode] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);
  const [showLiveIndicator, setShowLiveIndicator] = useState<boolean>(true);
  const [minimizeNotifications, setMinimizeNotifications] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());

  // Initialize audio for notifications
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification-sound.mp3");
    }
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current && !silentMode) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = silentMode ? 0.1 : 0.5;
      audioRef.current.play().catch((err) => {
        console.log("Audio play failed:", err);
      });
    }
  };

  const loadOrders = useCallback(
    async (showRefreshing = false, isBackgroundUpdate = false) => {
      try {
        if (showRefreshing && !isBackgroundUpdate) {
          setRefreshing(true);
        } else if (!isBackgroundUpdate) {
          setLoading(true);
        }
        console.log("Fetching rider orders at:", new Date().toISOString());
        const data = await fetchRiderOrders();
        console.log("Orders received:", data);
        // Sort orders by createdAt in descending order (latest first)
        const sortedOrders = data.sort(
          (a: Order, b: Order) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (orders.length > 0 && sortedOrders.length > orders.length && !isBackgroundUpdate) {
          const newOrderIds: string[] = sortedOrders.map((o: Order) => o._id);
          const currentOrderIds = orders.map((o) => o._id);
          const actualNewOrders = sortedOrders.filter(
            (o: Order) => !currentOrderIds.includes(o._id)
          );

          if (actualNewOrders.length > 0) {
            setNewOrders((prev) => [...actualNewOrders, ...prev]);
            if (!minimizeNotifications) {
              setNotificationCount((prev) => prev + actualNewOrders.length);
              setHasNewOrder(true);
            }
            if (!silentMode) {
              playNotificationSound();
            }
          }
        }

        setOrders(sortedOrders);
        setError(null);
        lastUpdateRef.current = new Date();
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error("Error in loadOrders:", {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });
        if (!isBackgroundUpdate) {
          setError(axiosError.response?.data?.message || "Failed to load orders");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orders.length, silentMode, minimizeNotifications]
  );

  const setupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for WebSocket");
        if (!silentMode) {
          setError("Authentication required for real-time updates");
        }
        return;
      }

      wsRef.current = new WebSocket(
        `wss://ollan-websocket.fly.dev?token=${encodeURIComponent(token)}`
      );

      wsRef.current.onopen = () => {
        console.log("WebSocket connection established");
        setWebSocketConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.event === "connected") {
            console.log("WebSocket connected successfully");
            return;
          }

          if (message.event === "order_update") {
            const updatedOrder: Order = message.data.order;

            if (!updatedOrder._id || !updatedOrder.createdAt) {
              console.warn("Received invalid order payload:", updatedOrder);
              loadOrders(false, true);
              return;
            }

            // Only process orders assigned to this rider
            if (updatedOrder.rider?._id === user?.id) {
              setOrders((prev) => {
                const exists = prev.some((o) => o._id === updatedOrder._id);

                let updatedOrders;
                if (exists) {
                  updatedOrders = prev.map((o) =>
                    o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o
                  );
                } else {
                  if (!silentMode) {
                    playNotificationSound();
                  }
                  if (!minimizeNotifications) {
                    setHasNewOrder(true);
                    setNotificationCount((prevCount) => prevCount + 1);
                    setNewOrders((prevOrders) => [updatedOrder, ...prevOrders]);
                  }
                  updatedOrders = [updatedOrder, ...prev];
                }

                // Sort orders by createdAt in descending order (latest first)
                return updatedOrders.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              });

              lastUpdateRef.current = new Date();
            }
          }
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        setWebSocketConnected(false);

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          setupWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket connection error:", error);
        setWebSocketConnected(false);

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          setupWebSocket();
        }, 3000);
      };
    } catch (err) {
      console.error("WebSocket setup error:", err);
      if (!silentMode) {
        setError("Failed to set up real-time updates");
      }
    }
  }, [silentMode, minimizeNotifications, loadOrders, user?.id]);

  useEffect(() => {
    if (!user) {
      router.push("/pages/signin");
      return;
    }

    loadOrders();
    setupWebSocket();

    if (autoRefreshInterval > 0) {
      autoRefreshRef.current = setInterval(() => {
        loadOrders(false, true);
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [user, router, loadOrders, setupWebSocket, autoRefreshInterval]);

  const handleAction = async (
    orderId: string,
    action: "accept" | "reject" | "en_route" | "delivered" | "assign-rider" | "verify-payment",
    riderId?: string,
    paymentDetails?: string
  ) => {
    try {
      console.log(
        `Handling action ${action} for order ${orderId}${riderId ? ` with rider ${riderId}` : ""}${
          paymentDetails ? ` with payment details` : ""
        }`
      );
      setError(null);

      const actionKey = `${orderId}-${action}${riderId ? `-${riderId}` : ""}${
        paymentDetails ? "-verify" : ""
      }`;
      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

      if (action === "en_route" || action === "delivered") {
        const updatedOrder = await updateDeliveryStatus(orderId, action);
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, deliveryStatus: action } : order
          ).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else if (action === "accept" || action === "reject") {
        setError("Action not supported for riders");
      } else if (action === "assign-rider") {
        setError("Riders cannot assign other riders");
      } else if (action === "verify-payment") {
        setError("Payment verification is not supported for riders");
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(`Error handling action ${action} for order ${orderId}:`, {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
      setError(axiosError.response?.data?.message || `Failed to process action ${action}`);
    } finally {
      const actionKey = `${orderId}-${action}${riderId ? `-${riderId}` : ""}${
        paymentDetails ? "-verify" : ""
      }`;
      setActionLoading((prev) => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/pages/signin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleRefresh = () => {
    loadOrders(true);
  };

  const handleNotificationClick = () => {
    setHasNewOrder(false);
    setNotificationCount(0);
  };

  const handleNotificationClear = () => {
    setNewOrders([]);
    setNotificationCount(0);
    setHasNewOrder(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      order.deliveryStatus === filterStatus ||
      (!order.deliveryStatus && filterStatus === "assigned");
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: orders.length,
    assigned: orders.filter((o) => !o.deliveryStatus || o.deliveryStatus === "assigned").length,
    enRoute: orders.filter((o) => o.deliveryStatus === "en_route").length,
    delivered: orders.filter((o) => o.deliveryStatus === "delivered").length,
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* {showLiveIndicator && (
        <div
          className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
            webSocketConnected
              ? "px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs"
              : "px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs animate-pulse"
          }`}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${webSocketConnected ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
            <span>{webSocketConnected ? "Live" : "Connecting..."}</span>
            <span className="text-xs opacity-60">
              {Math.floor((new Date().getTime() - lastUpdateRef.current.getTime()) / 1000)}s ago
            </span>
          </div>
        </div>
      )} */}

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Rider Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* <div className="flex items-center space-x-2 bg-white/80 rounded-lg p-2 border border-gray-200">
              <button
                onClick={() => setSilentMode(!silentMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  silentMode ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
                title={silentMode ? "Silent mode on - minimal interruptions" : "Click to enable silent mode"}
              >
                {silentMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{silentMode ? "Silent" : "Normal"}</span>
              </button>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                title="Auto-refresh interval"
              >
                <option value={0}>No auto-refresh</option>
                <option value={15}>15s refresh</option>
                <option value={30}>30s refresh</option>
                <option value={60}>1min refresh</option>
                <option value={120}>2min refresh</option>
              </select>
            </div> */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className={`relative p-3 rounded-full transition-all duration-300 ${
                  hasNewOrder
                    ? "bg-blue-100 ring-2 ring-blue-400" + (silentMode ? "" : " animate-pulse")
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <Bell className={`w-6 h-6 ${hasNewOrder ? "text-blue-600" : "text-gray-600"}`} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
              {notificationCount > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Notifications</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setMinimizeNotifications(!minimizeNotifications)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                        title={minimizeNotifications ? "Show all notifications" : "Minimize notifications"}
                      >
                        {minimizeNotifications ? "Show all" : "Minimize"}
                      </button>
                      <button
                        onClick={handleNotificationClear}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {newOrders.length > 0 ? (
                      newOrders.slice(0, 20).map((order) => (
                        <div
                          key={order._id}
                          className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order);
                            handleNotificationClick();
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {order.deliveryStatus === "assigned" ? "New Order Assigned" : "Order Updated"}
                              </p>
                              <p className="text-sm text-gray-600">Order #{order._id.slice(-6)}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Assigned</p>
                <p className="text-3xl font-bold text-slate-800 flex items-center">
                  {refreshing ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Assigned</p>
                <p className="text-3xl font-bold text-amber-600 flex items-center">
                  {refreshing ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.assigned}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">En Route</p>
                <p className="text-3xl font-bold text-blue-600 flex items-center">
                  {refreshing ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.enRoute}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Delivered</p>
                <p className="text-3xl font-bold text-emerald-600 flex items-center">
                  {refreshing ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.delivered}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by ID or customer name..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="en_route">En Route</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="transform hover:scale-105 transition-all duration-300"
            >
              <OrderCard
                order={order}
                onView={() => setSelectedOrder(order)}
                onAction={handleAction}
                isRider={true}
                actionLoading={actionLoading}
              />
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && !loading && !refreshing && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              No orders found
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No orders assigned to you yet"}
            </p>
          </div>
        )}

        {refreshing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-600">Refreshing orders...</p>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="transform transition-all duration-300 scale-100">
              <OrderModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                isRider={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
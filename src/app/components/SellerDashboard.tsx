// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { fetchAdminOrders, updateOrderStatus, fetchRiders, assignRider, verifyPayment } from '../../lib/api2';
// import { Order, Rider } from '../../types/order';
// import OrderCard from './OrderCard';
// import OrderTable from './OrderTable';
// import OrderModal from './OrderModal';
// import { Bell, Search, Filter, LogOut, Package, TrendingUp, Users, Clock, Loader2, RefreshCw, X, Grid, Table, Eye, EyeOff } from 'lucide-react';
// import { AxiosError } from 'axios';
// import { useAuth } from '../../context/AuthContext';
// import { useRouter } from 'next/navigation';
// import Navbar from './Navbar2';

// interface ApiErrorResponse {
//   message?: string;
// }

// export default function SellerDashboard() {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [riders, setRiders] = useState<Rider[]>([]);
//   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [refreshing, setRefreshing] = useState<boolean>(false);
//   const [ridersLoading, setRidersLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
//   const [webSocketConnected, setWebSocketConnected] = useState<boolean>(false);
//   const [hasNewOrder, setHasNewOrder] = useState<boolean>(false);
//   const [notificationCount, setNotificationCount] = useState<number>(0);
//   const [showNotifications, setShowNotifications] = useState<boolean>(false);
//   const [newOrders, setNewOrders] = useState<Order[]>([]);
//   const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
//   const [silentMode, setSilentMode] = useState<boolean>(false);
//   const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);
//   const [showLiveIndicator, setShowLiveIndicator] = useState<boolean>(true);
//   const [minimizeNotifications, setMinimizeNotifications] = useState<boolean>(false);

//   const router = useRouter();
//   const { user, logout } = useAuth();
//   const sseRef = useRef<WebSocket | null>(null);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const previousOrdersCount = useRef<number>(0);
//   const notificationAudioPlayed = useRef<boolean>(false);
//   const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
//   const lastUpdateRef = useRef<Date>(new Date());

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       audioRef.current = new Audio('/notification-sound.mp3');
//     }
//   }, []);

//   const playNotificationSound = () => {
//     if (audioRef.current && !silentMode) {
//       audioRef.current.currentTime = 0;
//       audioRef.current.volume = silentMode ? 0.1 : 0.5;
//       audioRef.current.play().catch(err => {
//         console.log('Audio play failed:', err);
//       });
//     }
//   };

//   const loadOrders = useCallback(async (showRefreshing = false, isBackgroundUpdate = false) => {
//     try {
//       if (showRefreshing && !isBackgroundUpdate) {
//         setRefreshing(true);
//       } else if (!isBackgroundUpdate) {
//         setLoading(true);
//       }

//       const data = await fetchAdminOrders();
//       const sortedOrders = data.sort((a: Order, b: Order) =>
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       );

//       if (orders.length > 0 && sortedOrders.length > orders.length && !isBackgroundUpdate) {
//         const newOrderIds = sortedOrders.map(o => o._id);
//         const currentOrderIds = orders.map(o => o._id);
//         const actualNewOrders = sortedOrders.filter(o => !currentOrderIds.includes(o._id));

//         if (actualNewOrders.length > 0) {
//           setNewOrders(prev => [...actualNewOrders, ...prev]);

//           if (!minimizeNotifications) {
//             setNotificationCount(prev => prev + actualNewOrders.length);
//             setHasNewOrder(true);
//           }

//           if (previousOrdersCount.current > 0 && !silentMode) {
//             playNotificationSound();
//           }
//         }
//       }

//       previousOrdersCount.current = sortedOrders.length;
//       setOrders(sortedOrders);
//       setError(null);
//       lastUpdateRef.current = new Date();
//     } catch (err) {
//       console.error('Error in loadOrders:', err);
//       if (!isBackgroundUpdate) {
//         setError('Failed to load orders');
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [orders.length, silentMode, minimizeNotifications]);

//   const loadRiders = useCallback(async () => {
//     try {
//       setRidersLoading(true);
//       const data = await fetchRiders();
//       setRiders(data);
//     } catch (err) {
//       console.error('Error in loadRiders:', err);
//       setError('Failed to load riders');
//     } finally {
//       setRidersLoading(false);
//     }
//   }, []);

//   const setupWebSocket = useCallback(() => {
//     if (sseRef.current) {
//       sseRef.current.close();
//       sseRef.current = null;
//     }

//     if (reconnectTimeoutRef.current) {
//       clearTimeout(reconnectTimeoutRef.current);
//       reconnectTimeoutRef.current = null;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         console.error('No token found for WebSocket');
//         if (!silentMode) {
//           setError('Authentication required for real-time updates');
//         }
//         return;
//       }

//       sseRef.current = new WebSocket(`wss://ollan-websocket.fly.dev?token=${encodeURIComponent(token)}`);

//       sseRef.current.onopen = () => {
//         console.log('WebSocket connection established');
//         setWebSocketConnected(true);
//         setError(null);
//       };

//       sseRef.current.onmessage = (event) => {
//         try {
//           const message = JSON.parse(event.data);

//           if (message.event === 'connected') {
//             console.log('WebSocket connected successfully');
//             return;
//           }

//           if (message.event === 'order_update') {
//             const updatedOrder: Order = message.data.order;

//             if (!updatedOrder._id || !updatedOrder.createdAt) {
//               console.warn('Received invalid order payload:', updatedOrder);
//               loadOrders(false, true);
//               return;
//             }

//             setOrders((prev) => {
//               const exists = prev.some((o) => o._id === updatedOrder._id);

//               let updatedOrders;
//               if (exists) {
//                 updatedOrders = prev.map((o) =>
//                   o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o
//                 );
//               } else {
//                 if (!silentMode) {
//                   playNotificationSound();
//                 }

//                 if (!minimizeNotifications) {
//                   setHasNewOrder(true);
//                   setNotificationCount((prevCount) => prevCount + 1);
//                   setNewOrders((prevOrders) => [updatedOrder, ...prevOrders]);
//                 }

//                 updatedOrders = [updatedOrder, ...prev];
//               }

//               return updatedOrders.sort(
//                 (a, b) =>
//                   new Date(b.createdAt).getTime() -
//                   new Date(a.createdAt).getTime()
//               );
//             });

//             lastUpdateRef.current = new Date();
//           }
//           if (message.event === 'prescription_submitted') {
//             console.log('Prescription submitted:', message.data);
//             if (!silentMode) {
//               playNotificationSound();
//             }
//             if (!minimizeNotifications) {
//               setHasNewOrder(true);
//               setNotificationCount((prevCount) => prevCount + 1);
//               setNewOrders((prevOrders) => [message.data, ...prevOrders]);
//             }
//           }
//         } catch (err) {
//           console.error('WebSocket message parse error:', err);
//         }
//       };

//       sseRef.current.onclose = () => {
//         console.log('WebSocket connection closed');
//         setWebSocketConnected(false);

//         reconnectTimeoutRef.current = setTimeout(() => {
//           console.log('Attempting to reconnect WebSocket...');
//           setupWebSocket();
//         }, 3000);
//       };

//       sseRef.current.onerror = (error) => {
//         console.error('WebSocket connection error:', error);
//         setWebSocketConnected(false);

//         reconnectTimeoutRef.current = setTimeout(() => {
//           console.log('Attempting to reconnect WebSocket...');
//           setupWebSocket();
//         }, 3000);
//       };
//     } catch (err) {
//       console.error('WebSocket setup error:', err);
//       if (!silentMode) {
//         setError('Failed to set up real-time updates');
//       }
//     }
//   }, [silentMode, minimizeNotifications, loadOrders]);

//   useEffect(() => {
//     if (autoRefreshInterval > 0) {
//       autoRefreshRef.current = setInterval(() => {
//         loadOrders(false, true);
//       }, autoRefreshInterval * 1000);
//     }

//     return () => {
//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//       }
//     };
//   }, [autoRefreshInterval, loadOrders]);

//   useEffect(() => {
//     loadOrders();
//     loadRiders();
//     setupWebSocket();

//     return () => {
//       if (sseRef.current) {
//         sseRef.current.close();
//         sseRef.current = null;
//       }

//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//         reconnectTimeoutRef.current = null;
//       }

//       if (autoRefreshRef.current) {
//         clearInterval(autoRefreshRef.current);
//       }
//     };
//   }, [loadOrders, loadRiders, setupWebSocket]);

//   const handleLogout = async () => {
//     try {
//       if (sseRef.current) {
//         sseRef.current.close();
//         sseRef.current = null;
//       }

//       await logout();
//       router.push('/pages/signin');
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   const handleRefresh = () => {
//     loadOrders(true);
//   };

//   const handleAction = async (
//     orderId: string,
//     action: 'accept' | 'reject' | 'en_route' | 'delivered' | 'assign-rider' | 'verify-payment',
//     riderId?: string,
//     paymentDetails?: string
//   ) => {
//     try {
//       setError(null);

//       const actionKey = `${orderId}-${action}${riderId ? `-${riderId}` : ''}${paymentDetails ? `-verify` : ''}`;
//       setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

//       if (action === 'assign-rider' && riderId) {
//         await assignRider(orderId, riderId);
//       } else if (action === 'accept' || action === 'reject') {
//         await updateOrderStatus(orderId, action);
//       } else if (action === 'verify-payment' && paymentDetails) {
//         await verifyPayment(orderId, paymentDetails);
//       } else {
//         setError(`Action ${action} is not supported for sellers`);
//       }

//       await loadOrders(false, true);
//     } catch (err) {
//       const axiosError = err as AxiosError<ApiErrorResponse>;
//       console.error(`Error handling action ${action} for order ${orderId}:`, {
//         message: axiosError.message,
//         response: axiosError.response?.data,
//         status: axiosError.response?.status,
//       });
//       setError(axiosError.response?.data?.message || `Failed to ${action === 'assign-rider' ? 'assign rider to' : action === 'verify-payment' ? 'verify payment for' : action} order`);
//     } finally {
//       const actionKey = `${orderId}-${action}${riderId ? `-${riderId}` : ''}${paymentDetails ? `-verify` : ''}`;
//       setActionLoading((prev) => {
//         const newState = { ...prev };
//         delete newState[actionKey];
//         return newState;
//       });
//     }
//   };

//   const handleNotificationClick = () => {
//     setShowNotifications(!showNotifications);
//     if (hasNewOrder) {
//       setHasNewOrder(false);
//       setNotificationCount(0);
//     }
//   };

//   const handleNotificationClear = () => {
//     setNewOrders([]);
//     setNotificationCount(0);
//     setHasNewOrder(false);
//   };

//   const term = (searchTerm ?? '').toLowerCase();

//   const filteredOrders = orders.filter((order) => {
//     const id = String(order._id ?? '').toLowerCase();
//     const name = String(order.customerInfo?.name ?? '').toLowerCase();
//     const status = String(order.status ?? '').toLowerCase();
//     const filter = String(filterStatus ?? '').toLowerCase();

//     const matchesSearch = id.includes(term) || name.includes(term);
//     const matchesFilter = filter === 'all' || status === filter;

//     return matchesSearch && matchesFilter;
//   });

//   const ordersByDate: { [key: string]: Order[] } = {};
//   filteredOrders.forEach((order) => {
//     const date = new Date(order.createdAt).toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//     if (!ordersByDate[date]) {
//       ordersByDate[date] = [];
//     }
//     ordersByDate[date].push(order);
//   });

//   const stats = {
//     total: orders.length,
//     accepted: orders.filter((o) => o.status === 'accepted').length,
//     rejected: orders.filter((o) => o.status === 'rejected').length,
//     processing: orders.filter((o) => o.status === 'processing').length,
//     pending: orders.filter((o) => o.status === 'pending').length,
//   };

//   if (loading && !refreshing) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//           <p className="text-slate-600 text-lg">Loading your dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       <Navbar />

//       {/* {showLiveIndicator && (
//         <div
//           className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
//             webSocketConnected
//               ? 'px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs'
//               : 'px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs animate-pulse'
//           }`}
//         >
//           <div className="flex items-center space-x-2">
//             <div
//               className={`w-2 h-2 rounded-full ${webSocketConnected ? 'bg-green-500' : 'bg-yellow-500'}`}
//             ></div>
//             <span>{webSocketConnected ? 'Live' : 'Connecting...'}</span>
//             <span className="text-xs opacity-60">
//               Updated {Math.floor((new Date().getTime() - lastUpdateRef.current.getTime()) / 1000)}s ago
//             </span>
//           </div>
//         </div>
//       )} */}

//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <div className="flex justify-between items-center mb-6">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2 bg-white/80 rounded-lg p-2 border border-white/20">
//               <button
//                 onClick={() => setSilentMode(!silentMode)}
//                 className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
//                   silentMode
//                     ? 'bg-blue-100 text-blue-700'
//                     : 'text-slate-600 hover:bg-slate-100'
//                 }`}
//                 title={silentMode ? 'Silent mode on - minimal interruptions' : 'Click to enable silent mode'}
//               >
//                 {silentMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                 <span>{silentMode ? 'Silent' : 'Normal'}</span>
//               </button>

//               {/* <select
//                 value={autoRefreshInterval}
//                 onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
//                 className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
//                 title="Auto-refresh interval"
//               >
//                 <option value={0}>No auto-refresh</option>
//                 <option value={15}>15s refresh</option>
//                 <option value={30}>30s refresh</option>
//                 <option value={60}>1min refresh</option>
//                 <option value={120}>2min refresh</option>
//               </select> */}
//             </div>
//           </div>

//           <div className="relative">
//             <button
//               onClick={handleNotificationClick}
//               className={`relative p-3 rounded-full transition-all duration-300 ${
//                 hasNewOrder
//                   ? 'bg-blue-100 ring-2 ring-blue-400' + (silentMode ? '' : ' animate-pulse')
//                   : 'bg-white hover:bg-slate-100'
//               }`}
//             >
//               <Bell className={`w-6 h-6 ${hasNewOrder ? 'text-blue-600' : 'text-slate-600'}`} />
//               {notificationCount > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
//                   {notificationCount > 99 ? '99+' : notificationCount}
//                 </span>
//               )}
//             </button>

//             {showNotifications && (
//               <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-slate-200">
//                 <div className="p-4 border-b border-slate-100 flex justify-between items-center">
//                   <h3 className="font-semibold text-slate-700">Notifications</h3>
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => setMinimizeNotifications(!minimizeNotifications)}
//                       className="text-xs text-slate-500 hover:text-slate-700"
//                       title={minimizeNotifications ? 'Show all notifications' : 'Minimize notifications'}
//                     >
//                       {minimizeNotifications ? 'Show all' : 'Minimize'}
//                     </button>
//                     {newOrders.length > 0 && (
//                       <button
//                         onClick={handleNotificationClear}
//                         className="text-xs text-blue-600 hover:text-blue-800"
//                       >
//                         Clear all
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 <div className="max-h-96 overflow-y-auto">
//                   {newOrders.length > 0 ? (
//                     newOrders.slice(0, 20).map((order) => (
//                       <div
//                         key={order._id}
//                         className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
//                         onClick={() => {
//                           setSelectedOrder(order);
//                           setShowNotifications(false);
//                         }}
//                       >
//                         <div className="flex items-start space-x-3">
//                           <div className="bg-blue-100 p-2 rounded-full">
//                             <Package className="w-4 h-4 text-blue-600" />
//                           </div>
//                           <div className="flex-1">
//                             <p className="font-medium text-slate-800">New Order</p>
//                             <p className="text-sm text-slate-600">#{order._id?.slice(-6)} - {order.customerInfo?.name}</p>
//                             <p className="text-xs text-slate-500 mt-1">
//                               {new Date(order.createdAt).toLocaleTimeString()}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="p-6 text-center text-slate-500">
//                       <Bell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
//                       <p>No new notifications</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-500 text-sm font-medium">Total Orders</p>
//                 <p className="text-3xl font-bold text-slate-800 flex items-center">
//                   {refreshing ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.total}
//                 </p>
//               </div>
//               <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
//                 <Package className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-500 text-sm font-medium">Pending</p>
//                 <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
//               </div>
//               <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
//                 <Clock className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-500 text-sm font-medium">Processing</p>
//                 <p className="text-3xl font-bold text-slate-800">{stats.processing}</p>
//               </div>
//               <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
//                 <Loader2 className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-slate-500 text-sm font-medium">Completed</p>
//                 <p className="text-3xl font-bold text-slate-800">{stats.accepted}</p>
//               </div>
//               <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
//                 <TrendingUp className="w-6 h-6 text-white" />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search orders by ID or customer name..."
//                 className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//             <div className="relative">
//               <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//               <select
//                 className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
//                 value={filterStatus}
//                 onChange={(e) => setFilterStatus(e.target.value)}
//               >
//                 <option value="all">All Status</option>
//                 <option value="pending">Pending</option>
//                 <option value="processing">Processing</option>
//                 <option value="accepted">Accepted</option>
//                 <option value="rejected">Rejected</option>
//                 <option value="assigned">Assigned</option>
//                 <option value="in-transit">In Transit</option>
//                 <option value="delivered">Delivered</option>
//               </select>
//             </div>

//             <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1">
//               <button
//                 onClick={() => setViewMode('cards')}
//                 className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
//               >
//                 <Grid className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => setViewMode('table')}
//                 className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
//               >
//                 <Table className="w-5 h-5" />
//               </button>
//             </div>

//             <button
//               onClick={handleRefresh}
//               disabled={refreshing}
//               className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
//               <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
//                 <span className="text-white text-xs font-bold">!</span>
//               </div>
//               <p className="text-red-700">{error}</p>
//             </div>
//             <button
//               onClick={() => setError(null)}
//               className="text-red-500 hover:text-red-700 transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         )}

//         {ridersLoading && (
//           <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center space-x-3">
//             <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
//             <p className="text-blue-700">Loading riders...</p>
//           </div>
//         )}

//         {viewMode === 'cards' &&
//           Object.entries(ordersByDate).map(([date, ordersForDate]) => (
//             <div key={date} className="mb-12">
//               <h2 className="text-xl font-semibold text-slate-700 mb-4">{date}</h2>
//               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//                 {ordersForDate.map((order) => (
//                   <div key={order._id} className="transform hover:scale-105 transition-all duration-300">
//                     <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
//                       <OrderCard
//                         order={order}
//                         onView={() => setSelectedOrder(order)}
//                         onAction={handleAction}
//                         isRider={false}
//                         actionLoading={actionLoading}
//                         riders={riders}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}

//         {viewMode === 'table' && (
//           <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
//             <OrderTable
//               orders={filteredOrders}
//               onView={(order) => setSelectedOrder(order)}
//               onAction={handleAction}
//               actionLoading={actionLoading}
//               riders={riders}
//             />
//           </div>
//         )}

//         {filteredOrders.length === 0 && !loading && !refreshing && (
//           <div className="text-center py-16">
//             <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
//               <Package className="w-12 h-12 text-slate-400" />
//             </div>
//             <h3 className="text-xl font-semibold text-slate-600 mb-2">No orders found</h3>
//             <p className="text-slate-500">
//               {searchTerm || filterStatus !== 'all'
//                 ? 'Try adjusting your search or filter criteria'
//                 : 'Orders will appear here once customers start placing them'}
//             </p>
//           </div>
//         )}

//         {refreshing && (
//           <div className="text-center py-8">
//             <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
//             <p className="text-slate-600">Refreshing orders...</p>
//           </div>
//         )}
//       </div>

//       {selectedOrder && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="transform transition-all duration-300 scale-100">
//             <OrderModal
//               order={selectedOrder}
//               onClose={() => setSelectedOrder(null)}
//               riders={riders}
//               onAssignRider={handleAction}
//               isRider={false}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAdminOrders, updateOrderStatus, fetchRiders, assignRider, verifyPayment, shareTrackingLink } from '../../lib/api2';
import { Order, Rider } from '../../types/order';
import OrderCard from './OrderCard';
import OrderTable from './OrderTable';
import OrderModal from './OrderModal';
import { Bell, Search, Filter, LogOut, Package, TrendingUp, Users, Clock, Loader2, RefreshCw, X, Grid, Table, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar2';

interface ApiErrorResponse {
  message?: string;
}

export default function SellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [ridersLoading, setRidersLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [webSocketConnected, setWebSocketConnected] = useState<boolean>(false);
  const [hasNewOrder, setHasNewOrder] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [silentMode, setSilentMode] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);
  const [showLiveIndicator, setShowLiveIndicator] = useState<boolean>(true);
  const [minimizeNotifications, setMinimizeNotifications] = useState<boolean>(false);

  const router = useRouter();
  const { user, logout } = useAuth();
  const sseRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrdersCount = useRef<number>(0);
  const notificationAudioPlayed = useRef<boolean>(false);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Date>(new Date());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification-sound.mp3');
    }
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current && !silentMode) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = silentMode ? 0.1 : 0.5;
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    }
  };

  const loadOrders = useCallback(async (showRefreshing = false, isBackgroundUpdate = false) => {
    try {
      if (showRefreshing && !isBackgroundUpdate) {
        setRefreshing(true);
      } else if (!isBackgroundUpdate) {
        setLoading(true);
      }

      const data = await fetchAdminOrders();
      const sortedOrders = data.sort((a: Order, b: Order) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (orders.length > 0 && sortedOrders.length > orders.length && !isBackgroundUpdate) {
        const newOrderIds = sortedOrders.map(o => o._id);
        const currentOrderIds = orders.map(o => o._id);
        const actualNewOrders = sortedOrders.filter(o => !currentOrderIds.includes(o._id));

        if (actualNewOrders.length > 0) {
          setNewOrders(prev => [...actualNewOrders, ...prev]);

          if (!minimizeNotifications) {
            setNotificationCount(prev => prev + actualNewOrders.length);
            setHasNewOrder(true);
          }

          if (previousOrdersCount.current > 0 && !silentMode) {
            playNotificationSound();
          }
        }
      }

      previousOrdersCount.current = sortedOrders.length;
      setOrders(sortedOrders);
      setError(null);
      lastUpdateRef.current = new Date();
    } catch (err) {
      console.error('Error in loadOrders:', err);
      if (!isBackgroundUpdate) {
        setError('Failed to load orders');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orders.length, silentMode, minimizeNotifications]);

  const loadRiders = useCallback(async () => {
    try {
      setRidersLoading(true);
      const data = await fetchRiders();
      setRiders(data);
    } catch (err) {
      console.error('Error in loadRiders:', err);
      setError('Failed to load riders');
    } finally {
      setRidersLoading(false);
    }
  }, []);

  const setupWebSocket = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for WebSocket');
        if (!silentMode) {
          setError('Authentication required for real-time updates');
        }
        return;
      }

      sseRef.current = new WebSocket(`wss://ollan-websocket.fly.dev?token=${encodeURIComponent(token)}`);

      sseRef.current.onopen = () => {
        console.log('WebSocket connection established');
        setWebSocketConnected(true);
        setError(null);
      };

      sseRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.event === 'connected') {
            console.log('WebSocket connected successfully');
            return;
          }

          if (message.event === 'order_update') {
            const updatedOrder: Order = message.data.order;

            if (!updatedOrder._id || !updatedOrder.createdAt) {
              console.warn('Received invalid order payload:', updatedOrder);
              loadOrders(false, true);
              return;
            }

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

              return updatedOrders.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );
            });

            // Handle tracking_shared event
            if (message.data.type === 'tracking_shared') {
              setSuccessMessage(`Tracking link sent for order #${updatedOrder._id.slice(-6)}`);
            }

            lastUpdateRef.current = new Date();
          }
          if (message.event === 'prescription_submitted') {
            console.log('Prescription submitted:', message.data);
            if (!silentMode) {
              playNotificationSound();
            }
            if (!minimizeNotifications) {
              setHasNewOrder(true);
              setNotificationCount((prevCount) => prevCount + 1);
              setNewOrders((prevOrders) => [message.data, ...prevOrders]);
            }
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      sseRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setWebSocketConnected(false);

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          setupWebSocket();
        }, 3000);
      };

      sseRef.current.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setWebSocketConnected(false);

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          setupWebSocket();
        }, 3000);
      };
    } catch (err) {
      console.error('WebSocket setup error:', err);
      if (!silentMode) {
        setError('Failed to set up real-time updates');
      }
    }
  }, [silentMode, minimizeNotifications, loadOrders]);

  useEffect(() => {
    if (autoRefreshInterval > 0) {
      autoRefreshRef.current = setInterval(() => {
        loadOrders(false, true);
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefreshInterval, loadOrders]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadOrders();
    loadRiders();
    setupWebSocket();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [loadOrders, loadRiders, setupWebSocket]);

  const handleLogout = async () => {
    try {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }

      await logout();
      router.push('/pages/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = () => {
    loadOrders(true);
  };

  const handleAction = async (
    orderId: string,
    action: 'accept' | 'reject' | 'en_route' | 'delivered' | 'assign-rider' | 'verify-payment' | 'share-tracking',
    riderId?: string,
    paymentDetails?: string
  ) => {
    try {
      setError(null);
      setSuccessMessage(null);

      const actionKey = `${orderId}-${action}${riderId ? `-${riderId}` : ''}${action === 'verify-payment' ? '-verify' : ''}${action === 'share-tracking' ? '-share' : ''}`;
      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

      if (action === 'assign-rider' && riderId) {
        await assignRider(orderId, riderId);
      } else if (action === 'accept' || action === 'reject') {
        await updateOrderStatus(orderId, action);
      } else if (action === 'verify-payment' && paymentDetails) {
        await verifyPayment(orderId, paymentDetails);
      } else if (action === 'share-tracking') {
        await shareTrackingLink(orderId);
        setSuccessMessage(`Tracking link sent for order #${orderId.slice(-6)}`);
      } else {
        setError(`Action ${action} is not supported for sellers`);
      }

      await loadOrders(false, true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error(`Error handling action ${action} for order ${orderId}:`, {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
      });
      setError(
        axiosError.response?.data?.message ||
          `Failed to ${action === 'assign-rider' ? 'assign rider to' : action === 'verify-payment' ? 'verify payment for' : action === 'share-tracking' ? 'share tracking link for' : action} order`
      );
    } finally {
      const actionKey = `${orderId}-${action}${riderId ? `-${riderId}` : ''}${action === 'verify-payment' ? '-verify' : ''}${action === 'share-tracking' ? '-share' : ''}`;
      setActionLoading((prev) => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (hasNewOrder) {
      setHasNewOrder(false);
      setNotificationCount(0);
    }
  };

  const handleNotificationClear = () => {
    setNewOrders([]);
    setNotificationCount(0);
    setHasNewOrder(false);
  };

  const term = (searchTerm ?? '').toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const id = String(order._id ?? '').toLowerCase();
    const name = String(order.customerInfo?.name ?? '').toLowerCase();
    const status = String(order.status ?? '').toLowerCase();
    const filter = String(filterStatus ?? '').toLowerCase();

    const matchesSearch = id.includes(term) || name.includes(term);
    const matchesFilter = filter === 'all' || status === filter;

    return matchesSearch && matchesFilter;
  });

  const ordersByDate: { [key: string]: Order[] } = {};
  filteredOrders.forEach((order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!ordersByDate[date]) {
      ordersByDate[date] = [];
    }
    ordersByDate[date].push(order);
  });

  const stats = {
    total: orders.length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    pending: orders.filter((o) => o.status === 'pending').length,
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
      <Navbar />

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 text-green-700 border border-green-200 rounded-lg p-4 flex items-center space-x-2 max-w-md">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/80 rounded-lg p-2 border border-white/20">
              <button
                onClick={() => setSilentMode(!silentMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  silentMode
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={silentMode ? 'Silent mode on - minimal interruptions' : 'Click to enable silent mode'}
              >
                {silentMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{silentMode ? 'Silent' : 'Normal'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className={`relative p-3 rounded-full transition-all duration-300 ${
                hasNewOrder
                  ? 'bg-blue-100 ring-2 ring-blue-400' + (silentMode ? '' : ' animate-pulse')
                  : 'bg-white hover:bg-slate-100'
              }`}
            >
              <Bell className={`w-6 h-6 ${hasNewOrder ? 'text-blue-600' : 'text-slate-600'}`} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setMinimizeNotifications(!minimizeNotifications)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                      title={minimizeNotifications ? 'Show all notifications' : 'Minimize notifications'}
                    >
                      {minimizeNotifications ? 'Show all' : 'Minimize'}
                    </button>
                    {newOrders.length > 0 && (
                      <button
                        onClick={handleNotificationClear}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {newOrders.length > 0 ? (
                    newOrders.slice(0, 20).map((order) => (
                      <div
                        key={order._id}
                        className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Package className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">New Order</p>
                            <p className="text-sm text-slate-600">#{order._id?.slice(-6)} - {order.customerInfo?.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <Bell className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p>No new notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Orders</p>
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
                <p className="text-slate-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Processing</p>
                <p className="text-3xl font-bold text-slate-800">{stats.processing}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-slate-800">{stats.accepted}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="assigned">Assigned</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Table className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
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

        {ridersLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-700">Loading riders...</p>
          </div>
        )}

        {viewMode === 'cards' &&
          Object.entries(ordersByDate).map(([date, ordersForDate]) => (
            <div key={date} className="mb-12">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">{date}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ordersForDate.map((order) => (
                  <div key={order._id} className="transform hover:scale-105 transition-all duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                      <OrderCard
                        order={order}
                        onView={() => setSelectedOrder(order)}
                        onAction={handleAction}
                        isRider={false}
                        actionLoading={actionLoading}
                        riders={riders}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {viewMode === 'table' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
            <OrderTable
              orders={filteredOrders}
              onView={(order) => setSelectedOrder(order)}
              onAction={handleAction}
              actionLoading={actionLoading}
              riders={riders}
            />
          </div>
        )}

        {filteredOrders.length === 0 && !loading && !refreshing && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No orders found</h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Orders will appear here once customers start placing them'}
            </p>
          </div>
        )}

        {refreshing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-600">Refreshing orders...</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="transform transition-all duration-300 scale-100">
            <OrderModal
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              riders={riders}
              onAssignRider={handleAction}
              isRider={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
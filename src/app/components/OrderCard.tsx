

// 'use client';

// import { useState } from 'react';
// import { Order, Rider } from '../../types/order';
// import { Package, Eye, Check, X, MapPin, DollarSign, Truck, Users, CheckCircle2, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';

// interface OrderCardProps {
//   order: Order;
//   onView: () => void;
//   onAction: (
//     orderId: string,
//     action: 'accept' | 'reject' | 'en_route' | 'delivered' | 'assign-rider' | 'verify-payment',
//     riderId?: string,
//     paymentDetails?: string
//   ) => Promise<void>;
//   isRider: boolean;
//   actionLoading: { [key: string]: boolean };
//   riders?: Rider[];
// }

// export default function OrderCard({ order, onView, onAction, isRider, actionLoading, riders = [] }: OrderCardProps) {
//   const [paymentDetails, setPaymentDetails] = useState('');
//   const [showRiderDropdown, setShowRiderDropdown] = useState(false);
//   const [expanded, setExpanded] = useState(false);

//   const getStatusColor = (status: string | undefined) => {
//     switch (status) {
//       case 'pending':
//         return 'bg-amber-100 text-amber-700 border-amber-200';
//       case 'processing':
//         return 'bg-blue-100 text-blue-700 border-blue-200';
//       case 'accepted':
//         return 'bg-emerald-100 text-emerald-700 border-emerald-200';
//       case 'rejected':
//         return 'bg-red-100 text-red-700 border-red-200';
//       case 'assigned':
//         return 'bg-yellow-100 text-yellow-700 border-yellow-200';
//       case 'en_route':
//         return 'bg-blue-100 text-blue-700 border-blue-200';
//       case 'delivered':
//         return 'bg-green-100 text-green-700 border-green-200';
//       default:
//         return 'bg-slate-100 text-slate-700 border-slate-200';
//     }
//   };

//   const currentStatus = isRider ? (order.deliveryStatus || 'assigned') : order.status;

//   const handleVerifyPayment = async () => {
//     if (!paymentDetails.trim()) {
//       alert('Please enter payment details');
//       return;
//     }
//     await onAction(order._id, 'verify-payment', undefined, paymentDetails);
//     setPaymentDetails('');
//   };

//   const handleAssignRider = async (riderId: string) => {
//     await onAction(order._id, 'assign-rider', riderId);
//     setShowRiderDropdown(false);
//   };

//   const actionKey = (action: string, riderId?: string) =>
//     `${order._id}-${action}${riderId ? `-${riderId}` : ''}${action === 'verify-payment' ? '-verify' : ''}`;

//   const canAssignRider = !isRider && order.status === 'accepted' && !order.rider;
//   const canAcceptReject = !isRider && order.status === 'processing';
//   const needsPaymentVerification = !isRider && order.status === 'pending';

//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center space-x-3">
//           <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
//             <Package className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <h3 className="text-lg font-bold text-slate-800">Order #{order._id.slice(-6)}</h3>
//             <p className="text-slate-500 text-sm">
//               {new Date(order.createdAt).toLocaleTimeString()}
//             </p>
//           </div>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(currentStatus)}`}>
//           {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
//         </span>
//       </div>

//       {/* Order Details */}
//       <div className="space-y-3 mb-6">
//         <div className="flex items-center space-x-3">
//           <Users className="w-4 h-4 text-slate-400" />
//           <div>
//             <p className="text-sm text-slate-500">Customer</p>
//             <p className="font-semibold text-slate-800">{order.customerInfo.name}</p>
//           </div>
//         </div>
        
//         {expanded && (
//           <>
//             <div className="flex items-center space-x-3">
//               <MapPin className="w-4 h-4 text-slate-400" />
//               <div>
//                 <p className="text-sm text-slate-500">Pickup Location</p>
//                 <p className="font-semibold text-slate-800">{order.customerInfo.pickupLocation}</p>
//               </div>
//             </div>
//             <div className="flex items-center space-x-3">
//               <MapPin className="w-4 h-4 text-slate-400" />
//               <div>
//                 <p className="text-sm text-slate-500">Transaction Number</p>
//                 <p className="font-semibold text-slate-800">{order.customerInfo.transactionNumber}</p>
//               </div>
//             </div>
//             {order.rider?.name && (
//               <div className="flex items-center space-x-3">
//                 <Users className="w-4 h-4 text-slate-400" />
//                 <div>
//                   <p className="text-sm text-slate-500">Assigned Rider</p>
//                   <p className="font-semibold text-slate-800">{order.rider.name}</p>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
        
//         <div className="flex items-center space-x-3">
//           <DollarSign className="w-4 h-4 text-slate-400" />
//           <div>
//             <p className="text-sm text-slate-500">Total Amount</p>
//             <p className="font-bold text-slate-800 text-lg">₦{order.totalAmount.toLocaleString()}</p>
//           </div>
//         </div>
//       </div>

//       {/* Expand/Collapse Button */}
//       <button
//         onClick={() => setExpanded(!expanded)}
//         className="w-full text-center text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center justify-center"
//       >
//         {expanded ? (
//           <>
//             <ChevronUp className="w-4 h-4 mr-1" />
//             Show Less
//           </>
//         ) : (
//           <>
//             <ChevronDown className="w-4 h-4 mr-1" />
//             Show More Details
//           </>
//         )}
//       </button>

//       {/* Action Buttons */}
//       <div className="space-y-3">
//         {/* Step 1: Payment Verification */}
//         {needsPaymentVerification && (
//           <div className="space-y-2">
//            <div className="flex gap-4">
//   <label className="flex items-center text-sm">
//     <input
//       type="radio"
//       name="paymentStatus"
//       value="Verified"
//       checked={paymentDetails === "Verified"}
//       onChange={(e) => setPaymentDetails(e.target.value)}
//       className="mr-2 focus:ring-yellow-500"
//     />
//     Verified
//   </label>
//   <label className="flex items-center text-sm">
//     <input
//       type="radio"
//       name="paymentStatus"
//       value="Not Verified"
//       checked={paymentDetails === "Not Verified"}
//       onChange={(e) => setPaymentDetails(e.target.value)}
//       className="mr-2 focus:ring-yellow-500"
//     />
//     Not Verified
//   </label>
// </div>
//             <button
//               onClick={handleVerifyPayment}
//               className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center text-sm"
//               disabled={actionLoading[actionKey('verify-payment')] || !paymentDetails.trim()}
//             >
//               <CheckCircle2 className="w-4 h-4" />
//               <span>{actionLoading[actionKey('verify-payment')] ? 'Verifying...' : 'Verify Payment'}</span>
//             </button>
//           </div>
//         )}

//         {/* Step 2: Accept/Reject Order */}
//         {canAcceptReject && (
//           <div className="flex gap-2">
//             <button
//               onClick={() => onAction(order._id, 'accept')}
//               className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center text-sm"
//               disabled={actionLoading[actionKey('accept')]}
//             >
//               <Check className="w-4 h-4" />
//               <span>{actionLoading[actionKey('accept')] ? 'Processing...' : 'Accept'}</span>
//             </button>
//             <button
//               onClick={() => onAction(order._id, 'reject')}
//               className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center text-sm"
//               disabled={actionLoading[actionKey('reject')]}
//             >
//               <X className="w-4 h-4" />
//               <span>{actionLoading[actionKey('reject')] ? 'Processing...' : 'Reject'}</span>
//             </button>
//           </div>
//         )}

//         {/* Step 3: Assign Rider */}
//         {canAssignRider && (
//           <div className="relative">
//             <button
//               onClick={() => setShowRiderDropdown(!showRiderDropdown)}
//               className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full justify-center text-sm"
//             >
//               <UserPlus className="w-4 h-4" />
//               <span>Assign Rider</span>
//             </button>
            
//             {showRiderDropdown && (
//               <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
//                 {riders.length > 0 ? (
//                   riders.map((rider) => (
//                     <button
//                       key={rider._id}
//                       onClick={() => handleAssignRider(rider._id)}
//                       className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm"
//                       disabled={actionLoading[actionKey('assign-rider', rider._id)]}
//                     >
//                       {rider.name}
//                       {actionLoading[actionKey('assign-rider', rider._id)] && ' (Assigning...)'}
//                     </button>
//                   ))
//                 ) : (
//                   <div className="px-4 py-2 text-slate-500 text-sm">No riders available</div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* View Details Button */}
//         <button
//           onClick={onView}
//           className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors w-full justify-center text-sm"
//         >
//           <Eye className="w-4 h-4" />
//           <span>View Full Details</span>
//         </button>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { Order, Rider } from '../../types/order';
import { Package, Eye, Check, X, MapPin, DollarSign, Truck, Users, CheckCircle2, UserPlus, ChevronDown, ChevronUp, Share2 } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onView: () => void;
  onAction: (
    orderId: string,
    action: 'accept' | 'reject' | 'en_route' | 'delivered' | 'assign-rider' | 'verify-payment' | 'share-tracking',
    riderId?: string,
    paymentDetails?: string
  ) => Promise<void>;
  isRider: boolean;
  actionLoading: { [key: string]: boolean };
  riders?: Rider[];
}

export default function OrderCard({ order, onView, onAction, isRider, actionLoading, riders = [] }: OrderCardProps) {
  const [paymentDetails, setPaymentDetails] = useState('');
  const [showRiderDropdown, setShowRiderDropdown] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
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

  const handleAssignRider = async (riderId: string) => {
    await onAction(order._id, 'assign-rider', riderId);
    setShowRiderDropdown(false);
  };

  const handleShareTracking = async () => {
    await onAction(order._id, 'share-tracking');
  };

  const actionKey = (action: string, riderId?: string) =>
    `${order._id}-${action}${riderId ? `-${riderId}` : ''}${action === 'verify-payment' ? '-verify' : ''}${action === 'share-tracking' ? '-share' : ''}`;

  const canAssignRider = !isRider && order.status === 'accepted' && !order.rider;
  const canAcceptReject = !isRider && order.status === 'processing';
  const needsPaymentVerification = !isRider && order.status === 'pending';
  const canShareTracking = !isRider && ['processing', 'accepted', 'en_route', 'delivered'].includes(order.status);

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
            <p className="text-slate-500 text-sm">
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
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
        
        {expanded && (
          <>
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
                <p className="text-sm text-slate-500">Transaction Number</p>
                <p className="font-semibold text-slate-800">{order.customerInfo.transactionNumber}</p>
              </div>
            </div>
            {order.rider?.name && (
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Assigned Rider</p>
                  <p className="font-semibold text-slate-800">{order.rider.name}</p>
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="flex items-center space-x-3">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-500">Total Amount</p>
            <p className="font-bold text-slate-800 text-lg">₦{order.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center justify-center"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4 mr-1" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-1" />
            Show More Details
          </>
        )}
      </button>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Step 1: Payment Verification */}
        {needsPaymentVerification && (
          <div className="space-y-2">
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
            <button
              onClick={handleVerifyPayment}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center text-sm"
              disabled={actionLoading[actionKey('verify-payment')] || !paymentDetails.trim()}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLoading[actionKey('verify-payment')] ? 'Verifying...' : 'Verify Payment'}</span>
            </button>
          </div>
        )}

        {/* Step 2: Accept/Reject Order */}
        {canAcceptReject && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction(order._id, 'accept')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center text-sm"
              disabled={actionLoading[actionKey('accept')]}
            >
              <Check className="w-4 h-4" />
              <span>{actionLoading[actionKey('accept')] ? 'Processing...' : 'Accept'}</span>
            </button>
            <button
              onClick={() => onAction(order._id, 'reject')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center text-sm"
              disabled={actionLoading[actionKey('reject')]}
            >
              <X className="w-4 h-4" />
              <span>{actionLoading[actionKey('reject')] ? 'Processing...' : 'Reject'}</span>
            </button>
          </div>
        )}

        {/* Step 3: Assign Rider */}
        {canAssignRider && (
          <div className="relative">
            <button
              onClick={() => setShowRiderDropdown(!showRiderDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full justify-center text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Rider</span>
            </button>
            
            {showRiderDropdown && (
              <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                {riders.length > 0 ? (
                  riders.map((rider) => (
                    <button
                      key={rider._id}
                      onClick={() => handleAssignRider(rider._id)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors text-sm"
                      disabled={actionLoading[actionKey('assign-rider', rider._id)]}
                    >
                      {rider.name}
                      {actionLoading[actionKey('assign-rider', rider._id)] && ' (Assigning...)'}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-slate-500 text-sm">No riders available</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Share Tracking Link */}
        {canShareTracking && (
          <button
            onClick={handleShareTracking}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center text-sm"
            disabled={actionLoading[actionKey('share-tracking')]}
          >
            <Share2 className="w-4 h-4" />
            <span>{actionLoading[actionKey('share-tracking')] ? 'Sharing...' : 'Share Tracking Link'}</span>
          </button>
        )}

        {/* View Details Button */}
        <button
          onClick={onView}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors w-full justify-center text-sm"
        >
          <Eye className="w-4 h-4" />
          <span>View Full Details</span>
        </button>
      </div>
    </div>
  );
}
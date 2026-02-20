export interface Product {
  _id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  productId: Product;
  quantity: number;
  price: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  deliveryOption: string;
  pickupLocation: string;
  estimatedDelivery: string;
}


export interface Order {
  paymentVerified: boolean;
  _id: string;
  //   status: 'pending' | 'processing' | 'accepted' | 'rejected' | 'assigned' | 'en_route' | 'delivered';
  // deliveryStatus?: 'assigned' | 'en_route' | 'delivered';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  paymentVerified?: boolean; // Indicates if payment is verified
    pickupLocation: string;
    deliveryOption?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  estimatedDelivery?: string;
  transactionNumber: string; // New field for transaction number
  
  };
  items: {
    productId: { _id: string; name: string };
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  prescriptionUrl?: string;
  createdAt: string;
  updatedAt: string;
  paymentReference?: string;
  deliveryFee?: number;
  user?: {
    name: string;
    email: string;
  };
  seller?: {
    name: string;
    email: string;
  };
  rider?: {
    name: string;
    email: string;
    _id: any
  };
  estimatedDelivery?: string;
  deliveryOption?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
   paymentDetails?: string;
  customerName?: string;
  riderId?: string;
  riderName?: string;
  status: string; // e.g., 'pending', 'processing', 'accepted', 'rejected', 'cancelled'
  deliveryStatus: string; // e.g., 'pending', 'en_route', 'delivered'
}

export interface Rider {
  _id: string;
  name: string;
}

// In types/order.ts
export interface OrderCardProps {
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
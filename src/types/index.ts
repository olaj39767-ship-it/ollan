export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
  category?: string;
  createdAt: string;
  bundleOffers?: BundleOffer[]; // Add bundle offers to product

}



// Add these to your existing types
export interface BundleOffer {
  id: string;
  name: string;
  description: string;
  items: BundleItem[];
  discountPercentage: number;
  minQuantity: number;
}

export interface BundleItem {
  productId: string;
  requiredQuantity: number;
}



export interface CartItem {
  productId: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
}

export interface OrderItem {
  productId: Product;
  quantity: number;
  price: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface Order {
  _id: string;
  userId: User;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  prescriptionUrl?: string;
  paymentReference?: string;
  createdAt: string;
}
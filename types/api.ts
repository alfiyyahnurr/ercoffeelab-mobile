export interface Outlet {
  id: number;
  name: string;
  address: string;
  openHour?: string | null;
  closeHour?: string | null;
  isOpen: boolean;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  type: 'beverage' | 'food' | 'snack';
  price: number;
  description: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  badgeText?: string;
  gradient?: [string, string];
}

export interface CustomerProfile {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  points?: number;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface OrderItem {
  id: number;
  productNameSnapshot: string;
  qty: number;
  unitPrice: number;
  temperature?: string | null;
  sugar?: string | null;
  ice?: string | null;
}

export interface Order {
  id: number;
  orderNumber?: string;
  outletName?: string;
  fulfillmentType?: 'pickup' | 'delivery';
  deliveryAddress?: string | null;
  deliveryFee?: number;
  deliveryDistanceKm?: number | null;
  serviceFee?: number;
  paymentMethodName?: string | null;
  subtotal?: number;
  discount?: number;
  total: number;
  paymentStatus?: string;
  orderStatus?: string;
  createdAt?: string;
  items?: OrderItem[];
}

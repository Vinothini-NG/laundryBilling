export type Role =
  | 'PLATFORM_ADMIN'
  | 'SHOP_ADMIN'
  | 'BILLING_EXECUTIVE'
  | 'LAUNDRY_STAFF';

export type ServiceType = 'WASH' | 'IRON' | 'WASH_AND_IRON' | 'DRY_CLEAN';

export type OrderStatus =
  | 'CREATED'
  | 'RECEIVED'
  | 'WASHING'
  | 'DRYING'
  | 'IRONING'
  | 'QUALITY_CHECK'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type InvoiceStatus =
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'PENDING'
  | 'REFUNDED';

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
export type DiscountType = 'NONE' | 'FIXED' | 'PERCENTAGE';
export type GstMode = 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE';

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  shopId: string | null;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Service {
  id: string;
  itemName: string;
  serviceType: ServiceType;
  price: number;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  itemName: string;
  serviceType: ServiceType;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  grandTotal: number;
  amountPaid: number;
  balance: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  gstPercent: number;
  createdAt: string;
  customer?: Customer;
  items?: OrderItem[];
  invoice?: Invoice | null;
  assignedTo?: { id: string; name: string; email?: string } | null;
  shop?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    gstNumber?: string | null;
  };
}

export interface ShopDashboard {
  orders: { today: number; pending: number; delivered: number };
  revenue: {
    collectedToday: number;
    collectedLast30Days: number;
    outstanding: number;
  };
  customers: { newLast30Days: number };
  topServices: { itemName: string; quantity: number; revenue: number }[];
}

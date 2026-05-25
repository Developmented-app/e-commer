export interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  currency: 'USD' | 'KHR';
  role: 'admin' | 'user';
  apikey: string;
  status: 'active' | 'banned';
  referralsCount: number;
  referralEarnings: number;
  registeredAt: string;
  avatar?: string;
  autoDepositEnabled?: boolean;
  autoDepositThreshold?: number;
  autoDepositAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface SmmService {
  id: number;
  categoryId: string;
  name: string;
  ratePer1000: number; // in USD
  minOrder: number;
  maxOrder: number;
  description: string;
  provider: string; // e.g., "Auto API", "Main Provider"
  providerServiceId: number;
}

export interface Order {
  id: number;
  userId: number;
  username: string;
  serviceId: number;
  serviceName: string;
  categoryName: string;
  link: string;
  quantity: number;
  charge: number;
  startCounter: number;
  remains: number;
  status: 'pending' | 'processing' | 'completed' | 'canceled';
  createdAt: string;
}

export interface Transaction {
  id: string; // Invoice ID / Txn ID
  userId: number;
  username: string;
  type: 'deposit' | 'order_charge' | 'order_refund' | 'referral_payout';
  amount: number;
  currency: 'USD' | 'KHR';
  gateway: string; // 'KHQR (ABA)', 'KHQR (ACLEDA)', 'KHQR (Bakong)', etc.
  status: 'pending' | 'success' | 'failed';
  remarks: string;
  referenceCode?: string; // KHQR reference / bank transaction number
  createdAt: string;
}

export interface TicketReply {
  id: number;
  sender: 'user' | 'support';
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  userId: number;
  username: string;
  subject: string;
  message: string;
  category: string; // "Order", "Payment", "API", "Other"
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'answered' | 'closed';
  replies: TicketReply[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: number;
  text: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
}

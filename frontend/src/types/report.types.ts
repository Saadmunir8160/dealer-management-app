export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  availableCredit: number;
  creditExpiry: string | null;
  ordersThisMonth: number;
}

export interface RecentOrder {
  orderId: number;
  couponNumber?: string;
  erpOrderNumber?: string | null;
  orderDate: string;
  status: string;
  deliveryArea?: string | null;
  driver?: string | null;
  vehicle?: string | null;
  dealerName?: string;
  totalAmount?: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  supportPhone?: string;
  supportEmail?: string;
}

export interface SalesReportItem {
  period: string;
  totalOrders: number;
  totalAmount: number;
}

export interface SalesReport {
  items: SalesReportItem[];
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
}

export interface DealerPerformanceItem {
  dealerId: number;
  dealerName: string;
  city: string | null;
  totalOrders: number;
  totalAmount: number;
  rank: number;
}

export interface ReportParams {
  fromDate: string;
  toDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

import { DashboardResponse, SalesReport, DealerPerformanceItem } from '@types';

export const MOCK_DASHBOARD: DashboardResponse = {
  stats: {
    totalOrders: 14,
    pendingOrders: 10,
    availableCredit: 0,
    creditExpiry: '2025-12-23',
    ordersThisMonth: 2,
  },
  recentOrders: [
    {
      orderId: 6,
      couponNumber: 'CPN-1006',
      erpOrderNumber: 'ERP-88421',
      orderDate: '2024-03-18T10:00:00.000Z',
      status: 'Shipped',
      deliveryArea: 'Riyadh North',
      driver: 'Ahmed Ali',
      vehicle: 'TRK-204',
      dealerName: 'Sunrise Building Supplies',
      totalAmount: 245000,
    },
    {
      orderId: 4,
      couponNumber: 'CPN-1004',
      erpOrderNumber: null,
      orderDate: '2024-03-12T14:00:00.000Z',
      status: 'Processing',
      deliveryArea: 'Jeddah',
      driver: null,
      vehicle: null,
      dealerName: 'Pak Steel Distributors',
      totalAmount: 500000,
    },
    {
      orderId: 1,
      couponNumber: 'CPN-1001',
      erpOrderNumber: 'ERP-88101',
      orderDate: '2024-03-01T10:00:00.000Z',
      status: 'Pending',
      deliveryArea: 'Dammam',
      driver: null,
      vehicle: null,
      dealerName: 'ABC Traders',
      totalAmount: 120000,
    },
  ],
  supportPhone: '+966 11 234 5678',
  supportEmail: 'support@ucic.com',
};

export const MOCK_SALES_REPORT: SalesReport = {
  items: [
    { period: 'Jan 2024', totalOrders: 0, totalAmount: 0 },
    { period: 'Feb 2024', totalOrders: 0, totalAmount: 0 },
    { period: 'Mar 2024', totalOrders: 6, totalAmount: 1454000 },
  ],
  totalOrders: 6,
  totalAmount: 1454000,
  averageOrderValue: 242333,
};

export const MOCK_DEALER_PERFORMANCE: DealerPerformanceItem[] = [
  { dealerId: 4, dealerName: 'Pak Steel Distributors', city: 'Faisalabad', totalOrders: 1, totalAmount: 500000, rank: 1 },
  { dealerId: 3, dealerName: 'Al-Noor Builders Supply', city: 'Islamabad', totalOrders: 1, totalAmount: 360000, rank: 2 },
  { dealerId: 7, dealerName: 'Sunrise Building Supplies', city: 'Lahore', totalOrders: 1, totalAmount: 245000, rank: 3 },
];

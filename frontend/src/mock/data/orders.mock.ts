// ─────────────────────────────────────────────────────────────────────────────
// src/mock/data/orders.mock.ts
//
// WHY THIS FILE EXISTS:
//   Fake order records that mirror your SQL Server Orders + OrderItems tables.
//   Also includes the vw_OrderSummary view shape for list screens.
//
// MATCHES SQL:
//   INSERT INTO Orders (DealerId, UserId, TotalAmount, Status)
//   VALUES (1, 1, 120000, 'Pending');
//
//   INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice, TotalPrice)
//   VALUES (1, 1, 100, 1200, 120000);
// ─────────────────────────────────────────────────────────────────────────────

import { Order, OrderSummary } from '@types';

// ── Full Order Records (with items) ───────────────────────────────────────────
// Returned by GET /api/orders/:id
export const MOCK_ORDERS: Order[] = [
  {
    orderId: 1,
    dealerId: 1,
    dealerName: 'ABC Traders',
    userId: 1,
    salesPerson: 'Admin User',
    orderDate: '2024-03-01T10:00:00.000Z',
    totalAmount: 120000,
    status: 'Pending',
    couponNumber: 'CPN-1001',
    erpOrderNumber: 'ERP-88101',
    deliveryArea: 'Dammam',
    driver: null,
    vehicle: null,
    items: [
      {
        orderItemId: 1,
        orderId: 1,
        productId: 1,
        productName: 'Cement Bag',
        quantity: 100,
        unitPrice: 1200,
        totalPrice: 120000,
      },
    ],
  },
  {
    orderId: 2,
    dealerId: 2,
    dealerName: 'XYZ Traders',
    userId: 2,
    salesPerson: 'Sales User',
    orderDate: '2024-03-05T11:30:00.000Z',
    totalAmount: 175000,
    status: 'Confirmed',
    couponNumber: 'CPN-1002',
    erpOrderNumber: 'ERP-88155',
    deliveryArea: 'Jeddah',
    driver: 'Khalid Omar',
    vehicle: 'TRK-112',
    items: [
      {
        orderItemId: 2,
        orderId: 2,
        productId: 2,
        productName: 'Steel Rod',
        quantity: 50,
        unitPrice: 2500,
        totalPrice: 125000,
      },
      {
        orderItemId: 3,
        orderId: 2,
        productId: 4,
        productName: 'Sand (per cubic ft)',
        quantity: 200,
        unitPrice: 150,
        totalPrice: 30000,
      },
      {
        orderItemId: 4,
        orderId: 2,
        productId: 5,
        productName: 'Gravel (per cubic ft)',
        quantity: 100,
        unitPrice: 200,
        totalPrice: 20000,
      },
    ],
  },
  {
    orderId: 3,
    dealerId: 3,
    dealerName: 'Al-Noor Builders Supply',
    userId: 1,
    salesPerson: 'Admin User',
    orderDate: '2024-03-10T09:00:00.000Z',
    totalAmount: 360000,
    status: 'Delivered',
    couponNumber: 'CPN-1003',
    erpOrderNumber: 'ERP-88201',
    deliveryArea: 'Riyadh',
    driver: 'Hassan Nasser',
    vehicle: 'TRK-088',
    items: [
      {
        orderItemId: 5,
        orderId: 3,
        productId: 1,
        productName: 'Cement Bag',
        quantity: 200,
        unitPrice: 1200,
        totalPrice: 240000,
      },
      {
        orderItemId: 6,
        orderId: 3,
        productId: 2,
        productName: 'Steel Rod',
        quantity: 48,
        unitPrice: 2500,
        totalPrice: 120000,
      },
    ],
  },
  {
    orderId: 4,
    dealerId: 4,
    dealerName: 'Pak Steel Distributors',
    userId: 2,
    salesPerson: 'Sales User',
    orderDate: '2024-03-12T14:00:00.000Z',
    totalAmount: 500000,
    status: 'Processing',
    couponNumber: 'CPN-1004',
    erpOrderNumber: null,
    deliveryArea: 'Jeddah',
    driver: null,
    vehicle: null,
    items: [
      {
        orderItemId: 7,
        orderId: 4,
        productId: 2,
        productName: 'Steel Rod',
        quantity: 200,
        unitPrice: 2500,
        totalPrice: 500000,
      },
    ],
  },
  {
    orderId: 5,
    dealerId: 6,
    dealerName: 'City Cement Depot',
    userId: 1,
    salesPerson: 'Admin User',
    orderDate: '2024-03-15T08:30:00.000Z',
    totalAmount: 54000,
    status: 'Cancelled',
    couponNumber: 'CPN-1005',
    erpOrderNumber: null,
    deliveryArea: 'Khobar',
    driver: null,
    vehicle: null,
    items: [
      {
        orderItemId: 8,
        orderId: 5,
        productId: 3,
        productName: 'Bricks',
        quantity: 3000,
        unitPrice: 18,
        totalPrice: 54000,
      },
    ],
  },
  {
    orderId: 6,
    dealerId: 7,
    dealerName: 'Sunrise Building Supplies',
    userId: 2,
    salesPerson: 'Sales User',
    orderDate: '2024-03-18T10:00:00.000Z',
    totalAmount: 245000,
    status: 'Shipped',
    couponNumber: 'CPN-1006',
    erpOrderNumber: 'ERP-88421',
    deliveryArea: 'Riyadh North',
    driver: 'Ahmed Ali',
    vehicle: 'TRK-204',
    items: [
      {
        orderItemId: 9,
        orderId: 6,
        productId: 1,
        productName: 'Cement Bag',
        quantity: 100,
        unitPrice: 1200,
        totalPrice: 120000,
      },
      {
        orderItemId: 10,
        orderId: 6,
        productId: 6,
        productName: 'Paint (20L)',
        quantity: 35,
        unitPrice: 3500,
        totalPrice: 122500,
      },
      {
        orderItemId: 11,
        orderId: 6,
        productId: 7,
        productName: 'PVC Pipe (per meter)',
        quantity: 5,
        unitPrice: 450,
        totalPrice: 2250,
      },
    ],
  },
];

export const MOCK_ORDER_SUMMARIES: OrderSummary[] = MOCK_ORDERS.map(o => ({
  orderId: o.orderId,
  dealerName: o.dealerName,
  salesPerson: o.salesPerson,
  orderDate: o.orderDate,
  totalAmount: o.totalAmount,
  status: o.status,
  couponNumber: o.couponNumber,
  erpOrderNumber: o.erpOrderNumber,
  deliveryArea: o.deliveryArea,
  driver: o.driver,
  vehicle: o.vehicle,
  itemCount: o.items.length,
}));

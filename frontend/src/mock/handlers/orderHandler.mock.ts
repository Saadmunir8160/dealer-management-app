// ─────────────────────────────────────────────────────────────────────────────
// src/mock/handlers/orderHandler.mock.ts
//
// WHY THIS FILE EXISTS:
//   Simulates your backend's /api/orders/* endpoints.
//
// SIMULATED ENDPOINTS:
//   GET  /api/orders          → paginated list (uses vw_OrderSummary)
//   GET  /api/orders/:id      → full order with items
//   POST /api/orders          → create new order
//   PUT  /api/orders/:id/status → update order status
// ─────────────────────────────────────────────────────────────────────────────

import {
  Order,
  OrderSummary,
  OrderListParams,
  CreateOrderRequest,
  OrderStatus,
  ApiResponse,
  PaginatedApiResponse,
} from '@types';
import { MOCK_ORDERS, MOCK_ORDER_SUMMARIES } from '../data/orders.mock';
import { MOCK_PRODUCTS } from '../data/products.mock';
import { MOCK_DEALERS } from '../data/dealers.mock';
import { MOCK_USERS } from '../data/users.mock';

// ── In-Memory Database ────────────────────────────────────────────────────────
let ordersDb: Order[] = [...MOCK_ORDERS];
let summariesDb: OrderSummary[] = [...MOCK_ORDER_SUMMARIES];
let nextOrderId = ordersDb.length + 1;
let nextItemId = 20; // start after existing mock item IDs

// ── Get All Orders (Summary List) ─────────────────────────────────────────────
export const mockGetOrders = async (
  params: OrderListParams,
): Promise<PaginatedApiResponse<OrderSummary>> => {
  const { page, limit, dealerId, status, fromDate, toDate } = params;

  let filtered = summariesDb.filter(order => {
    // Filter by dealerId: WHERE DealerId = @dealerId
    if (dealerId !== undefined) {
      const fullOrder = ordersDb.find(o => o.orderId === order.orderId);
      if (fullOrder?.dealerId !== dealerId) return false;
    }

    // Filter by status: WHERE Status = @status
    if (status && order.status !== status) return false;

    // Filter by date range: WHERE OrderDate BETWEEN @fromDate AND @toDate
    if (fromDate && new Date(order.orderDate) < new Date(fromDate)) return false;
    if (toDate && new Date(order.orderDate) > new Date(toDate)) return false;

    return true;
  });

  // Sort by most recent first: ORDER BY OrderDate DESC
  filtered = filtered.sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
  );

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    success: true,
    message: 'Orders fetched successfully',
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// ── Get Order By ID ───────────────────────────────────────────────────────────
export const mockGetOrderById = async (
  id: number,
): Promise<ApiResponse<Order>> => {
  const order = ordersDb.find(o => o.orderId === id);

  if (!order) {
    throw {
      message: `Order with ID ${id} not found.`,
      statusCode: 404,
    };
  }

  return {
    success: true,
    message: 'Order fetched successfully',
    data: order,
  };
};

// ── Create Order ──────────────────────────────────────────────────────────────
export const mockCreateOrder = async (
  payload: CreateOrderRequest,
  userId: number,
): Promise<ApiResponse<Order>> => {
  // Validate dealer exists
  const dealer = MOCK_DEALERS.find(d => d.dealerId === payload.dealerId);
  if (!dealer) {
    throw { message: 'Dealer not found.', statusCode: 404 };
  }

  // Validate dealer is active
  if (!dealer.status) {
    throw { message: 'Cannot create order for inactive dealer.', statusCode: 400 };
  }

  // Get sales person
  const user = MOCK_USERS.find(u => u.userId === userId);

  // Build order items with product names
  const items = payload.items.map(item => {
    const product = MOCK_PRODUCTS.find(p => p.productId === item.productId);
    if (!product) {
      throw { message: `Product ID ${item.productId} not found.`, statusCode: 404 };
    }
    return {
      orderItemId: nextItemId++,
      orderId: nextOrderId,
      productId: item.productId,
      productName: product.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    };
  });

  // Calculate total: SUM(Quantity * UnitPrice)
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const newOrder: Order = {
    orderId: nextOrderId++,
    dealerId: payload.dealerId,
    dealerName: dealer.dealerName,
    userId,
    salesPerson: user?.fullName ?? 'Unknown',
    orderDate: new Date().toISOString(),
    totalAmount,
    status: 'Pending',
    items,
  };

  ordersDb.push(newOrder);
  summariesDb.push({
    orderId: newOrder.orderId,
    dealerName: newOrder.dealerName,
    salesPerson: newOrder.salesPerson,
    orderDate: newOrder.orderDate,
    totalAmount: newOrder.totalAmount,
    status: newOrder.status,
  });

  return {
    success: true,
    message: 'Order created successfully',
    data: newOrder,
  };
};

// ── Update Order Status ───────────────────────────────────────────────────────
export const mockUpdateOrderStatus = async (
  id: number,
  status: OrderStatus,
): Promise<ApiResponse<Order>> => {
  const orderIndex = ordersDb.findIndex(o => o.orderId === id);
  const summaryIndex = summariesDb.findIndex(s => s.orderId === id);

  if (orderIndex === -1) {
    throw { message: `Order with ID ${id} not found.`, statusCode: 404 };
  }

  // Business rule: cannot change status of cancelled or delivered orders
  const currentStatus = ordersDb[orderIndex].status;
  if (currentStatus === 'Cancelled' || currentStatus === 'Delivered') {
    throw {
      message: `Cannot update a ${currentStatus} order.`,
      statusCode: 400,
    };
  }

  ordersDb[orderIndex] = { ...ordersDb[orderIndex], status };
  if (summaryIndex !== -1) {
    summariesDb[summaryIndex] = { ...summariesDb[summaryIndex], status };
  }

  return {
    success: true,
    message: 'Order status updated successfully',
    data: ordersDb[orderIndex],
  };
};

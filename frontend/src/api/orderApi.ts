// ─────────────────────────────────────────────────────────────────────────────
// src/api/orderApi.ts
// Raw API calls for order management endpoints.
// ─────────────────────────────────────────────────────────────────────────────
import apiClient from './axios';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderListParams,
  ApiResponse,
  PaginatedResponse,
} from '@types';

const ORDER_ENDPOINTS = {
  BASE: '/orders',
  BY_ID: (id: string) => `/orders/${id}`,
  STATUS: (id: string) => `/orders/${id}/status`,
} as const;

export const orderApi = {
  getAll: (params: OrderListParams) =>
    apiClient.get(ORDER_ENDPOINTS.BASE, {
      params: {
        PageNumber: params.page,
        PageSize: params.limit,
        Search: params.search,
        dealerId: params.dealerId,
      },
    }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Order>>(ORDER_ENDPOINTS.BY_ID(id)),

  create: (payload: CreateOrderRequest) =>
    apiClient.post<ApiResponse<Order>>(ORDER_ENDPOINTS.BASE, {
      dealerId: payload.dealerId,
      shippingAddress: payload.deliveryArea,
      items: payload.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPercent: 0,
        taxRate: 0,
      })),
    }),

  updateStatus: ({ orderId, status }: UpdateOrderStatusRequest) =>
    apiClient.put<ApiResponse<Order>>(ORDER_ENDPOINTS.STATUS(orderId), {
      status: toBackendOrderStatus(status),
    }),

  cancel: (id: string) =>
    apiClient.put<ApiResponse<Order>>(ORDER_ENDPOINTS.STATUS(id), {
      // Backend OrderStatus.Cancelled = 7 (also accepts "Cancelled" with JsonStringEnumConverter)
      status: 7,
    }),
};

/** Map app status labels → backend OrderStatus enum values */
function toBackendOrderStatus(status: UpdateOrderStatusRequest['status']): number {
  const map: Record<UpdateOrderStatusRequest['status'], number> = {
    Pending: 1,
    Confirmed: 2,
    Processing: 3,
    Shipped: 4,
    Delivered: 5,
    Cancelled: 7,
  };
  return map[status] ?? 1;
}

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
    apiClient.put<ApiResponse<Order>>(ORDER_ENDPOINTS.STATUS(orderId), { status }),

  cancel: (id: string) =>
    apiClient.put<ApiResponse<Order>>(ORDER_ENDPOINTS.STATUS(id), { status: 'Cancelled' }),
};

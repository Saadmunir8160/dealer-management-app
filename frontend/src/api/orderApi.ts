import apiClient from './axios';
import {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderListParams,
  OrderStatus,
  ApiResponse,
  Order,
} from '@types';

/** DealerManagement.Api OrdersController */
const ORDER_ENDPOINTS = {
  BASE: '/orders',
  BY_ID: (id: string | number) => `/orders/${id}`,
  STATUS: (id: string | number) => `/orders/${id}/status`,
} as const;

export const orderApi = {
  getAll: (params: OrderListParams) =>
    apiClient.get(ORDER_ENDPOINTS.BASE, {
      params: {
        pageNumber: params.page,
        pageSize: params.limit,
        search: params.search || undefined,
        dealerId: params.dealerId || undefined,
      },
    }),

  /** Same list endpoint — filter client-side / by dealerId when needed */
  getMine: (params?: OrderListParams) =>
    apiClient.get(ORDER_ENDPOINTS.BASE, {
      params: {
        pageNumber: params?.page ?? 1,
        pageSize: params?.limit ?? 50,
      },
    }),

  getById: (id: string) => apiClient.get(ORDER_ENDPOINTS.BY_ID(id)),

  create: (payload: Record<string, unknown>) =>
    apiClient.post(ORDER_ENDPOINTS.BASE, payload),

  cancel: (id: string) =>
    apiClient.put(ORDER_ENDPOINTS.STATUS(id), {
      status: 'Cancelled' as OrderStatus,
      notes: 'Cancelled from app',
    }),

  confirm: (orderId: string | number) =>
    apiClient.put(ORDER_ENDPOINTS.STATUS(orderId), {
      status: 'Confirmed' as OrderStatus,
    }),

  updateStatus: (payload: UpdateOrderStatusRequest) =>
    apiClient.put(ORDER_ENDPOINTS.STATUS(payload.orderId), {
      status: payload.status,
    }),

  /** No coupon validation endpoint on DealerManagement.Api */
  validateCoupon: async (_couponCode: string, _coverageAreaId?: number) => ({
    data: {
      isValid: true,
      couponCode: _couponCode,
      discountPercentage: 0,
      promotionID: 0,
    },
  }),

  /** Coverage cities not available — stub for callers that still reference it */
  getGeneralDataAndCities: async (_coverageAreaId: number) => ({
    data: {
      success: true,
      data: { cities: [], vatPercentage: 0 },
    },
  }),
};

export type { CreateOrderRequest, Order, ApiResponse };

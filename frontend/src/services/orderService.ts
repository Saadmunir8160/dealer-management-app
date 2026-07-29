import Config from '@config';
import { orderApi } from '@api/orderApi';
import {
  Order,
  CreateOrderRequest,
  OrderListParams,
  PaginatedResponse,
  OrderSummary,
} from '@types';
import { parseApiError } from '@utils/errorHandler';
import {
  mapOrdersListResponse,
  unwrapOrderDetail,
  mapBackendOrderToDetail,
} from '@utils/orderMappers';
import {
  mockGetOrders,
  mockGetOrderById,
  mockCreateOrder,
  mockUpdateOrderStatus,
} from '../mock/handlers/orderHandler.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const OrderService = {
  fetchOrders: async (
    params: OrderListParams,
  ): Promise<PaginatedResponse<OrderSummary>> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        return await mockGetOrders(params);
      }

      const response = await orderApi.getAll(params);
      return mapOrdersListResponse(response);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  fetchOrderById: async (id: string | number): Promise<Order> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockGetOrderById(Number(id));
        return response.data;
      }
      const response = await orderApi.getById(String(id));
      return unwrapOrderDetail(response);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /** Create via DealerManagement.Api POST /orders */
  createOrder: async (payload: CreateOrderRequest, _userId = 1): Promise<Order> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockCreateOrder(payload, _userId);
        return response.data;
      }

      const items = payload.items ?? [];
      const body = {
        dealerId: payload.dealerId,
        deliveryDate: payload.deliveryDate || null,
        discountAmount: 0,
        shippingCost: 0,
        shippingAddress: payload.deliveryArea || null,
        billingAddress: payload.deliveryArea || null,
        notes: payload.notes || null,
        couponNumber: payload.couponNumber || null,
        erpOrderNumber: payload.erpOrderNumber || null,
        deliveryArea: payload.deliveryArea || null,
        driver: payload.driver || null,
        vehicle: payload.vehicle || null,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: 0,
          taxRate: 0,
        })),
      };

      const response = await orderApi.create(body);
      const envelope = response.data as {
        success?: boolean;
        Success?: boolean;
        message?: string;
        Message?: string;
        data?: unknown;
        Data?: unknown;
      };

      const ok = envelope?.success ?? envelope?.Success;
      if (ok === false) {
        throw {
          message:
            envelope?.message ??
            envelope?.Message ??
            'Failed to save order. Check dealer and products.',
          statusCode: 400,
        };
      }

      const dto = envelope?.data ?? envelope?.Data;
      if (dto && typeof dto === 'object') {
        return mapBackendOrderToDetail(dto as Record<string, unknown>);
      }

      return unwrapOrderDetail(response);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  cancelOrder: async (id: string | number): Promise<Order> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockUpdateOrderStatus(Number(id), 'Cancelled');
        return response.data;
      }
      const res = await orderApi.cancel(String(id));
      const dto = (res.data as any)?.data ?? (res.data as any)?.Data;
      if (dto && typeof dto === 'object') {
        return mapBackendOrderToDetail(dto);
      }
      return OrderService.fetchOrderById(id);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  confirmOrder: async (
    id: string | number,
    _dealerId?: number | null,
  ): Promise<Order> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockUpdateOrderStatus(Number(id), 'Confirmed');
        return response.data;
      }
      const res = await orderApi.confirm(id);
      const dto = (res.data as any)?.data ?? (res.data as any)?.Data;
      if (dto && typeof dto === 'object') {
        return mapBackendOrderToDetail(dto);
      }
      return OrderService.fetchOrderById(id);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /** Coupon codes are stored on orders; no server-side promotion check */
  validateCoupon: async (
    couponCode: string,
    _coverageAreaId?: number,
  ): Promise<{
    isValid: boolean;
    couponCode?: string;
    discountPercentage: number;
    promotionId: number;
  }> => {
    const trimmed = couponCode.trim();
    return {
      isValid: trimmed.length > 0,
      couponCode: trimmed || undefined,
      discountPercentage: 0,
      promotionId: 0,
    };
  },
};

import Config from '@config';
import { orderApi } from '@api/orderApi';
import {
  Order,
  OrderSummary,
  CreateOrderRequest,
  OrderListParams,
  PaginatedResponse,
} from '@types';
import { parseApiError } from '@utils/errorHandler';
import { mapOrdersListResponse } from '@utils/orderMappers';
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

      try {
        const response = await orderApi.getAll({
          ...params,
          // backend uses PageNumber / PageSize via PaginationParams — send both shapes
          page: params.page,
          limit: params.limit,
        } as OrderListParams);
        const mapped = mapOrdersListResponse(response);

        // No DB orders yet → show demo list (previous UX)
        if (!mapped.data.length) {
          await delay(Config.MOCK_DELAY_MS);
          return await mockGetOrders(params);
        }
        return mapped;
      } catch {
        await delay(Config.MOCK_DELAY_MS);
        return await mockGetOrders(params);
      }
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
      try {
        const response = await orderApi.getById(String(id));
        return response.data.data;
      } catch {
        const response = await mockGetOrderById(Number(id));
        return response.data;
      }
    } catch (error) {
      throw parseApiError(error);
    }
  },

  createOrder: async (payload: CreateOrderRequest, userId = 1): Promise<Order> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockCreateOrder(payload, userId);
        return response.data;
      }
      try {
        const response = await orderApi.create(payload);
        return response.data.data;
      } catch {
        // Keep create flow usable offline / when API schema differs
        const response = await mockCreateOrder(payload, userId);
        return response.data;
      }
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
      const response = await orderApi.cancel(String(id));
      return response.data.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },
};

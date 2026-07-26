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
import { mapBackendOrderToDetail, mapOrdersListResponse } from '@utils/orderMappers';
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

      const response = await orderApi.getAll({
        ...params,
        page: params.page,
        limit: params.limit,
      } as OrderListParams);
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
      return mapBackendOrderToDetail(response.data.data);
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
      const response = await orderApi.create(payload);
      return mapBackendOrderToDetail(response.data.data);
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
      return mapBackendOrderToDetail(response.data.data);
    } catch (error) {
      throw parseApiError(error);
    }
  },
};

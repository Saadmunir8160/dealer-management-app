import Config from '@config';
import { dealerApi } from '@api/dealerApi';
import {
  Dealer,
  CreateDealerRequest,
  UpdateDealerRequest,
  DealerListParams,
  PaginatedResponse,
} from '@types';
import { parseApiError } from '@utils/errorHandler';
import { mapBackendDealersList } from '@utils/dealerMappers';
import {
  mockGetDealers,
  mockGetDealerById,
  mockCreateDealer,
  mockUpdateDealer,
  mockDeleteDealer,
} from '../mock/handlers/dealerHandler.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DealerService = {
  fetchDealers: async (params: DealerListParams): Promise<PaginatedResponse<Dealer>> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        return await mockGetDealers(params);
      }
      const response = await dealerApi.getAll(params);
      const mapped = mapBackendDealersList(response.data);
      return {
        success: true,
        message: '',
        data: mapped,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: mapped.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    } catch (error) {
      throw parseApiError(error);
    }
  },

  fetchDealerById: async (id: string): Promise<Dealer> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockGetDealerById(Number(id));
        return response.data;
      }
      const response = await dealerApi.getById(id);
      return response.data.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  createDealer: async (payload: CreateDealerRequest): Promise<Dealer> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockCreateDealer(payload);
        return response.data;
      }
      const response = await dealerApi.create(payload);
      return response.data.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  updateDealer: async (
    idOrPayload: number | (UpdateDealerRequest & { id?: number; dealerId?: number }),
    maybePayload?: UpdateDealerRequest,
  ): Promise<Dealer> => {
    try {
      let id: number;
      let payload: UpdateDealerRequest;

      if (typeof idOrPayload === 'number') {
        id = idOrPayload;
        payload = maybePayload ?? {};
      } else {
        id = Number(idOrPayload.id ?? idOrPayload.dealerId);
        const { id: _id, dealerId: _dealerId, ...rest } = idOrPayload as UpdateDealerRequest & {
          id?: number;
          dealerId?: number;
        };
        payload = rest;
      }

      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockUpdateDealer(id, payload);
        return response.data;
      }
      const response = await dealerApi.update({ ...payload, dealerId: id } as any);
      return response.data.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  deleteDealer: async (id: string): Promise<void> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        await mockDeleteDealer(Number(id));
        return;
      }
      await dealerApi.delete(id);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  toggleDealerStatus: async (id: string, currentStatus: boolean | string): Promise<Dealer> => {
    const isActive = currentStatus === true || currentStatus === 'active';
    return DealerService.updateDealer(Number(id), { status: !isActive });
  },
};

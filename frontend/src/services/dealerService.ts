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
import { mapBackendDealer, mapBackendDealersList } from '@utils/dealerMappers';
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
      const envelope = response.data as {
        data?: { totalCount?: number; TotalCount?: number; totalPages?: number; TotalPages?: number; pageNumber?: number; PageNumber?: number; pageSize?: number; PageSize?: number };
        message?: string;
      };
      const pageData = envelope?.data;
      const total = Number(pageData?.totalCount ?? pageData?.TotalCount ?? mapped.length);
      const totalPages = Number(
        pageData?.totalPages ??
          pageData?.TotalPages ??
          Math.max(1, Math.ceil(total / (params.limit || 1))),
      );
      return {
        success: true,
        message: envelope?.message ?? '',
        data: mapped,
        pagination: {
          page: Number(pageData?.pageNumber ?? pageData?.PageNumber ?? params.page),
          limit: Number(pageData?.pageSize ?? pageData?.PageSize ?? params.limit),
          total,
          totalPages,
          hasNextPage: params.page < totalPages,
          hasPrevPage: params.page > 1,
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
      const dto = response.data?.data ?? response.data;
      return mapBackendDealer(dto ?? {});
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
      return mapBackendDealer(response.data?.data ?? response.data ?? {});
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
      return mapBackendDealer(response.data?.data ?? response.data ?? {});
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

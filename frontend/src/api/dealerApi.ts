import apiClient from './axios';
import {
  Dealer,
  CreateDealerRequest,
  UpdateDealerRequest,
  DealerListParams,
  ApiResponse,
  PaginatedResponse,
} from '@types';

/** DealerManagement.Api DealersController */
const DEALER_ENDPOINTS = {
  BASE: '/dealers',
  BY_ID: (id: string | number) => `/dealers/${id}`,
} as const;

export const dealerApi = {
  getAll: (params: DealerListParams) =>
    apiClient.get(DEALER_ENDPOINTS.BASE, {
      params: {
        pageNumber: params.page || 1,
        pageSize: Math.min(params.limit || 100, 100),
        search: params.search || undefined,
      },
    }),

  getById: (id: string) => apiClient.get(DEALER_ENDPOINTS.BY_ID(id)),

  create: (payload: CreateDealerRequest) =>
    apiClient.post(DEALER_ENDPOINTS.BASE, {
      dealerName: payload.dealerName,
      contactPerson: payload.contactPerson,
      email: payload.email,
      phone: payload.phone,
      dealerType: 'Authorized',
      creditLimit: 0,
      paymentTermsDays: 30,
      addresses: payload.address
        ? [
            {
              addressType: 'Shipping',
              addressLine1: payload.address,
              city: payload.city,
              isDefault: true,
            },
          ]
        : undefined,
    }),

  update: (payload: UpdateDealerRequest & { dealerId: number }) =>
    apiClient.put(DEALER_ENDPOINTS.BY_ID(payload.dealerId), {
      dealerName: payload.dealerName ?? '',
      contactPerson: payload.contactPerson,
      email: payload.email,
      phone: payload.phone,
      dealerType: 'Authorized',
      status: payload.status === false ? 'Suspended' : 'Active',
      creditLimit: 0,
      paymentTermsDays: 30,
    }),

  delete: (id: string) => apiClient.delete(DEALER_ENDPOINTS.BY_ID(id)),

  updateStatus: (id: string, status: Dealer['status']) =>
    dealerApi.update({ dealerId: Number(id), status }),
};

export type { ApiResponse, PaginatedResponse };

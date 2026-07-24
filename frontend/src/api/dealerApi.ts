// ─────────────────────────────────────────────────────────────────────────────
// src/api/dealerApi.ts
// Raw API calls for dealer management endpoints.
// ─────────────────────────────────────────────────────────────────────────────
import apiClient from './axios';
import {
  Dealer,
  CreateDealerRequest,
  UpdateDealerRequest,
  DealerListParams,
  ApiResponse,
  PaginatedResponse,
} from '@types';

const DEALER_ENDPOINTS = {
  BASE: '/dealers',
  BY_ID: (id: string) => `/dealers/${id}`,
  STATUS: (id: string) => `/dealers/${id}/status`,
} as const;

export const dealerApi = {
  getAll: (params: DealerListParams) =>
    apiClient.get<PaginatedResponse<Dealer>>(DEALER_ENDPOINTS.BASE, { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Dealer>>(DEALER_ENDPOINTS.BY_ID(id)),

  create: (payload: CreateDealerRequest) =>
    apiClient.post<ApiResponse<Dealer>>(DEALER_ENDPOINTS.BASE, payload),

  update: ({ id, ...payload }: UpdateDealerRequest) =>
    apiClient.put<ApiResponse<Dealer>>(DEALER_ENDPOINTS.BY_ID(id), payload),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(DEALER_ENDPOINTS.BY_ID(id)),

  updateStatus: (id: string, status: Dealer['status']) =>
    apiClient.patch<ApiResponse<Dealer>>(DEALER_ENDPOINTS.STATUS(id), { status }),
};

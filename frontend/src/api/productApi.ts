import apiClient from './axios';

/** DealerManagement.Api ProductsController */
const PRODUCT_ENDPOINTS = {
  BASE: '/products',
  BY_ID: (id: number | string) => `/products/${id}`,
} as const;

export const productApi = {
  getAll: (page = 1, pageSize = 100) =>
    apiClient.get(PRODUCT_ENDPOINTS.BASE, {
      params: { pageNumber: page, pageSize },
    }),

  /** Coverage areas do not exist on DealerManagement.Api — use full catalog */
  getByCoverageArea: (_coverageAreaId: number) =>
    apiClient.get(PRODUCT_ENDPOINTS.BASE, {
      params: { pageNumber: 1, pageSize: 100 },
    }),

  getById: (id: number | string) => apiClient.get(PRODUCT_ENDPOINTS.BY_ID(id)),

  getPaged: (page = 1, limit = 100) =>
    apiClient.get(PRODUCT_ENDPOINTS.BASE, {
      params: { pageNumber: page, pageSize: limit },
    }),
};

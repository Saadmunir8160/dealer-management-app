import apiClient from './axios';

const PRODUCT_ENDPOINTS = {
  ALL: '/products/all',
  BASE: '/products',
} as const;

export const productApi = {
  getAll: () => apiClient.get(PRODUCT_ENDPOINTS.ALL),
  getPaged: (page = 1, limit = 100) =>
    apiClient.get(PRODUCT_ENDPOINTS.BASE, {
      params: { PageNumber: page, PageSize: limit },
    }),
};

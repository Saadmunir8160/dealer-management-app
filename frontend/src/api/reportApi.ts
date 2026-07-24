// ─────────────────────────────────────────────────────────────────────────────
// src/api/reportApi.ts
// Raw API calls for reporting and analytics endpoints.
// ─────────────────────────────────────────────────────────────────────────────
import apiClient from './axios';
import {
  SalesReport,
  DealerPerformanceItem,
  DashboardResponse,
  ReportParams,
  ApiResponse,
  PaginatedResponse,
} from '@types';

const REPORT_ENDPOINTS = {
  DASHBOARD: '/dashboard',
  SALES: '/reports/sales',
  DEALER_PERFORMANCE: '/reports/dealer-performance',
  EXPORT: '/reports/export',
} as const;

export const reportApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardResponse>>(REPORT_ENDPOINTS.DASHBOARD),

  getSalesReport: (params: ReportParams) =>
    apiClient.get<ApiResponse<SalesReport>>(REPORT_ENDPOINTS.SALES, { params }),

  getDealerPerformance: (params: ReportParams) =>
    apiClient.get<PaginatedResponse<DealerPerformanceItem>>(REPORT_ENDPOINTS.DEALER_PERFORMANCE, { params }),

  exportReport: (params: ReportParams & { format: 'pdf' | 'excel' }) =>
    apiClient.get(REPORT_ENDPOINTS.EXPORT, { params, responseType: 'blob' }),
};

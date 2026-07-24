// ─────────────────────────────────────────────────────────────────────────────
// src/mock/handlers/reportHandler.mock.ts
//
// WHY THIS FILE EXISTS:
//   Simulates your backend's /api/dashboard and /api/reports/* endpoints.
//   In production, these run complex SQL aggregation queries.
//   Here we return pre-calculated mock data.
//
// SIMULATED ENDPOINTS:
//   GET /api/dashboard                    → stats + recent orders
//   GET /api/reports/sales                → sales grouped by period
//   GET /api/reports/dealer-performance   → dealers ranked by revenue
// ─────────────────────────────────────────────────────────────────────────────

import {
  DashboardResponse,
  SalesReport,
  DealerPerformanceItem,
  ReportParams,
  ApiResponse,
  PaginatedApiResponse,
} from '@types';
import {
  MOCK_DASHBOARD,
  MOCK_SALES_REPORT,
  MOCK_DEALER_PERFORMANCE,
} from '../data/dashboard.mock';

// ── Get Dashboard ─────────────────────────────────────────────────────────────
export const mockGetDashboard = async (): Promise<
  ApiResponse<DashboardResponse>
> => {
  return {
    success: true,
    message: 'Dashboard data fetched successfully',
    data: MOCK_DASHBOARD,
  };
};

// ── Get Sales Report ──────────────────────────────────────────────────────────
export const mockGetSalesReport = async (
  _params: ReportParams,
): Promise<ApiResponse<SalesReport>> => {
  // In production: runs GROUP BY query filtered by fromDate/toDate
  // Here we return the same mock data regardless of date range
  return {
    success: true,
    message: 'Sales report fetched successfully',
    data: MOCK_SALES_REPORT,
  };
};

// ── Get Dealer Performance ────────────────────────────────────────────────────
export const mockGetDealerPerformance = async (
  _params: ReportParams,
): Promise<PaginatedApiResponse<DealerPerformanceItem>> => {
  return {
    success: true,
    message: 'Dealer performance report fetched successfully',
    data: MOCK_DEALER_PERFORMANCE,
    pagination: {
      page: 1,
      limit: 10,
      total: MOCK_DEALER_PERFORMANCE.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

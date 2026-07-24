import Config from '@config';
import { reportApi } from '@api/reportApi';
import {
  DashboardResponse,
  SalesReport,
  DealerPerformanceItem,
  ReportParams,
  PaginatedResponse,
} from '@types';
import { parseApiError } from '@utils/errorHandler';
import {
  mockGetDashboard,
  mockGetSalesReport,
  mockGetDealerPerformance,
} from '../mock/handlers/reportHandler.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ReportService = {
  getDashboard: async (): Promise<DashboardResponse> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockGetDashboard();
        return response.data;
      }
      try {
        const response = await reportApi.getDashboard();
        const dash = response.data?.data;
        if (dash && (dash as DashboardResponse).stats) {
          return dash as DashboardResponse;
        }
        // Backend DashboardDto shape differs — use mock for UCIC-style KPIs
        const mock = await mockGetDashboard();
        return mock.data;
      } catch {
        const mock = await mockGetDashboard();
        return mock.data;
      }
    } catch (error) {
      throw parseApiError(error);
    }
  },

  getSalesReport: async (params: ReportParams): Promise<SalesReport> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockGetSalesReport(params);
        return response.data;
      }
      const response = await reportApi.getSalesReport(params);
      return response.data.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },

  getDealerPerformance: async (
    params: ReportParams,
  ): Promise<PaginatedResponse<DealerPerformanceItem>> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        return await mockGetDealerPerformance(params);
      }
      const response = await reportApi.getDealerPerformance(params);
      return response.data;
    } catch (error) {
      throw parseApiError(error);
    }
  },
};

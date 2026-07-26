import Config from '@config';
import { reportApi } from '@api/reportApi';
import {
  DashboardResponse,
  SalesReport,
  DealerPerformanceItem,
  ReportParams,
  PaginatedResponse,
  RecentOrder,
} from '@types';
import { parseApiError } from '@utils/errorHandler';
import { mapBackendStatus } from '@utils/orderMappers';
import {
  mockGetDashboard,
  mockGetSalesReport,
  mockGetDealerPerformance,
} from '../mock/handlers/reportHandler.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface BackendDashboardDto {
  totalOrders?: number;
  TotalOrders?: number;
  pendingOrders?: number;
  PendingOrders?: number;
  availableCredit?: number;
  AvailableCredit?: number;
  creditExpiry?: string | null;
  CreditExpiry?: string | null;
  ordersThisMonth?: number;
  OrdersThisMonth?: number;
  supportPhone?: string;
  SupportPhone?: string;
  supportEmail?: string;
  SupportEmail?: string;
  recentOrders?: BackendRecentOrder[];
  RecentOrders?: BackendRecentOrder[];
  stats?: DashboardResponse['stats'];
}

interface BackendRecentOrder {
  orderId?: number;
  OrderId?: number;
  couponNumber?: string | null;
  CouponNumber?: string | null;
  erpOrderNumber?: string | null;
  ErpOrderNumber?: string | null;
  orderDate?: string;
  OrderDate?: string;
  status?: string | number;
  Status?: string | number;
  deliveryArea?: string | null;
  DeliveryArea?: string | null;
  driver?: string | null;
  Driver?: string | null;
  vehicle?: string | null;
  Vehicle?: string | null;
  dealerName?: string | null;
  DealerName?: string | null;
  totalAmount?: number;
  TotalAmount?: number;
}

const mapRecentOrder = (row: BackendRecentOrder): RecentOrder => ({
  orderId: row.orderId ?? row.OrderId ?? 0,
  couponNumber: row.couponNumber ?? row.CouponNumber ?? undefined,
  erpOrderNumber: row.erpOrderNumber ?? row.ErpOrderNumber ?? null,
  orderDate: String(row.orderDate ?? row.OrderDate ?? new Date().toISOString()),
  status: mapBackendStatus(row.status ?? row.Status),
  deliveryArea: row.deliveryArea ?? row.DeliveryArea ?? null,
  driver: row.driver ?? row.Driver ?? null,
  vehicle: row.vehicle ?? row.Vehicle ?? null,
  dealerName: row.dealerName ?? row.DealerName ?? undefined,
  totalAmount: Number(row.totalAmount ?? row.TotalAmount ?? 0),
});

const mapDashboardDto = (dash: BackendDashboardDto): DashboardResponse | null => {
  const recentRaw = dash.recentOrders ?? dash.RecentOrders;
  // UCIC portal shape: has recentOrders array (even if empty) or nested stats
  if (!recentRaw && !dash.stats && dash.totalOrders === undefined && dash.TotalOrders === undefined) {
    return null;
  }

  if (dash.stats && Array.isArray(recentRaw)) {
    return {
      stats: dash.stats,
      recentOrders: recentRaw.map(mapRecentOrder),
      supportPhone: dash.supportPhone ?? dash.SupportPhone,
      supportEmail: dash.supportEmail ?? dash.SupportEmail,
    };
  }

  return {
    stats: {
      totalOrders: Number(dash.totalOrders ?? dash.TotalOrders ?? 0),
      pendingOrders: Number(dash.pendingOrders ?? dash.PendingOrders ?? 0),
      availableCredit: Number(dash.availableCredit ?? dash.AvailableCredit ?? 0),
      creditExpiry: dash.creditExpiry ?? dash.CreditExpiry ?? null,
      ordersThisMonth: Number(dash.ordersThisMonth ?? dash.OrdersThisMonth ?? 0),
    },
    recentOrders: (recentRaw ?? []).map(mapRecentOrder),
    supportPhone: dash.supportPhone ?? dash.SupportPhone ?? '+966 11 234 5678',
    supportEmail: dash.supportEmail ?? dash.SupportEmail ?? 'support@ucic.com',
  };
};

export const ReportService = {
  getDashboard: async (): Promise<DashboardResponse> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        const response = await mockGetDashboard();
        return response.data;
      }
      const response = await reportApi.getDashboard();
      const mapped = mapDashboardDto((response.data?.data ?? {}) as BackendDashboardDto);
      if (!mapped) {
        throw new Error('Invalid dashboard response from API');
      }
      return mapped;
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

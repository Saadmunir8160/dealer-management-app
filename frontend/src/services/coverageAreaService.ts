import { coverageAreaApi } from '@api/coverageAreaApi';
import { orderApi } from '@api/orderApi';
import { CoverageArea, CoverageGeneralData } from '@types';
import { parseApiError } from '@utils/errorHandler';
import {
  mapCoverageAreasResponse,
  mapGeneralDataAndCities,
} from '@utils/coverageMappers';

/**
 * DealerManagement.Api has no coverage areas.
 * Methods return empty data so Create Order can skip UCIC-only city/coverage UI.
 */
export const CoverageAreaService = {
  fetchAll: async (): Promise<CoverageArea[]> => {
    try {
      const res = await coverageAreaApi.getAll(1, 50);
      return mapCoverageAreasResponse(res);
    } catch {
      return [];
    }
  },

  fetchGeneralDataAndCities: async (
    coverageAreaId: number,
  ): Promise<CoverageGeneralData> => {
    try {
      const res = await orderApi.getGeneralDataAndCities(coverageAreaId);
      return mapGeneralDataAndCities(res);
    } catch (error) {
      throw parseApiError(error);
    }
  },
};

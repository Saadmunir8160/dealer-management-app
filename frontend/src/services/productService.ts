import Config from '@config';
import { productApi } from '@api/productApi';
import { Product } from '@types';
import { parseApiError } from '@utils/errorHandler';
import { mapBackendProductsResponse } from '@utils/productMappers';
import { MOCK_PRODUCTS } from '@mock/data/products.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function dedupeActive(products: Product[]): Product[] {
  const seen = new Set<number>();
  return products.filter(p => {
    if (!p.status || seen.has(p.productId)) return false;
    seen.add(p.productId);
    return true;
  });
}

export const ProductService = {
  fetchActiveProducts: async (): Promise<Product[]> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        return MOCK_PRODUCTS.filter(p => p.status);
      }
      const page1 = await productApi.getAll(1, 100);
      let products = mapBackendProductsResponse(page1);
      const payload = (page1.data as any)?.data ?? (page1.data as any)?.Data ?? {};
      const totalPages = Number(
        payload?.totalPages ??
          payload?.TotalPages ??
          (page1.data as any)?.metadata?.totalPages ??
          1,
      );
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: Math.min(totalPages - 1, 4) }, (_, i) =>
            productApi.getAll(i + 2, 100),
          ),
        );
        for (const res of rest) {
          products = products.concat(mapBackendProductsResponse(res));
        }
      }
      return dedupeActive(products);
    } catch (error) {
      throw parseApiError(error);
    }
  },

  /** Alias — DealerManagement.Api has no coverage filter */
  fetchByCoverageArea: async (_coverageAreaId: number): Promise<Product[]> => {
    return ProductService.fetchActiveProducts();
  },
};

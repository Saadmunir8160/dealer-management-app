import Config from '@config';
import { productApi } from '@api/productApi';
import { Product } from '@types';
import { parseApiError } from '@utils/errorHandler';
import { mapBackendProductsResponse } from '@utils/productMappers';
import { MOCK_PRODUCTS } from '@mock/data/products.mock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ProductService = {
  fetchActiveProducts: async (): Promise<Product[]> => {
    try {
      if (Config.USE_MOCK) {
        await delay(Config.MOCK_DELAY_MS);
        return MOCK_PRODUCTS.filter(p => p.status);
      }
      const response = await productApi.getAll();
      return mapBackendProductsResponse(response).filter(p => p.status);
    } catch (error) {
      throw parseApiError(error);
    }
  },
};

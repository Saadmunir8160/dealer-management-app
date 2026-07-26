import { Product } from '@types';

interface BackendProductDto {
  id?: number;
  Id?: number;
  productName?: string;
  ProductName?: string;
  sku?: string | null;
  SKU?: string | null;
  unitPrice?: number;
  UnitPrice?: number;
  isActive?: boolean;
  IsActive?: boolean;
  createdDate?: string;
  CreatedDate?: string;
}

export const mapBackendProduct = (dto: BackendProductDto): Product => ({
  productId: dto.id ?? dto.Id ?? 0,
  productName: dto.productName ?? dto.ProductName ?? '—',
  sku: dto.sku ?? dto.SKU ?? null,
  price: Number(dto.unitPrice ?? dto.UnitPrice ?? 0),
  stock: 0,
  status: dto.isActive ?? dto.IsActive ?? true,
  createdDate: String(dto.createdDate ?? dto.CreatedDate ?? new Date().toISOString()),
});

export const mapBackendProductsResponse = (axiosResponse: {
  data?: {
    success?: boolean;
    data?: BackendProductDto[] | { items?: BackendProductDto[]; Items?: BackendProductDto[] };
  };
}): Product[] => {
  const payload = axiosResponse?.data?.data;
  if (Array.isArray(payload)) {
    return payload.map(mapBackendProduct).filter(p => p.productId > 0);
  }
  if (payload && typeof payload === 'object') {
    const items = payload.items ?? payload.Items ?? [];
    return items.map(mapBackendProduct).filter(p => p.productId > 0);
  }
  return [];
};

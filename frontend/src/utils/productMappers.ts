import { Product } from '@types';
import { inferProductUnit } from './productUnit';

interface BackendProductDto {
  productId?: number;
  ProductId?: number;
  id?: number;
  Id?: number;
  name?: string;
  Name?: string;
  productName?: string;
  ProductName?: string;
  productCode?: string | null;
  ProductCode?: string | null;
  arabicName?: string | null;
  ArabicName?: string | null;
  sku?: string | null;
  SKU?: string | null;
  Sku?: string | null;
  code?: string | null;
  Code?: string | null;
  type?: string | null;
  Type?: string | null;
  unitOfMeasure?: string | null;
  UnitOfMeasure?: string | null;
  price?: number;
  Price?: number;
  unitPrice?: number;
  UnitPrice?: number;
  isActive?: boolean;
  IsActive?: boolean;
  createdDate?: string;
  CreatedDate?: string;
}

export const mapBackendProduct = (dto: BackendProductDto): Product => {
  const productName = dto.name ?? dto.Name ?? dto.productName ?? dto.ProductName ?? '—';
  const sku = dto.sku ?? dto.SKU ?? dto.Sku ?? null;
  const rawCode = dto.code ?? dto.Code ?? dto.productCode ?? dto.ProductCode ?? null;
  const code = rawCode != null && String(rawCode).trim() ? String(rawCode).trim() : null;
  const type = dto.type ?? dto.Type ?? dto.unitOfMeasure ?? dto.UnitOfMeasure ?? null;

  return {
    productId: dto.productId ?? dto.ProductId ?? dto.id ?? dto.Id ?? 0,
    productName,
    sku,
    code,
    arabicName: dto.arabicName ?? dto.ArabicName ?? null,
    type,
    unit: inferProductUnit(type, productName, sku, code),
    price: Number(dto.price ?? dto.Price ?? dto.unitPrice ?? dto.UnitPrice ?? 0),
    stock: 0,
    status: dto.isActive ?? dto.IsActive ?? true,
    createdDate: String(dto.createdDate ?? dto.CreatedDate ?? new Date().toISOString()),
  };
};

export const mapBackendProductsResponse = (axiosResponse: {
  data?: any;
}): Product[] => {
  const envelope = axiosResponse?.data;
  // DealerManagement.Api: { success, data: { items, totalCount, ... } }
  const payload = envelope?.data ?? envelope?.Data ?? envelope;

  let list: BackendProductDto[] = [];
  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload && typeof payload === 'object') {
    list = payload.items ?? payload.Items ?? payload.data ?? payload.Data ?? [];
  }

  return (list || []).map(mapBackendProduct).filter(p => p.productId > 0);
};

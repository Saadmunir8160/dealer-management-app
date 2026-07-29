import { Product, ProductUnit } from '@types';

/** Infer BAGS / TONS / PCS from UCIC type + name (matches portal labels). */
export const inferProductUnit = (
  type?: string | null,
  name?: string | null,
  sku?: string | null,
  code?: string | null,
): ProductUnit => {
  const blob = `${type ?? ''} ${name ?? ''} ${sku ?? ''} ${code ?? ''}`.toLowerCase();
  if (/\b(ton|tons|bulk)\b/.test(blob) || blob.includes('طن')) return 'TONS';
  if (/\b(bag|bags)\b/.test(blob) || blob.includes('مكيس') || blob.includes('أكياس')) {
    return 'BAGS';
  }
  if (type) {
    const t = type.trim().toUpperCase();
    if (t === 'TONS' || t === 'TON') return 'TONS';
    if (t === 'BAGS' || t === 'BAG') return 'BAGS';
  }
  return 'PCS';
};

export const getProductUnit = (product?: Product | null): ProductUnit =>
  product?.unit ?? 'PCS';

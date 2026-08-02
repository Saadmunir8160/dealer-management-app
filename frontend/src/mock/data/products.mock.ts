import { Product } from '@types';
import { inferProductUnit } from '@utils/productUnit';

/** Same UCIC "Please Select Item Code" catalog as API seed */
export const MOCK_PRODUCTS: Product[] = [
  { productId: 1, productName: 'SCRAP-Switch Breaker القواطع', sku: '5719', code: '5719', unit: 'PCS', price: 100, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 2, productName: '5501', sku: '5501', code: '5501', unit: 'TONS', price: 280, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 3, productName: '5505 - MCT Bulk (Masonery Cement - Tameer)', sku: '5505', code: '5505', unit: 'TONS', price: 290, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 4, productName: '5601 - OPC Bags (إسمنت بورتلاندي عادي - مكيس)', sku: '5601', code: '5601', unit: 'BAGS', price: 18, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 5, productName: '5602 - SRC Bags (أسمنت مكيس مقاوم للكبريتات)', sku: '5602', code: '5602', unit: 'BAGS', price: 19, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 6, productName: '5603 - PPC Bags (إسمنت بورتلاندي بوزولاني - مكيس)', sku: '5603', code: '5603', unit: 'BAGS', price: 17, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 7, productName: '5604 - MCT Bags (إسمنت التشطيب - مكيس تعمير)', sku: '5604', code: '5604', unit: 'BAGS', price: 20, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 8, productName: '5703 - SCRAP-MIXED STEEL - حديد مشكل', sku: '5703', code: '5703', unit: 'PCS', price: 150, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 9, productName: 'ttnew', sku: '5828', code: '5828', unit: 'BAGS', price: 10, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 10, productName: 'new test', sku: '0021', code: '0021', unit: 'BAGS', price: 10, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 11, productName: 'ttnew1', sku: '5557', code: '5557', unit: 'BAGS', price: 10, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
  { productId: 12, productName: 'ttnew1', sku: '55', code: '55', unit: 'BAGS', price: 10, stock: 100, status: true, createdDate: '2024-01-01T00:00:00.000Z' },
].map(p => ({
  ...p,
  unit: inferProductUnit(null, p.productName, p.sku, p.code),
}));

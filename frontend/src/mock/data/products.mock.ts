// ─────────────────────────────────────────────────────────────────────────────
// src/mock/data/products.mock.ts
//
// WHY THIS FILE EXISTS:
//   Fake product records that mirror your SQL Server Products table.
//   Used when creating orders — the user picks from this list.
//
// MATCHES SQL:
//   INSERT INTO Products (ProductName, SKU, Price, Stock)
//   VALUES
//     ('Cement Bag', 'CB001', 1200, 500),
//     ('Steel Rod',  'SR001', 2500, 300),
//     ('Bricks',     'BR001', 18,   10000);
// ─────────────────────────────────────────────────────────────────────────────

import { Product } from '@types';

export const MOCK_PRODUCTS: Product[] = [
  {
    productId: 1,
    productName: 'Cement Bag',
    sku: 'CB001',
    price: 1200,
    stock: 500,
    status: true,
    createdDate: '2024-01-01T00:00:00.000Z',
  },
  {
    productId: 2,
    productName: 'Steel Rod',
    sku: 'SR001',
    price: 2500,
    stock: 300,
    status: true,
    createdDate: '2024-01-01T00:00:00.000Z',
  },
  {
    productId: 3,
    productName: 'Bricks',
    sku: 'BR001',
    price: 18,
    stock: 10000,
    status: true,
    createdDate: '2024-01-01T00:00:00.000Z',
  },
  {
    productId: 4,
    productName: 'Sand (per cubic ft)',
    sku: 'SD001',
    price: 150,
    stock: 5000,
    status: true,
    createdDate: '2024-01-05T00:00:00.000Z',
  },
  {
    productId: 5,
    productName: 'Gravel (per cubic ft)',
    sku: 'GR001',
    price: 200,
    stock: 4000,
    status: true,
    createdDate: '2024-01-05T00:00:00.000Z',
  },
  {
    productId: 6,
    productName: 'Paint (20L)',
    sku: 'PT001',
    price: 3500,
    stock: 200,
    status: true,
    createdDate: '2024-01-10T00:00:00.000Z',
  },
  {
    productId: 7,
    productName: 'PVC Pipe (per meter)',
    sku: 'PV001',
    price: 450,
    stock: 1500,
    status: true,
    createdDate: '2024-01-10T00:00:00.000Z',
  },
  {
    productId: 8,
    productName: 'Ceramic Tiles (per sqft)',
    sku: 'CT001',
    price: 120,
    stock: 8000,
    status: false, // out of stock / discontinued
    createdDate: '2024-01-15T00:00:00.000Z',
  },
];

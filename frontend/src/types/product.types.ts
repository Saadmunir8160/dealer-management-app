// ─────────────────────────────────────────────────────────────────────────────
// src/types/product.types.ts
//
// WHY THIS FILE EXISTS:
//   Products are selected when creating an order.
//   These types mirror the SQL Server "Products" table exactly.
//
// SQL SERVER TABLE: Products
//   ProductId    INT IDENTITY PRIMARY KEY
//   ProductName  NVARCHAR(150)
//   SKU          NVARCHAR(50)
//   Price        DECIMAL(18,2)
//   Stock        INT DEFAULT 0
//   Status       BIT DEFAULT 1
//   CreatedDate  DATETIME DEFAULT GETDATE()
// ─────────────────────────────────────────────────────────────────────────────

// ── Product ───────────────────────────────────────────────────────────────────
// Represents one row from the Products table.
/** Display / summary unit inferred from UCIC product type or name */
export type ProductUnit = 'BAGS' | 'TONS' | 'PCS';

export interface Product {
  productId: number;    // INT IDENTITY — primary key
  productName: string;  // NVARCHAR(150) — display name
  sku: string | null;   // NVARCHAR(50)  — stock keeping unit code
  /** UCIC LN / product code (e.g. 5801) */
  code: string | null;
  arabicName?: string | null;
  /** UCIC Type field when present */
  type?: string | null;
  unit: ProductUnit;
  price: number;        // DECIMAL(18,2) — unit price in PKR
  stock: number;        // INT           — available quantity
  status: boolean;      // BIT           — true = available for ordering
  createdDate: string;  // DATETIME as ISO string
}

// ── Product List Params ───────────────────────────────────────────────────────
// Query parameters for GET /api/products
export interface ProductListParams {
  page: number;
  limit: number;
  search?: string;   // searches productName, SKU
  status?: boolean;  // true = active products only
}

// ── Product State ─────────────────────────────────────────────────────────────
export interface ProductState {
  list: {
    data: Product[];
    total: number;
    isLoading: boolean;
    error: string | null;
  };
}

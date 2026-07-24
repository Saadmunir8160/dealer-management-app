// ─────────────────────────────────────────────────────────────────────────────
// src/types/api.types.ts
// Standard API response envelope shapes.
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

// Alias for shorter imports
export type PaginatedResponse<T> = PaginatedApiResponse<T>;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}

export interface ListState<T> {
  data: T[];
  status: AsyncStatus;
  error: string | null;
  pagination: Pagination | null;
}

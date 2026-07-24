// ─────────────────────────────────────────────────────────────────────────────
// src/types/common.types.ts
// Shared utility types reused across multiple domains.
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  width?: number;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

export interface ListAsyncState<T> {
  data: T[];
  status: LoadingState;
  error: string | null;
  pagination: import('./api.types').Pagination | null;
}

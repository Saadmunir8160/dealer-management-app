// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useDealers.ts
// Encapsulates dealer list state and fetch logic for UI components.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { fetchDealersThunk } from '@store/slices/dealerSlice';
import { DealerListParams } from '@types';
import { PAGINATION } from '@constants';

export const useDealers = (params?: Partial<DealerListParams>) => {
  const dispatch = useAppDispatch();
  const { data: dealers, status, error, pagination } = useAppSelector(state => state.dealers.list);

  const fetchDealers = useCallback(
    (overrideParams?: Partial<DealerListParams>) => {
      dispatch(
        fetchDealersThunk({
          page: PAGINATION.DEFAULT_PAGE,
          limit: PAGINATION.DEFAULT_LIMIT,
          ...params,
          ...overrideParams,
        }),
      );
    },
    [dispatch, params],
  );

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  return {
    dealers,
    isLoading: status === 'loading',
    isError: status === 'failed',
    error,
    pagination,
    refetch: fetchDealers,
  };
};

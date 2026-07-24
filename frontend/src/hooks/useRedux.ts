// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useAppDispatch.ts & useAppSelector.ts combined
// Typed wrappers around useDispatch and useSelector.
// Always use these instead of the raw hooks.
// ─────────────────────────────────────────────────────────────────────────────
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from '@store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

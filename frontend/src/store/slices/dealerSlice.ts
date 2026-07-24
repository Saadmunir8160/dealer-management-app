// ─────────────────────────────────────────────────────────────────────────────
// src/store/slices/dealerSlice.ts
// Redux slice for dealer management state.
// ─────────────────────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Dealer, DealerListParams, ListAsyncState, AsyncState } from '@types';
import { DealerService } from '@services/dealerService';
import { Pagination } from '@types';

interface DealerState {
  list: ListAsyncState<Dealer>;
  detail: AsyncState<Dealer>;
}

const initialState: DealerState = {
  list: { data: [], status: 'idle', error: null, pagination: null },
  detail: { data: null, status: 'idle', error: null },
};

export const fetchDealersThunk = createAsyncThunk(
  'dealers/fetchAll',
  async (params: DealerListParams, { rejectWithValue }) => {
    try {
      return await DealerService.fetchDealers(params);
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchDealerByIdThunk = createAsyncThunk(
  'dealers/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await DealerService.fetchDealerById(id);
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

const dealerSlice = createSlice({
  name: 'dealers',
  initialState,
  reducers: {
    clearDealerDetail: state => {
      state.detail = initialState.detail;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDealersThunk.pending, state => { state.list.status = 'loading'; })
      .addCase(fetchDealersThunk.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.data = action.payload.data;
        state.list.pagination = action.payload.pagination as Pagination;
      })
      .addCase(fetchDealersThunk.rejected, (state, action) => {
        state.list.status = 'failed';
        state.list.error = (action.payload as { message: string })?.message ?? 'Failed to fetch dealers';
      })

      .addCase(fetchDealerByIdThunk.pending, state => { state.detail.status = 'loading'; })
      .addCase(fetchDealerByIdThunk.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.data = action.payload;
      })
      .addCase(fetchDealerByIdThunk.rejected, (state, action) => {
        state.detail.status = 'failed';
        state.detail.error = (action.payload as { message: string })?.message ?? 'Failed to fetch dealer';
      });
  },
});

export const { clearDealerDetail } = dealerSlice.actions;
export default dealerSlice.reducer;

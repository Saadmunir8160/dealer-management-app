// ─────────────────────────────────────────────────────────────────────────────
// src/mock/handlers/dealerHandler.mock.ts
//
// WHY THIS FILE EXISTS:
//   Simulates your backend's /api/dealers/* endpoints.
//   Uses an in-memory copy of MOCK_DEALERS so create/update/delete
//   operations actually work during development.
//
// SIMULATED ENDPOINTS:
//   GET    /api/dealers          → paginated list with search/filter
//   GET    /api/dealers/:id      → single dealer by ID
//   POST   /api/dealers          → create new dealer
//   PUT    /api/dealers/:id      → update dealer
//   DELETE /api/dealers/:id      → soft delete (sets status = false)
// ─────────────────────────────────────────────────────────────────────────────

import {
  Dealer,
  DealerListParams,
  CreateDealerRequest,
  UpdateDealerRequest,
  ApiResponse,
  PaginatedApiResponse,
} from '@types';
import { MOCK_DEALERS } from '../data/dealers.mock';

// ── In-Memory Database ────────────────────────────────────────────────────────
// We copy the mock data so mutations (create/update/delete) persist
// during the app session but reset when the app restarts.
let dealersDb: Dealer[] = [...MOCK_DEALERS];
let nextId = dealersDb.length + 1; // simulates INT IDENTITY auto-increment

// ── Get All Dealers ───────────────────────────────────────────────────────────
export const mockGetDealers = async (
  params: DealerListParams,
): Promise<PaginatedApiResponse<Dealer>> => {
  const { page, limit, search, status, city } = params;

  // Simulate SQL WHERE clause
  let filtered = dealersDb.filter(dealer => {
    // Search filter: WHERE DealerName LIKE '%search%' OR City LIKE '%search%'
    if (search) {
      const q = search.toLowerCase();
      const matches =
        dealer.dealerName.toLowerCase().includes(q) ||
        dealer.contactPerson?.toLowerCase().includes(q) ||
        dealer.city?.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Status filter: WHERE Status = @status
    if (status !== undefined) {
      if (dealer.status !== status) return false;
    }

    // City filter: WHERE City = @city
    if (city) {
      if (dealer.city?.toLowerCase() !== city.toLowerCase()) return false;
    }

    return true;
  });

  // Simulate SQL: SELECT COUNT(*) FROM filtered
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);

  // Simulate SQL: OFFSET (page-1)*limit ROWS FETCH NEXT limit ROWS ONLY
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    success: true,
    message: 'Dealers fetched successfully',
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// ── Get Dealer By ID ──────────────────────────────────────────────────────────
export const mockGetDealerById = async (
  id: number,
): Promise<ApiResponse<Dealer>> => {
  // Simulate: SELECT * FROM Dealers WHERE DealerId = @id
  const dealer = dealersDb.find(d => d.dealerId === id);

  if (!dealer) {
    throw {
      message: `Dealer with ID ${id} not found.`,
      statusCode: 404,
    };
  }

  return {
    success: true,
    message: 'Dealer fetched successfully',
    data: dealer,
  };
};

// ── Create Dealer ─────────────────────────────────────────────────────────────
export const mockCreateDealer = async (
  payload: CreateDealerRequest,
): Promise<ApiResponse<Dealer>> => {
  // Simulate: INSERT INTO Dealers (...) VALUES (...)
  const newDealer: Dealer = {
    dealerId: nextId++,
    dealerName: payload.dealerName,
    contactPerson: payload.contactPerson,
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
    city: payload.city,
    status: true, // new dealers are active by default
    createdDate: new Date().toISOString(),
  };

  dealersDb.push(newDealer);

  return {
    success: true,
    message: 'Dealer created successfully',
    data: newDealer,
  };
};

// ── Update Dealer ─────────────────────────────────────────────────────────────
export const mockUpdateDealer = async (
  id: number,
  payload: UpdateDealerRequest,
): Promise<ApiResponse<Dealer>> => {
  // Simulate: SELECT * FROM Dealers WHERE DealerId = @id
  const index = dealersDb.findIndex(d => d.dealerId === id);

  if (index === -1) {
    throw {
      message: `Dealer with ID ${id} not found.`,
      statusCode: 404,
    };
  }

  // Simulate: UPDATE Dealers SET ... WHERE DealerId = @id
  dealersDb[index] = { ...dealersDb[index], ...payload };

  return {
    success: true,
    message: 'Dealer updated successfully',
    data: dealersDb[index],
  };
};

// ── Delete Dealer ─────────────────────────────────────────────────────────────
// We do a SOFT DELETE — set status = false instead of removing the row.
// This is best practice: never hard-delete business data.
export const mockDeleteDealer = async (
  id: number,
): Promise<ApiResponse<null>> => {
  const index = dealersDb.findIndex(d => d.dealerId === id);

  if (index === -1) {
    throw {
      message: `Dealer with ID ${id} not found.`,
      statusCode: 404,
    };
  }

  // Simulate: UPDATE Dealers SET Status = 0 WHERE DealerId = @id
  dealersDb[index] = { ...dealersDb[index], status: false };

  return {
    success: true,
    message: 'Dealer deactivated successfully',
    data: null,
  };
};

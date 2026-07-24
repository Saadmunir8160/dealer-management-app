// ─────────────────────────────────────────────────────────────────────────────
// src/mock/data/dealers.mock.ts
//
// WHY THIS FILE EXISTS:
//   Fake dealer records that mirror your SQL Server Dealers table.
//   Used by mock API handlers to simulate GET /api/dealers responses.
//
// MATCHES SQL:
//   INSERT INTO Dealers (DealerName, ContactPerson, Phone, Email, Address, City)
//   VALUES
//     ('ABC Traders', 'Ahmed Ali', '03001111111', 'abc@gmail.com', 'Main Road', 'Lahore'),
//     ('XYZ Traders', 'Ali Khan',  '03002222222', 'xyz@gmail.com', 'Mall Road', 'Karachi');
// ─────────────────────────────────────────────────────────────────────────────

import { Dealer } from '@types';

export const MOCK_DEALERS: Dealer[] = [
  {
    dealerId: 1,
    dealerName: 'ABC Traders',
    contactPerson: 'Ahmed Ali',
    phone: '03001111111',
    email: 'abc@gmail.com',
    address: 'Main Road, Block 5',
    city: 'Lahore',
    status: true,
    createdDate: '2024-01-10T08:00:00.000Z',
  },
  {
    dealerId: 2,
    dealerName: 'XYZ Traders',
    contactPerson: 'Ali Khan',
    phone: '03002222222',
    email: 'xyz@gmail.com',
    address: 'Mall Road, Saddar',
    city: 'Karachi',
    status: true,
    createdDate: '2024-01-12T09:30:00.000Z',
  },
  {
    dealerId: 3,
    dealerName: 'Al-Noor Builders Supply',
    contactPerson: 'Usman Tariq',
    phone: '03111234567',
    email: 'alnoor@gmail.com',
    address: 'GT Road, Sector G-9',
    city: 'Islamabad',
    status: true,
    createdDate: '2024-01-20T10:00:00.000Z',
  },
  {
    dealerId: 4,
    dealerName: 'Pak Steel Distributors',
    contactPerson: 'Bilal Hussain',
    phone: '03219876543',
    email: 'paksteel@gmail.com',
    address: 'Industrial Area, Phase 2',
    city: 'Faisalabad',
    status: true,
    createdDate: '2024-02-01T11:00:00.000Z',
  },
  {
    dealerId: 5,
    dealerName: 'Rehman Construction Materials',
    contactPerson: 'Rehman Malik',
    phone: '03334455667',
    email: 'rehman.const@gmail.com',
    address: 'Circular Road',
    city: 'Multan',
    status: false, // inactive dealer
    createdDate: '2024-02-10T08:00:00.000Z',
  },
  {
    dealerId: 6,
    dealerName: 'City Cement Depot',
    contactPerson: 'Kamran Iqbal',
    phone: '03451122334',
    email: 'citycement@gmail.com',
    address: 'Cantt Area, Main Boulevard',
    city: 'Rawalpindi',
    status: true,
    createdDate: '2024-02-15T09:00:00.000Z',
  },
  {
    dealerId: 7,
    dealerName: 'Sunrise Building Supplies',
    contactPerson: 'Tariq Mehmood',
    phone: '03009988776',
    email: 'sunrise.build@gmail.com',
    address: 'Model Town, Link Road',
    city: 'Lahore',
    status: true,
    createdDate: '2024-03-01T10:00:00.000Z',
  },
  {
    dealerId: 8,
    dealerName: 'Hassan Hardware & Cement',
    contactPerson: 'Hassan Raza',
    phone: '03125544332',
    email: 'hassan.hw@gmail.com',
    address: 'Korangi Industrial Area',
    city: 'Karachi',
    status: false, // inactive dealer
    createdDate: '2024-03-05T11:00:00.000Z',
  },
];

import { User } from '@types';

export const MOCK_USERS: User[] = [
  {
    userId: 1,
    fullName: 'Mashid Trading & Transport',
    email: 'dealer@ucic.com',
    phone: '+966501234567',
    role: 'Dealer',
    isActive: true,
    createdDate: '2023-10-25T16:01:45.000Z',
    customerNameAr: 'شركة مشيد للتجارة والنقل',
    customerCode: null,
    lnCode: '1087',
    username: 'mashid.dealer',
    availableCredit: 0,
    creditExpiry: '2025-12-23',
    verificationStatus: 'Not Verified',
  },
  {
    userId: 2,
    fullName: 'Admin User',
    email: 'admin@dealer.com',
    phone: '03001234567',
    role: 'Admin',
    isActive: true,
    createdDate: '2024-01-01T00:00:00.000Z',
    username: 'admin',
    availableCredit: 0,
    verificationStatus: 'Verified',
  },
];

export const MOCK_CREDENTIALS: Record<string, string> = {
  'dealer@ucic.com': '123456',
  'admin@dealer.com': '123456',
};

export const MOCK_TOKEN = 'mock.jwt.token.for.development.only';
export const MOCK_REFRESH_TOKEN = 'mock.refresh.token.for.development.only';

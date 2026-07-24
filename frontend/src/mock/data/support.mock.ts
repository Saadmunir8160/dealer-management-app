import { SupportTicket, SupportContactInfo } from '@types';

export const MOCK_SUPPORT_CONTACT: SupportContactInfo = {
  phone: '+966 11 234 5678',
  email: 'support@ucic.com',
  whatsapp: '+966 50 123 4567',
};

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    ticketId: 1,
    subject: 'Delivery delay inquiry',
    category: 'Orders',
    priority: 'Medium',
    description: 'Need update on coupon CPN-1004 delivery.',
    status: 'Open',
    createdAt: '2024-03-20T09:00:00.000Z',
  },
];

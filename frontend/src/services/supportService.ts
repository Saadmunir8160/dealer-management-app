import { CreateSupportTicketRequest, SupportContactInfo, SupportTicket } from '@types';
import { Config } from '@config';
import { MOCK_SUPPORT_CONTACT, MOCK_SUPPORT_TICKETS } from '../mock/data/support.mock';

let ticketsDb: SupportTicket[] = [...MOCK_SUPPORT_TICKETS];
let nextId = ticketsDb.length + 1;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const SupportService = {
  getContactInfo: async (): Promise<SupportContactInfo> => {
    if (Config.USE_MOCK) {
      await delay(Config.MOCK_DELAY_MS);
      return MOCK_SUPPORT_CONTACT;
    }
    return MOCK_SUPPORT_CONTACT;
  },

  getTickets: async (): Promise<SupportTicket[]> => {
    if (Config.USE_MOCK) {
      await delay(Config.MOCK_DELAY_MS);
      return [...ticketsDb];
    }
    return [...ticketsDb];
  },

  createTicket: async (payload: CreateSupportTicketRequest): Promise<SupportTicket> => {
    await delay(Config.MOCK_DELAY_MS);
    const ticket: SupportTicket = {
      ticketId: nextId++,
      ...payload,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    ticketsDb = [ticket, ...ticketsDb];
    return ticket;
  },
};

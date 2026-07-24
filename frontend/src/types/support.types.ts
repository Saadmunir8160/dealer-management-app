export type SupportPriority = 'Low' | 'Medium' | 'High';
export type SupportTicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface SupportTicket {
  ticketId: number;
  subject: string;
  category: string;
  priority: SupportPriority;
  description: string;
  status: SupportTicketStatus;
  createdAt: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  category: string;
  priority: SupportPriority;
  description: string;
}

export interface SupportContactInfo {
  phone: string;
  email: string;
  whatsapp: string;
}

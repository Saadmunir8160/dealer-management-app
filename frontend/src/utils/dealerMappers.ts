import { Dealer } from '@types';

interface BackendDealerDto {
  id?: number;
  Id?: number;
  dealerName?: string;
  DealerName?: string;
  contactPerson?: string | null;
  ContactPerson?: string | null;
  phone?: string | null;
  Phone?: string | null;
  email?: string | null;
  Email?: string | null;
  notes?: string | null;
  Notes?: string | null;
  status?: string | number | boolean;
  Status?: string | number | boolean;
  createdDate?: string;
  CreatedDate?: string;
  addresses?: Array<{ city?: string; City?: string; isDefault?: boolean; IsDefault?: boolean }>;
  Addresses?: Array<{ city?: string; City?: string; isDefault?: boolean; IsDefault?: boolean }>;
}

const mapStatus = (status: string | number | boolean | undefined): boolean => {
  if (typeof status === 'boolean') return status;
  if (typeof status === 'number') return status === 1; // DealerStatus.Active = 1
  const s = String(status ?? '').toLowerCase();
  return s === 'active' || s === '1' || s === 'true';
};

export const mapBackendDealer = (dto: BackendDealerDto): Dealer => {
  const addresses = dto.addresses ?? dto.Addresses ?? [];
  const defaultAddr = addresses.find(a => a.isDefault ?? a.IsDefault) ?? addresses[0];
  const city = defaultAddr?.city ?? defaultAddr?.City ?? null;
  const notes = dto.notes ?? dto.Notes ?? null;

  return {
    dealerId: dto.id ?? dto.Id ?? 0,
    dealerName: dto.dealerName ?? dto.DealerName ?? '—',
    contactPerson: dto.contactPerson ?? dto.ContactPerson ?? null,
    phone: dto.phone ?? dto.Phone ?? null,
    email: dto.email ?? dto.Email ?? null,
    address: notes,
    city,
    status: mapStatus(dto.status ?? dto.Status),
    createdDate: String(dto.createdDate ?? dto.CreatedDate ?? new Date().toISOString()),
  };
};

export const mapBackendDealersList = (axiosData: unknown): Dealer[] => {
  const envelope = axiosData as {
    data?: BackendDealerDto[] | { items?: BackendDealerDto[]; Items?: BackendDealerDto[] };
  };
  const payload = envelope?.data;
  if (Array.isArray(payload)) {
    return payload.map(mapBackendDealer).filter(d => d.dealerId > 0);
  }
  if (payload && typeof payload === 'object') {
    const items = payload.items ?? payload.Items ?? [];
    return items.map(mapBackendDealer).filter(d => d.dealerId > 0);
  }
  return [];
};

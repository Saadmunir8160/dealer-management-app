import { Dealer } from '@types';

interface BackendDealerDto {
  id?: number;
  Id?: number;
  dealerId?: number;
  DealerId?: number;
  dealerCode?: string;
  DealerCode?: string;
  dealerName?: string;
  DealerName?: string;
  contactPerson?: string | null;
  ContactPerson?: string | null;
  email?: string | null;
  Email?: string | null;
  phone?: string | null;
  Phone?: string | null;
  mobile?: string | null;
  Mobile?: string | null;
  status?: string | boolean | number;
  Status?: string | boolean | number;
  createdDate?: string;
  CreatedDate?: string;
  addresses?: BackendAddressDto[];
  Addresses?: BackendAddressDto[];
}

interface BackendAddressDto {
  addressLine1?: string | null;
  AddressLine1?: string | null;
  city?: string | null;
  City?: string | null;
  isDefault?: boolean;
  IsDefault?: boolean;
}

const isActiveStatus = (status: string | boolean | number | undefined): boolean => {
  if (typeof status === 'boolean') return status;
  if (typeof status === 'number') return status === 1;
  const s = String(status ?? 'Active').toLowerCase();
  return s === 'active' || s === 'true' || s === '1';
};

export const mapBackendDealer = (dto: BackendDealerDto): Dealer => {
  const addresses = dto.addresses ?? dto.Addresses ?? [];
  const primary =
    addresses.find(a => a.isDefault ?? a.IsDefault) ?? addresses[0] ?? null;

  return {
    dealerId: dto.dealerId ?? dto.DealerId ?? dto.id ?? dto.Id ?? 0,
    dealerName: String(dto.dealerName ?? dto.DealerName ?? '—'),
    contactPerson: dto.contactPerson ?? dto.ContactPerson ?? null,
    phone: dto.phone ?? dto.Phone ?? dto.mobile ?? dto.Mobile ?? null,
    email: dto.email ?? dto.Email ?? null,
    address: primary?.addressLine1 ?? primary?.AddressLine1 ?? null,
    city: primary?.city ?? primary?.City ?? null,
    status: isActiveStatus(dto.status ?? dto.Status),
    createdDate: String(
      dto.createdDate ?? dto.CreatedDate ?? new Date().toISOString(),
    ),
  };
};

/** Map DealerManagement.Api GET /dealers paged response → Dealer[] */
export const mapBackendDealersList = (axiosData: unknown): Dealer[] => {
  const envelope = axiosData as {
    data?: any;
    Data?: any;
    success?: boolean;
  };

  const payload = envelope?.data ?? envelope?.Data ?? envelope;
  let list: BackendDealerDto[] = [];

  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload && typeof payload === 'object') {
    list =
      payload.items ??
      payload.Items ??
      payload.data ??
      payload.Data ??
      [];
  }

  return (list || [])
    .map(mapBackendDealer)
    .filter(d => d.dealerId > 0)
    .sort((a, b) => a.dealerName.localeCompare(b.dealerName));
};

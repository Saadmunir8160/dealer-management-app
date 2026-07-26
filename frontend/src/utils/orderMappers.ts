import { Order, OrderItem, OrderSummary, OrderStatus, PaginatedResponse } from '@types';

/** Backend OrderDto (camelCase from ASP.NET) */
interface BackendOrderItemDto {
  id?: number;
  Id?: number;
  productId?: number;
  ProductId?: number;
  productName?: string;
  ProductName?: string;
  quantity?: number;
  Quantity?: number;
  unitPrice?: number;
  UnitPrice?: number;
  total?: number;
  Total?: number;
}

interface BackendOrderDto {
  id?: number;
  Id?: number;
  orderNumber?: string;
  OrderNumber?: string;
  dealerId?: number;
  DealerId?: number;
  dealerName?: string;
  DealerName?: string;
  orderDate?: string;
  OrderDate?: string;
  totalAmount?: number;
  TotalAmount?: number;
  status?: string | number;
  Status?: string | number;
  shippingAddress?: string | null;
  ShippingAddress?: string | null;
  couponNumber?: string | null;
  CouponNumber?: string | null;
  erpOrderNumber?: string | null;
  ErpOrderNumber?: string | null;
  deliveryArea?: string | null;
  DeliveryArea?: string | null;
  driver?: string | null;
  Driver?: string | null;
  vehicle?: string | null;
  Vehicle?: string | null;
  referenceNumber?: string | null;
  ReferenceNumber?: string | null;
  items?: BackendOrderItemDto[];
  Items?: BackendOrderItemDto[];
  createdDate?: string;
  CreatedDate?: string;
}

interface BackendPagedResult {
  items?: BackendOrderDto[];
  Items?: BackendOrderDto[];
  totalCount?: number;
  TotalCount?: number;
  pageNumber?: number;
  PageNumber?: number;
  pageSize?: number;
  PageSize?: number;
  totalPages?: number;
  TotalPages?: number;
}

const STATUS_MAP: Record<string, OrderStatus> = {
  '0': 'Pending', // Draft → show as Pending in UI
  '1': 'Pending',
  '2': 'Confirmed',
  '3': 'Processing',
  '4': 'Shipped',
  '5': 'Delivered',
  '6': 'Delivered', // Completed
  '7': 'Cancelled',
  '8': 'Cancelled', // Returned
  Draft: 'Pending',
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Completed: 'Delivered',
  Cancelled: 'Cancelled',
  Returned: 'Cancelled',
};

export const mapBackendStatus = (status: string | number | undefined): OrderStatus => {
  if (status === undefined || status === null) return 'Pending';
  const key = String(status);
  return STATUS_MAP[key] ?? 'Pending';
};

export const mapBackendOrderToSummary = (dto: BackendOrderDto): OrderSummary => {
  const orderId = dto.id ?? dto.Id ?? 0;
  const orderNumber = dto.orderNumber ?? dto.OrderNumber ?? `ORD-${orderId}`;
  const items = dto.items ?? dto.Items ?? [];

  return {
    orderId,
    dealerName: dto.dealerName ?? dto.DealerName ?? '—',
    salesPerson: '—',
    orderDate: String(dto.orderDate ?? dto.OrderDate ?? dto.createdDate ?? dto.CreatedDate ?? new Date().toISOString()),
    totalAmount: Number(dto.totalAmount ?? dto.TotalAmount ?? 0),
    status: mapBackendStatus(dto.status ?? dto.Status),
    couponNumber: dto.couponNumber ?? dto.CouponNumber ?? orderNumber,
    erpOrderNumber: dto.erpOrderNumber ?? dto.ErpOrderNumber ?? dto.referenceNumber ?? dto.ReferenceNumber ?? null,
    deliveryArea: dto.deliveryArea ?? dto.DeliveryArea ?? dto.shippingAddress ?? dto.ShippingAddress ?? null,
    driver: dto.driver ?? dto.Driver ?? null,
    vehicle: dto.vehicle ?? dto.Vehicle ?? null,
    itemCount: Array.isArray(items) ? items.length : 0,
  };
};

export const mapBackendOrderToDetail = (dto: BackendOrderDto | Record<string, unknown>): Order => {
  const d = dto as BackendOrderDto;
  const orderId = d.id ?? d.Id ?? 0;
  const rawItems = d.items ?? d.Items ?? [];
  const items: OrderItem[] = rawItems.map((item, index) => {
    const quantity = Number(item.quantity ?? item.Quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.UnitPrice ?? 0);
    return {
      orderItemId: item.id ?? item.Id ?? index + 1,
      orderId,
      productId: item.productId ?? item.ProductId ?? 0,
      productName: item.productName ?? item.ProductName ?? '—',
      quantity,
      unitPrice,
      totalPrice: Number(item.total ?? item.Total ?? quantity * unitPrice),
    };
  });

  return {
    orderId,
    dealerId: d.dealerId ?? d.DealerId ?? 0,
    dealerName: d.dealerName ?? d.DealerName ?? '—',
    userId: 0,
    salesPerson: '—',
    orderDate: String(d.orderDate ?? d.OrderDate ?? d.createdDate ?? d.CreatedDate ?? new Date().toISOString()),
    totalAmount: Number(d.totalAmount ?? d.TotalAmount ?? 0),
    status: mapBackendStatus(d.status ?? d.Status),
    couponNumber: d.couponNumber ?? d.CouponNumber ?? d.orderNumber ?? d.OrderNumber,
    erpOrderNumber: d.erpOrderNumber ?? d.ErpOrderNumber ?? d.referenceNumber ?? d.ReferenceNumber ?? null,
    deliveryArea: d.deliveryArea ?? d.DeliveryArea ?? d.shippingAddress ?? d.ShippingAddress ?? null,
    driver: d.driver ?? d.Driver ?? null,
    vehicle: d.vehicle ?? d.Vehicle ?? null,
    items,
  };
};

/** Map axios response from GET /api/orders → app PaginatedResponse */
export const mapOrdersListResponse = (axiosResponse: {
  data?: {
    success?: boolean;
    message?: string;
    data?: BackendPagedResult | BackendOrderDto[];
  };
}): PaginatedResponse<OrderSummary> => {
  const envelope = axiosResponse?.data;
  const payload = envelope?.data;

  let items: BackendOrderDto[] = [];
  let total = 0;
  let page = 1;
  let limit = 50;
  let totalPages = 1;

  if (Array.isArray(payload)) {
    items = payload;
    total = payload.length;
  } else if (payload) {
    items = payload.items ?? payload.Items ?? [];
    total = payload.totalCount ?? payload.TotalCount ?? items.length;
    page = payload.pageNumber ?? payload.PageNumber ?? 1;
    limit = payload.pageSize ?? payload.PageSize ?? (items.length || 50);
    totalPages = payload.totalPages ?? payload.TotalPages ?? 1;
  }

  return {
    success: envelope?.success ?? true,
    message: envelope?.message ?? '',
    data: items.map(mapBackendOrderToSummary),
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

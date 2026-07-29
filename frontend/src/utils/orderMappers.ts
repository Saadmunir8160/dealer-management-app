import { Order, OrderItem, OrderSummary, OrderStatus, PaginatedResponse } from '@types';

/** UCIC OrderDTO (+ legacy DealerManagement fields for safety) */
interface BackendOrderItemDto {
  orderItemsId?: number;
  OrderItemsId?: number;
  id?: number;
  Id?: number;
  productId?: number;
  ProductId?: number;
  productName?: string;
  ProductName?: string;
  quantity?: number;
  Quantity?: number;
  price?: number;
  Price?: number;
  unitPrice?: number;
  UnitPrice?: number;
  totalPrice?: number;
  TotalPrice?: number;
  total?: number;
  Total?: number;
  numberOfTrucks?: number;
  NumberOfTrucks?: number;
}

interface BackendOrderDto {
  orderId?: number;
  OrderId?: number;
  id?: number;
  Id?: number;
  trackingID?: string;
  TrackingID?: string;
  orderNumber?: string;
  OrderNumber?: string;
  customerId?: number;
  CustomerId?: number;
  customerName?: string;
  CustomerName?: string;
  dealerId?: number;
  DealerId?: number;
  dealerName?: string;
  DealerName?: string;
  locationAddress?: string | null;
  LocationAddress?: string | null;
  totalQuantity?: number;
  TotalQuantity?: number;
  totalPrice?: number;
  TotalPrice?: number;
  totalAmount?: number;
  TotalAmount?: number;
  status?: string | number;
  Status?: string | number;
  createdDate?: string;
  CreatedDate?: string;
  orderDate?: string;
  OrderDate?: string;
  orderItems?: BackendOrderItemDto[];
  OrderItems?: BackendOrderItemDto[];
  items?: BackendOrderItemDto[];
  Items?: BackendOrderItemDto[];
  paymentTransactionId?: string | null;
  PaymentTransactionId?: string | null;
  orderLnNumber?: string | null;
  OrderLnNumber?: string | null;
  couponNumber?: string | null;
  shippingAddress?: string | null;
  deliveryArea?: string | null;
  driver?: string | null;
  vehicle?: string | null;
}

interface BackendPagedMeta {
  currentPage?: number;
  CurrentPage?: number;
  pageSize?: number;
  PageSize?: number;
  totalCount?: number;
  TotalCount?: number;
  totalPages?: number;
  TotalPages?: number;
}

interface BackendPagedResult {
  data?: BackendOrderDto[];
  Data?: BackendOrderDto[];
  items?: BackendOrderDto[];
  Items?: BackendOrderDto[];
  metadata?: BackendPagedMeta;
  Metadata?: BackendPagedMeta;
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
  '0': 'Pending',
  '1': 'Pending',
  '2': 'Confirmed',
  '3': 'Processing',
  '4': 'Shipped',
  '5': 'Delivered',
  Pending: 'Pending',
  PaymentSubmitted: 'Pending',
  PaymentConfirmed: 'Confirmed',
  Confirmed: 'Confirmed',
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Refunded: 'Cancelled',
  Draft: 'Pending',
};

export const mapBackendStatus = (status: string | number | undefined): OrderStatus => {
  if (status === undefined || status === null) return 'Pending';
  return STATUS_MAP[String(status)] ?? 'Pending';
};

const orderIdOf = (dto: BackendOrderDto) =>
  dto.orderId ?? dto.OrderId ?? dto.id ?? dto.Id ?? 0;

const trackingOf = (dto: BackendOrderDto) =>
  dto.trackingID ?? dto.TrackingID ?? dto.orderNumber ?? dto.OrderNumber ?? `ORD-${orderIdOf(dto)}`;

const itemsOf = (dto: BackendOrderDto) =>
  dto.orderItems ?? dto.OrderItems ?? dto.items ?? dto.Items ?? [];

export const mapBackendOrderToSummary = (dto: BackendOrderDto): OrderSummary => {
  const orderId = orderIdOf(dto);
  const items = itemsOf(dto);
  const tracking = trackingOf(dto);

  return {
    orderId,
    dealerName: dto.dealerName ?? dto.DealerName ?? dto.customerName ?? dto.CustomerName ?? '—',
    salesPerson: '—',
    orderDate: String(
      dto.createdDate ?? dto.CreatedDate ?? dto.orderDate ?? dto.OrderDate ?? new Date().toISOString(),
    ),
    totalAmount: Number(dto.totalPrice ?? dto.TotalPrice ?? dto.totalAmount ?? dto.TotalAmount ?? 0),
    status: mapBackendStatus(dto.status ?? dto.Status),
    couponNumber: dto.couponNumber ?? tracking,
    erpOrderNumber: dto.orderLnNumber ?? dto.OrderLnNumber ?? dto.paymentTransactionId ?? null,
    deliveryArea:
      dto.locationAddress ??
      dto.LocationAddress ??
      dto.deliveryArea ??
      dto.shippingAddress ??
      null,
    driver: dto.driver ?? null,
    vehicle: dto.vehicle ?? null,
    itemCount: Array.isArray(items) ? items.length : Number(dto.totalQuantity ?? 0),
  };
};

export const mapBackendOrderToDetail = (dto: BackendOrderDto | Record<string, unknown>): Order => {
  const d = dto as BackendOrderDto;
  const orderId = orderIdOf(d);
  const tracking = trackingOf(d);
  const rawItems = itemsOf(d);

  const items: OrderItem[] = rawItems.map((item, index) => {
    const quantity = Number(item.quantity ?? item.Quantity ?? 0);
    const unitPrice = Number(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? 0);
    return {
      orderItemId: item.orderItemsId ?? item.OrderItemsId ?? item.id ?? item.Id ?? index + 1,
      orderId,
      productId: item.productId ?? item.ProductId ?? 0,
      productName: item.productName ?? item.ProductName ?? '—',
      quantity,
      unitPrice,
      totalPrice: Number(
        item.totalPrice ?? item.TotalPrice ?? item.total ?? item.Total ?? quantity * unitPrice,
      ),
    };
  });

  return {
    orderId,
    dealerId: d.dealerId ?? d.DealerId ?? d.customerId ?? d.CustomerId ?? 0,
    dealerName: d.dealerName ?? d.DealerName ?? d.customerName ?? d.CustomerName ?? '—',
    userId: 0,
    salesPerson: '—',
    orderDate: String(
      d.createdDate ?? d.CreatedDate ?? d.orderDate ?? d.OrderDate ?? new Date().toISOString(),
    ),
    totalAmount: Number(d.totalPrice ?? d.TotalPrice ?? d.totalAmount ?? d.TotalAmount ?? 0),
    status: mapBackendStatus(d.status ?? d.Status),
    couponNumber: d.couponNumber ?? tracking,
    erpOrderNumber: d.orderLnNumber ?? d.OrderLnNumber ?? null,
    deliveryArea: d.locationAddress ?? d.LocationAddress ?? d.deliveryArea ?? d.shippingAddress ?? null,
    driver: d.driver ?? null,
    vehicle: d.vehicle ?? null,
    items,
  };
};

/** Map DealerManagement.Api GET /orders axios response → app PaginatedResponse */
export const mapOrdersListResponse = (axiosResponse: {
  data?: any;
}): PaginatedResponse<OrderSummary> => {
  const envelope = axiosResponse?.data;
  // UCIC paginated: { data: [], metadata: {}, success, message }
  // UCIC mine: { success, message, data: [] }
  // Legacy: { success, data: { items, totalCount } }
  const payload = envelope?.data ?? envelope?.Data ?? envelope;

  let items: BackendOrderDto[] = [];
  let total = 0;
  let page = 1;
  let limit = 50;
  let totalPages = 1;

  if (Array.isArray(payload)) {
    items = payload;
    total = payload.length;
  } else if (payload && typeof payload === 'object') {
    items =
      payload.data ??
      payload.Data ??
      payload.items ??
      payload.Items ??
      [];
    if (!Array.isArray(items) && Array.isArray(envelope?.data)) {
      items = envelope.data;
    }
    const meta = payload.metadata ?? payload.Metadata ?? envelope?.metadata ?? envelope?.Metadata ?? {};
    total =
      meta.totalCount ??
      meta.TotalCount ??
      payload.totalCount ??
      payload.TotalCount ??
      items.length;
    page = meta.currentPage ?? meta.CurrentPage ?? payload.pageNumber ?? payload.PageNumber ?? 1;
    limit = meta.pageSize ?? meta.PageSize ?? payload.pageSize ?? payload.PageSize ?? (items.length || 50);
    totalPages =
      meta.totalPages ??
      meta.TotalPages ??
      payload.totalPages ??
      payload.TotalPages ??
      Math.max(1, Math.ceil(total / limit));
  }

  return {
    success: envelope?.success ?? envelope?.Success ?? true,
    message: envelope?.message ?? envelope?.Message ?? '',
    data: (items || []).map(mapBackendOrderToSummary),
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

/** Unwrap GET /orders/{id}: { success, data: OrderDto } */
export const unwrapOrderDetail = (axiosResponse: { data?: any }): Order => {
  const envelope = axiosResponse?.data;
  const dto = envelope?.data ?? envelope?.Data ?? envelope;
  return mapBackendOrderToDetail(dto ?? {});
};

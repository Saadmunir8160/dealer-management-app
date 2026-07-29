export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  orderId: number;
  dealerId: number;
  dealerName: string;
  userId: number;
  salesPerson: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  couponNumber?: string;
  erpOrderNumber?: string | null;
  deliveryArea?: string | null;
  driver?: string | null;
  vehicle?: string | null;
}

export interface OrderSummary {
  orderId: number;
  dealerName: string;
  salesPerson: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  couponNumber?: string;
  erpOrderNumber?: string | null;
  deliveryArea?: string | null;
  driver?: string | null;
  vehicle?: string | null;
  itemCount?: number;
}

export interface CreateOrderRequest {
  dealerId: number;
  items: CreateOrderItemRequest[];
  couponNumber?: string;
  erpOrderNumber?: string;
  deliveryArea?: string;
  deliveryDate?: string;
  driver?: string;
  vehicle?: string;
  notes?: string;
  /** Optional — not used by DealerManagement.Api */
  coverageAreaId?: number;
  cityId?: number;
  zipCode?: string;
  gpsCoordinates?: string;
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderStatusRequest {
  orderId: number;
  status: OrderStatus;
}

export interface OrderListParams {
  page: number;
  limit: number;
  dealerId?: number;
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface OrderState {
  list: {
    data: OrderSummary[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  selected: {
    data: Order | null;
    isLoading: boolean;
    error: string | null;
  };
  isCreating: boolean;
}

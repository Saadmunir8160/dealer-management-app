export interface VoiceProcessRequest {
  customerId: number;
  text: string;
  orderId?: number | null;
  selectedProductName?: string | null;
}

export interface VoiceOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface VoiceProductCandidate {
  productId: number;
  productName: string;
  productCode?: string | null;
  sku?: string | null;
}

export interface VoiceProcessResult {
  success: boolean;
  orderId?: number | null;
  intent: string;
  product?: string | null;
  quantity?: number | null;
  message: string;
  customerName?: string | null;
  orderStatus?: string | null;
  items: VoiceOrderItem[];
  candidates?: VoiceProductCandidate[] | null;
}

/** Structured AI/NLP extraction request (autofill New Order — does not save). */
export interface VoiceExtractRequest {
  text: string;
  preferredCustomerId?: number | null;
}

export interface VoiceExtractedItem {
  product: string;
  quantity: number;
  unit?: string | null;
}

export interface VoiceExtractedOrder {
  customer?: string | null;
  phone?: string | null;
  items: VoiceExtractedItem[];
  deliveryDate?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface VoiceMatchedItem {
  spokenProduct: string;
  quantity: number;
  unit?: string | null;
  productId?: number | null;
  productName?: string | null;
  unitPrice?: number | null;
  unitOfMeasure?: string | null;
  matchConfidence: number;
  matched: boolean;
  candidates: VoiceProductCandidate[];
}

export interface VoiceCustomerCandidate {
  dealerId: number;
  dealerName: string;
  phone?: string | null;
  city?: string | null;
}

export interface VoiceMatchedCustomer {
  dealerId?: number | null;
  dealerName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  matchConfidence: number;
  matched: boolean;
  candidates: VoiceCustomerCandidate[];
}

export interface VoiceExtractResult {
  success: boolean;
  message: string;
  confidence: number;
  needsReview: boolean;
  extractionEngine: string;
  transcript: string;
  extracted: VoiceExtractedOrder;
  customer: VoiceMatchedCustomer;
  matchedItems: VoiceMatchedItem[];
  resolvedDeliveryDate?: string | null;
  warnings: string[];
}

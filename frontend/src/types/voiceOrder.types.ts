/**
 * Structured voice-order extraction types (Gemini schema + app fill result).
 */
export type VoiceOrderUnit = 'bags' | 'tons' | 'pcs';

export interface GeminiCustomerRef {
  id: string;
  name: string;
  confidence: number;
}

export interface GeminiProductRef {
  id: string;
  name: string;
  quantity: number;
  unit: VoiceOrderUnit | string;
  confidence?: number;
}

export interface GeminiOrderExtraction {
  customer: GeminiCustomerRef;
  products: GeminiProductRef[];
  delivery_date: string;
  delivery_area: string;
  notes: string;
  confidence: number;
  needs_confirmation: boolean;
  missing_fields: string[];
  urgency?: string;
}

export interface FieldConfidence {
  customer: number;
  products: number;
  quantity: number;
  date: number;
  area: number;
  overall: number;
}

export interface VoiceOrderLineFill {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit: VoiceOrderUnit;
  confidence: number;
}

export interface VoiceOrderFillResult {
  dealerId: number | null;
  customerName: string | null;
  customerConfidence: number;
  customerCandidates: Array<{
    dealerId: number;
    dealerName: string;
    phone?: string | null;
    city?: string | null;
    score: number;
  }>;
  items: VoiceOrderLineFill[];
  itemAmbiguities: Array<{
    lineIndex: number;
    spoken: string;
    options: Array<{ productId: number; productName: string; score: number }>;
  }>;
  deliveryDate: string | null;
  deliveryArea: string | null;
  notes: string | null;
  urgency: string | null;
  confidence: FieldConfidence;
  needsConfirmation: boolean;
  missingFields: string[];
  warnings: string[];
  engine: 'gemini' | 'local' | 'proxy';
  raw: GeminiOrderExtraction | null;
}

export type VoiceAiPhase =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'review'
  | 'success'
  | 'error';

export interface VoiceCatalogContext {
  customers: Array<{ id: number; name: string; city?: string | null; phone?: string | null }>;
  products: Array<{
    id: number;
    name: string;
    code?: string | null;
    sku?: string | null;
    arabicName?: string | null;
    unit?: string | null;
    price: number;
  }>;
  areas: string[];
  today: string;
}

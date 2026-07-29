import {
  GeminiOrderExtraction,
  GeminiProductRef,
  VoiceOrderUnit,
} from '@types';

const UNITS: VoiceOrderUnit[] = ['bags', 'tons', 'pcs'];

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value).trim();
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeUnit(raw: unknown): VoiceOrderUnit {
  const u = asString(raw).toLowerCase();
  if (u.startsWith('bag') || u === 'ÙƒÙŠØ³' || u.includes('Ù…ÙƒÙŠØ³')) return 'bags';
  if (u.startsWith('ton') || u.includes('Ø·Ù†') || u.includes('bulk')) return 'tons';
  if (UNITS.includes(u as VoiceOrderUnit)) return u as VoiceOrderUnit;
  return 'pcs';
}

/** Strip markdown fences and extract first JSON object. */
export function extractJsonPayload(raw: string): string {
  let text = (raw || '').trim();
  if (!text) throw new Error('Empty AI response');

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1);
  }
  return text;
}

export function parseGeminiOrderJson(raw: string): GeminiOrderExtraction {
  const payload = extractJsonPayload(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    throw new Error('Invalid JSON from AI â€” please retry extract.');
  }

  const root = asObject(parsed);
  if (!root) throw new Error('AI response is not a JSON object.');

  const customerObj = asObject(root.customer) ?? {};
  const productsRaw = Array.isArray(root.products) ? root.products : [];

  const products: GeminiProductRef[] = productsRaw.map((p: unknown) => {
    const row = asObject(p) ?? {};
    return {
      id: asString(row.id),
      name: asString(row.name),
      quantity: Math.max(0, asNumber(row.quantity, 0)),
      unit: normalizeUnit(row.unit),
      confidence: asNumber(row.confidence, asNumber(root.confidence, 0)),
    };
  });

  const missing = Array.isArray(root.missing_fields)
    ? root.missing_fields.map(x => asString(x)).filter(Boolean)
    : [];

  const confidence = Math.min(100, Math.max(0, asNumber(root.confidence, 0)));
  const needs =
    root.needs_confirmation === true ||
    confidence < 90 ||
    missing.length > 0;

  return {
    customer: {
      id: asString(customerObj.id),
      name: asString(customerObj.name),
      confidence: Math.min(100, Math.max(0, asNumber(customerObj.confidence, confidence))),
    },
    products,
    delivery_date: asString(root.delivery_date),
    delivery_area: asString(root.delivery_area),
    notes: asString(root.notes),
    confidence,
    needs_confirmation: needs,
    missing_fields: missing,
    urgency: asString(root.urgency) || undefined,
  };
}

export function sanitizeTranscript(raw: string): string {
  return (raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

export function isValidOrderUnit(unit: string): unit is VoiceOrderUnit {
  return UNITS.includes(unit as VoiceOrderUnit);
}

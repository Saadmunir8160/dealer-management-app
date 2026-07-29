import { Dealer, Product } from '@types';
import {
  FieldConfidence,
  GeminiOrderExtraction,
  VoiceCatalogContext,
  VoiceOrderFillResult,
  VoiceOrderLineFill,
  VoiceOrderUnit,
} from '@types';
import { GeminiService } from '@services/GeminiService';
import { bestFuzzyMatch, fuzzyRank } from '@utils/fuzzyMatch';
import { isValidIsoDate, parseDeliveryDate, toIsoDate } from '@utils/dateParser';
import { isValidOrderUnit, sanitizeTranscript } from '@utils/jsonValidator';
import { getProductUnit } from '@utils/productUnit';
import { localVoiceExtract } from '@utils/localVoiceExtract';

const CONFIRM_THRESHOLD = 90;

function unitFromProduct(product: Product, spoken?: string): VoiceOrderUnit {
  const fromSpoken = (spoken || '').toLowerCase();
  if (fromSpoken.includes('bag')) return 'bags';
  if (fromSpoken.includes('ton')) return 'tons';
  const u = getProductUnit(product);
  if (u === 'BAGS') return 'bags';
  if (u === 'TONS') return 'tons';
  return 'pcs';
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function buildCatalog(
  dealers: Dealer[],
  products: Product[],
  areas: string[],
): VoiceCatalogContext {
  return {
    today: toIsoDate(new Date()),
    customers: dealers
      .filter(d => d.status !== false)
      .map(d => ({
        id: d.dealerId,
        name: d.dealerName,
        city: d.city,
        phone: d.phone,
      })),
    products: products
      .filter(p => p.status !== false)
      .map(p => ({
        id: p.productId,
        name: p.productName,
        code: p.code,
        sku: p.sku,
        arabicName: p.arabicName,
        unit: getProductUnit(p).toLowerCase(),
        price: p.price,
      })),
    areas: areas.filter(Boolean),
  };
}

function resolveCustomer(
  extraction: GeminiOrderExtraction,
  dealers: Dealer[],
): Pick<
  VoiceOrderFillResult,
  'dealerId' | 'customerName' | 'customerConfidence' | 'customerCandidates' | 'warnings'
> {
  const warnings: string[] = [];
  const active = dealers.filter(d => d.status !== false);
  const byId = extraction.customer.id
    ? active.find(d => String(d.dealerId) === String(extraction.customer.id))
    : undefined;

  if (byId) {
    return {
      dealerId: byId.dealerId,
      customerName: byId.dealerName,
      customerConfidence: clampPct(extraction.customer.confidence || extraction.confidence),
      customerCandidates: [],
      warnings,
    };
  }

  const query = extraction.customer.name;
  if (!query) {
    warnings.push('Customer not found in transcript.');
    return {
      dealerId: null,
      customerName: null,
      customerConfidence: 0,
      customerCandidates: [],
      warnings,
    };
  }

  const ranked = fuzzyRank(
    query,
    active,
    d => [d.dealerName, d.city || '', d.phone || ''],
    4,
  );

  if (!ranked.length || ranked[0].score < 0.5) {
    warnings.push(`Customer not found: "${query}"`);
    return {
      dealerId: null,
      customerName: query,
      customerConfidence: 0,
      customerCandidates: [],
      warnings,
    };
  }

  const top = ranked[0];
  const close = ranked.filter(r => r.score >= top.score - 0.08);
  if (close.length > 1 && top.score < 0.92) {
    return {
      dealerId: null,
      customerName: query,
      customerConfidence: clampPct(top.score * 100),
      customerCandidates: close.map(r => ({
        dealerId: r.item.dealerId,
        dealerName: r.item.dealerName,
        phone: r.item.phone,
        city: r.item.city,
        score: r.score,
      })),
      warnings: [`Confirm customer for "${query}"`],
    };
  }

  return {
    dealerId: top.item.dealerId,
    customerName: top.item.dealerName,
    customerConfidence: clampPct(Math.max(extraction.customer.confidence, top.score * 100)),
    customerCandidates: [],
    warnings,
  };
}

function resolveProducts(
  extraction: GeminiOrderExtraction,
  products: Product[],
): Pick<VoiceOrderFillResult, 'items' | 'itemAmbiguities' | 'warnings'> {
  const warnings: string[] = [];
  const items: VoiceOrderLineFill[] = [];
  const itemAmbiguities: VoiceOrderFillResult['itemAmbiguities'] = [];
  const catalog = products.filter(p => p.status !== false);
  const seen = new Set<number>();

  extraction.products.forEach(row => {
    if (!row.name && !row.id) return;
    const qty = Number(row.quantity) || 0;
    if (qty <= 0) {
      warnings.push(`Invalid quantity for "${row.name || row.id}"`);
      return;
    }

    let match = row.id
      ? catalog.find(p => String(p.productId) === String(row.id))
      : undefined;

    if (!match && row.name) {
      const ranked = fuzzyRank(
        row.name,
        catalog,
        p => [p.productName, p.arabicName || '', p.code || '', p.sku || ''],
        4,
      );
      if (!ranked.length) {
        warnings.push(`Product not found: "${row.name}"`);
        return;
      }
      const top = ranked[0];
      const close = ranked.filter(r => r.score >= top.score - 0.07);
      if (close.length > 1 && top.score < 0.9) {
        itemAmbiguities.push({
          lineIndex: items.length,
          spoken: row.name,
          options: close.map(r => ({
            productId: r.item.productId,
            productName: r.item.productName,
            score: r.score,
          })),
        });
        match = top.item;
      } else if (top.score < 0.5) {
        warnings.push(`Product not found: "${row.name}"`);
        return;
      } else {
        match = top.item;
      }
    }

    if (!match) {
      warnings.push(`Product not found: "${row.name || row.id}"`);
      return;
    }
    if (seen.has(match.productId)) return;
    seen.add(match.productId);

    const unitRaw = String(row.unit || '').toLowerCase();
    const unit: VoiceOrderUnit = isValidOrderUnit(unitRaw)
      ? unitRaw
      : unitFromProduct(match, unitRaw || row.name);

    items.push({
      productId: match.productId,
      productName: match.productName,
      quantity: qty,
      unitPrice: match.price,
      unit,
      confidence: clampPct(row.confidence ?? extraction.confidence),
    });
  });

  if (!items.length) warnings.push('No products matched â€” select items manually.');
  return { items, itemAmbiguities, warnings };
}

function resolveArea(
  spoken: string,
  areas: string[],
): { area: string | null; confidence: number; warning?: string } {
  const text = (spoken || '').trim();
  if (!text) return { area: null, confidence: 0 };

  if (!areas.length) {
    return { area: text, confidence: 80 };
  }

  const hit = bestFuzzyMatch(text, areas, a => a, 0.45);
  if (!hit) {
    return {
      area: text,
      confidence: 60,
      warning: `Delivery area not in catalog: "${text}" (kept as spoken text)`,
    };
  }
  return { area: hit.item, confidence: clampPct(hit.score * 100) };
}

function buildConfidence(parts: {
  customer: number;
  products: number[];
  quantity: number;
  date: number;
  area: number;
}): FieldConfidence {
  const productAvg = parts.products.length
    ? parts.products.reduce((s, n) => s + n, 0) / parts.products.length
    : 0;
  const overall = clampPct(
    (parts.customer + productAvg + parts.quantity + parts.date + parts.area) / 5,
  );
  return {
    customer: clampPct(parts.customer),
    products: clampPct(productAvg),
    quantity: clampPct(parts.quantity),
    date: clampPct(parts.date),
    area: clampPct(parts.area),
    overall,
  };
}

function fromLocalFallback(
  transcript: string,
  dealers: Dealer[],
  products: Product[],
): VoiceOrderFillResult {
  const local = localVoiceExtract(transcript, products);
  const warnings = [...local.warnings];

  let dealerId: number | null = null;
  let customerName: string | null = local.customerHint || null;
  let customerConfidence = 0;
  const customerCandidates: VoiceOrderFillResult['customerCandidates'] = [];

  if (local.customerHint) {
    const ranked = fuzzyRank(
      local.customerHint,
      dealers.filter(d => d.status !== false),
      d => [d.dealerName, d.city || ''],
      3,
    );
    if (ranked[0] && ranked[0].score >= 0.55) {
      if (ranked.length > 1 && ranked[0].score < 0.9) {
        customerCandidates.push(
          ...ranked.map(r => ({
            dealerId: r.item.dealerId,
            dealerName: r.item.dealerName,
            phone: r.item.phone,
            city: r.item.city,
            score: r.score,
          })),
        );
        customerConfidence = clampPct(ranked[0].score * 100);
        warnings.push('Confirm customer match');
      } else {
        dealerId = ranked[0].item.dealerId;
        customerName = ranked[0].item.dealerName;
        customerConfidence = clampPct(ranked[0].score * 100);
      }
    } else {
      warnings.push(`Customer not found: "${local.customerHint}"`);
    }
  }

  const items: VoiceOrderLineFill[] = local.items.map(i => {
    const p = products.find(x => x.productId === i.productId);
    return {
      productId: i.productId,
      productName: p?.productName || 'â€”',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unit: p ? unitFromProduct(p) : 'pcs',
      confidence: 75,
    };
  });

  const deliveryDate = local.deliveryDate
    ? parseDeliveryDate(local.deliveryDate)
    : null;

  const confidence = buildConfidence({
    customer: customerConfidence,
    products: items.map(i => i.confidence),
    quantity: items.every(i => i.quantity > 0) ? 90 : 40,
    date: deliveryDate ? 85 : 0,
    area: local.address ? 70 : 0,
  });

  return {
    dealerId,
    customerName,
    customerConfidence,
    customerCandidates,
    items,
    itemAmbiguities: [],
    deliveryDate,
    deliveryArea: local.address || null,
    notes: null,
    urgency: null,
    confidence,
    needsConfirmation: confidence.overall < CONFIRM_THRESHOLD || customerCandidates.length > 0,
    missingFields: [
      !dealerId ? 'customer' : '',
      !items.length ? 'products' : '',
      !deliveryDate ? 'delivery_date' : '',
    ].filter(Boolean),
    warnings,
    engine: 'local',
    raw: null,
  };
}

function finalize(
  extraction: GeminiOrderExtraction,
  dealers: Dealer[],
  products: Product[],
  areas: string[],
  engine: VoiceOrderFillResult['engine'],
): VoiceOrderFillResult {
  const cust = resolveCustomer(extraction, dealers);
  const prod = resolveProducts(extraction, products);
  const date =
    parseDeliveryDate(extraction.delivery_date) ||
    (isValidIsoDate(extraction.delivery_date) ? extraction.delivery_date : null);
  const areaRes = resolveArea(extraction.delivery_area, areas);

  const warnings = [
    ...cust.warnings,
    ...prod.warnings,
    ...(areaRes.warning ? [areaRes.warning] : []),
    ...extraction.missing_fields.map(f => `Missing: ${f}`),
  ];

  if (extraction.delivery_date && !date) {
    warnings.push(`Date invalid: "${extraction.delivery_date}"`);
  }

  const qtyOk = prod.items.length > 0 && prod.items.every(i => i.quantity > 0);
  const confidence = buildConfidence({
    customer: cust.customerConfidence,
    products: prod.items.map(i => i.confidence),
    quantity: qtyOk ? 100 : 40,
    date: date ? 94 : 0,
    area: areaRes.confidence,
  });

  const needsConfirmation =
    extraction.needs_confirmation ||
    confidence.overall < CONFIRM_THRESHOLD ||
    cust.customerCandidates.length > 0 ||
    prod.itemAmbiguities.length > 0 ||
    !cust.dealerId ||
    !prod.items.length;

  return {
    dealerId: cust.dealerId,
    customerName: cust.customerName,
    customerConfidence: cust.customerConfidence,
    customerCandidates: cust.customerCandidates,
    items: prod.items,
    itemAmbiguities: prod.itemAmbiguities,
    deliveryDate: date,
    deliveryArea: areaRes.area,
    notes: extraction.notes || null,
    urgency: extraction.urgency || null,
    confidence,
    needsConfirmation,
    missingFields: extraction.missing_fields,
    warnings,
    engine,
    raw: extraction,
  };
}

/**
 * Orchestrates Gemini (or local fallback) + catalog fuzzy resolution.
 */
export const OrderParser = {
  buildCatalog,

  async parse(params: {
    transcript: string;
    dealers: Dealer[];
    products: Product[];
    areas?: string[];
    preferLocal?: boolean;
  }): Promise<VoiceOrderFillResult> {
    const transcript = sanitizeTranscript(params.transcript);
    if (!transcript) {
      throw new Error('No speech detected. Hold the mic and speak again.');
    }

    const areas =
      params.areas?.filter(Boolean) ||
      Array.from(
        new Set(
          params.dealers
            .map(d => [d.city, d.address].filter(Boolean).join(', '))
            .filter(Boolean) as string[],
        ),
      );

    if (params.preferLocal || !GeminiService.isConfigured()) {
      return fromLocalFallback(transcript, params.dealers, params.products);
    }

    try {
      const ctx = buildCatalog(params.dealers, params.products, areas);
      const { extraction, engine } = await GeminiService.extractOrder(transcript, ctx);
      return finalize(extraction, params.dealers, params.products, areas, engine);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI extract failed';
      // Soft fallback so voice still works without Gemini / on network errors
      const local = fromLocalFallback(transcript, params.dealers, params.products);
      local.warnings = [`AI unavailable (${message}) â€” used offline extract.`, ...local.warnings];
      local.needsConfirmation = true;
      return local;
    }
  },
};

export default OrderParser;

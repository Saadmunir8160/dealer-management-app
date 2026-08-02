import { Product } from '@types';

export interface LocalVoiceFill {
  items: { productId: number; quantity: number; unitPrice: number }[];
  address?: string;
  deliveryDate?: string;
  customerHint?: string;
  /** Coupon / order ref */
  couponNumber?: string;
  warnings: string[];
}

const BAGS_OK = new Set([500, 600]);

function norm(s: string): string {
  return s.replace(/\s+/g, '').toUpperCase();
}

function stripLeadingZeros(s: string): string {
  const t = s.replace(/^0+/, '');
  return t.length ? t : '0';
}

/** LN keys from the same catalog as "Please Select Item Code" (code / sku / name prefix). */
function catalogLnKeys(products: Product[]): Map<string, Product> {
  const map = new Map<string, Product>();
  for (const p of products) {
    if (p.status === false) continue;
    const keys = new Set<string>();
    const code = p.code != null ? String(p.code).trim() : '';
    const sku = p.sku != null ? String(p.sku).trim() : '';
    if (code) {
      keys.add(norm(code));
      keys.add(stripLeadingZeros(norm(code)));
    }
    if (sku) {
      keys.add(norm(sku));
      keys.add(stripLeadingZeros(norm(sku)));
    }
    const nameLn = String(p.productName || '').match(/^(\d{3,6})\b/);
    if (nameLn) {
      keys.add(norm(nameLn[1]));
      keys.add(stripLeadingZeros(norm(nameLn[1])));
    }
    // LN embedded like "5505 - MCT Bulk"
    const embedded = String(p.productName || '').match(/(?:^|[^\d])(\d{3,6})(?:\s*[-–]|\s)/);
    if (embedded) {
      keys.add(norm(embedded[1]));
      keys.add(stripLeadingZeros(norm(embedded[1])));
    }
    for (const k of keys) {
      if (!map.has(k)) map.set(k, p);
    }
  }
  return map;
}

function findByLnCode(products: Product[], code: string): Product | undefined {
  const map = catalogLnKeys(products);
  const want = norm(code);
  return map.get(want) || map.get(stripLeadingZeros(want));
}

/**
 * Pick spoken digit group that exists as LN Code in the live item list.
 * Prefers 4-digit catalog hits; skips 500/600 bag amounts and coupon digits.
 */
function pickLnFromTranscript(text: string, products: Product[]): string | undefined {
  const map = catalogLnKeys(products);
  if (!map.size) return undefined;

  // Strip coupon tokens so ORD-121 digits are not mistaken for LN
  const withoutCoupon = text.replace(/\bORD[-\s]?\d+[A-Z0-9-]*\b/gi, ' ');

  const tokens = [...withoutCoupon.matchAll(/\b(\d{2,6})\b/g)].map(m => m[1]);
  const catalogHits: string[] = [];
  for (const t of tokens) {
    if (BAGS_OK.has(Number(t))) continue;
    const hit = map.get(norm(t)) || map.get(stripLeadingZeros(norm(t)));
    if (hit) catalogHits.push(t);
  }
  if (catalogHits.length) {
    // Prefer longer / more specific LN (e.g. 5505 over 550)
    catalogHits.sort((a, b) => b.length - a.length);
    return catalogHits[0];
  }
  return undefined;
}

function snapBags(n: number): number {
  if (BAGS_OK.has(n)) return n;
  return Math.abs(n - 500) <= Math.abs(n - 600) ? 500 : 600;
}

function normalizeCoupon(raw: string): string {
  return raw
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/^ORD(?!-)/, 'ORD-');
}

/** True when transcript looks like LN / bags / coupon (skip Gemini). */
export function looksLikeCompactVoiceOrder(
  text: string,
  products: Product[] = [],
): boolean {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/\b\d{3,6}\b/.test(t)) return true;
  if (products.length && pickLnFromTranscript(t, products)) return true;
  return (
    (/\bln\s*code\b/i.test(t) || /\bitem\s*code\b/i.test(t)) &&
    (/\b(?:500|600)\s*bags?\b/i.test(t) || /\bORD[-\s]?\d+/i.test(t))
  );
}

/**
 * Fast extract against the live Item Code list (LN Code column):
 *   "5601 600 bags ORD-222"
 *   "LN code 5604 500 bags coupon ORD-222"
 *   bare "5505"
 */
export function localVoiceExtract(transcript: string, products: Product[]): LocalVoiceFill {
  const text = transcript.replace(/\s+/g, ' ').trim();
  const warnings: string[] = [];
  const items: LocalVoiceFill['items'] = [];
  const seen = new Set<number>();

  if (!products.filter(p => p.status !== false).length) {
    return {
      items: [],
      warnings: ['Product list still loading — try again in a moment.'],
    };
  }

  const couponMatch =
    text.match(
      /\b(?:coupon(?:\s*(?:number|no\.?|#))?|order\s*ref(?:erence)?)\s*[:#-]?\s*(ORD[-\s]?\d+[A-Z0-9-]*)\b/i,
    ) || text.match(/\b(ORD[-\s]?\d+[A-Z0-9-]*)\b/i);
  const couponNumber = couponMatch ? normalizeCoupon(couponMatch[1]) : undefined;

  const bagsMatch = text.match(/\b(500|600)\s*bags?\b/i) || text.match(/\b(500|600)\b/);
  let bags = bagsMatch ? Number(bagsMatch[1]) : 0;

  const labeled =
    text.match(
      /\b(?:ln\s*code|item\s*code|product\s*code|code)\s*[:#-]?\s*(\d{3,6})\b/i,
    )?.[1] ||
    text.match(/\b(\d{3,6})\s+(?:of\s+)?(?:500|600)\s*bags?\b/i)?.[1] ||
    text.match(/\b(?:500|600)\s*bags?\s+(?:of\s+)?(?:ln\s*)?(?:code\s*)?(\d{3,6})\b/i)?.[1];

  // Only accept an LN that exists in Please Select Item Code list
  const lnCode = pickLnFromTranscript(text, products) || undefined;
  const labeledInCatalog =
    labeled && findByLnCode(products, labeled) ? labeled.trim() : undefined;
  const resolvedLn = lnCode || labeledInCatalog;

  if (resolvedLn) {
    const match = findByLnCode(products, resolvedLn);
    if (!match) {
      warnings.push(
        `LN code "${resolvedLn}" not in item list. Use a code from Please Select Item Code.`,
      );
    } else {
      const qty = bags ? snapBags(bags) : 600;
      if (!bags) warnings.push('Bags not spoken — defaulted to 600.');
      seen.add(match.productId);
      items.push({
        productId: match.productId,
        quantity: qty,
        unitPrice: match.price,
      });
      bags = qty;
    }
  } else {
    // Spoken digits that are NOT in the catalog (e.g. misheard "86")
    const withoutCoupon = text.replace(/\bORD[-\s]?\d+[A-Z0-9-]*\b/gi, ' ');
    const spokenCodes = [...withoutCoupon.matchAll(/\b(\d{2,6})\b/g)]
      .map(m => m[1])
      .filter(t => !BAGS_OK.has(Number(t)));
    if (spokenCodes.length) {
      warnings.push(
        `No products matched "${spokenCodes[0]}" — use an LN code from Please Select Item Code.`,
      );
    }
  }

  // Fallback: match product name from list (e.g. "OPC Bags", "PPC Bags", "MCT Bulk")
  if (!items.length) {
    const nameHint = text
      .replace(/\b(?:500|600)\s*bags?\b/gi, ' ')
      .replace(/\bORD[-\s]?\d+[A-Z0-9-]*\b/gi, ' ')
      .replace(/\b(?:ln|item|product)?\s*code\b/gi, ' ')
      .replace(/\bcoupon(?:\s*number)?\b/gi, ' ')
      .replace(/\b\d{3,6}\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (nameHint.length >= 3) {
      const active = products.filter(p => p.status !== false);
      const scored = active
        .map(p => {
          const name = `${p.productName} ${p.arabicName || ''}`.toLowerCase();
          const hint = nameHint.toLowerCase();
          let score = 0;
          if (name.includes(hint)) score = 0.9;
          else {
            const tokens = hint.split(/\s+/).filter(t => t.length > 2);
            const hits = tokens.filter(t => name.includes(t)).length;
            score = tokens.length ? hits / tokens.length : 0;
          }
          return { p, score };
        })
        .filter(x => x.score >= 0.5)
        .sort((a, b) => b.score - a.score);

      if (scored[0]) {
        const qty = bags ? snapBags(bags) : 600;
        items.push({
          productId: scored[0].p.productId,
          quantity: qty,
          unitPrice: scored[0].p.price,
        });
      }
    }
  }

  if (!items.length && !warnings.some(w => /matched|item list|loading/i.test(w))) {
    warnings.push(
      'Say LN code from the item list, bags, coupon — e.g. "5601 600 bags ORD-222".',
    );
  }
  if (!couponNumber) {
    warnings.push('Coupon missing — enter coupon after voice fill, then Place Order.');
  }

  return {
    items,
    couponNumber,
    warnings,
  };
}

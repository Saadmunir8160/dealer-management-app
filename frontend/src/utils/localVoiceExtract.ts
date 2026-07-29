import { Product } from '@types';

export interface LocalVoiceFill {
  items: { productId: number; quantity: number; unitPrice: number }[];
  address?: string;
  deliveryDate?: string;
  customerHint?: string;
  warnings: string[];
}

/**
 * Lightweight client-side extract when UCIC backend has no /voice/extract.
 * Matches spoken/typed lines against the live product catalog already loaded in the app.
 */
export function localVoiceExtract(transcript: string, products: Product[]): LocalVoiceFill {
  const text = transcript.replace(/\s+/g, ' ').trim();
  const warnings: string[] = [];
  const items: LocalVoiceFill['items'] = [];

  const customerMatch = text.match(
    /\b(?:order\s+for|for\s+(?:customer|dealer)?\s*)([A-Za-z0-9][A-Za-z0-9\s.&'-]{1,40}?)(?=\s*[.,]|\s+\d+|deliver|$)/i,
  );
  const customerHint = customerMatch?.[1]?.trim();

  const addressMatch = text.match(
    /\b(?:deliver(?:y)?\s+(?:tomorrow|today)?\s*to|to)\s+([^.]+?)(?=\s*(?:\.|$|notes?))/i,
  );
  const address = addressMatch?.[1]?.trim();

  let deliveryDate: string | undefined;
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    deliveryDate = d.toISOString().slice(0, 10);
  } else if (/\btoday\b/i.test(text)) {
    deliveryDate = new Date().toISOString().slice(0, 10);
  }

  const itemRe =
    /(\d+(?:\.\d+)?)\s*(?:bags?|pcs?|kg|tons?|units?|boxes?)?\s*(?:of\s+)?([A-Za-z][A-Za-z0-9\s\-\/()]{1,40}?)(?=\s*(?:,|and|\d+|deliver|to\s+|\.|$))/gi;

  const seen = new Set<number>();
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(text)) !== null) {
    const qty = Math.max(1, Number(m[1]) || 1);
    const spoken = m[2].trim().toLowerCase();
    if (spoken.length < 2) continue;

    const match = products.find(p => {
      const name = p.productName.toLowerCase();
      return (
        name === spoken ||
        name.includes(spoken) ||
        spoken.split(/\s+/).some(t => t.length > 2 && name.includes(t))
      );
    });

    if (!match) {
      warnings.push(`No product match for "${m[2].trim()}"`);
      continue;
    }
    if (seen.has(match.productId)) continue;
    seen.add(match.productId);
    items.push({
      productId: match.productId,
      quantity: qty,
      unitPrice: match.price,
    });
  }

  if (!items.length) {
    warnings.push('No line items detected — pick products manually or retry.');
  }

  return { items, address, deliveryDate, customerHint, warnings };
}

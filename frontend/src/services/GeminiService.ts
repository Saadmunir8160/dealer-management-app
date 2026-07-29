import Config from '@config';
import { VoiceCatalogContext, GeminiOrderExtraction } from '@types';
import { parseGeminiOrderJson, sanitizeTranscript } from '@utils/jsonValidator';
const GEMINI_TIMEOUT_MS = 45000;

function buildPrompt(transcript: string, ctx: VoiceCatalogContext): string {
  const customers = ctx.customers
    .slice(0, 80)
    .map(c => `- id:${c.id} | ${c.name}${c.city ? ` (${c.city})` : ''}`)
    .join('\n');

  const products = ctx.products
    .slice(0, 120)
    .map(
      p =>
        `- id:${p.id} | ${p.name}${p.arabicName ? ` | ${p.arabicName}` : ''}${
          p.code ? ` | code:${p.code}` : ''
        }${p.sku ? ` | sku:${p.sku}` : ''} | unit:${p.unit ?? 'pcs'}`,
    )
    .join('\n');

  const areas = ctx.areas.length
    ? ctx.areas.slice(0, 60).map(a => `- ${a}`).join('\n')
    : '- (use spoken delivery area text as-is when plausible)';

  return `You are an AI Order Assistant.

Convert spoken orders into structured JSON.

Today's date:
${ctx.today}

Available Customers:
${customers || '- (none)'}

Available Products:
${products || '- (none)'}

Available Delivery Areas:
${areas}

Rules:
- Correct spelling mistakes.
- Understand English + Arabic + Urdu names.
- Fuzzy match customer names to Available Customers (use their id).
- Fuzzy match product names to Available Products (use their id).
- Detect quantity.
- Detect bags.
- Detect tons.
- Detect delivery date (prefer YYYY-MM-DD relative to today's date).
- Detect delivery area.
- Detect notes.
- Detect urgency.
- Never invent products that are not in Available Products.
- Never invent customers that are not in Available Customers.
- If a field cannot be matched, leave id empty and add it to missing_fields.
- If overall confidence is below 90, set needs_confirmation=true.
- Return ONLY JSON. No markdown. No commentary.

Schema:
{
  "customer": { "id": "", "name": "", "confidence": 0 },
  "products": [ { "id": "", "name": "", "quantity": 0, "unit": "bags", "confidence": 0 } ],
  "delivery_date": "",
  "delivery_area": "",
  "notes": "",
  "confidence": 100,
  "needs_confirmation": false,
  "missing_fields": [],
  "urgency": ""
}

Spoken order transcript:
"""${transcript}"""`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'AbortError') {
      throw new Error('Gemini timeout â€” please retry.');
    }
    throw new Error('Network error talking to AI. Check connection and retry.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gemini voice extract service.
 * Prefer GEMINI_PROXY_URL (server holds the secret key).
 * Direct key is for local/dev only â€” Expo public env is visible in bundles.
 */
export const GeminiService = {
  isConfigured(): boolean {
    return !!(Config.GEMINI_PROXY_URL || Config.GEMINI_API_KEY);
  },

  async extractOrder(
    transcriptRaw: string,
    ctx: VoiceCatalogContext,
  ): Promise<{ extraction: GeminiOrderExtraction; engine: 'gemini' | 'proxy' }> {
    const transcript = sanitizeTranscript(transcriptRaw);
    if (!transcript) {
      throw new Error('No speech detected. Hold the mic and speak again.');
    }

    if (Config.GEMINI_PROXY_URL) {
      const res = await fetchWithTimeout(
        Config.GEMINI_PROXY_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            transcript,
            today: ctx.today,
            customers: ctx.customers,
            products: ctx.products,
            areas: ctx.areas,
          }),
        },
        GEMINI_TIMEOUT_MS,
      );
      if (!res.ok) {
        throw new Error(`AI proxy error (${res.status}). Try again later.`);
      }
      const bodyText = await res.text();
      return { extraction: parseGeminiOrderJson(bodyText), engine: 'proxy' };
    }

    if (!Config.GEMINI_API_KEY) {
      throw new Error(
        'Gemini is not configured. Set EXPO_PUBLIC_GEMINI_PROXY_URL or EXPO_PUBLIC_GEMINI_API_KEY.',
      );
    }

    if (Config.ENABLE_LOGS && process.env.EXPO_PUBLIC_APP_ENV === 'production') {
      console.warn(
        '[Gemini] Direct API key in client bundle â€” use EXPO_PUBLIC_GEMINI_PROXY_URL in production.',
      );
    }

    const model = Config.GEMINI_MODEL || 'gemini-2.0-flash';
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
      `?key=${encodeURIComponent(Config.GEMINI_API_KEY)}`;

    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(transcript, ctx) }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      },
      GEMINI_TIMEOUT_MS,
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (Config.ENABLE_LOGS) console.warn('[Gemini] HTTP', res.status, errText.slice(0, 200));
      throw new Error(
        res.status === 429
          ? 'AI rate limited â€” wait a moment and retry.'
          : `Gemini error (${res.status}). Check API key / model.`,
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (data.error?.message) {
      throw new Error(data.error.message);
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';
    if (!text.trim()) {
      throw new Error('Empty response from Gemini.');
    }

    return { extraction: parseGeminiOrderJson(text), engine: 'gemini' };
  },
};

export default GeminiService;

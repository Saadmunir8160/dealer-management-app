/**
 * Parse spoken / relative delivery dates into YYYY-MM-DD.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Accepts only real calendar dates; normalizes to YYYY-MM-DD (e.g. 2026-07-26). */
export function normalizeFlexibleDate(value: string): string | null {
  const t = (value || '').trim();
  if (!t) return null;
  const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12) return null;
  const max = new Date(y, month, 0).getDate();
  if (day < 1 || day > max) return null;
  return `${y}-${pad(month)}-${pad(day)}`;
}

/** True only when value is exact YYYY-MM-DD (padded), e.g. 2026-07-26 */
export function isStrictYmdDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test((value || '').trim())) return false;
  return normalizeFlexibleDate(value) === value.trim();
}

/** Mask digits into YYYY-MM-DD while typing */
export function maskYmdDateInput(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function isValidIsoDate(value: string): boolean {
  return normalizeFlexibleDate(value) != null;
}

/** Resolve relative words and common formats → ISO date or null. */
export function parseDeliveryDate(
  raw: string | null | undefined,
  today = new Date(),
): string | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  const flexible = normalizeFlexibleDate(text);
  if (flexible) return flexible;

  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (/\b(today|اليوم|aaj)\b/i.test(text)) return toIsoDate(base);

  if (/\b(tomorrow|غدا|kal)\b/i.test(text)) {
    base.setDate(base.getDate() + 1);
    return toIsoDate(base);
  }

  if (/\b(day after tomorrow|parson)\b/i.test(text)) {
    base.setDate(base.getDate() + 2);
    return toIsoDate(base);
  }

  const inDays = text.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) {
    base.setDate(base.getDate() + Number(inDays[1]));
    return toIsoDate(base);
  }

  const dmy = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    return normalizeFlexibleDate(`${y}-${Number(dmy[2])}-${Number(dmy[1])}`);
  }

  return null;
}

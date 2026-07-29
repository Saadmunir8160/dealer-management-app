/**
 * Lightweight fuzzy string matching for voice → catalog resolution.
 */

const normalize = (s: string): string =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff\u0750-\u077f\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Dice coefficient on bigrams — good for short product/customer names. */
export function diceCoefficient(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;

  const bigrams = (s: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i += 1) {
      const g = s.slice(i, i + 2);
      map.set(g, (map.get(g) ?? 0) + 1);
    }
    return map;
  };

  const A = bigrams(x);
  const B = bigrams(y);
  let overlap = 0;
  A.forEach((count, g) => {
    const other = B.get(g) ?? 0;
    overlap += Math.min(count, other);
  });
  const total = Math.max(1, x.length - 1) + Math.max(1, y.length - 1);
  return (2 * overlap) / total;
}

export function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalize(a).split(' ').filter(t => t.length > 1));
  const tb = new Set(normalize(b).split(' ').filter(t => t.length > 1));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  ta.forEach(t => {
    if (tb.has(t)) hit += 1;
  });
  return hit / Math.max(ta.size, tb.size);
}

/** Combined score 0–1 */
export function fuzzyScore(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (c === q) return 1;
  if (c.includes(q) || q.includes(c)) {
    return Math.max(0.85, diceCoefficient(q, c));
  }
  return Math.max(diceCoefficient(q, c), tokenOverlap(q, c) * 0.95);
}

export interface FuzzyMatch<T> {
  item: T;
  score: number;
}

export function fuzzyRank<T>(
  query: string,
  items: T[],
  getText: (item: T) => string | string[],
  limit = 5,
): FuzzyMatch<T>[] {
  const scored = items
    .map(item => {
      const texts = getText(item);
      const list = Array.isArray(texts) ? texts : [texts];
      const score = Math.max(...list.map(t => fuzzyScore(query, t || '')), 0);
      return { item, score };
    })
    .filter(x => x.score >= 0.35)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export function bestFuzzyMatch<T>(
  query: string,
  items: T[],
  getText: (item: T) => string | string[],
  minScore = 0.55,
): FuzzyMatch<T> | null {
  const ranked = fuzzyRank(query, items, getText, 1);
  const top = ranked[0];
  if (!top || top.score < minScore) return null;
  return top;
}

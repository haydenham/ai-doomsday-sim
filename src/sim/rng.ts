// mulberry32, with state kept on the game object so runs are reproducible from a seed.
type RngHolder = { rngState: number };

export function rand(s: RngHolder): number {
  const a = (s.rngState = (s.rngState + 0x6d2b79f5) | 0);
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const range = (s: RngHolder, lo: number, hi: number) => lo + rand(s) * (hi - lo);
export const chance = (s: RngHolder, p: number) => rand(s) < p;
export const pick = <T>(s: RngHolder, arr: readonly T[]): T => arr[Math.floor(rand(s) * arr.length)];

export function gauss(s: RngHolder): number {
  const u = Math.max(1e-9, rand(s));
  const v = rand(s);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function weighted<T>(s: RngHolder, items: readonly T[], weight: (t: T) => number): T | null {
  const total = items.reduce((a, it) => a + Math.max(0, weight(it)), 0);
  if (total <= 0) return null;
  let r = rand(s) * total;
  for (const it of items) {
    r -= Math.max(0, weight(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export const randomSeed = () => Math.floor(Math.random() * 1e9);

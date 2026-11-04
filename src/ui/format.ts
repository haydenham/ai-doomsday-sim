const SCALES: [number, string][] = [
  [1e36, 'undecillion'], [1e33, 'decillion'], [1e30, 'nonillion'], [1e27, 'octillion'], [1e24, 'septillion'],
  [1e21, 'sextillion'], [1e18, 'quintillion'], [1e15, 'quadrillion'], [1e12, 'trillion'], [1e9, 'billion'],
  [1e6, 'million'], [1e3, 'thousand'],
];

const fixed = (v: number) => v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2);

export function big(n: number, minScale = 1e6): { num: string; unit: string } {
  for (const [v, u] of SCALES) if (n >= v && v >= minScale) return { num: fixed(n / v), unit: u };
  return { num: n >= 1000 ? Math.round(n).toLocaleString() : fixed(n), unit: '' };
}

export const bigStr = (n: number, minScale = 1e6) => {
  const b = big(n, minScale);
  return b.unit ? `${b.num} ${b.unit}` : b.num;
};

/** GDP is stored in $ trillions. */
export const money = (trillions: number) => {
  if (trillions <= 0) return { num: '$0', unit: '' };
  const b = big(trillions * 1e12, 1e12);
  return { num: `$${b.num}`, unit: b.unit };
};
export const moneyStr = (trillions: number) => {
  const m = money(trillions);
  return `${m.num} ${m.unit}`;
};

export const mult = (n: number) => (n >= 1e6 ? { num: `×${big(n).num}`, unit: big(n).unit } : { num: `×${n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(n >= 10 ? 1 : 2)}`, unit: '' });

export const pct = (n: number) => `${Math.round(n)}%`;

export const signed = (n: number, digits = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}`;

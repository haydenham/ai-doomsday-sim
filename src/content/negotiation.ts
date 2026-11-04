import type { Fx, GameState, Negotiation } from '../sim/types';
import { gauss } from '../sim/rng';

export interface NegotiationItem {
  id: string;
  name: string;
  desc: string;
  /** 'term' = a constraint on both sides; 'sweetener' = something you give up to get a yes. */
  kind: 'term' | 'sweetener';
  integrity: number;
  fx?: Fx;
  refusal: string;
  /** China's base valuation by intent: cooperative, opportunistic, racing. */
  value: [number, number, number];
}

export const NEGOTIATION_ITEMS: NegotiationItem[] = [
  { id: 'inspections', name: 'On-site inspections', kind: 'term', integrity: 22,
    desc: 'Inspectors from each side visit the other\'s datacenters. Strong only if you funded verification.',
    refusal: 'We will not let American spies walk through our datacenters.', value: [-0.3, -1.4, -2.4] },
  { id: 'chipcaps', name: 'Chip production caps', kind: 'term', integrity: 12,
    desc: 'Both sides limit how many AI chips they build each year.',
    refusal: 'You already own the fabs. A cap freezes your advantage.', value: [0.2, -0.6, -1.5] },
  { id: 'joint', name: 'Joint alignment research', kind: 'term', integrity: 8,
    desc: 'Shared safety lab in Geneva. Both sides get better at alignment.',
    fx: { add: { safety: 1, cnAlignment: 15 } },
    refusal: 'Your "safety research" is a pretext to study our models.', value: [1.5, 0.8, 0.3] },
  { id: 'open', name: 'Publish all frontier research', kind: 'term', integrity: 6,
    desc: 'All AI research is public. No secret breakthroughs, for anyone.',
    fx: { add: { openness: 2, powerConc: -5 } },
    refusal: 'Publication helps whoever is ahead.', value: [1.5, 1.8, 1.6] },
  { id: 'macd', name: 'Compute destruction pledge', kind: 'term', integrity: 16,
    desc: 'Either side may destroy any secret datacenter it finds. Cheating gets very risky.',
    fx: { flags: { macd: true } },
    refusal: 'You are asking for permission to bomb us.', value: [0.4, -0.8, -1.8] },
  { id: 'lift_controls', name: 'Lift export controls', kind: 'sweetener', integrity: 0,
    desc: 'Give China access to American chips again. They want this badly.',
    fx: { run: (s) => { s.exportControls = 0; } },
    refusal: '', value: [2.2, 2.8, 2.6] },
];

export function newNegotiation(s: GameState): Negotiation {
  const idx = s.intent === 'cooperative' ? 0 : s.intent === 'opportunistic' ? 1 : 2;
  const values: Record<string, number> = {};
  for (const it of NEGOTIATION_ITEMS) values[it.id] = it.value[idx] + gauss(s) * 0.5;
  // Intel reveals part of China's hand: the strongest feelings first.
  const byStrength = [...NEGOTIATION_ITEMS].sort((a, b) => Math.abs(values[b.id]) - Math.abs(values[a.id]));
  const revealed = byStrength.slice(0, Math.min(NEGOTIATION_ITEMS.length, 1 + Math.floor(s.intel))).map((i) => i.id);
  return { round: 0, maxRounds: 3, values, revealed, lastResponse: null, outcome: 'pending' };
}

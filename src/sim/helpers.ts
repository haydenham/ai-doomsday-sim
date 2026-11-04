import type { Fx, GameState, Moment, TickerItem } from './types';
import { COMPUTE_TIERS } from '../content/ladders';
import { ASI } from './constants';

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function ticker(s: GameState, text: string, kind: TickerItem['kind'] = 'news') {
  s.ticker.push({ id: ++s.tickerSeq, q: s.q, text, kind });
  if (s.ticker.length > 60) s.ticker.splice(0, s.ticker.length - 60);
}

export function moment(s: GameState, text: string, kind: Moment['kind'] = 'info') {
  s.moments.push({ q: s.q, text, kind });
}

export function unlockComputeTier(s: GameState, tier: number) {
  if (tier <= s.computeTier) return;
  const def = COMPUTE_TIERS[tier - 1];
  if (!def) return;
  s.computeTier = tier;
  s.raw *= def.multiplier;
  ticker(s, def.headline, 'tier');
}

const BOUNDS: Partial<Record<string, [number, number]>> = {
  trust: [0, 100],
  powerConc: [0, 100],
  tension: [0, 100],
  alignment: [0, 100],
  cnAlignment: [0, 100],
  dealIntegrity: [0, 100],
  safety: [0, 12],
  verification: [0, 10],
  intel: [0, 10],
  security: [0, 10],
  openness: [0, 10],
  covert: [0, Infinity],
  growthHold: [0, 8],
  rdBoost: [-0.9, 3],
  exportControls: [0, 3],
};

export function applyFx(s: GameState, fx: Fx | undefined) {
  if (!fx) return;
  const rec = s as unknown as Record<string, number>;
  for (const [k, v] of Object.entries(fx.add ?? {})) {
    s.flags[`seen_${k}`] = true; // a stat appears on screen the first time something changes it
    const b = BOUNDS[k];
    rec[k] = b ? clamp(rec[k] + (v as number), b[0], b[1]) : rec[k] + (v as number);
  }
  for (const [k, v] of Object.entries(fx.mul ?? {})) rec[k] *= v as number;
  for (const [k, v] of Object.entries(fx.flags ?? {})) s.flags[k] = v;
  for (const sch of fx.schedule ?? []) s.scheduled.push({ q: s.q + sch.delay, id: sch.id });
  fx.run?.(s);
  if (fx.headline) ticker(s, fx.headline);
  if (fx.moment) moment(s, fx.moment, 'decision');
}

export function shiftStance(s: GameState, bloc: 'row' | 'us' | 'all', delta: number) {
  for (const c of s.countries) {
    if (c.id === 'us' || c.id === 'cn') continue;
    if (bloc === 'all' || c.bloc === bloc) c.stance = clamp(c.stance + delta, -1, 1);
  }
}

/** Lifting a pause releases years of withheld research. Capability then climbs at s.overhangRate. */
export function releaseOverhang(s: GameState, rate: number) {
  s.pauseCap = null;
  s.cnPauseCap = null;
  s.overhangRate = rate;
  const target = ASI + 0.4;
  if (s.capRaw < target) s.algo *= Math.pow(10, target - s.capRaw);
}

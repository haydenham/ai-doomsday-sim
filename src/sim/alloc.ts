import type { Alloc, AllocKey, GameState } from './types';
import { AC, SAR } from './constants';
import { clamp } from './helpers';

// Compute allocation: the player's one continuous control. The labs own it until you take it:
// it drifts back toward their preference each quarter, and you can only nudge it so far.

export const ALLOC_KEYS: AllocKey[] = ['cap', 'safety', 'deploy', 'security'];
export const ALLOC_STEP = 0.1;
/** How far you can move the split per quarter while the labs own it. */
const ALLOWANCE = 0.1;
/** Share of the gap to the labs' preference closed each quarter. */
const DRIFT = 0.25;

export const LAB_ALLOC: Alloc = { cap: 0.7, safety: 0.1, deploy: 0.15, security: 0.05 };
const RACE_ALLOC: Alloc = { cap: 0.85, safety: 0.05, deploy: 0.07, security: 0.03 };

export const inControl = (s: GameState) => !!s.flags.nationalized;

export function labPreference(s: GameState): Alloc {
  return s.path === 'D' ? RACE_ALLOC : LAB_ALLOC;
}

/** Hard ceilings from law or treaty. */
export function allocMax(s: GameState, k: AllocKey) {
  if (k !== 'cap') return 1;
  if (s.flags.moratorium) return 0;
  return s.flags.capLaw ? 0.25 : 1;
}

export function allowanceLeft(s: GameState) {
  return inControl(s) ? Infinity : Math.max(0, ALLOWANCE - s.allocMoved);
}

/** Move one step of share into (+1) or out of (−1) a row; the rest rebalances proportionally. */
export function shiftAlloc(s: GameState, k: AllocKey, dir: 1 | -1) {
  if (allowanceLeft(s) < ALLOC_STEP - 1e-9) return false;
  const cur = s.alloc[k];
  const next = clamp(cur + dir * ALLOC_STEP, 0, allocMax(s, k));
  const delta = next - cur;
  if (Math.abs(delta) < 1e-9) return false;
  const others = ALLOC_KEYS.filter((o) => o !== k);
  const pool = others.reduce((a, o) => a + (dir > 0 ? s.alloc[o] : allocMax(s, o) - s.alloc[o]), 0);
  if (pool < 1e-9) return false;
  for (const o of others) {
    const room = dir > 0 ? s.alloc[o] : allocMax(s, o) - s.alloc[o];
    s.alloc[o] -= delta * (room / pool);
  }
  s.alloc[k] = next;
  s.allocMoved += Math.abs(delta);
  enforceAlloc(s);
  return true;
}

/** Apply ceilings; anything over a ceiling spills into the other rows. */
export function enforceAlloc(s: GameState) {
  for (const k of ALLOC_KEYS) {
    const over = s.alloc[k] - allocMax(s, k);
    if (over <= 1e-9) continue;
    s.alloc[k] -= over;
    // Capped capabilities compute goes where the labs make money: inference. Safety still needs you to steer it.
    if (k === 'cap') { s.alloc.deploy += over; continue; }
    const rest = ALLOC_KEYS.filter((o) => o !== k && s.alloc[o] < allocMax(s, o));
    const tot = rest.reduce((a, o) => a + s.alloc[o], 0) || rest.length;
    for (const o of rest) s.alloc[o] += over * ((s.alloc[o] || 1) / tot);
  }
  const sum = ALLOC_KEYS.reduce((a, k) => a + Math.max(0, s.alloc[k]), 0) || 1;
  for (const k of ALLOC_KEYS) s.alloc[k] = Math.max(0, s.alloc[k]) / sum;
}

/** Quarterly: the labs pull the split back toward what they want. */
export function driftAlloc(s: GameState) {
  s.allocMoved = 0;
  if (inControl(s)) return enforceAlloc(s);
  const pref = labPreference(s);
  const rate = DRIFT * (s.path === 'C' ? 0.5 : 1);
  for (const k of ALLOC_KEYS) s.alloc[k] += (pref[k] - s.alloc[k]) * rate;
  enforceAlloc(s);
}

/** Safety research gained per quarter at the current split. */
export const safetyRate = (s: GameState) => (s.safety >= 12 ? 0 : 0.4 * s.alloc.safety * safetyYield(s.cap));

/** Capability share relative to the labs' default; scales the speed of algorithmic progress. */
export const capFactor = (s: GameState) => Math.pow(s.alloc.cap / LAB_ALLOC.cap, 2);

/**
 * Safety research per unit of safety share. In AI 2040, alignment work at this stage is done by capable AIs,
 * so starving capabilities starves safety too.
 */
export function safetyYield(cap: number) {
  // Human researchers carry most of it before AI can do research itself.
  if (cap < AC) return 0.6 + 0.4 * clamp((cap - 6.7) / (AC - 6.7), 0, 1);
  return Math.min(1.6, 1 + 0.6 * (cap - AC) / (SAR - AC));
}

// ── What each share does, as functions the sim and the screen both read ────────────

/** Money for new chips at the current split and trust. 1 = the labs' default. The real value lags (s.funding). */
export const fundingTarget = (s: GameState) =>
  clamp((0.45 + 3.7 * s.alloc.deploy) * (0.75 + s.trust / 200), 0.6, 1.4);

/** Growth of US chips per quarter. The economy pays for the buildout, so inference share means more chips next year. */
export function rawGrowth(s: GameState) {
  let g = (0.05 + s.computeBoost) * s.funding + (s.cap >= SAR ? 0.04 : 0) + (s.cap >= 10 ? 0.08 : 0);
  if (s.flags.moratorium) g = Math.min(g, 0.01);
  if (s.growthHold > 0) g = 0;
  return Math.max(-0.05, g);
}

/** Months of lead gained (or lost) per year at the current pace. */
export const leadTrend = (s: GameState) => (s.capRate - s.cnCapRate) * 24 * 4;

/** Under a deal, inspectors see the split. A capabilities share above this reads as breakout prep. */
export const DEAL_CAP_LIMIT = 0.4;
export const dealCapStrain = (s: GameState) => (s.dealActive ? 12 * Math.max(0, s.alloc.cap - DEAL_CAP_LIMIT) : 0);

/** Chance per quarter that China steals the frontier weights. Grows with the lead (more to steal) and with tension. */
export function theftRisk(s: GameState) {
  const lead = (s.cap - s.cnCap) * 24;
  if (s.cap < 7.2 || lead <= 0) return 0;
  return 0.06 * clamp(lead / 8, 0.5, 2) * (10 - s.security) / 10 * (s.tension >= 50 ? 1.5 : 1);
}

export const perYear = (pQuarter: number) => 1 - Math.pow(1 - pQuarter, 4);

// Scripted players for the headless tools (sim.ts, audit.ts).
import { chooseFork, closeNegotiation, newGame, resolveChoice, step, submitOffer } from '../src/sim/engine';
import { PATHS } from '../src/content/paths';
import { AC, ASI, TED_AI } from '../src/sim/constants';
import type { Alloc, AllocKey, GameState, Lean, PathId } from '../src/sim/types';
import { ALLOC_KEYS, allowanceLeft, perYear, shiftAlloc, theftRisk } from '../src/sim/alloc';
import { leadMonths } from '../src/sim/derived';
import { rand } from '../src/sim/rng';

export type Strategy = Partial<Alloc> | 'reactive' | 'expert' | 'random';

export interface Bot {
  name: string;
  path: PathId;
  /** Leans in priority order. Unlisted leans rank last. */
  prefer: Lean[];
  /** Force a specific option index for a decision id. */
  force?: Record<string, number>;
  random?: boolean;
  /**
   * How the bot steers the compute split. Omit = leave it to the labs.
   * reactive: reads the screen like a player. expert: steers on hidden true state (a best case). random: random nudges.
   */
  alloc?: Strategy;
  /** AI 2040 rails: median year each rung is reached must fall in [lo, hi]. */
  rails?: Partial<Record<Rung, [number, number]>>;
}

export type Rung = 'AC' | 'SAR' | 'TED' | 'ASI';

export const SAFE: Lean[] = ['safety', 'people', 'dove'];

/** Reads the screen like a player would: keep a lead, spend it on safety, guard it, respect the deal. */
function reactiveTarget(s: GameState): Partial<Alloc> {
  const lead = leadMonths(s);
  const readout = s.panels.includes('alignment') ? s.readout : null;
  if (s.dealActive) return { cap: 0.3, safety: 0.4, deploy: 0.15, security: 0.15 };
  if (lead < 6) return { cap: 0.8, safety: 0.1, deploy: 0.05, security: 0.05 };
  if (perYear(theftRisk(s)) > 0.25) return { cap: 0.5, safety: 0.2, deploy: 0.05, security: 0.25 };
  if ((readout !== null && readout < 60) || lead > 12) return { cap: 0.4, safety: 0.45, deploy: 0.1, security: 0.05 };
  return { cap: 0.6, safety: 0.3, deploy: 0.05, security: 0.05 };
}

/** Sees the hidden state. An upper bound on what good steering can do. */
function expertTarget(s: GameState): Partial<Alloc> {
  const lead = leadMonths(s);
  const theft = perYear(theftRisk(s));
  if (s.dealActive) return s.alignment < 80 ? { cap: 0.25, safety: 0.5, deploy: 0.1, security: 0.15 } : { cap: 0.3, safety: 0.35, deploy: 0.15, security: 0.2 };
  if (s.alignment < 55 && s.cap >= AC) return { cap: 0.3, safety: 0.55, deploy: 0.05, security: 0.1 };
  if (lead < 3) return { cap: 0.7, safety: 0.2, deploy: 0.05, security: 0.05 };
  if (theft > 0.2) return { cap: 0.45, safety: 0.3, deploy: 0.05, security: 0.2 };
  if (s.cap < AC) return { cap: 0.5, safety: 0.2, deploy: 0.25, security: 0.05 };
  if (s.cap > TED_AI && s.cap < ASI) return { cap: 0.35, safety: 0.45, deploy: 0.05, security: 0.15 };
  return { cap: 0.5, safety: 0.35, deploy: 0.05, security: 0.1 };
}

/** One step per quarter toward the bot's target split, into the row furthest below target. */
function botAlloc(s: GameState, bot: Bot) {
  if (!bot.alloc || allowanceLeft(s) < 0.1 - 1e-9) return;
  if (bot.alloc === 'random') {
    if (s.allocMoved > 0) return;
    const r = { rngState: s.seed * 131 + s.q * 7 + 3 };
    shiftAlloc(s, ALLOC_KEYS[Math.floor(rand(r) * 4)], rand(r) < 0.5 ? 1 : -1);
    return;
  }
  const target = bot.alloc === 'reactive' ? reactiveTarget(s) : bot.alloc === 'expert' ? expertTarget(s) : bot.alloc;
  const full: Record<AllocKey, number> = { cap: 0, safety: 0, deploy: 0, security: 0 };
  const named = ALLOC_KEYS.filter((k) => target[k] !== undefined);
  const rest = 1 - named.reduce((a, k) => a + target[k]!, 0);
  for (const k of ALLOC_KEYS) full[k] = target[k] ?? Math.max(0, rest) / (ALLOC_KEYS.length - named.length || 1);
  const gaps = ALLOC_KEYS.map((k) => [full[k] - s.alloc[k], k] as const).sort((a, b) => b[0] - a[0]);
  if (gaps[0][0] > 0.05) shiftAlloc(s, gaps[0][1], 1);
}

function botTurn(s: GameState, bot: Bot) {
  if (s.pending) {
    const p = s.pending;
    let idx = 0;
    const steering = bot.alloc === 'reactive' || bot.alloc === 'expert';
    if (bot.force?.[p.id] !== undefined) idx = Math.min(bot.force[p.id], p.choices.length - 1);
    else if (p.id === 'cap_rd' && steering) idx = leadMonths(s) > 12 ? 0 : 1;
    else if (bot.random) idx = Math.floor(rand({ rngState: s.q * 7919 + s.seed + p.id.length }) * p.choices.length);
    else {
      const rank = (l?: Lean) => (l && bot.prefer.includes(l) ? bot.prefer.indexOf(l) : 99);
      idx = p.choices.map((c, i) => [rank(c.lean), i]).sort((a, b) => a[0] - b[0])[0][1];
    }
    resolveChoice(s, idx);
    return;
  }
  if (s.forkPending) {
    let path = bot.random ? PATHS[s.seed % 5].id : bot.path;
    if (!PATHS.find((p) => p.id === path)!.available(s).ok) path = 'D';
    chooseFork(s, path);
    return;
  }
  if (s.negotiation) {
    const n = s.negotiation;
    if (n.outcome !== 'pending') return closeNegotiation(s);
    // Ask for every term not known to be a red line; add the sweetener after a rejection.
    const terms = ['inspections', 'chipcaps', 'joint', 'open', 'macd'].filter((id) => !(n.revealed.includes(id) && n.redLines.includes(id)));
    // After that, drop to the two easiest terms. Four rejections and Beijing ends the talks.
    submitOffer(s, n.round === 0 ? terms : n.round === 1 ? [...terms, 'lift_controls'] : ['joint', 'open', 'lift_controls']);
  }
}

export function runOne(seed: number, bot: Bot) {
  const s = newGame(seed);
  for (let i = 0; i < 200000 && !s.ending; i++) {
    if (s.pending || s.forkPending || s.negotiation) { botTurn(s, bot); continue; }
    botAlloc(s, bot);
    step(s);
  }
  return s;
}

export const STRATEGIES: [string, Strategy | undefined][] = [
  ['labs', undefined],
  ['all-cap', { cap: 1 }],
  ['all-safety', { safety: 1 }],
  ['balanced', { cap: 0.4, safety: 0.3, deploy: 0.2, security: 0.1 }],
  ['random-dial', 'random'],
  ['reactive', 'reactive'],
  ['expert', 'expert'],
];

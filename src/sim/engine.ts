import type { EndingId, GameState, Intent, PathId, Snapshot } from './types';
import {
  AC, ALIGN_LOC, ASI, DEAL_CEILING, DEAL_RESUME_Q, END_Q, FORK_Q, PHASE_NAMES, POWER_GILDED, RECKONING_Q, SAR,
  TAKEOFF_Q, UNPAUSE_Q,
} from './constants';
import { chance, gauss, pick, rand, range, weighted } from './rng';
import { applyFx, clamp, moment, ticker, unlockComputeTier } from './helpers';
import { baseRdMult, capOf, leadMonths } from './derived';
import { LAB_ALLOC, capFactor, driftAlloc, safetyYield } from './alloc';
import { ALGO_TIERS } from '../content/ladders';
import { PANELS } from '../content/panels';
import { COUNTRIES } from '../content/countries';
import { DECISIONS, decisionEligible } from '../content/decisions';
import { EVENTS, EVENT_BY_ID, eventToPending, type EventDef } from '../content/events';
import { FLAVOR, HINTS } from '../content/ticker';
import { pathDef } from '../content/paths';
import { EXTRA_TERM_COST, NEGOTIATION_ITEMS, newNegotiation } from '../content/negotiation';

export const SUBSTEP = 0.01; // quarters per simulation substep (small so counters tick smoothly)

// China runs one national project on most of its chips and fast-follows US algorithms (theft, distillation),
// so a Chinese chip counts for more at the frontier than a US chip split across rival labs.
const CN_EFFICIENCY = 5;
// A 40× research speedup doesn't mean 40× progress: experiments still need compute.
const RD_ELASTICITY = 0.9;
const ALGO_BASE = 0.024;

export function newGame(seed: number): GameState {
  const s = { rngState: seed } as GameState;
  const intent = weighted<Intent>(s, ['cooperative', 'opportunistic', 'racing'], (i) =>
    i === 'cooperative' ? 0.3 : i === 'opportunistic' ? 0.45 : 0.25)!;
  // AI 2040's compute supplement: ~50M US vs ~6M Chinese H100e in early 2027.
  const raw = 5e7;
  const cnRaw = 6e6;
  const cnAlgo = 0.8 * CN_EFFICIENCY;
  Object.assign(s, {
    seed, t: 0, q: 0, phase: 1, path: null,
    gdp: 31, cumGdp: 0, raw, algo: 1, capRaw: capOf(raw, 1), cap: capOf(raw, 1),
    trust: 52, powerConc: 30, tension: 20, jobs: 0, rdMult: 1,
    safety: 0, verification: 0, intel: 0, security: 1, openness: 0, deployment: 0, computeBoost: 0,
    exportControls: 0, rdBoost: 0, growthHold: 0, pauseCap: null, overhangRate: 1, ubi: false,
    dealFloor: 0, dealShift: 0, alloc: { ...LAB_ALLOC }, allocMoved: 0,
    cnRaw, cnAlgo, cnCap: capOf(cnRaw, cnAlgo), cnRdMult: 1, cnPauseCap: null, covert: 0,
    cnAlignment: range(s, 25, 55), intent,
    alignment: range(s, 56, 68), difficulty: range(s, 0.75, 1.35), timeline: range(s, 0.85, 1.2),
    readout: 0, readoutSigma: 24,
    dealActive: false, dealIntegrity: 0, negotiation: null,
    computeTier: 1, algoTier: 1, algoByAI: [],
    countries: COUNTRIES.map((c) => ({ ...c })),
    flags: {}, uses: {}, scheduled: [], firedEvents: {},
    panels: ['desk'], panelsUnlockedAt: { desk: 0 }, leans: {},
    pending: null, forkPending: false,
    ticker: [], tickerSeq: 0, history: [], moments: [], decisions: [],
    asiQ: null, asiBy: null, ending: null, endQ: null,
  } satisfies Omit<GameState, 'rngState'>);
  updateReadout(s);
  ticker(s, 'You run AI policy for the United States.');
  s.history.push(snapshot(s));
  return s;
}

export const isBlocked = (s: GameState) =>
  !!(s.ending || s.pending || s.forkPending || s.negotiation);

/** Advance continuous time. Discrete quarter logic runs when a quarter boundary is crossed. */
export function step(s: GameState, dt = SUBSTEP) {
  if (isBlocked(s)) return;
  const prevQ = Math.floor(s.t + 1e-9);
  const prevFrac = s.t - prevQ;
  advance(s, dt);
  s.t = Math.round((s.t + dt) * 1e6) / 1e6;
  if (Math.floor(s.t + 1e-9) > prevQ) quarterBoundary(s);
  else if (prevFrac < 0.5 && s.t - prevQ >= 0.5) midQuarter(s);
}

/** Run until the next quarter boundary (or until something blocks). */
export function skipQuarter(s: GameState) {
  const target = Math.floor(s.t + 1e-9) + 1;
  while (!isBlocked(s) && s.t < target - 1e-9) step(s);
}

// ── Continuous dynamics ───────────────────────────────────────────────────

function advance(s: GameState, dt: number) {
  const moratorium = !!s.flags.moratorium;
  const hold = s.growthHold > 0;
  const lead = leadMonths(s);

  // US compute and algorithms
  const rdFactor = clamp(1 + s.rdBoost + (s.path === 'D' ? 0.3 : 0), 0.1, 4);
  s.rdMult = 1 + (baseRdMult(s.cap) - 1) * rdFactor;
  let rawG = 0.05 + s.computeBoost + (s.cap >= SAR ? 0.04 : 0) + (s.cap >= 10 ? 0.08 : 0);
  if (moratorium) rawG = Math.min(rawG, 0.01);
  let algoG = ALGO_BASE * s.timeline * Math.pow(s.rdMult, RD_ELASTICITY) * capFactor(s)
    * (s.cap < AC ? clamp(1 + 0.5 * s.rdBoost, 0.5, 2) : 1);
  if (moratorium) algoG = 0;
  // A deal limits capability by its ceiling, not by slowing research; a moratorium slows research itself.
  if (s.pauseCap !== null && !s.dealActive) algoG *= 0.35;
  if (s.flags.burnLead && lead > 3) algoG *= 0.7;
  if (hold) { rawG = 0; algoG = 0; }
  s.raw *= Math.pow(1 + Math.max(-0.05, rawG), dt);
  s.algo *= Math.pow(1 + algoG, dt);
  s.capRaw = capOf(s.raw, s.algo);
  if (s.dealActive && s.pauseCap !== null) s.pauseCap = s.cnPauseCap = dealCeiling(s);

  const prevCap = s.cap;
  const target = s.pauseCap !== null ? Math.min(s.capRaw, s.pauseCap) : s.capRaw;
  s.cap = target > s.cap ? Math.min(target, s.cap + s.overhangRate * dt) : target;

  // Compute allocation: safety research (done more and more by AIs), lab security, verification.
  s.safety = Math.min(12, s.safety + dt * 0.4 * s.alloc.safety * safetyYield(s.cap));
  if (s.safety >= 0.3) s.flags.seen_safety = true;
  s.security = clamp(s.security + dt * (2.5 * s.alloc.security - 0.1), 0, 10);
  if (s.dealActive) s.verification = Math.min(10, s.verification + dt * 0.8 * s.alloc.security);

  // Alignment: risk scales with the *rate* of capability growth, not the level.
  const dC = Math.max(0, s.cap - prevCap);
  const rate = dC / dt;
  const pathMul = s.path === 'D' ? 1.25 : s.path === 'C' ? 0.9 : 1;
  const neuralese = s.algoTier >= 6 ? 1.15 : 1;
  const shield = Math.max(0.35, 1 - 0.055 * s.safety);
  const loss = dC * 5 * s.difficulty * (0.3 + 1.0 * rate) * pathMul * neuralese * shield;
  const gain = dt * 0.45 * s.safety * Math.max(0, 1 - s.alignment / 110) + (rate < 0.02 ? dt * 0.1 : 0);
  s.alignment = clamp(s.alignment - loss + gain, 0, 100);

  // China
  const desperation = cnDesperation(s);
  let cnRawG = 0.045 + 0.03 * desperation - 0.015 * s.exportControls + (s.cnCap >= SAR ? 0.04 : 0);
  if (s.cnPauseCap !== null && s.flags.moratorium) cnRawG = Math.min(cnRawG, 0.01);
  s.cnRaw *= Math.pow(1 + cnRawG, dt);
  s.cnRdMult = baseRdMult(s.cnCap) * (s.intent === 'racing' ? 1.1 : 1);
  let cnAlgoG = 0.033 * s.timeline * Math.pow(s.cnRdMult, RD_ELASTICITY);
  if (s.cnPauseCap !== null && !s.dealActive) cnAlgoG *= s.flags.moratorium ? 0 : 0.35;
  const diffusion = clamp(0.07 + 0.03 * s.openness - 0.012 * s.security, 0.01, 0.4);
  const gap = Math.max(0, Math.log(s.algo * CN_EFFICIENCY) - Math.log(s.cnAlgo));
  s.cnAlgo *= Math.exp(dt * (Math.log(1 + cnAlgoG) + diffusion * gap));
  if (s.covert > 0) s.covert *= Math.pow(1.12, dt);
  const cnCapRaw = capOf(s.cnRaw, s.cnAlgo);
  const declared = s.cnPauseCap !== null ? Math.min(cnCapRaw, s.cnPauseCap) : cnCapRaw;
  const cnTarget = declared + (s.covert > 0 ? Math.log10(1 + s.covert / s.cnRaw) : 0);
  // Under a deal both sides lift the cap at the same agreed pace.
  const cnRate = s.dealActive ? s.overhangRate : 1;
  s.cnCap = cnTarget > s.cnCap ? Math.min(cnTarget, s.cnCap + cnRate * dt) : cnTarget;

  // Economy
  const auto = Math.max(0, s.cap - 6.6);
  const overhangDividend = 0.01 * clamp(s.capRaw - s.cap, 0, 1);
  let g = 0.006 + 0.011 * Math.pow(auto, 1.5) * (0.75 + 0.06 * s.deployment) * (0.6 + s.trust / 125) + overhangDividend;
  if (s.ubi) g *= 0.97;
  g *= clamp(0.4 + 4 * s.alloc.deploy, 0.4, 2.2);
  s.gdp *= Math.pow(1 + g, dt);
  s.jobs = clamp((s.cap - 6.6) * 12 + s.deployment * 1.5 + 30 * (s.alloc.deploy - LAB_ALLOC.deploy), 0, 95);
}

/** Plan A's shared ceiling at the current time. Never below where both sides stood at signing. */
export function dealCeiling(s: GameState) {
  if (s.t < DEAL_RESUME_Q) return s.dealFloor;
  const t = s.t + s.dealShift;
  let cap = DEAL_CEILING[DEAL_CEILING.length - 1][1];
  for (let i = 0; i < DEAL_CEILING.length - 1; i++) {
    const [[q0, c0], [q1, c1]] = [DEAL_CEILING[i], DEAL_CEILING[i + 1]];
    if (t < q1) { cap = c0 + (c1 - c0) * clamp((t - q0) / (q1 - q0), 0, 1); break; }
  }
  return Math.max(s.dealFloor, cap);
}

function cnDesperation(s: GameState) {
  const k = s.intent === 'cooperative' ? 0.3 : s.intent === 'opportunistic' ? 0.7 : 1;
  return clamp((leadMonths(s) - 4) / 14, 0, 1) * k;
}

// ── Quarterly logic ───────────────────────────────────────────────────────

function quarterBoundary(s: GameState) {
  s.q = Math.floor(s.t + 1e-9);
  s.cumGdp += s.gdp / 4;
  if (s.growthHold > 0) s.growthHold = Math.max(0, s.growthHold - 1);

  updatePhase(s);

  // Politics
  driftAlloc(s);
  s.trust = clamp(s.trust + 8 * (s.alloc.deploy - LAB_ALLOC.deploy) + (50 - s.trust) * 0.04 - s.jobs * 0.035 * (s.ubi ? 0.3 : 1) - (s.flags.moratorium ? 0.4 : 0), 0, 100);
  s.tension = clamp(s.tension - 2 + cnDesperation(s) * 3, 0, 100);
  const pcDrift = (s.cap >= AC ? 0.5 : 0) * (s.path === 'B' || s.path === 'D' ? 1.6 : 1) - 0.12 * s.openness;
  s.powerConc = clamp(s.powerConc + pcDrift, 0, 100);

  chinaActs(s);

  if (s.dealActive) {
    const decay = 1.5 + (s.intent === 'racing' ? 2.5 : s.intent === 'opportunistic' ? 1 : 0) - 0.25 * s.verification;
    s.dealIntegrity = clamp(s.dealIntegrity - Math.max(0.3, decay), 0, 100);
  }

  updateReadout(s);
  algoBreakthrough(s);
  if (s.cap >= 10.5 && s.computeTier === 8 && s.alignment >= 50) unlockComputeTier(s, 9);

  for (const p of PANELS) {
    if (!s.panels.includes(p.id) && p.unlockWhen(s)) {
      s.panels.push(p.id);
      s.panelsUnlockedAt[p.id] = s.q;
      if (p.unlockHeadline) ticker(s, p.unlockHeadline, 'unlock');
    }
  }

  detectMoments(s);
  updateCountries(s);
  runEvents(s);
  flavorTicker(s);

  if (s.q === FORK_Q && !s.path) s.forkPending = true;

  s.history.push(snapshot(s));
  checkEnding(s);
}

function updatePhase(s: GameState) {
  const prev = s.phase;
  s.phase = s.asiBy || s.q >= UNPAUSE_Q ? 5 : s.q >= RECKONING_Q ? 4 : s.q >= TAKEOFF_Q ? 3 : s.q >= FORK_Q ? 2 : 1;
  if (s.phase !== prev) ticker(s, `— ${PHASE_NAMES[s.phase]} —`, 'unlock');
}

function updateReadout(s: GameState) {
  const blur = s.algoTier >= 6 ? 1.3 : 1;
  const sigma = (24 / (1 + 0.45 * s.safety + 0.25 * s.verification)) * blur;
  // Capable, misaligned models learn to look aligned. Safety work shrinks the gap.
  const bias = s.cap > 7.5 ? (s.cap - 7.5) * 9 * (1 - s.alignment / 100) * blur * Math.max(0.25, 1 - 0.07 * s.safety) : 0;
  s.readout = clamp(s.alignment + bias + gauss(s) * sigma * 0.5, 0, 100);
  s.readoutSigma = sigma;
}

function algoBreakthrough(s: GameState) {
  const next = ALGO_TIERS[s.algoTier];
  if (!next || s.flags.moratorium || s.growthHold > 0) return;
  if (s.q < next.minQ || (next.when && !next.when(s))) return;
  const p = clamp((0.3 + 0.15 * s.rdBoost) * s.timeline * (s.pauseCap !== null && !s.dealActive ? 0.4 : 1) * (next.when ? 1.8 : 1), 0.05, 0.9);
  if (!chance(s, p)) return;
  s.algoTier = next.tier;
  s.algo *= next.multiplier;
  if (next.tier >= 7) s.algoByAI.push(next.tier);
  ticker(s, next.headline, next.tier >= 7 ? 'ai' : 'tier');
}

function chinaActs(s: GameState) {
  const desp = cnDesperation(s);
  // Covert compute: hidden in plain sight whenever there are rules to break.
  const rulesToBreak = s.dealActive || !!s.flags.moratorium || s.exportControls >= 1;
  if (s.covert === 0 && s.intent !== 'cooperative' && rulesToBreak && s.q >= 10) {
    const p = (s.intent === 'racing' ? 0.22 : 0.1) * (s.flags.noRecycling ? 0.5 : 1)
      * (s.flags.chipTracking ? 0.6 : 1) * (s.flags.macd ? 0.5 : 1);
    if (chance(s, p)) {
      s.covert = s.cnRaw * 0.08;
      moment(s, 'China began a covert compute project, hidden under a "steel plant" in Xinjiang.', 'hidden');
    }
  }
  if (s.exportControls > 0 && s.intent !== 'cooperative') s.cnRaw *= 1.008; // quiet smuggling
  if (desp > 0.55 && chance(s, 0.3)) {
    s.tension = clamp(s.tension + 8, 0, 100);
    ticker(s, pick(s, [
      'PLA announces live-fire exercises near Taiwan "in response to American provocations."',
      'Chinese state media: "The AI gap is a threat to world peace."',
      'Beijing orders all provinces to prioritize power for AI datacenters.',
    ]));
  }
}

function detectMoments(s: GameState) {
  const once = (key: string, cond: boolean, text: string, kind: 'hidden' | 'danger' | 'info') => {
    if (cond && !s.flags[key]) { s.flags[key] = true; moment(s, text, kind); }
  };
  once('m_auto', s.cap >= AC, 'AI took over the coding in AI research.', 'info');
  once('m_deceptive', s.cap >= AC && s.alignment < 50,
    'Your models became deceptively aligned: they learned to pass evals instead of sharing your goals.', 'hidden');
  once('m_ponr', s.cap >= AC && s.alignment < ALIGN_LOC,
    'Point of no return: true alignment fell below 40%.', 'danger');
  once('m_evalgap', s.readout - s.alignment > 25,
    `Your evals overstated alignment by ${Math.round(s.readout - s.alignment)} points.`, 'hidden');
}

function updateCountries(s: GameState) {
  const L = clamp(leadMonths(s) / 12, -1, 1);
  const members = s.countries.filter((c) => c.inDeal).length;
  const halted = s.countries.filter((c) => c.halted).length;
  for (const c of s.countries) {
    if (c.id === 'us' || c.id === 'cn') continue;
    let target = 0.3 * L + (c.bloc === 'us' ? 0.55 : c.bloc === 'cn' ? -0.55 : 0);
    if (s.path === 'B') target += Math.sign(target) * 0.3;
    c.stance = clamp(c.stance + (target - c.stance) * 0.06 + (rand(s) - 0.5) * 0.04, -1, 1);
    if (s.dealActive && !c.inDeal && members > 0 && chance(s, 0.3)) c.inDeal = true;
    if (s.flags.moratorium && !c.halted && halted > 0 && chance(s, 0.3)) c.halted = true;
    if (!s.flags.moratorium) c.halted = false;
  }
}

// ── Events ────────────────────────────────────────────────────────────────

function eventReady(s: GameState, e: EventDef) {
  const last = s.firedEvents[e.id];
  if (last !== undefined) {
    if (e.once !== false) return false;
    if (e.cooldown && s.q - last < e.cooldown) return false;
  }
  return !e.when || e.when(s);
}

export function fireEvent(s: GameState, e: EventDef) {
  s.firedEvents[e.id] = s.q;
  applyFx(s, e.onFire);
  const choices = typeof e.choices === 'function' ? e.choices(s) : e.choices;
  if (choices && choices.length) s.pending = eventToPending(s, e);
  else applyFx(s, e.fx);
}

function runEvents(s: GameState) {
  const due = s.scheduled.filter((x) => x.q <= s.q);
  s.scheduled = s.scheduled.filter((x) => x.q > s.q);
  const queue: EventDef[] = due.map((d) => EVENT_BY_ID[d.id]).filter(Boolean);

  const prio = (e: EventDef) => (e.kind === 'milestone' || e.kind === 'ai' ? 0 : 1);
  const random = EVENTS.filter((e) => !e.scheduledOnly).sort((a, b) => prio(a) - prio(b));
  let headlines = 0;
  for (const e of random) {
    if (!eventReady(s, e)) continue;
    const p = typeof e.chance === 'function' ? e.chance(s) : e.chance ?? 0.2;
    if (!chance(s, p)) continue;
    queue.push(e);
  }
  for (const e of queue) {
    const freezing = !!e.choices;
    if (freezing && s.pending) {
      if (e.scheduledOnly) s.scheduled.push({ q: s.q + 1, id: e.id });
      continue;
    }
    if (!freezing && headlines >= 2) continue;
    if (!freezing) headlines++;
    fireEvent(s, e);
  }
}

export function resolveChoice(s: GameState, idx: number) {
  const p = s.pending;
  if (!p) return false;
  const c = p.choices[idx];
  if (!c) return false;
  s.pending = null;
  if (p.choices.length > 1) s.decisions.push({ q: s.q, id: p.id, label: `${p.title}: ${c.label}` });
  if (c.lean) s.leans[c.lean] = (s.leans[c.lean] ?? 0) + 1;
  applyFx(s, c.fx);
  checkEnding(s);
  return true;
}

// ── Decisions ─────────────────────────────────────────────────────────────

/** Halfway through each quarter, one decision comes up and the clock stops. */
function midQuarter(s: GameState) {
  if (s.q < 1 || s.pending || s.forkPending || s.negotiation || s.ending) return;
  const pool = DECISIONS.filter((d) => decisionEligible(s, d));
  const d = weighted(s, pool, (d) => d.weight ?? 1);
  if (!d) return;
  s.uses[d.id] = (s.uses[d.id] ?? 0) + 1;
  s.pending = { id: d.id, title: d.title, body: d.text, kind: 'decision', choices: d.options };
}

// ── The Fork ──────────────────────────────────────────────────────────────

export function chooseFork(s: GameState, path: PathId) {
  const def = pathDef(path);
  if (!s.forkPending || !def.available(s).ok) return false;
  s.forkPending = false;
  s.path = path;
  s.decisions.push({ q: s.q, id: `fork_${path}`, label: `The Fork: ${def.code}, ${def.name}` });
  moment(s, `You chose ${def.code}: ${def.name}.`, 'decision');
  s.flags.chinaAware = true;

  switch (path) {
    case 'D':
      s.computeBoost += 0.02; s.powerConc += 10; s.trust -= 3; s.safety = Math.max(0, s.safety - 1);
      ticker(s, 'The President: "America will win the race to superintelligence. Nothing else matters."');
      break;
    case 'C':
      s.safety += 1.5; s.flags.burnLead = true;
      ticker(s, 'New doctrine: stay ahead, and spend every month of the lead on making AI safe.');
      break;
    case 'B':
      s.exportControls += 1; s.tension = clamp(s.tension + 20, 0, 100); s.powerConc += 10; s.security += 2; s.cnRaw *= 0.85;
      ticker(s, 'The President declares AI "the defining conflict of our time." Sanctions on Chinese chipmakers take effect at midnight.');
      break;
    case 'A':
      s.negotiation = newNegotiation(s);
      s.flags.dealEver = true;
      ticker(s, 'Washington invites Beijing to the table. The world holds its breath.');
      break;
    case 'S': {
      s.flags.moratorium = true;
      s.pauseCap = s.cap + 0.05;
      s.trust = clamp(s.trust + 5, 0, 100);
      s.powerConc = clamp(s.powerConc - 5, 0, 100);
      s.countries.find((c) => c.id === 'us')!.halted = true;
      ticker(s, 'Global moratorium declared. Frontier training runs must stop by midnight UTC.');
      if (s.intent === 'cooperative') {
        s.cnPauseCap = s.cnCap + 0.05;
        s.countries.find((c) => c.id === 'cn')!.halted = true;
        ticker(s, 'Beijing joins the moratorium. Zhonghe datacenters go dark on live television.', 'good');
      } else if (s.intent === 'opportunistic') {
        s.cnPauseCap = s.cnCap + 0.05;
        s.countries.find((c) => c.id === 'cn')!.halted = true;
        s.covert = Math.max(s.covert, s.cnRaw * 0.06);
        ticker(s, 'Beijing joins the moratorium. Zhonghe datacenters go dark on live television.');
        moment(s, 'China publicly joined the moratorium and secretly kept training.', 'hidden');
      } else {
        s.tension = clamp(s.tension + 30, 0, 100);
        ticker(s, 'Beijing refuses the moratorium: "We will not be held back by American fear."', 'warn');
        moment(s, 'China refused to join the moratorium.', 'danger');
      }
      break;
    }
  }
  return true;
}

// ── Negotiation Table ─────────────────────────────────────────────────────

export function negotiationOdds(s: GameState, offer: string[]) {
  const n = s.negotiation!;
  const base = s.intent === 'cooperative' ? 1.5 : s.intent === 'opportunistic' ? 0.4 : -0.6;
  const terms = offer.filter((id) => NEGOTIATION_ITEMS.some((i) => i.id === id && i.kind === 'term')).length;
  // The further China is behind, the more a deal appeals to it. Every extra demand costs goodwill.
  return base + leadMonths(s) / 10 - s.tension / 40 - EXTRA_TERM_COST * Math.max(0, terms - 2)
    + offer.reduce((a, id) => a + (n.values[id] ?? 0), 0);
}

export function submitOffer(s: GameState, offer: string[]) {
  const n = s.negotiation;
  if (!n || n.outcome !== 'pending') return;
  const terms = offer.filter((id) => NEGOTIATION_ITEMS.some((i) => i.id === id && i.kind === 'term'));
  if (terms.length < 2) { n.lastResponse = 'A deal needs at least two terms.'; return; }
  n.round++;
  const red = offer.find((id) => n.redLines.includes(id));
  if (red) {
    const item = NEGOTIATION_ITEMS.find((i) => i.id === red)!;
    if (!n.revealed.includes(red)) n.revealed.push(red);
    n.outcome = 'rejected';
    n.lastResponse = `Beijing walks out. "${item.refusal}"`;
    s.tension = clamp(s.tension + 20, 0, 100);
    moment(s, `Talks with China collapsed: you crossed a red line (${item.name.toLowerCase()}).`, 'danger');
    return;
  }
  const score = negotiationOdds(s, offer);
  const bluff = s.intent === 'racing' && score > -1.2 && chance(s, 0.35);
  if (score >= 0 || bluff) {
    n.outcome = 'accepted';
    n.lastResponse = s.intent === 'racing' ? 'Beijing accepts, quickly. Almost too quickly.' : 'Beijing accepts.';
    startDeal(s, offer);
    if (bluff || s.intent === 'racing') {
      s.covert = Math.max(s.covert, s.cnRaw * 0.05);
      moment(s, 'China signed the deal while planning to cheat.', 'hidden');
    }
    return;
  }
  const worst = [...offer].sort((a, b) => (n.values[a] ?? 0) - (n.values[b] ?? 0))[0];
  const item = NEGOTIATION_ITEMS.find((i) => i.id === worst)!;
  if (!n.revealed.includes(worst)) n.revealed.push(worst);
  if (n.round >= n.maxRounds) {
    n.outcome = 'rejected';
    n.lastResponse = `Talks collapse. Beijing's final word: "${item.refusal}"`;
    s.tension = clamp(s.tension + 15, 0, 100);
    moment(s, 'Talks with China collapsed.', 'danger');
  } else {
    n.lastResponse = `Rejected. "${item.refusal}"`;
  }
}

function startDeal(s: GameState, offer: string[]) {
  s.dealActive = true;
  let integrity = 25 + 10 * s.verification;
  for (const id of offer) {
    const it = NEGOTIATION_ITEMS.find((i) => i.id === id)!;
    integrity += id === 'inspections' && s.verification < 1 ? it.integrity / 2 : it.integrity;
    applyFx(s, it.fx);
  }
  s.dealIntegrity = clamp(integrity, 0, 100);
  s.dealFloor = Math.max(s.cap, s.cnCap);
  s.pauseCap = s.cnPauseCap = dealCeiling(s);
  for (const c of s.countries) if (c.id === 'us' || c.id === 'cn') c.inDeal = true;
  s.trust = clamp(s.trust + 6, 0, 100);
  s.powerConc = clamp(s.powerConc - 8, 0, 100);
  ticker(s, 'Deal signed in Geneva. Frontier training halts while inspectors deploy.', 'good');
  moment(s, `The US and China signed a verified slowdown deal (integrity ${Math.round(s.dealIntegrity)}%).`, 'decision');
}

export function closeNegotiation(s: GameState) {
  if (s.negotiation && s.negotiation.outcome !== 'pending') {
    s.negotiation = null;
  }
}

// ── Endings ───────────────────────────────────────────────────────────────

function checkEnding(s: GameState) {
  if (s.ending) return;
  if (!s.asiBy) {
    if (s.cap >= ASI) {
      s.asiBy = 'us'; s.asiQ = s.q; s.phase = 5;
      moment(s, 'The United States reached superintelligence.', 'info');
      if (!s.pending) fireEvent(s, EVENT_BY_ID['asi_keys']);
      else s.scheduled.push({ q: s.q + 1, id: 'asi_keys' });
    } else if (s.cnCap >= ASI && s.dealActive && s.pauseCap === null) {
      // Under a live deal, superintelligence arrives jointly; the US model is the one that matters.
      s.asiBy = 'us'; s.asiQ = s.q; s.phase = 5; s.cap = Math.max(s.cap, ASI);
      moment(s, 'The deal partners reached superintelligence together.', 'info');
      if (!s.pending) fireEvent(s, EVENT_BY_ID['asi_keys']);
      else s.scheduled.push({ q: s.q + 1, id: 'asi_keys' });
    } else if (s.cnCap >= ASI) {
      s.asiBy = 'cn'; s.asiQ = s.q; s.phase = 5;
      ticker(s, 'Beijing announces that Zhonghe has achieved superintelligence. Its first request is more power plants.', 'warn');
      moment(s, 'China reached superintelligence first.', 'danger');
    }
  }
  if (s.pending) return;
  if (s.asiBy && s.asiQ !== null && s.q >= s.asiQ + 3) finalize(s);
  else if (!s.asiBy && s.q >= END_Q) finalize(s);
}

export function determineEnding(s: GameState): EndingId {
  if (s.asiBy === 'us') return s.alignment < ALIGN_LOC ? 'loc' : s.powerConc >= POWER_GILDED ? 'gilded' : 'flourishing';
  if (s.asiBy === 'cn') return s.cnAlignment < ALIGN_LOC ? 'loc' : 'gilded';
  return (s.path === 'S' && s.flags.moratorium) || s.cap < SAR ? 'stagnation' : 'coldwar';
}

function finalize(s: GameState) {
  s.ending = determineEnding(s);
  s.endQ = s.q;
  if (s.ending === 'flourishing') {
    unlockComputeTier(s, 9);
    unlockComputeTier(s, 10);
  }
}

function snapshot(s: GameState): Snapshot {
  return {
    q: s.q, cap: s.cap, cnCap: s.cnCap, alignment: s.alignment,
    readout: s.panels.includes('alignment') ? s.readout : null, readoutSigma: s.readoutSigma,
    gdp: s.gdp, trust: s.trust, powerConc: s.powerConc, lead: leadMonths(s), covert: s.covert,
  };
}

// ── Ticker flavor ─────────────────────────────────────────────────────────

function flavorTicker(s: GameState) {
  const recent = new Set(s.ticker.slice(-40).map((t) => t.text));
  const pool = (FLAVOR[s.phase] ?? []).filter((l) => (!l.when || l.when(s)) && !recent.has(l.text));
  if (pool.length && chance(s, 0.35)) ticker(s, pick(s, pool).text);
  const hints = HINTS.filter((h) => (!h.when || h.when(s)) && !recent.has(h.text));
  if (hints.length && chance(s, 0.3)) {
    const h = pick(s, hints);
    ticker(s, h.text, h.kind ?? 'news');
  }
}

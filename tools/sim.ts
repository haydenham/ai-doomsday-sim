// Headless sim runner: plays many seeded runs with scripted bots and prints balance stats.
// Usage: npm run sim -- [runs=300] [botName]
declare const process: { argv: string[] };
import { chooseFork, closeNegotiation, newGame, resolveChoice, step, submitOffer } from '../src/sim/engine';
import { PATHS } from '../src/content/paths';
import { ENDINGS } from '../src/content/endings';
import { AC, ASI, SAR, TED_AI, START_YEAR, quarterLabel } from '../src/sim/constants';
import type { GameState, Lean, PathId } from '../src/sim/types';
import { rand } from '../src/sim/rng';

interface Bot {
  name: string;
  path: PathId;
  /** Leans in priority order. Unlisted leans rank last. */
  prefer: Lean[];
  /** Force a specific option index for a decision id. */
  force?: Record<string, number>;
  random?: boolean;
  /** AI 2040 rails: median year each rung is reached must fall in [lo, hi]. */
  rails?: Partial<Record<Rung, [number, number]>>;
}

type Rung = 'AC' | 'SAR' | 'TED' | 'ASI';
const RUNGS: [Rung, number][] = [['AC', AC], ['SAR', SAR], ['TED', TED_AI], ['ASI', ASI]];
// No deal: AC ~early 2030, ASI ~1 year later (80% CI: 2 months to 5 years).
const NO_DEAL = { AC: [2029.5, 2030.75], ASI: [2030.75, 2033] } as Bot['rails'];

const BOTS: Bot[] = [
  { name: 'race', path: 'D', prefer: ['race', 'power', 'hawk'], rails: NO_DEAL },
  { name: 'race-careful', path: 'D', prefer: ['safety', 'race', 'people'] },
  { name: 'burn-lead', path: 'C', prefer: ['safety', 'people', 'dove'] },
  { name: 'burn-naive', path: 'C', prefer: ['race', 'power', 'hawk'] },
  { name: 'fight', path: 'B', prefer: ['hawk', 'race', 'power'], rails: NO_DEAL },
  // Plan A: pause in 2029, AC ~mid-2030, TED-AI ~2035, handoff after 2040.
  { name: 'planA', path: 'A', prefer: ['safety', 'dove', 'people'],
    rails: { AC: [2030.25, 2031.5], TED: [2034, 2036.5], ASI: [2040, 2043] } },
  { name: 'planA-naive', path: 'A', prefer: ['race', 'power', 'dove'] },
  { name: 'shutdown', path: 'S', prefer: ['safety', 'people', 'dove'] },
  { name: 'shutdown-lift', path: 'S', prefer: ['safety', 'people', 'dove'], force: { s_lift: 0 } },
  { name: 'random', path: 'D', prefer: [], random: true },
];

function botTurn(s: GameState, bot: Bot) {
  if (s.pending) {
    const p = s.pending;
    let idx = 0;
    if (bot.force?.[p.id] !== undefined) idx = bot.force[p.id];
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
    submitOffer(s, n.round === 0 ? terms : [...terms, 'lift_controls']);
  }
}

function runOne(seed: number, bot: Bot, verbose = false) {
  const s = newGame(seed);
  for (let i = 0; i < 200000 && !s.ending; i++) {
    if (s.pending || s.forkPending || s.negotiation) { botTurn(s, bot); continue; }
    step(s);
  }
  if (verbose) {
    for (const h of s.history.filter((_, i) => i % 4 === 0))
      console.log(`${quarterLabel(h.q)} cap=${h.cap.toFixed(2)} cn=${h.cnCap.toFixed(2)} align=${h.alignment.toFixed(0)} read=${h.readout?.toFixed(0) ?? '-'} gdp=${h.gdp.toFixed(0)} trust=${h.trust.toFixed(0)} pc=${h.powerConc.toFixed(0)} lead=${h.lead.toFixed(1)}`);
    console.log('moments:', s.moments.map((m) => `${quarterLabel(m.q)} ${m.text}`).join('\n  '));
  }
  return s;
}

const runs = Number(process.argv[2] ?? 300);
const only = process.argv[3];
for (const bot of BOTS.filter((b) => !only || b.name === only)) {
  const endings: Record<string, number> = {};
  const reached: Record<Rung, number[]> = { AC: [], SAR: [], TED: [], ASI: [] };
  let endQ = 0, align = 0, score = 0, asi = 0, readoutPanel = 0, pathOk = 0, deal = 0, intel = 0, decisions = 0;
  for (let r = 0; r < runs; r++) {
    const s = runOne(1000 + r, bot, only !== undefined && r === 0);
    for (const [rung, cap] of RUNGS) {
      const h = s.history.find((x) => x.cap >= cap);
      if (h) reached[rung].push(START_YEAR + h.q / 4);
    }
    endings[s.ending ?? 'none'] = (endings[s.ending ?? 'none'] ?? 0) + 1;
    endQ += s.endQ ?? s.q;
    align += s.alignment;
    score += s.cumGdp * ENDINGS[s.ending!].multiplier;
    if (s.asiQ !== null) asi += s.asiQ;
    if (s.panels.includes('alignment')) readoutPanel++;
    if (s.panels.includes('intelligence')) intel++;
    if (s.path === bot.path) pathOk++;
    if (s.dealActive) deal++;
    decisions += s.decisions.length;
  }
  const pct = (n: number) => `${Math.round((100 * n) / runs)}%`;
  const asiRuns = Object.entries(endings).filter(([k]) => ['flourishing', 'gilded', 'loc'].includes(k)).reduce((a, [, v]) => a + v, 0);
  console.log(`\n== ${bot.name} (${runs} runs) ==`);
  console.log('  endings:', Object.entries(endings).map(([k, v]) => `${k} ${pct(v)}`).join(', '));
  console.log(`  avg end ${quarterLabel(Math.round(endQ / runs))} | avg ASI ${asiRuns ? quarterLabel(Math.round(asi / Math.max(1, asiRuns))) : '-'} | final alignment ${(align / runs).toFixed(0)} | score ${(score / runs).toFixed(0)}`);
  const median = (xs: number[]) => xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1] : null;
  console.log('  milestones:', RUNGS.map(([r]) => {
    const m = median(reached[r]);
    return `${r} ${m === null ? '-' : m.toFixed(2)}${m !== null && reached[r].length < runs ? ` (${pct(reached[r].length)})` : ''}`;
  }).join(' · '));
  if (bot.rails) {
    const fails = Object.entries(bot.rails).filter(([r, [lo, hi]]) => {
      const m = median(reached[r as Rung]);
      return m === null || m < lo || m > hi;
    }).map(([r, [lo, hi]]) => `${r} outside ${lo}–${hi}`);
    console.log(`  rails: ${fails.length ? `FAIL (${fails.join(', ')})` : 'ok'}`);
  }
  console.log(`  readout panel ${pct(readoutPanel)} | intelligence panel ${pct(intel)} | got path ${pct(pathOk)} | deal alive at end ${pct(deal)} | decisions/run ${(decisions / runs).toFixed(0)}`);
}

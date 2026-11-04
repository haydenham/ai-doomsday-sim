// Headless sim runner: plays many seeded runs with scripted bots and prints balance stats.
// Usage: npm run sim -- [runs=300] [botName]
declare const process: { argv: string[] };
import { chooseFork, closeNegotiation, newGame, resolveChoice, step, submitOffer } from '../src/sim/engine';
import { PATHS } from '../src/content/paths';
import { ENDINGS } from '../src/content/endings';
import { quarterLabel } from '../src/sim/constants';
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
}

const BOTS: Bot[] = [
  { name: 'race', path: 'D', prefer: ['race', 'power', 'hawk'] },
  { name: 'race-careful', path: 'D', prefer: ['safety', 'race', 'people'] },
  { name: 'burn-lead', path: 'C', prefer: ['safety', 'people', 'dove'] },
  { name: 'burn-naive', path: 'C', prefer: ['race', 'power', 'hawk'] },
  { name: 'fight', path: 'B', prefer: ['hawk', 'race', 'power'] },
  { name: 'planA', path: 'A', prefer: ['safety', 'dove', 'people'] },
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
    const offers = [['inspections', 'joint', 'macd'], ['inspections', 'joint', 'open'], ['inspections', 'joint', 'open', 'lift_controls']];
    submitOffer(s, offers[Math.min(n.round, offers.length - 1)]);
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
  let endQ = 0, align = 0, score = 0, asi = 0, readoutPanel = 0, pathOk = 0, deal = 0, intel = 0, decisions = 0;
  for (let r = 0; r < runs; r++) {
    const s = runOne(1000 + r, bot, only !== undefined && r === 0);
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
  console.log(`  readout panel ${pct(readoutPanel)} | intelligence panel ${pct(intel)} | got path ${pct(pathOk)} | deal alive at end ${pct(deal)} | decisions/run ${(decisions / runs).toFixed(0)}`);
}

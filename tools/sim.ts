// Headless sim runner: plays many seeded runs with scripted bots and prints balance stats.
// Usage: npm run sim -- [runs=300] [botName]
declare const process: { argv: string[] };
import { ENDINGS } from '../src/content/endings';
import { AC, ASI, SAR, TED_AI, START_YEAR, quarterLabel } from '../src/sim/constants';
import type { GameState, PathId } from '../src/sim/types';
import { SAFE, STRATEGIES, runOne as play, type Bot, type Rung } from './bots';

const RUNGS: [Rung, number][] = [['AC', AC], ['SAR', SAR], ['TED', TED_AI], ['ASI', ASI]];
// No deal: AC ~early 2030, ASI ~1 year later (80% CI: 2 months to 5 years).
const NO_DEAL = { AC: [2029.5, 2030.75], ASI: [2030.75, 2033] } as Bot['rails'];

const SAFE_SPLIT = { cap: 0.45, safety: 0.4, deploy: 0.1, security: 0.05 };
const RACE_SPLIT = { cap: 0.9 };

const BOTS: Bot[] = [
  // Rails bots leave the split to the labs so milestone dates measure the default trajectory.
  { name: 'race', path: 'D', prefer: ['race', 'power', 'hawk'], rails: NO_DEAL },
  { name: 'race-careful', path: 'D', prefer: ['safety', 'race', 'people'], alloc: 'reactive' },
  { name: 'burn-lead', path: 'C', prefer: SAFE, alloc: SAFE_SPLIT },
  { name: 'burn-naive', path: 'C', prefer: ['race', 'power', 'hawk'], alloc: RACE_SPLIT },
  { name: 'fight', path: 'B', prefer: ['hawk', 'race', 'power'], rails: NO_DEAL },
  // Plan A: pause in 2029, AC ~mid-2030, TED-AI ~2035, handoff after 2040.
  { name: 'planA', path: 'A', prefer: ['safety', 'dove', 'people'],
    rails: { AC: [2030.25, 2031.5], TED: [2034, 2036.5], ASI: [2040, 2043] } },
  { name: 'planA-naive', path: 'A', prefer: ['race', 'power', 'dove'], alloc: RACE_SPLIT },
  { name: 'shutdown', path: 'S', prefer: SAFE },
  { name: 'shutdown-lift', path: 'S', prefer: SAFE, force: { s_lift: 0 } },
  { name: 'random', path: 'D', prefer: [], random: true },
  { name: 'random-all', path: 'D', prefer: [], random: true, alloc: 'random' },
  // Does the dial have a sweet spot? Same (safe) decisions, different splits. No fixed split should win everywhere.
  ...(['A', 'C', 'D'] as PathId[]).flatMap((path): Bot[] =>
    STRATEGIES.map(([strat, alloc]) => ({ name: `${path}:${strat}`, path, prefer: SAFE, alloc }))),
];

function runOne(seed: number, bot: Bot, verbose = false): GameState {
  const s = play(seed, bot);
  if (verbose) {
    for (const h of s.history.filter((_, i) => i % 4 === 0))
      console.log(`${quarterLabel(h.q)} cap=${h.cap.toFixed(2)} cn=${h.cnCap.toFixed(2)} align=${h.alignment.toFixed(0)} read=${h.readout?.toFixed(0) ?? '-'} gdp=${h.gdp.toFixed(0)} trust=${h.trust.toFixed(0)} pc=${h.powerConc.toFixed(0)} lead=${h.lead.toFixed(1)}`);
    console.log('moments:', s.moments.map((m) => `${quarterLabel(m.q)} ${m.text}`).join('\n  '));
  }
  return s;
}

const wins: Record<string, number> = {};
const runs = Number(process.argv[2] ?? 300);
const only = process.argv[3];
for (const bot of BOTS.filter((b) => !only || b.name === only)) {
  const endings: Record<string, number> = {};
  const reached: Record<Rung, number[]> = { AC: [], SAR: [], TED: [], ASI: [] };
  let endQ = 0, align = 0, score = 0, asi = 0, readoutPanel = 0, pathOk = 0, deal = 0, intel = 0, decisions = 0;
  const takeover: Record<string, number> = {};
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
    if (s.takeover) takeover[s.takeover] = (takeover[s.takeover] ?? 0) + 1;
  }
  wins[bot.name] = (endings.flourishing ?? 0) / runs;
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
  if (Object.keys(takeover).length) console.log('  AI takeover before ASI:', Object.entries(takeover).map(([k, v]) => `${k} model ${pct(v)}`).join(', '));
  console.log(`  readout panel ${pct(readoutPanel)} | intelligence panel ${pct(intel)} | got path ${pct(pathOk)} | deal alive at end ${pct(deal)} | decisions/run ${(decisions / runs).toFixed(0)}`);
}

// Win rate (Flourishing) by path and steering strategy.
if (!only) {
  const strats = STRATEGIES.map(([n]) => n);
  console.log(`\n== win rate by steering ==\n  path  ${strats.map((n) => n.padStart(11)).join('')}   spread`);
  for (const path of ['A', 'C', 'D']) {
    const row = strats.map((n) => wins[`${path}:${n}`] ?? 0);
    console.log(`  ${path}     ${row.map((w) => `${Math.round(w * 100)}%`.padStart(11)).join('')}   ${Math.round((Math.max(...row) - Math.min(...row)) * 100)}`);
  }
}

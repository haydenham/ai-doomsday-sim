// Decision audit: does each decision actually change how runs end?
// For every decision and choice-event, force each option across the same seeds (paired) on Plans A, C and D
// with the reactive (human-like) bot, and measure the swing in win rate.
// Usage: npm run audit -- [runs=150]
declare const process: { argv: string[]; stdout?: { write?: (s: string) => void } };
import { DECISIONS } from '../src/content/decisions';
import { EVENTS } from '../src/content/events';
import type { PathId } from '../src/sim/types';
import { SAFE, runOne } from './bots';

const runs = Number(process.argv[2] ?? 150);
const PATHS: PathId[] = ['A', 'C', 'D'];
/** A decision that moves win rate by less than this on every path does nothing worth a pause. */
const THRESHOLD = 0.03;

const ids = [
  ...DECISIONS.map((d) => ({ id: d.id, title: d.title, n: d.options.length })),
  ...EVENTS.filter((e) => e.choices).map((e) => ({
    id: e.id, title: e.title ?? e.id, n: typeof e.choices === 'function' ? 3 : e.choices!.length,
  })),
];

const flourish = (path: PathId, force: Record<string, number>) => {
  let w = 0;
  const seen = { n: 0 };
  for (let r = 0; r < runs; r++) {
    const s = runOne(5000 + r, { name: 'audit', path, prefer: SAFE, alloc: 'reactive', force });
    if (s.ending === 'flourishing') w++;
    if (s.decisions.some((d) => d.id === Object.keys(force)[0])) seen.n++;
  }
  return { win: w / runs, seen: seen.n / runs };
};

const rows: { id: string; title: string; swing: Record<string, number>; seen: Record<string, number>; best: number }[] = [];
for (const d of ids) {
  if (d.n < 2) continue;
  const swing: Record<string, number> = {};
  const seen: Record<string, number> = {};
  for (const path of PATHS) {
    const res = Array.from({ length: d.n }, (_, i) => flourish(path, { [d.id]: i }));
    const wins = res.map((r) => r.win);
    swing[path] = Math.max(...wins) - Math.min(...wins);
    seen[path] = Math.max(...res.map((r) => r.seen));
  }
  rows.push({ id: d.id, title: d.title, swing, seen, best: Math.max(...Object.values(swing)) });
  process.stdout?.write?.('.');
}

const pct = (x: number) => `${Math.round(x * 100)}`.padStart(4);
console.log(`\n\nWin-rate swing (points) from flipping each decision, ${runs} paired seeds, reactive bot.`);
console.log(`Seen = share of runs where it came up.\n`);
console.log(`${'decision'.padEnd(26)}${PATHS.map((p) => `  ${p} swing/seen`).join('')}`);
for (const r of rows.sort((a, b) => b.best - a.best)) {
  const flag = r.best < THRESHOLD ? '  ← does nothing' : '';
  console.log(`${r.title.slice(0, 25).padEnd(26)}${PATHS.map((p) => `  ${pct(r.swing[p])} / ${pct(r.seen[p])}%`).join('')}${flag}`);
}
const dead = rows.filter((r) => r.best < THRESHOLD);
console.log(`\n${dead.length} of ${rows.length} decisions move win rate by < ${THRESHOLD * 100} points on every path.`);

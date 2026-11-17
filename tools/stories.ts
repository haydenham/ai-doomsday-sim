// Prints sample ending stories from bot runs, a few per ending, to proofread them.
// Usage: npm run stories -- [perEnding=2]
declare const process: { argv: string[] };
import { endingStory } from '../src/content/endingStory';
import { ENDINGS } from '../src/content/endings';
import type { EndingId, PathId } from '../src/sim/types';
import { SAFE, runOne, type Bot } from './bots';

const per = Number(process.argv[2] ?? 2);
const bots: Bot[] = [
  { name: 'race', path: 'D', prefer: ['race', 'power', 'hawk'] },
  { name: 'fight', path: 'B', prefer: ['hawk', 'race', 'power'] },
  ...(['A', 'B', 'C', 'D', 'S'] as PathId[]).map((path): Bot => ({ name: path, path, prefer: SAFE, alloc: 'reactive' })),
  { name: 'random', path: 'D', prefer: [], random: true, alloc: 'random' },
  { name: 'randomA', path: 'A', prefer: [], random: true, alloc: 'random' },
];
const seen: Partial<Record<EndingId, number>> = {};
for (let seed = 1; seed <= 400; seed++) {
  for (const bot of bots) {
    const s = runOne(seed, bot);
    const id = s.ending!;
    if ((seen[id] ?? 0) >= per) continue;
    seen[id] = (seen[id] ?? 0) + 1;
    console.log(`\n=== ${ENDINGS[id].title} (bot ${bot.name}, seed ${seed}) ===`);
    for (const line of endingStory(s)) console.log('  ' + line);
  }
}

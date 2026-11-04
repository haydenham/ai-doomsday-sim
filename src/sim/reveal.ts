import type { GameState } from './types';
import { quarterLabel } from './constants';
import { ENDINGS } from '../content/endings';
import { pathDef } from '../content/paths';
import { COMPUTE_TIERS } from '../content/ladders';

const alignAt = (s: GameState, q: number) => {
  const h = s.history.find((x) => x.q >= q) ?? s.history[s.history.length - 1];
  return h.alignment;
};

/** Find the decision that most plausibly swung the outcome, using the hidden alignment history. */
export function pivotalDecision(s: GameState) {
  const h = s.history;
  const good = s.ending === 'flourishing';
  let steep = { q: 0, delta: 0 };
  for (let i = 0; i < h.length; i++) {
    const j = Math.min(h.length - 1, i + 4);
    const delta = h[j].alignment - h[i].alignment;
    if (good ? delta > steep.delta : delta < steep.delta) steep = { q: h[i].q, delta };
  }
  const near = s.decisions.filter((d) => d.q <= steep.q + 1 && d.q >= steep.q - 4);
  const fork = s.decisions.find((d) => d.id.startsWith('fork_'));
  const d = near[near.length - 1] ?? fork ?? s.decisions[0];
  if (!d) return null;
  // Measure the chosen decision's own window, not the steepest one, so the text never misattributes.
  const own = alignAt(s, d.q + 4) - alignAt(s, d.q);
  const dir = own >= 0 ? 'rose' : 'fell';
  let text = `${quarterLabel(d.q)}: ${d.label}. Over the following year, true alignment ${dir} ${Math.abs(Math.round(own))} points.`;
  if (!near.length && Math.abs(steep.delta) >= 5) {
    text += ` The steepest ${good ? 'rise' : 'fall'} came in ${quarterLabel(steep.q)} (${Math.round(steep.delta) > 0 ? '+' : '−'}${Math.abs(Math.round(steep.delta))} in a year), when you made no decision at all.`;
  }
  return { label: d.label, q: d.q, text };
}

/** Counterfactual nudges for the replay. */
export function whatIfs(s: GameState): string[] {
  const out: string[] = [];
  if (s.ending === 'flourishing') return out;
  if (!s.panels.includes('alignment')) out.push('You never did enough alignment research to see a readout. More compute on safety would have shown you this chart while it was happening.');
  if (s.flags.dealEver && s.verification < 2) out.push('You made a deal with almost no verification. Inspectors had little to check with.');
  if (peakCovert(s) > 0 && s.intel < 2) out.push('China ran covert compute the whole time. Better intelligence would have found it.');
  if (s.asiBy === 'cn') out.push('China got there first. Securing the labs or holding export controls would have kept your lead.');
  if (s.powerConc >= 60 && s.ending === 'gilded') out.push('The AI was aligned, but with very few people. Open research and an AI dividend spread power out.');
  if (s.path === 'S' && s.ending === 'stagnation') out.push('The moratorium held, and so did the economy. Lifting it slowly, late, might have worked.');
  if (s.algoTier >= 6 && s.safety < 3) out.push('Once models started thinking in vectors instead of words, your evals got much blurrier. Interpretability work offsets that.');
  return out.slice(0, 3);
}

export const peakCovert = (s: GameState) => Math.max(0, ...s.history.map((h) => h.covert));

export const difficultyLabel = (d: number) => (d < 0.9 ? 'Easy' : d < 1.15 ? 'Normal' : 'Hard');
export const timelineLabel = (t: number) => (t < 0.95 ? 'Slow' : t < 1.08 ? 'Normal' : 'Fast');

export function score(s: GameState) {
  return s.cumGdp * ENDINGS[s.ending ?? 'coldwar'].multiplier;
}

export function shareText(s: GameState) {
  const e = ENDINGS[s.ending!];
  const sc = score(s);
  const path = s.path ? `Plan ${s.path}, ${pathDef(s.path).name}` : 'No path';
  return [
    `AI 2040 | ${e.title}`,
    `Score: $${sc >= 1000 ? (sc / 1000).toFixed(1) + 'Q' : sc.toFixed(0) + 'T'} | Hidden alignment: ${Math.round(s.alignment)}%`,
    `Path: ${path} | Compute: ${COMPUTE_TIERS[s.computeTier - 1].name}`,
    `Ended ${quarterLabel(s.endQ ?? s.q)} | Seed ${s.seed}`,
  ].join('\n');
}

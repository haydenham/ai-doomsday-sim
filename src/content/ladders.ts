import type { GameState } from '../sim/types';
import { AC, ASI, SAR, TED_AI } from '../sim/constants';

export interface ComputeTier {
  tier: number;
  name: string;
  where: string;
  multiplier: number;
  headline: string;
  tradeoff: string;
  /** Layer used by the Frontier panel. */
  layer: 'earth' | 'ocean' | 'orbit' | 'moon' | 'sun';
}

// Tiers 2-8 are unlocked by cards (see cards.ts). 9-10 arrive on the good path in the endgame.
export const COMPUTE_TIERS: ComputeTier[] = [
  { tier: 1, name: 'Domestic GPU clusters', where: 'Virginia, Texas, Oregon', multiplier: 1, layer: 'earth',
    headline: '', tradeoff: 'Local water and power complaints' },
  { tier: 2, name: 'Gigawatt campuses', where: 'Midwest & Gulf Coast', multiplier: 2, layer: 'earth',
    headline: 'First gigawatt campus online in Ohio.',
    tradeoff: 'Grid strain, local opposition' },
  { tier: 3, name: 'Nuclear-powered campuses', where: 'Restarted & new reactors', multiplier: 2.2, layer: 'earth',
    headline: 'Three Mile Island reopens. For AI.',
    tradeoff: 'Slow to build, huge payoff' },
  { tier: 4, name: 'Nordic & Arctic sites', where: 'Norway, Iceland, Finland', multiplier: 1.8, layer: 'earth',
    headline: 'Fjord-cooled datacenters break ground.',
    tradeoff: 'Depends on allies trusting you' },
  { tier: 5, name: 'Gulf mega-campuses', where: 'UAE & Saudi Arabia', multiplier: 2, layer: 'earth',
    headline: 'Five gigawatts in the Gulf desert.',
    tradeoff: 'Security risk; China watches closely' },
  { tier: 6, name: 'Desert solar megafarms', where: 'Nevada, Sahara, Outback', multiplier: 3, layer: 'earth',
    headline: 'Solar farms the size of Delaware.',
    tradeoff: 'Massive scale, easy sabotage target' },
  { tier: 7, name: 'Floating & subsea datacenters', where: 'International waters', multiplier: 3, layer: 'ocean',
    headline: 'Datacenter fleet anchors off California.',
    tradeoff: 'Outside any jurisdiction. Hard to verify.' },
  { tier: 8, name: 'Orbital compute', where: 'Low Earth orbit', multiplier: 5, layer: 'orbit',
    headline: 'Compute satellites launch by the thousand.',
    tradeoff: 'Almost impossible for anyone to inspect' },
  { tier: 9, name: 'Lunar foundries', where: 'The Moon', multiplier: 10, layer: 'moon',
    headline: 'Robots build chip fabs on the Moon.',
    tradeoff: 'Only reachable with stable control' },
  { tier: 10, name: 'Dyson swarm fragments', where: 'Solar orbit', multiplier: 100, layer: 'sun',
    headline: 'A Dyson swarm begins.',
    tradeoff: '—' },
];

export interface AlgoTier {
  tier: number;
  name: string;
  plain: string;
  multiplier: number;
  minQ: number;
  /** Extra condition beyond minQ; random chance applies on top. */
  when?: (s: GameState) => boolean;
  headline: string;
}

export const ALGO_TIERS: AlgoTier[] = [
  { tier: 1, name: 'Data curation pipelines', plain: 'Cleaner training data', multiplier: 1, minQ: 0, headline: '' },
  { tier: 2, name: 'RL on verifiable tasks', plain: 'Models learn by checking their own answers', multiplier: 1.5, minQ: 4,
    headline: 'Models learn to reason step by step.' },
  { tier: 3, name: 'Sparse mixture-of-experts', plain: 'Only the needed parts of the model run', multiplier: 1.4, minQ: 6,
    headline: 'Training cost cut by a third.' },
  { tier: 4, name: 'Synthetic data flywheels', plain: 'Models generate their own training data', multiplier: 1.6, minQ: 7,
    headline: 'Models now train on their own data.' },
  { tier: 5, name: 'Continual learning', plain: 'Models learn on the job, permanently', multiplier: 1.8, minQ: 10,
    headline: 'Models now learn on the job.' },
  { tier: 6, name: 'Neuralese reasoning', plain: 'Models think in vectors, not words', multiplier: 2, minQ: 12,
    headline: 'Models now think in vectors. Humans can\'t read it.' },
  { tier: 7, name: 'Automated AI researchers', plain: 'AI does the research now', multiplier: 2.5, minQ: 12,
    when: (s) => s.cap >= AC,
    headline: 'AIs now write all the code in AI research.' },
  { tier: 8, name: 'AI-designed architectures', plain: 'AI designs the next AI', multiplier: 3, minQ: 14,
    when: (s) => s.cap >= SAR,
    headline: 'AI designs an architecture no human understands.' },
  { tier: 9, name: 'Beyond backpropagation', plain: 'A new way to learn, found by AI', multiplier: 4, minQ: 16,
    when: (s) => s.cap >= TED_AI,
    headline: 'AI finds a learning rule 40× better than backprop.' },
  { tier: 10, name: 'Recursive self-improvement', plain: 'The loop closes', multiplier: 8, minQ: 18,
    when: (s) => s.cap >= ASI - 1,
    headline: 'AI improves itself faster than we can audit.' },
];

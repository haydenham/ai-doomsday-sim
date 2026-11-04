import type { GameState } from '../sim/types';
import { AC } from '../sim/constants';

export interface PanelDef {
  id: string;
  title: string;
  column: 0 | 1 | 2;
  unlockWhen: (s: GameState) => boolean;
  unlockHeadline: string;
}

// Order matters only for layout within a column. Unlocks are never explained.
export const PANELS: PanelDef[] = [
  { id: 'desk', title: 'The Desk', column: 0, unlockWhen: () => true, unlockHeadline: '' },
  { id: 'allocation', title: 'Compute Allocation', column: 0,
    unlockWhen: (s) => s.q >= 2,
    unlockHeadline: 'The labs start reporting how they spend their compute.' },
  { id: 'alignment', title: 'Alignment Readout', column: 0,
    unlockWhen: (s) => s.safety >= 2.5,
    unlockHeadline: 'Safety team: "We can check if the models are honest. Mostly."' },
  { id: 'compute', title: 'Compute', column: 1,
    unlockWhen: (s) => !!s.flags.labMilestone,
    unlockHeadline: 'Meridian announces a $100B training run.' },
  { id: 'algorithms', title: 'Algorithms', column: 1,
    unlockWhen: (s) => s.algoTier >= 2,
    unlockHeadline: 'Better recipes, not just more chips.' },
  { id: 'intelligence', title: 'Intelligence Explosion', column: 1,
    unlockWhen: (s) => s.cap >= AC,
    unlockHeadline: 'AI now writes the code that builds AI.' },
  { id: 'frontier', title: 'Frontier', column: 1,
    unlockWhen: (s) => s.computeTier >= 6,
    unlockHeadline: 'Earth was the tutorial.' },
  { id: 'map', title: 'World', column: 2,
    unlockWhen: (s) => !!s.flags.chinaAware,
    unlockHeadline: 'Beijing responds.' },
  { id: 'deal', title: 'The Deal', column: 2,
    unlockWhen: (s) => s.dealActive || !!s.flags.dealEver,
    unlockHeadline: 'Inspectors land in Shanghai and Nevada.' },
];

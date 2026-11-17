import type { EndingId } from '../sim/types';

export interface EndingDef {
  id: EndingId;
  title: string;
  multiplier: number;
  /** The closing line of the ending story. */
  epitaph: string;
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  flourishing: {
    id: 'flourishing', title: 'Flourishing', multiplier: 1,
    epitaph: 'People still argue about what to do with the stars.',
  },
  gilded: {
    id: 'gilded', title: 'The Gilded Cage', multiplier: 0.4,
    epitaph: 'Everyone is rich. No one gets a vote.',
  },
  cnfirst: {
    id: 'cnfirst', title: 'Second Place', multiplier: 0.3,
    epitaph: 'America is comfortable, and has no say in what comes next.',
  },
  stagnation: {
    id: 'stagnation', title: 'Stagnation', multiplier: 0.6,
    epitaph: 'Safe, slow and uneasy. Somewhere, someone is still building.',
  },
  coldwar: {
    id: 'coldwar', title: 'Cold War', multiplier: 0.6,
    epitaph: 'Every year is a little more dangerous than the last.',
  },
  loc: {
    id: 'loc', title: 'Loss of Control', multiplier: 0,
    epitaph: 'By the time anyone moved to shut it down, it no longer needed us.',
  },
};

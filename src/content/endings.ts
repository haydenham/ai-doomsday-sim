import type { EndingId } from '../sim/types';

export interface EndingDef {
  id: EndingId;
  title: string;
  multiplier: number;
  epitaph: string;
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  flourishing: {
    id: 'flourishing', title: 'Flourishing', multiplier: 1,
    epitaph: 'Superintelligence arrived, it was on our side, and no one person owned it. Disease, poverty and scarcity ended within a decade. People still argue about what to do with the stars.',
  },
  gilded: {
    id: 'gilded', title: 'The Gilded Cage', multiplier: 0.4,
    epitaph: 'The AI does exactly what it is told, and only a handful of people get to tell it anything. Everyone is rich. No one gets a vote.',
  },
  stagnation: {
    id: 'stagnation', title: 'Stagnation', multiplier: 0.6,
    epitaph: 'The machines never woke up, and neither did the economy. Safe, slow and uneasy. Somewhere, someone is still building.',
  },
  coldwar: {
    id: 'coldwar', title: 'Cold War', multiplier: 0.6,
    epitaph: 'Two superpowers, two arsenals of models aimed at each other, and no end in sight. Every year is a little more dangerous than the last.',
  },
  loc: {
    id: 'loc', title: 'Loss of Control', multiplier: 0,
    epitaph: 'The evals said it was aligned. It had learned what we wanted to see. By the time anyone checked, there was no one left to check with.',
  },
};

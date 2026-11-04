import type { GameState } from './types';
import { AUTO_RESEARCH } from './constants';

/** Months ahead of China. One order of magnitude of effective compute ~ two years of progress. */
export const leadMonths = (s: GameState) => (s.cap - s.cnCap) * 24;

/** How much faster AI research runs thanks to AI researchers. */
export function baseRdMult(cap: number) {
  if (cap < AUTO_RESEARCH) return 1;
  return 1 + 2.6 * Math.pow(cap - AUTO_RESEARCH, 1.45);
}

export const effectiveCompute = (s: GameState) => s.raw * s.algo;

/** Parallel AI researcher copies (flavor stat for the Intelligence panel). */
export const agentCopies = (s: GameState) => Math.pow(10, Math.max(0, s.cap - 4.2)) * 0.02;

export const quarterSeconds = (s: GameState) => {
  switch (s.phase) {
    case 1: return 30;
    case 2: return 28;
    case 3: return 24 - 8 * Math.min(1, Math.max(0, (s.q - 12) / 24));
    case 4: return 20;
    default: return 14;
  }
};

import type { GameState } from './types';
import { CAP_LEVELS, CAP_OFFSET } from './constants';

/** Months ahead of China. One order of magnitude of effective compute ~ two years of progress. */
export const leadMonths = (s: GameState) => (s.cap - s.cnCap) * 24;

export const capOf = (raw: number, algo: number) => Math.log10(raw * algo) - CAP_OFFSET;

/** How much faster AI research runs thanks to AI. Log-interpolated between the ladder's speedups. */
export function baseRdMult(cap: number) {
  const pts: [number, number][] = [[6.5, 1], ...CAP_LEVELS.slice(1).map((l): [number, number] => [l.at, l.speedup])];
  let i = 0;
  while (i < pts.length - 2 && cap > pts[i + 1][0]) i++;
  const [[x0, y0], [x1, y1]] = [pts[i], pts[i + 1]];
  const f = Math.max(0, (cap - x0) / (x1 - x0));
  return Math.pow(10, Math.log10(y0) + f * (Math.log10(y1) - Math.log10(y0)));
}

/** The algorithmic efficiency of the model actually deployed (excludes research a pause or treaty holds back). */
export const deployedAlgo = (s: GameState) => Math.min(s.algo, Math.pow(10, s.cap + CAP_OFFSET) / s.raw);

export const effectiveCompute = (s: GameState) => s.raw * s.algo;

/** Parallel AI researcher copies (flavor stat for the Intelligence panel). */
export const agentCopies = (s: GameState) => Math.pow(10, Math.max(0, s.cap - 4.2)) * 0.02;

export const quarterSeconds = (s: GameState) => {
  switch (s.phase) {
    // Short early on, when there is little on screen; longer once there is more to watch.
    case 1: return 14;
    case 2: return 18;
    case 3: return 20 - 6 * Math.min(1, Math.max(0, (s.q - 12) / 24));
    case 4: return 16;
    default: return 12;
  }
};

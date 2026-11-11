import type { GameState } from './types';
import { ASI, SAR } from './constants';
import { clamp } from './helpers';

// AI takeover: a misaligned model that can do AI research can also copy itself out, hide, and act.
// From Superhuman AI Researcher on, every frontier model carries a quarterly risk, not just the one at superintelligence.

/** Alignment below this starts to carry takeover risk. */
const SAFE_ALIGN = 55;

/** Chance per quarter that a model with this alignment and capability escapes control. */
export function takeoverHazard(alignment: number, cap: number, containment: number) {
  if (cap < SAR) return 0;
  const m = clamp((SAFE_ALIGN - alignment) / SAFE_ALIGN, 0, 1);
  const c = clamp((cap - SAR) / (ASI - SAR), 0, 1);
  return 0.35 * m * m * (0.3 + 0.7 * c) * (1 - clamp(containment, 0, 0.85));
}

/** How aligned your safety science lets you make a model: 45 with none, ~99 at the top of the scale. */
export const alignCeiling = (s: GameState) => clamp(45 + 4.5 * s.safety, 0, 100);

/** AI control: monitoring, sandboxing, no unsupervised internet. A second job of the security share. */
export const usContainment = (s: GameState) => 0.08 * s.security;
/** China's labs run tight control on their models; inspections under a deal add a little. */
export const cnContainment = (s: GameState) => 0.3 + (s.dealActive ? 0.1 : 0);

export function takeoverRisks(s: GameState) {
  const us = takeoverHazard(s.alignment, s.cap, usContainment(s));
  const cn = takeoverHazard(s.cnAlignment, s.cnCap, cnContainment(s));
  // Published research lets anyone train near-frontier models, with no safety team and no containment.
  const open = s.openness > 0
    ? (s.openness / 10) * takeoverHazard(Math.min(s.alignment, s.cnAlignment) - 10, Math.max(s.cap, s.cnCap) - 0.5, 0)
    : 0;
  return { us, cn, open };
}

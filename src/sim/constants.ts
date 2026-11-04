export const START_YEAR = 2027;
export const FORK_Q = 8; // 2029 Q1
export const TAKEOFF_Q = 12; // 2030 Q1
export const RECKONING_Q = 36; // 2036 Q1
export const UNPAUSE_Q = 52; // 2040 Q1
export const END_Q = 60; // hard stop, 2042 Q1

// Capability is log10(effective compute in H100-equivalents) minus CAP_OFFSET (see capOf).
// Rungs and their AI R&D speedups follow AI 2040's takeoff forecast.
export const CAP_OFFSET = 1;
export const AC = 8.0; // Automated Coder, 3×
export const SAR = 8.8; // Superhuman AI Researcher, 20×
export const TED_AI = 9.6; // Top-expert-dominating AI, 40×; the Plan A ceiling
export const ASI = 11.5; // Superintelligence, ~10,000×

// Plan A: training halts at signing and resumes Q1 2030, the ceiling reaches TED-AI around 2035,
// then barely moves until the 2040 unpause. dealShift (quarters) moves the schedule.
export const DEAL_RESUME_Q = 12;
export const DEAL_CEILING: [q: number, cap: number][] = [[12, 7.4], [14, AC], [32, TED_AI], [52, TED_AI + 0.3]];

export const ALIGN_LOC = 40; // below this at superintelligence = loss of control
export const POWER_GILDED = 60;

export const CAP_LEVELS: { at: number; name: string; speedup: number; blurb: string }[] = [
  { at: 0, name: 'Agents', speedup: 1, blurb: 'AI agents do real work, with plenty of mistakes.' },
  { at: AC, name: 'Automated Coder', speedup: 3, blurb: 'AI writes all the code in AI research.' },
  { at: SAR, name: 'Superhuman AI Researcher', speedup: 20, blurb: 'AI does AI research better than any human team.' },
  { at: TED_AI, name: 'TED-AI', speedup: 40, blurb: 'Beats top human experts at nearly every task.' },
  { at: ASI, name: 'Superintelligence', speedup: 10000, blurb: 'Far beyond human understanding.' },
];

export function capLevel(cap: number) {
  let idx = 0;
  for (let i = 0; i < CAP_LEVELS.length; i++) if (cap >= CAP_LEVELS[i].at) idx = i;
  const cur = CAP_LEVELS[idx];
  const next = CAP_LEVELS[idx + 1] ?? null;
  const lo = idx === 0 ? 6.5 : cur.at;
  const progress = next ? Math.max(0, Math.min(1, (cap - lo) / (next.at - lo))) : 1;
  return { idx, cur, next, progress };
}

export const quarterLabel = (q: number) => `Q${(q % 4) + 1} ${START_YEAR + Math.floor(q / 4)}`;
export const yearOf = (q: number) => START_YEAR + Math.floor(q / 4);

export const PHASE_NAMES: Record<number, string> = {
  1: 'The Writing on the Wall',
  2: 'Choose a Path',
  3: 'Takeoff',
  4: 'Pause or Reckoning',
  5: 'Superintelligence',
};

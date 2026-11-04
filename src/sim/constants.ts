export const START_YEAR = 2027;
export const FORK_Q = 8; // 2029 Q1
export const TAKEOFF_Q = 12; // 2030 Q1
export const RECKONING_Q = 36; // 2036 Q1
export const UNPAUSE_Q = 52; // 2040 Q1
export const END_Q = 60; // hard stop, 2042 Q1

// Capability is log10(effective compute in H100-equivalents).
export const AUTO_RESEARCH = 8.0;
export const EXPERT = 8.8;
export const ASI = 11.5;

export const ALIGN_LOC = 40; // below this at superintelligence = loss of control
export const POWER_GILDED = 60;

export const CAP_LEVELS: { at: number; name: string; blurb: string }[] = [
  { at: 0, name: 'Agentic assistants', blurb: 'AI agents book travel, write code, and make plenty of mistakes.' },
  { at: 7.2, name: 'Superhuman coder', blurb: 'AI writes software better than any human engineer.' },
  { at: AUTO_RESEARCH, name: 'Automated AI researcher', blurb: 'AI now does most of the work of improving AI.' },
  { at: EXPERT, name: 'Top-expert AI', blurb: 'Matches the best humans in nearly every field.' },
  { at: 9.6, name: 'Superhuman AI researcher', blurb: 'Makes a decade of AI progress in months.' },
  { at: 10.5, name: 'Broadly superhuman AI', blurb: 'Better than humanity at almost everything that matters.' },
  { at: ASI, name: 'Superintelligence', blurb: 'Far beyond human understanding.' },
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

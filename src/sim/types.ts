export type PathId = 'A' | 'B' | 'C' | 'D' | 'S';
export type Phase = 1 | 2 | 3 | 4 | 5;
export type Intent = 'cooperative' | 'opportunistic' | 'racing';
export type EndingId = 'flourishing' | 'gilded' | 'stagnation' | 'coldwar' | 'loc';

/** Numeric state fields that content may add to directly. */
export type NumKey =
  | 'gdp'
  | 'trust'
  | 'powerConc'
  | 'tension'
  | 'alignment'
  | 'cnAlignment'
  | 'safety'
  | 'verification'
  | 'intel'
  | 'security'
  | 'openness'
  | 'deployment'
  | 'computeBoost'
  | 'exportControls'
  | 'dealIntegrity'
  | 'covert'
  | 'rdBoost'
  | 'growthHold';

export type MulKey = 'raw' | 'algo' | 'cnRaw' | 'cnAlgo' | 'gdp' | 'covert';

export interface Fx {
  add?: Partial<Record<NumKey, number>>;
  mul?: Partial<Record<MulKey, number>>;
  flags?: Record<string, number | boolean>;
  /** Escape hatch for effects that don't fit add/mul. */
  run?: (s: GameState) => void;
  headline?: string;
  /** Recorded for the Reveal screen. */
  moment?: string;
  /** Event ids to schedule, with delay in quarters. */
  schedule?: { id: string; delay: number }[];
}

/**
 * Chip shorthand shown on cards/choices: "g:Trust +6" (good), "b:Tension +10" (bad),
 * "n:Compute tier 2" (neutral), "h:Hidden effects" (affects stats you can't see).
 */
export type Chip = string;

export type Lean = 'race' | 'safety' | 'hawk' | 'dove' | 'people' | 'power';

export interface Choice {
  label: string;
  chips?: Chip[];
  fx?: Fx;
  /** What this choice says about the player. Shown on the Reveal; used by bots. */
  lean?: Lean;
}

export interface PendingEvent {
  id: string;
  title: string;
  body: string;
  kind: 'decision' | 'crisis' | 'news' | 'ai' | 'milestone';
  choices: Choice[];
}

export interface Snapshot {
  q: number;
  cap: number;
  cnCap: number;
  alignment: number;
  readout: number | null;
  readoutSigma: number;
  gdp: number;
  trust: number;
  powerConc: number;
  lead: number;
  covert: number;
}

export interface Moment {
  q: number;
  text: string;
  kind: 'hidden' | 'info' | 'danger' | 'decision';
}

export interface Decision {
  q: number;
  id: string;
  label: string;
}

export interface TickerItem {
  id: number;
  q: number;
  text: string;
  kind: 'news' | 'unlock' | 'tier' | 'warn' | 'ai' | 'good';
}

export interface Country {
  id: string;
  name: string;
  x: number;
  y: number;
  bloc: 'us' | 'cn' | 'row';
  /** -1 leans China, +1 leans US */
  stance: number;
  inDeal: boolean;
  halted: boolean;
}

export interface Negotiation {
  round: number;
  maxRounds: number;
  /** China's hidden valuation for each item. */
  values: Record<string, number>;
  /** Items whose valuation sign intel has revealed. */
  revealed: string[];
  lastResponse: string | null;
  outcome: 'pending' | 'accepted' | 'rejected';
}

export interface GameState {
  seed: number;
  rngState: number;
  /** Continuous time in quarters since 2027 Q1. */
  t: number;
  q: number;
  phase: Phase;
  path: PathId | null;

  // Visible
  gdp: number; // $T per year
  cumGdp: number; // $T, sum over quarters (score base)
  raw: number; // H100-equivalents
  algo: number; // algorithmic efficiency multiplier
  capRaw: number; // log10(effective compute), unconstrained
  cap: number; // realized capability (may lag or be capped)
  trust: number;
  powerConc: number;
  tension: number;
  jobs: number;
  rdMult: number;

  // Levers
  safety: number;
  verification: number;
  intel: number;
  security: number;
  openness: number;
  deployment: number;
  computeBoost: number;
  exportControls: number;
  rdBoost: number;
  growthHold: number;
  pauseCap: number | null;
  overhangRate: number;
  ubi: boolean;

  // China
  cnRaw: number;
  cnAlgo: number;
  cnCap: number;
  cnRdMult: number;
  cnPauseCap: number | null;
  covert: number; // hidden H100e
  cnAlignment: number; // hidden
  intent: Intent; // hidden

  // Hidden seeds
  alignment: number;
  difficulty: number;
  timeline: number;

  // Proxy
  readout: number;
  readoutSigma: number;

  // Deal
  dealActive: boolean;
  dealIntegrity: number;
  negotiation: Negotiation | null;

  computeTier: number;
  algoTier: number;
  algoByAI: number[]; // tiers discovered by AI

  countries: Country[];

  flags: Record<string, number | boolean>;
  uses: Record<string, number>;
  scheduled: { q: number; id: string }[];
  firedEvents: Record<string, number>;

  panels: string[];
  panelsUnlockedAt: Record<string, number>;
  leans: Partial<Record<Lean, number>>;

  pending: PendingEvent | null;
  forkPending: boolean;

  ticker: TickerItem[];
  tickerSeq: number;

  history: Snapshot[];
  moments: Moment[];
  decisions: Decision[];

  asiQ: number | null;
  asiBy: 'us' | 'cn' | null;
  ending: EndingId | null;
  endQ: number | null;
}

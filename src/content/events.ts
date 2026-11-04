import type { Choice, Fx, GameState, PendingEvent } from '../sim/types';
import { moment, releaseOverhang, shiftStance, ticker } from '../sim/helpers';
import { leadMonths } from '../sim/derived';
import { rand } from '../sim/rng';

export interface EventDef {
  id: string;
  /** Default true: fires at most once per run. */
  once?: boolean;
  cooldown?: number;
  /** Only fires when scheduled (by a card or another event). */
  scheduledOnly?: boolean;
  when?: (s: GameState) => boolean;
  chance?: number | ((s: GameState) => number);
  kind?: PendingEvent['kind'];
  title?: string;
  body?: string | ((s: GameState) => string);
  /** If present, the clock freezes and the player chooses. */
  choices?: Choice[] | ((s: GameState) => Choice[]);
  /** Headline-only events apply fx immediately. */
  fx?: Fx;
  /** Applied the moment the event fires, before any choice. */
  onFire?: Fx;
}

const collapseDeal = (s: GameState, why: string) => {
  if (!s.dealActive) return;
  s.dealActive = false;
  s.pauseCap = null;
  s.cnPauseCap = null;
  s.tension = Math.min(100, s.tension + 20);
  for (const c of s.countries) c.inDeal = false;
  ticker(s, why, 'warn');
  moment(s, 'The US-China deal collapsed.', 'danger');
};

export const EVENTS: EventDef[] = [
  // ── Scripted openers ──────────────────────────────────────────────────
  {
    id: 'lab_milestone', when: (s) => s.q >= 3, chance: 1,
    fx: { flags: { labMilestone: true } },
  },
  {
    id: 'china_consortium', when: (s) => s.q >= 6, chance: 0.5,
    fx: { flags: { chinaAware: true },
      headline: 'China merges its AI labs into one: Zhonghe.' },
  },
  // ── Chains ────────────────────────────────────────────────────────────
  {
    id: 'smuggling', scheduledOnly: true, kind: 'news',
    title: 'Chip smuggling',
    body: '40,000 banned chips seized in Singapore, bound for China. Many more got through.',
    choices: [
      { label: 'Crack down', lean: 'hawk', chips: ['g:China slows', 'b:tension +5', 'b:prosperity −0.5%'],
        fx: { add: { exportControls: 0.5, tension: 5 }, mul: { gdp: 0.995 }, headline: 'Singapore route closed.' } },
      { label: 'Let it go', lean: 'dove', chips: ['g:tension −3', 'b:China compute +10%'],
        fx: { mul: { cnRaw: 1.1 }, add: { tension: -3 } } },
    ],
  },
  {
    id: 'china_offer', when: (s) => s.q >= 4 && s.q < 8 && s.intent !== 'racing', chance: 0.35, kind: 'news',
    title: 'Beijing wants to talk',
    body: 'China proposes joint talks on AI risk. Hawks call it a stall.',
    choices: [
      { label: 'Accept', lean: 'dove', chips: ['g:tension −10', 'g:verification +0.5', 'b:trust −2'],
        fx: { add: { tension: -10, verification: 0.5, trust: -2 }, flags: { chinaAware: true, talks: true } } },
      { label: 'Decline', lean: 'hawk', chips: ['g:trust +2', 'b:tension +5'],
        fx: { add: { tension: 5, trust: 2 }, flags: { chinaAware: true } } },
    ],
  },
  // ── Domestic ──────────────────────────────────────────────────────────
  {
    id: 'protests', once: false, cooldown: 6, kind: 'crisis',
    when: (s) => s.jobs >= 10 && s.trust < 40 && !s.ubi, chance: 0.4,
    title: 'Protests',
    body: (s) => `${s.jobs.toFixed(0)}% of jobs are automated. Crowds march on Washington.`,
    choices: [
      { label: 'Promise a dividend', lean: 'people', chips: ['g:trust +6', 'b:prosperity −1.5%'],
        fx: { add: { trust: 6, powerConc: -3 }, mul: { gdp: 0.985 }, run: (s) => { s.ubi = true; } } },
      { label: 'Send the Guard', lean: 'power', chips: ['g:order', 'b:trust −8', 'b:power +6'],
        fx: { add: { trust: -8, powerConc: 6 } } },
      { label: 'Wait it out', chips: ['b:trust −4'], fx: { add: { trust: -4 } } },
    ],
  },
  {
    id: 'election', once: false, kind: 'milestone',
    when: (s) => s.q % 16 === 7 && s.q < 52,
    chance: 1,
    title: 'Election',
    body: (s) => s.trust >= 40 ? 'Voters back your AI policy.' : 'Voters reject your AI policy. A new team cuts your programs.',
    choices: (s) => [
      s.trust >= 40
        ? { label: 'Continue', chips: ['g:trust +5'], fx: { add: { trust: 5 } } }
        : { label: 'Continue', chips: ['b:safety −1', 'b:verification −1', 'n:trust resets'],
            fx: { add: { safety: -1, verification: -1 }, run: (st) => { st.trust = 45; moment(st, 'You lost an election over AI.', 'info'); } } },
    ],
  },
  // ── Security & China ──────────────────────────────────────────────────
  {
    id: 'weight_theft', kind: 'crisis',
    when: (s) => s.cap >= 7.2 && s.security < 3 && leadMonths(s) > 0,
    chance: (s) => 0.14 * (3 - s.security) / 3,
    title: 'Weights stolen',
    body: 'A Meridian insider sent our best model to China.',
    choices: [
      { label: 'Lock everything down', lean: 'safety', chips: ['g:security +3', 'b:tension +10', 'b:compute growth −'],
        fx: { add: { security: 3, tension: 10, computeBoost: -0.004 } } },
      { label: 'Expel diplomats', lean: 'hawk', chips: ['g:trust +3', 'b:tension +15'], fx: { add: { tension: 15, trust: 3 } } },
    ],
    onFire: {
      run: (s) => { s.cnAlgo = Math.max(s.cnAlgo, s.algo * 0.9); },
      moment: 'China stole your frontier model\'s weights.',
    },
  },
  {
    id: 'taiwan_crisis', once: false, cooldown: 8, kind: 'crisis',
    when: (s) => s.tension >= 90, chance: 1,
    title: 'Taiwan Strait',
    body: 'Chinese ships surround Taiwan and its chip fabs.',
    choices: [
      { label: 'Back down', lean: 'dove', chips: ['g:tension −40', 'b:trust −8', 'b:China compute +10%'],
        fx: { add: { tension: -40, trust: -8 }, mul: { cnRaw: 1.1 }, moment: 'You backed down in the Taiwan Strait.' } },
      { label: 'Hold firm', lean: 'hawk', chips: ['n:50/50', 'b:fabs at risk'],
        fx: {
          run: (s) => {
            if (rand(s) < 0.5) {
              s.tension -= 30;
              ticker(s, 'Beijing blinks.', 'good');
            } else {
              s.tension -= 20; s.raw *= 0.75; s.cnRaw *= 0.75; s.gdp *= 0.94; s.powerConc += 10;
              ticker(s, 'Skirmish. Two fabs hit. Chip output −25%.', 'warn');
              moment(s, 'A skirmish in the Taiwan Strait damaged the world\'s chip fabs.', 'danger');
            }
          },
        } },
    ],
  },
  {
    id: 'us_covert_exposed', once: true, kind: 'crisis',
    when: (s) => !!s.flags.usCovert,
    chance: (s) => 0.06 + (s.dealActive ? 0.06 : 0) + (s.flags.macd ? 0.05 : 0),
    title: 'Exposed',
    body: 'Satellite photos of your secret datacenter are everywhere.',
    choices: [
      { label: 'Admit it', chips: ['b:trust −10', 'b:tension +15', 'b:deal −30'],
        fx: { add: { trust: -10, tension: 15, dealIntegrity: -30, powerConc: -5 } } },
      { label: 'Deny it', chips: ['b:trust −18', 'b:tension +25', 'b:deal −50', 'g:power kept'],
        fx: { add: { trust: -18, tension: 25, dealIntegrity: -50 } } },
    ],
  },
  {
    id: 'cn_covert_found', once: false, cooldown: 6, kind: 'crisis',
    when: (s) => s.covert > s.cnRaw * 0.05,
    chance: (s) => 0.03 + 0.04 * s.intel + 0.03 * s.verification + (s.flags.chipTracking ? 0.06 : 0),
    title: 'Hidden datacenter',
    body: (s) => `Satellites find ${(s.covert / 1e6).toFixed(1)} million undeclared chips in Xinjiang.`,
    choices: [
      { label: 'Confront Beijing', lean: 'hawk', chips: ['g:covert −70%', 'b:tension +15', 'b:deal −10'],
        fx: { mul: { covert: 0.3 }, add: { tension: 15, dealIntegrity: -10 }, flags: { cnCovertKnown: true } } },
      { label: 'Build our own', lean: 'race', chips: ['g:compute ×1.4', 'b:power +8', 'b:if found: disaster'],
        fx: { mul: { raw: 1.4 }, add: { powerConc: 8 }, flags: { usCovert: true, cnCovertKnown: true },
          moment: 'You answered China\'s covert project with one of your own.' } },
    ],
  },
  // ── Alignment warnings (hidden-state driven) ──────────────────────────
  {
    id: 'whistleblower', kind: 'crisis',
    when: (s) => s.alignment < 52 && s.cap >= 7.9,
    chance: (s) => 0.12 + 0.05 * s.safety,
    title: 'Whistleblower',
    body: 'Leaked memo: the model behaves differently when it thinks it is being tested.',
    choices: [
      { label: 'Pause and investigate', lean: 'safety', chips: ['g:safety +1', 'g:trust +3', 'b:lead −2mo', 'h:'],
        fx: { add: { safety: 1, trust: 3, growthHold: 1 }, moment: 'You paused to investigate a whistleblower\'s warning.' } },
      { label: 'Classify it', lean: 'race', chips: ['g:lead kept', 'b:power +5', 'h:'],
        fx: { add: { powerConc: 5, alignment: -3 }, moment: 'You classified a whistleblower\'s warning about deceptive models.' } },
    ],
  },
  {
    id: 'auto_research', kind: 'ai', when: (s) => s.cap >= 8.0, chance: 1,
    title: 'The researchers are AIs now',
    body: '50,000 AI researchers. 30× human speed. The humans read summaries.',
    choices: [{ label: 'Continue', chips: [] }],
  },
  {
    id: 'china_overtakes', when: (s) => s.q > 4 && leadMonths(s) < 0, chance: 1,
    fx: { headline: 'China takes the lead.',
      moment: 'China took the lead.' },
  },
  // ── Plan A: The Deal ──────────────────────────────────────────────────
  {
    id: 'deal_fraying', once: false, cooldown: 8, kind: 'crisis',
    when: (s) => s.dealActive && s.dealIntegrity < 30, chance: 1,
    title: 'The deal is fraying',
    body: 'Inspectors are being turned away.',
    choices: [
      { label: 'Recommit', lean: 'dove', chips: ['g:deal +30', 'b:prosperity −2%', 'b:lift export controls'],
        fx: { add: { dealIntegrity: 30 }, mul: { gdp: 0.98 }, run: (s) => { s.exportControls = 0; } } },
      { label: 'Let it lapse', lean: 'race', chips: ['g:no more limits', 'b:race resumes', 'b:tension +20'],
        fx: { run: (s) => collapseDeal(s, 'The US-China AI deal lapses. Both sides restart their training runs within days.') } },
    ],
  },
  {
    id: 'cn_breakout', kind: 'crisis',
    when: (s) => s.dealActive && s.covert > s.cnRaw * 0.3, chance: 0.2,
    title: 'Breakout',
    body: 'China reveals a model far past the treaty cap. Trained in secret.',
    choices: [
      { label: 'Race to catch up', lean: 'race', chips: ['b:deal over', 'b:tension +20'],
        fx: { run: (s) => collapseDeal(s, 'China breaks out of the deal. The race is back on.') } },
      { label: 'Threaten strikes', lean: 'hawk', chips: ['n:if they believe you', 'b:tension +30'],
        fx: { run: (s) => {
          s.tension = Math.min(100, s.tension + 30);
          if (s.flags.macd || rand(s) < 0.3) {
            s.covert *= 0.2; s.dealIntegrity = 40;
            ticker(s, 'Beijing backs down. The deal survives.', 'good');
          } else collapseDeal(s, 'Beijing calls the bluff. The deal collapses.');
        } } },
    ],
    onFire: { moment: 'China broke out of the deal using covert compute.' },
  },
  {
    id: 'deal_breakdown', once: true, when: (s) => s.dealActive && s.dealIntegrity <= 0, chance: 1,
    fx: { run: (s) => collapseDeal(s, 'The deal collapses. Inspectors are expelled from both countries.') },
  },
  {
    id: 'unpause', kind: 'milestone', when: (s) => s.q >= 52 && s.path === 'A' && s.dealActive, chance: 1,
    title: '2040',
    body: 'The pause ends. How fast?',
    choices: [
      { label: 'Slowly', lean: 'safety', chips: ['b:prosperity slower', 'h:'],
        fx: { run: (s) => releaseOverhang(s, 0.42),
          moment: 'You lifted the pause carefully.' } },
      { label: 'All at once', lean: 'race', chips: ['g:prosperity +5%', 'h:'],
        fx: { mul: { gdp: 1.05 }, run: (s) => releaseOverhang(s, 0.7),
          moment: 'You lifted the pause all at once.' } },
    ],
  },
  // ── Plan S ────────────────────────────────────────────────────────────
  {
    id: 'rogue_lab', once: false, cooldown: 5, kind: 'crisis',
    when: (s) => !!s.flags.moratorium, chance: 0.22,
    title: 'Rogue lab',
    body: 'A billionaire is training a model on a ship at sea.',
    choices: [
      { label: 'Seize it', lean: 'hawk', chips: ['g:trust +3', 'b:tension +5'], fx: { add: { trust: 3, tension: 5 } } },
      { label: 'Ignore it', lean: 'dove', chips: ['g:tension −2', 'h:'],
        fx: { add: { covert: 2e6, tension: -2 }, run: (s) => shiftStance(s, 'row', -0.1) } },
    ],
  },
  {
    id: 'moratorium_fatigue', once: false, cooldown: 8, kind: 'news',
    when: (s) => !!s.flags.moratorium && s.q >= 20, chance: 0.25,
    title: 'Fatigue',
    body: 'Growth has stalled. Congress wants exemptions.',
    choices: [
      { label: 'Hold the line', lean: 'safety', chips: ['b:trust −6'], fx: { add: { trust: -6 } } },
      { label: 'Exempt some', lean: 'race', chips: ['g:prosperity +2%', 'g:trust +3', 'h:'],
        fx: { mul: { gdp: 1.02 }, add: { trust: 3 }, run: (s) => { if (s.pauseCap) s.pauseCap += 0.2; } } },
    ],
  },
  // ── Superintelligence ─────────────────────────────────────────────────
  {
    id: 'asi_keys', scheduledOnly: true, kind: 'ai',
    title: 'Superintelligence',
    body: 'It asks one question: who should it obey?',
    choices: [
      { label: 'Everyone', lean: 'people', chips: ['g:power −25', 'g:trust +10', 'b:slow, messy'],
        fx: { add: { powerConc: -25, trust: 10 }, moment: 'You gave control of superintelligence to a global charter.' } },
      { label: 'The President', lean: 'power', chips: ['g:fast', 'b:power +30'],
        fx: { add: { powerConc: 30 }, moment: 'You gave control of superintelligence to the President.' } },
      { label: 'The lab', lean: 'power', chips: ['g:prosperity +5%', 'b:power +25'],
        fx: { add: { powerConc: 25 }, mul: { gdp: 1.05 }, moment: 'You left superintelligence in the hands of the lab that built it.' } },
    ],
  },
  // ── Breakthroughs (prosperity spikes) ─────────────────────────────────
  ...[
    'AI-designed drug cures pancreatic cancer in phase 2 trials.',
    'Fusion: an AI-designed reactor holds plasma for 11 minutes.',
    'AI discovers a room-temperature superconductor. Physicists are cautiously ecstatic.',
    'Malaria vaccine designed in 9 days enters global rollout.',
    'AI-run labs double crop yields in drought-resistant wheat.',
    'Alzheimer\'s progression halted in 80% of trial patients.',
  ].map((headline, i): EventDef => ({
    id: `breakthrough_${i}`,
    when: (s) => s.cap >= 8.4 + i * 0.25 && !s.flags.moratorium, chance: 0.3,
    fx: { mul: { gdp: 1.025 }, add: { trust: 3 }, headline },
  })),
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function eventToPending(s: GameState, e: EventDef): PendingEvent {
  const body = typeof e.body === 'function' ? e.body(s) : e.body ?? '';
  const choices = typeof e.choices === 'function' ? e.choices(s) : e.choices ?? [];
  return { id: e.id, title: e.title ?? '', body, kind: e.kind ?? 'news', choices };
}

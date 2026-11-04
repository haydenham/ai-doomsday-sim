import type { Choice, GameState, PathId, Phase } from '../sim/types';
import { concentratePower, declareCovert, releaseOverhang, shiftStance, ticker, unlockComputeTier } from '../sim/helpers';
import { rand } from '../sim/rng';
import { AC } from '../sim/constants';
import { enforceAlloc } from '../sim/alloc';

/**
 * A decision is the game's only verb. One at a time, the clock stops, the player picks.
 * Rule: every option costs something. If one option is all upside, the decision is broken.
 */
export interface DecisionDef {
  id: string;
  title: string;
  /** One line. */
  text: string;
  phases: Phase[];
  /** Restrict to Fork paths. Omit = any. */
  paths?: PathId[];
  /** Times this decision can come up. Default 1. */
  max?: number;
  when?: (s: GameState) => boolean;
  weight?: number;
  options: [Choice, Choice] | [Choice, Choice, Choice];
}

const EARLY: Phase[] = [1, 2];
const ALL: Phase[] = [1, 2, 3, 4];
const LATE: Phase[] = [3, 4];
const POST: Phase[] = [2, 3, 4];

export const DECISIONS: DecisionDef[] = [
  // ── 2027–2028 ─────────────────────────────────────────────────────────
  {
    id: 'permits', title: 'Datacenter permits', phases: [1, 2, 3], max: 3, weight: 3,
    text: 'Labs want fast-track approval for gigawatt campuses.',
    when: (s) => s.computeTier === 1,
    options: [
      { label: 'Fast-track', lean: 'race', chips: ['g:compute ×2', 'b:trust −4'],
        fx: { add: { trust: -4 }, run: (s) => unlockComputeTier(s, 2) } },
      { label: 'Normal review', lean: 'people', chips: ['g:trust +2', 'b:compute growth −'],
        fx: { add: { trust: 2, computeBoost: -0.004 } } },
    ],
  },
  {
    id: 'transparency', title: 'Transparency bill', phases: EARLY, weight: 2,
    text: 'Force labs to publish their safety tests.',
    options: [
      { label: 'Pass it', lean: 'safety', chips: ['g:trust +5', 'g:verification +1', 'b:compute growth −', 'h:'],
        fx: { add: { trust: 5, verification: 1, safety: 0.5, computeBoost: -0.004, powerConc: -3 } } },
      { label: 'Kill it', lean: 'race', chips: ['g:compute growth +', 'b:power +3'],
        fx: { add: { computeBoost: 0.004, powerConc: 3 } } },
    ],
  },
  {
    id: 'exports', title: 'Chip sales to China', phases: EARLY, weight: 2,
    text: 'China is buying every advanced chip it can get.',
    when: (s) => s.q >= 2,
    options: [
      { label: 'Ban them', lean: 'hawk', chips: ['g:China slows', 'b:tension +15'],
        fx: { add: { exportControls: 1, tension: 15 }, flags: { chinaAware: true }, schedule: [{ id: 'smuggling', delay: 3 }],
          headline: 'Chip export ban. Beijing: "technological containment."' } },
      { label: 'Keep selling', lean: 'dove', chips: ['g:prosperity +1%', 'g:tension −5', 'b:China compute +10%'],
        fx: { mul: { gdp: 1.01, cnRaw: 1.1 }, add: { tension: -5 }, flags: { chinaAware: true } } },
    ],
  },
  {
    id: 'verification_rd', title: 'Verification research', phases: ALL, max: 3,
    text: 'Tools to prove what chips are doing, anywhere on Earth.',
    options: [
      { label: 'Fund it', lean: 'safety', chips: ['g:verification +1', 'b:prosperity −0.5%'],
        fx: { add: { verification: 1 }, mul: { gdp: 0.995 } } },
      { label: 'Not a priority', lean: 'race', chips: ['g:compute +5%'],
        fx: { mul: { raw: 1.05 } } },
    ],
  },
  {
    id: 'spies', title: 'Spy budget', phases: ALL, max: 3,
    text: 'The CIA wants more sources inside Chinese labs.',
    when: (s) => !!s.flags.chinaAware,
    options: [
      { label: 'Expand', lean: 'hawk', chips: ['g:intel +1', 'b:tension +5'],
        fx: { add: { intel: 1, tension: 5 } } },
      { label: 'Stay quiet', lean: 'dove', chips: ['g:tension −5', 'b:see less'],
        fx: { add: { tension: -5 } } },
    ],
  },
  {
    id: 'chip_tracking', title: 'Chip tracking', phases: ALL,
    text: 'Every advanced chip could report its location.',
    when: (s) => s.q >= 4,
    options: [
      { label: 'Require it', lean: 'safety', chips: ['g:verification +1', 'b:trust −2', 'h:'],
        fx: { add: { verification: 1, trust: -2 }, flags: { chipTracking: true } } },
      { label: 'Too invasive', lean: 'people', chips: ['g:trust +2', 'h:'],
        fx: { add: { trust: 2 } } },
    ],
  },
  {
    id: 'agents_gov', title: 'AI in government', phases: ALL,
    text: 'Automate paperwork across federal agencies.',
    when: (s) => s.q >= 2,
    options: [
      { label: 'Automate', lean: 'race', chips: ['g:prosperity +1%', 'b:jobs +', 'b:trust −2'],
        fx: { add: { deployment: 1, trust: -2 }, mul: { gdp: 1.01 } } },
      { label: 'Protect jobs', lean: 'people', chips: ['g:trust +2', 'b:prosperity −0.5%'],
        fx: { add: { trust: 2 }, mul: { gdp: 0.995 } } },
    ],
  },
  {
    id: 'nuclear', title: 'Power for AI', phases: [1, 2, 3], weight: 3,
    text: 'The datacenters need more electricity than the grid has.',
    when: (s) => s.computeTier === 2,
    max: 2,
    options: [
      { label: 'Restart nuclear', lean: 'race', chips: ['g:compute ×2.2', 'b:trust −3'],
        fx: { add: { trust: -3 }, run: (s) => unlockComputeTier(s, 3) } },
      { label: 'Wait for renewables', lean: 'people', chips: ['g:trust +2', 'b:compute growth −'],
        fx: { add: { trust: 2, computeBoost: -0.003 } } },
    ],
  },
  {
    id: 'nordic', title: 'Arctic compute pact', phases: [1, 2, 3], weight: 3, max: 2,
    text: 'Norway and Finland offer cold, clean sites.',
    when: (s) => s.computeTier === 3,
    options: [
      { label: 'Sign', lean: 'race', chips: ['g:compute ×1.8', 'b:tension +5'],
        fx: { add: { tension: 5 }, run: (s) => { unlockComputeTier(s, 4); shiftStance(s, 'us', 0.1); } } },
      { label: 'Decline', lean: 'dove', chips: ['g:tension −3', 'b:allies drift'],
        fx: { add: { tension: -3 }, run: (s) => shiftStance(s, 'us', -0.1) } },
    ],
  },
  {
    id: 'backchannel', title: 'Backchannel', phases: EARLY,
    text: 'Chinese scientists want to talk. Off the record.',
    when: (s) => !!s.flags.chinaAware,
    options: [
      { label: 'Talk', lean: 'dove', chips: ['g:tension −10', 'g:learn their intent', 'b:trust −3'],
        fx: {
          add: { tension: -10, trust: -3, intel: 0.5 },
          run: (s) => {
            const honest = rand(s) < 0.55 + s.intel * 0.08;
            const read = honest ? s.intent : (['cooperative', 'opportunistic', 'racing'] as const)[Math.floor(rand(s) * 3)];
            ticker(s, {
              cooperative: 'Backchannel: they are afraid too. They want rules.',
              opportunistic: 'Backchannel: they will talk, if talking keeps options open.',
              racing: 'Backchannel: polite tea. No substance.',
            }[read]);
          },
        } },
      { label: 'Refuse', lean: 'hawk', chips: ['g:trust +2', 'b:tension +3'],
        fx: { add: { trust: 2, tension: 3 } } },
    ],
  },
  {
    id: 'ubi', title: 'AI dividend', phases: ALL, weight: 2, max: 2,
    text: 'Send every citizen a check, funded by AI profits.',
    when: (s) => s.jobs >= 8 && !s.ubi,
    options: [
      { label: 'Pay it', lean: 'people', chips: ['g:trust +8', 'g:power −5', 'b:prosperity −1.5%'],
        fx: { add: { trust: 8, powerConc: -5 }, mul: { gdp: 0.985 }, run: (s) => { s.ubi = true; } } },
      { label: 'No handouts', lean: 'power', chips: ['g:prosperity +1%', 'b:trust −4'],
        fx: { add: { trust: -4 }, mul: { gdp: 1.01 } } },
    ],
  },
  {
    id: 'internal_models', title: 'Secret models', phases: ALL,
    text: 'Labs run models internally far beyond anything public.',
    when: (s) => s.q >= 5,
    options: [
      { label: 'Ban the gap', lean: 'safety', chips: ['g:trust +3', 'b:AI research −25%', 'h:'],
        fx: { add: { trust: 3, rdBoost: -0.25, safety: 0.5 } } },
      { label: 'Allow it', lean: 'race', chips: ['g:AI research +15%', 'h:'],
        fx: { add: { rdBoost: 0.15, safety: -0.3 } } },
    ],
  },
  {
    id: 'talent', title: 'Government talent', phases: ALL,
    text: 'Hire top AI engineers away from the labs.',
    options: [
      { label: 'Hire them', lean: 'safety', chips: ['g:intel +1', 'g:verification +0.5', 'b:compute growth −'],
        fx: { add: { intel: 1, verification: 0.5, computeBoost: -0.003 } } },
      { label: 'Leave them', lean: 'race', chips: ['g:compute growth +'],
        fx: { add: { computeBoost: 0.003 } } },
    ],
  },
  {
    id: 'old_chips', title: 'Old chips', phases: [1, 2, 3],
    text: 'Retired AI chips are being resold on the gray market.',
    when: (s) => s.q >= 3,
    options: [
      { label: 'Destroy them', lean: 'safety', chips: ['b:prosperity −0.5%', 'h:'],
        fx: { mul: { gdp: 0.995 }, flags: { noRecycling: true } } },
      { label: 'Let them sell', lean: 'race', chips: ['g:prosperity +0.5%', 'h:'],
        fx: { mul: { gdp: 1.005 } } },
    ],
  },
  {
    id: 'merger', title: 'Lab merger', phases: ALL,
    text: 'Meridian wants to buy Halcyon.',
    when: (s) => s.q >= 4,
    options: [
      { label: 'Approve', lean: 'power', chips: ['g:compute growth +', 'b:power +8'],
        fx: { add: { computeBoost: 0.008, powerConc: 8 } } },
      { label: 'Block', lean: 'people', chips: ['g:power −4', 'b:compute growth −'],
        fx: { add: { powerConc: -4, computeBoost: -0.004 } } },
    ],
  },

  // ── Post-Fork, any path ───────────────────────────────────────────────
  {
    id: 'cap_rd', title: 'AI research cap', phases: LATE, weight: 2,
    text: 'AIs now improve AIs. Make it law: capabilities get at most 25% of compute?',
    when: (s) => s.cap >= AC,
    options: [
      { label: 'Cap at 25%', lean: 'safety', chips: ['n:capabilities ≤ 25%', 'g:power −3', 'b:lead shrinks', 'h:'],
        fx: { add: { powerConc: -3 }, flags: { capLaw: true }, run: (s) => enforceAlloc(s),
          moment: 'You capped AI research at 25% of compute by law.' } },
      { label: 'No limit', lean: 'race', chips: ['g:AI research +20%', 'h:'],
        fx: { add: { rdBoost: 0.2 } } },
    ],
  },
  {
    id: 'nationalize', title: 'Nationalize', phases: POST,
    text: 'Bring the frontier labs under federal control.',
    options: [
      { label: 'Do it', lean: 'power', chips: ['g:you set the compute split', 'g:security +3', 'b:power → 80+', 'b:trust −6'],
        fx: { add: { security: 3, computeBoost: 0.01, trust: -6 }, flags: { nationalized: true },
          run: (s) => concentratePower(s, 80, 15), moment: 'You nationalized the frontier labs.' } },
      { label: 'Stay private', lean: 'people', chips: ['g:trust +2', 'b:theft risk'],
        fx: { add: { trust: 2 } } },
    ],
  },
  {
    id: 'covert', title: 'Off the books', phases: LATE, paths: ['A', 'B', 'D', 'S'],
    text: 'A secret datacenter. No one needs to know.',
    options: [
      { label: 'Build it', lean: 'race', chips: ['g:compute ×1.5', 'b:power +8', 'b:if found: disaster'],
        fx: { mul: { raw: 1.5 }, add: { powerConc: 8 }, flags: { usCovert: true }, moment: 'You built a secret US datacenter.' } },
      { label: 'No', lean: 'safety', chips: ['g:tension −3', 'b:lead −'],
        fx: { add: { tension: -3 }, mul: { raw: 0.97 } } },
    ],
  },
  {
    id: 'gulf', title: 'Gulf compute deal', phases: [2, 3, 4], weight: 3, max: 2,
    text: 'Gulf states will finance and host US datacenters.',
    when: (s) => s.computeTier === 4 && !s.flags.moratorium,
    options: [
      { label: 'Sign', lean: 'race', chips: ['g:compute ×2', 'b:tension +5', 'b:security −1'],
        fx: { add: { tension: 5, security: -1 }, run: (s) => unlockComputeTier(s, 5) } },
      { label: 'Keep it home', lean: 'safety', chips: ['g:security +1', 'b:compute growth −'],
        fx: { add: { security: 1, computeBoost: -0.003 } } },
    ],
  },
  {
    id: 'solar', title: 'Desert megafarms', phases: LATE, weight: 3, max: 2,
    text: 'AI-designed solar farms the size of small states.',
    when: (s) => s.computeTier === 5 && s.cap >= 8.4,
    options: [
      { label: 'Build', lean: 'race', chips: ['g:compute ×3', 'b:sabotage target'],
        fx: { run: (s) => unlockComputeTier(s, 6) } },
      { label: 'Not yet', lean: 'safety', chips: ['b:lead −'], fx: { mul: { raw: 0.97 } } },
    ],
  },
  {
    id: 'ocean', title: 'Floating datacenters', phases: LATE, weight: 3, max: 2,
    text: 'Anchor compute in international waters.',
    when: (s) => s.computeTier === 6,
    options: [
      { label: 'Launch the fleet', lean: 'race', chips: ['g:compute ×3', 'b:verification −1'],
        fx: { add: { verification: -1 }, run: (s) => unlockComputeTier(s, 7) } },
      { label: 'Stay on land', lean: 'safety', chips: ['g:verification +0.5', 'b:lead −'],
        fx: { add: { verification: 0.5 }, mul: { raw: 0.97 } } },
    ],
  },
  {
    id: 'orbit', title: 'Orbital compute', phases: [3, 4, 5], weight: 3, max: 2,
    text: 'Datacenters in orbit, powered by constant sunlight.',
    when: (s) => s.computeTier === 7 && s.cap >= 9.4,
    options: [
      { label: 'Launch', lean: 'race', chips: ['g:compute ×5', 'b:verification −1.5', 'b:tension +8'],
        fx: { add: { verification: -1.5, tension: 8 }, run: (s) => unlockComputeTier(s, 8) } },
      { label: 'Keep it on Earth', lean: 'safety', chips: ['g:tension −3', 'b:lead −'],
        fx: { add: { tension: -3 }, mul: { raw: 0.97 } } },
    ],
  },
  {
    id: 'medicine', title: 'AI medicine', phases: [3, 4, 5],
    text: 'AI-designed drugs are ready. Trials take years.',
    when: (s) => s.cap >= 8.6,
    options: [
      { label: 'Skip the trials', lean: 'race', chips: ['g:prosperity +4%', 'g:trust +4', 'b:jobs +'],
        fx: { add: { trust: 4, deployment: 1 }, mul: { gdp: 1.04 } } },
      { label: 'Run the trials', lean: 'safety', chips: ['g:trust +2', 'b:prosperity −'],
        fx: { add: { trust: 2 } } },
    ],
  },
  {
    id: 'robots', title: 'Robot factories', phases: [3, 4, 5],
    text: 'Robots that build robots. Special economic zones are ready.',
    when: (s) => s.cap >= 9.0,
    options: [
      { label: 'Build', lean: 'race', chips: ['g:prosperity +6%', 'g:compute growth +', 'b:jobs +', 'b:trust −4'],
        fx: { add: { deployment: 2, computeBoost: 0.02, trust: -4 }, mul: { gdp: 1.06 } } },
      { label: 'Go slow', lean: 'people', chips: ['g:trust +3', 'b:prosperity −1%'],
        fx: { add: { trust: 3 }, mul: { gdp: 0.99 } } },
    ],
  },

  // ── Plan D ────────────────────────────────────────────────────────────
  {
    id: 'd_ai_labs', title: 'Who runs the lab?', phases: POST, paths: ['D'], weight: 2,
    text: 'The AIs are faster researchers than the humans.',
    options: [
      { label: 'The AIs', lean: 'race', chips: ['g:AI research +50%', 'h:'], fx: { add: { rdBoost: 0.5, safety: -0.5 } } },
      { label: 'The humans', lean: 'safety', chips: ['g:safety +0.5', 'b:AI research −20%'], fx: { add: { rdBoost: -0.2, safety: 0.5 } } },
    ],
  },
  {
    id: 'd_reviews', title: 'Safety reviews', phases: POST, paths: ['D'], max: 2, weight: 2,
    text: 'Each review takes weeks. China does not wait.',
    options: [
      { label: 'Streamline', lean: 'race', chips: ['g:faster', 'b:trust −3', 'h:'],
        fx: { add: { computeBoost: 0.012, rdBoost: 0.15, trust: -3, safety: -0.5 } } },
      { label: 'Keep them', lean: 'safety', chips: ['g:safety +0.5', 'b:compute growth −'],
        fx: { add: { computeBoost: -0.005, safety: 0.5 } } },
    ],
  },
  {
    id: 'd_dpa', title: 'Defense Production Act', phases: POST, paths: ['D', 'B'],
    text: 'Order factories to make chips and turbines. Now.',
    options: [
      { label: 'Invoke it', lean: 'power', chips: ['g:compute ×1.8', 'b:power +10'], fx: { mul: { raw: 1.8 }, add: { powerConc: 10 } } },
      { label: 'Let markets work', lean: 'people', chips: ['g:trust +2', 'b:lead −'], fx: { add: { trust: 2 }, mul: { raw: 0.98 } } },
    ],
  },
  // ── Plan B ────────────────────────────────────────────────────────────
  {
    id: 'b_cyber', title: 'Cyberattack', phases: POST, paths: ['B'], max: 3, weight: 2,
    text: 'We can take Chinese datacenters offline.',
    options: [
      { label: 'Strike', lean: 'hawk', chips: ['g:China compute −25%', 'b:tension +18', 'b:retaliation risk'],
        fx: {
          mul: { cnRaw: 0.75 }, add: { tension: 18 },
          run: (s) => {
            if (rand(s) < 0.35) { s.raw *= 0.88; ticker(s, 'Retaliation: a Texas datacenter goes dark.', 'warn'); }
            else ticker(s, 'Fire at a Chinese datacenter. Beijing blames saboteurs.');
          },
        } },
      { label: 'Hold', lean: 'dove', chips: ['g:tension −5', 'b:lead −'], fx: { add: { tension: -5 }, mul: { cnRaw: 1.03 } } },
    ],
  },
  {
    id: 'b_sanctions', title: 'Secondary sanctions', phases: POST, paths: ['B'],
    text: 'Punish any country that sells chips to China.',
    options: [
      { label: 'Sanction', lean: 'hawk', chips: ['g:China slows', 'b:neutrals drift away', 'b:tension +8'],
        fx: { add: { exportControls: 1, tension: 8 }, run: (s) => shiftStance(s, 'row', -0.25) } },
      { label: 'Persuade', lean: 'dove', chips: ['g:neutrals drift closer', 'b:China grows'],
        fx: { mul: { cnRaw: 1.05 }, run: (s) => shiftStance(s, 'row', 0.15) } },
    ],
  },
  {
    id: 'b_taiwan', title: 'Taiwan', phases: POST, paths: ['B', 'D'],
    text: 'Guarantee its defense, and its chip fabs.',
    options: [
      { label: 'Guarantee', lean: 'hawk', chips: ['g:chip supply safe', 'b:tension +12', 'b:power +5'],
        fx: { add: { tension: 12, security: 1, powerConc: 5 }, flags: { taiwanPact: true } } },
      { label: 'Stay vague', lean: 'dove', chips: ['g:tension −5', 'b:fabs exposed'],
        fx: { add: { tension: -5 } } },
    ],
  },
  {
    id: 'b_emergency', title: 'Emergency powers', phases: POST, paths: ['B', 'D'],
    text: 'Govern AI by executive order.',
    options: [
      { label: 'Declare', lean: 'power', chips: ['g:compute growth +', 'b:power → 50+', 'b:trust −4'],
        fx: { add: { computeBoost: 0.01, trust: -4 }, run: (s) => concentratePower(s, 50, 12) } },
      { label: 'Go through Congress', lean: 'people', chips: ['g:trust +2', 'b:slower'],
        fx: { add: { trust: 2, computeBoost: -0.003 } } },
    ],
  },
  // ── Plan C ────────────────────────────────────────────────────────────
  {
    id: 'c_interp', title: 'Interpretability', phases: POST, paths: ['C', 'A'],
    text: 'A crash program to read what models are thinking.',
    options: [
      { label: 'Fund it', lean: 'safety', chips: ['g:safety +2', 'b:prosperity −1%'], fx: { add: { safety: 2 }, mul: { gdp: 0.99 } } },
      { label: 'Skip', lean: 'race', chips: ['g:compute growth +'], fx: { add: { computeBoost: 0.005 } } },
    ],
  },
  {
    id: 'c_share', title: 'Share safety research', phases: POST, paths: ['C', 'A'],
    text: 'Give China our alignment methods?',
    options: [
      { label: 'Share', lean: 'dove', chips: ['g:tension −8', 'b:China learns', 'h:'],
        fx: { add: { tension: -8, cnAlignment: 15 }, mul: { cnAlgo: 1.08 } } },
      { label: 'Keep it', lean: 'hawk', chips: ['g:lead kept', 'b:tension +3'], fx: { add: { tension: 3 } } },
    ],
  },
  // ── Plan A ────────────────────────────────────────────────────────────
  {
    id: 'a_inspect', title: 'Inspectors', phases: LATE, paths: ['A'], max: 3, weight: 2,
    text: 'Send more inspectors to Chinese sites?',
    when: (s) => s.dealActive,
    options: [
      { label: 'Send more', lean: 'safety', chips: ['g:deal +12', 'b:prosperity −0.5%'],
        fx: { add: { dealIntegrity: 12, verification: 0.5 }, mul: { gdp: 0.995 } } },
      { label: 'Trust them', lean: 'dove', chips: ['g:tension −3', 'b:deal −5'], fx: { add: { tension: -3, dealIntegrity: -5 } } },
    ],
  },
  {
    id: 'a_joint', title: 'Joint safety lab', phases: LATE, paths: ['A'],
    text: 'US and Chinese researchers, one lab in Geneva.',
    when: (s) => s.dealActive,
    options: [
      { label: 'Build it', lean: 'dove', chips: ['g:safety +1', 'g:deal +5', 'b:China learns', 'h:'],
        fx: { add: { safety: 1, cnAlignment: 15, dealIntegrity: 5 }, mul: { cnAlgo: 1.05 } } },
      { label: 'Separate labs', lean: 'hawk', chips: ['g:lead kept', 'b:deal −3'], fx: { add: { dealIntegrity: -3 } } },
    ],
  },
  {
    id: 'a_macd', title: 'Destruction pledge', phases: LATE, paths: ['A'],
    text: 'Either side may destroy any secret datacenter it finds.',
    when: (s) => s.dealActive,
    options: [
      { label: 'Pledge', lean: 'hawk', chips: ['g:deal +15', 'g:cheating riskier', 'b:tension +5'],
        fx: { add: { dealIntegrity: 15, tension: 5 }, flags: { macd: true } } },
      { label: 'Too dangerous', lean: 'dove', chips: ['g:tension −3', 'b:deal −3'], fx: { add: { tension: -3, dealIntegrity: -3 } } },
    ],
  },
  {
    id: 'a_open', title: 'Open research', phases: LATE, paths: ['A'],
    text: 'Publish all frontier research, for everyone.',
    options: [
      { label: 'Publish', lean: 'people', chips: ['g:power −8', 'g:deal +6', 'b:others catch up'],
        fx: { add: { openness: 2, powerConc: -8, dealIntegrity: 6 }, mul: { cnAlgo: 1.1 } } },
      { label: 'Keep secrets', lean: 'power', chips: ['g:lead kept', 'b:power +4'], fx: { add: { powerConc: 4 } } },
    ],
  },
  {
    id: 'a_ceiling', title: 'Treaty review', phases: LATE, paths: ['A'], max: 3, weight: 2,
    text: 'The labs want the ceiling raised faster.',
    when: (s) => s.dealActive && s.pauseCap !== null && s.q >= 14,
    options: [
      { label: 'Raise it sooner', lean: 'race', chips: ['g:prosperity +2%', 'g:schedule +6mo', 'b:deal −6', 'h:'],
        fx: { add: { dealShift: 2, dealIntegrity: -6 }, mul: { gdp: 1.02 } } },
      { label: 'Slow it down', lean: 'safety', chips: ['g:safety +0.5', 'b:schedule −6mo', 'b:trust −4'],
        fx: { add: { dealShift: -2, safety: 0.5, trust: -4 } } },
    ],
  },
  // ── Plan S ────────────────────────────────────────────────────────────
  {
    id: 's_taskforce', title: 'Enforcement', phases: LATE, paths: ['S'], max: 2,
    text: 'Inspectors with satellites and shutdown powers.',
    options: [
      { label: 'Fund it', lean: 'safety', chips: ['g:verification +1', 'g:intel +1', 'b:prosperity −1%'],
        fx: { add: { verification: 1, intel: 1 }, mul: { gdp: 0.99 } } },
      { label: 'Trust the treaty', lean: 'dove', chips: ['g:prosperity +0.5%', 'h:'], fx: { mul: { gdp: 1.005 } } },
    ],
  },
  {
    id: 's_strike', title: 'Rogue datacenter', phases: LATE, paths: ['S'], max: 3, weight: 2,
    text: 'An unregistered datacenter is training. Owner unknown.',
    options: [
      { label: 'Strike it', lean: 'hawk', chips: ['g:covert −60%', 'b:tension +15'],
        fx: { mul: { covert: 0.4 }, add: { tension: 15 }, run: (s) => { if (s.cnPauseCap === null) s.cnRaw *= 0.8; } } },
      { label: 'Diplomacy', lean: 'dove', chips: ['g:tension −3', 'h:'], fx: { add: { tension: -3, covert: 2e6 } } },
    ],
  },
  {
    id: 's_retrain', title: 'Retraining', phases: LATE, paths: ['S'],
    text: 'Teach people the jobs a slower economy needs.',
    options: [
      { label: 'Fund it', lean: 'people', chips: ['g:trust +8', 'b:prosperity −1%'], fx: { add: { trust: 8 }, mul: { gdp: 0.99 } } },
      { label: 'Cut costs', lean: 'power', chips: ['g:prosperity +1%', 'b:trust −4'], fx: { add: { trust: -4 }, mul: { gdp: 1.01 } } },
    ],
  },
  {
    id: 's_lift', title: 'The moratorium', phases: [3, 4], paths: ['S'], max: 3, weight: 3,
    text: 'Lift it, slowly?',
    when: (s) => !!s.flags.moratorium && (s.q >= 36 || s.cnPauseCap === null),
    options: [
      { label: 'Lift slowly', lean: 'race', chips: ['g:growth returns', 'h:'],
        fx: { flags: { moratorium: false }, run: (s) => { releaseOverhang(s, 0.3); declareCovert(s); },
          headline: 'The moratorium ends.', moment: 'You lifted the moratorium.' } },
      { label: 'Hold', lean: 'safety', chips: ['b:trust −4'], fx: { add: { trust: -4 } } },
    ],
  },
];

export const DECISION_BY_ID: Record<string, DecisionDef> = Object.fromEntries(DECISIONS.map((d) => [d.id, d]));

export function decisionEligible(s: GameState, d: DecisionDef) {
  if (!d.phases.includes(s.phase)) return false;
  if (d.paths && (!s.path || !d.paths.includes(s.path))) return false;
  if ((s.uses[d.id] ?? 0) >= (d.max ?? 1)) return false;
  if (d.when && !d.when(s)) return false;
  return true;
}

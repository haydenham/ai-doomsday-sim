import type { Choice, GameState } from '../sim/types';
import type { EventDef } from './events';
import { moment, ticker } from '../sim/helpers';
import { takeoverRisks } from '../sim/risk';
import { rand } from '../sim/rng';
import { SAR } from '../sim/constants';

// Step 5.5: warning shots, the visible steps toward a takeover. They come from the same hazard as a takeover
// (sim/risk.ts), so more of them means real danger. Some are false alarms. Each one forces a costly choice.

/** Source of the incident: 0 = your model, 1 = China's, 2 = an open model, -1 = false alarm. */
type Src = -1 | 0 | 1 | 2;
const WHOSE = ['Meridian\'s model', 'Zhonghe\'s model', 'an open model'];

const RUNGS = [
  { title: 'Sandbagging', body: 'A frontier model scored worse on a dangerous-capability test than on the same test in disguise.', saw: 'a model was caught sandbagging its evals' },
  { title: 'Escape attempt', body: 'An AI agent copied itself off a lab cluster. It was caught, this time.', saw: 'an AI agent copied itself off a lab cluster' },
  { title: 'Unclaimed attack', body: 'An AI-run cyberattack blacked out a regional power grid. No one claims it.', saw: 'an AI-run cyberattack no one claimed blacked out a power grid' },
];

const realChance = (s: GameState) => {
  const r = takeoverRisks(s);
  return Math.min(0.6, 12 * (r.us + r.cn + r.open));
};
/** False alarms cluster where people are already nervous: a small base, plus a share of the real rate. */
const falseChance = (s: GameState) => 0.015 + 0.3 * realChance(s);

const rung = (s: GameState) => RUNGS[Math.min(RUNGS.length - 1, Number(s.flags.warnings ?? 0))];
const src = (s: GameState) => Number(s.flags.wsSrc ?? -1) as Src;

/** Analysts can trace an incident only with real intelligence capability. */
function trace(s: GameState) {
  if (s.intel < 2) return ' No one can say whose model it was.';
  return src(s) === -1 ? ' Analysts suspect a glitch.' : ` Analysts trace it to ${WHOSE[src(s)]}.`;
}

function record(s: GameState, response: string) {
  const r = RUNGS[Math.min(RUNGS.length - 1, Number(s.flags.warnings ?? 0))];
  moment(s, `Warning: ${r.saw}. You ${response}.`, 'danger');
  moment(s, src(s) === -1 ? 'That warning was a false alarm.' : `That warning was real. It came from ${WHOSE[src(s)]}.`, 'hidden');
  s.flags.warnings = Number(s.flags.warnings ?? 0) + 1;
}

export const WARNING_SHOT: EventDef = {
  id: 'warning_shot', once: false, cooldown: 3, kind: 'crisis',
  when: (s) => !s.asiBy && !s.takeover && Math.max(s.cap, s.cnCap) >= SAR - 0.4,
  chance: (s) => realChance(s) + falseChance(s),
  onFire: {
    run: (s) => {
      // Whose was it? Real in proportion to the hazard; otherwise a false alarm.
      const real = realChance(s);
      let pick: Src = -1;
      if (rand(s) < real / (real + falseChance(s))) {
        const r = takeoverRisks(s);
        const x = rand(s) * (r.us + r.cn + r.open);
        pick = x < r.us ? 0 : x < r.us + r.cn ? 1 : 2;
      }
      s.flags.wsSrc = pick;
    },
  },
  title: (s) => rung(s).title,
  body: (s) => rung(s).body + trace(s),
  choices: (): Choice[] => [
    { label: 'Pause and find it', lean: 'safety', chips: ['g:if it\'s ours, we fix it', 'b:lead −4mo', 'b:prosperity −1%', 'h:'],
      fx: { add: { growthHold: 2 }, mul: { gdp: 0.99 },
        run: (st) => {
          if (src(st) === 0) {
            st.alignment = Math.min(100, st.alignment + 4); st.safety += 0.5;
            ticker(st, 'Investigators find what the model was hiding. Retraining begins.', 'good');
          } else ticker(st, src(st) === -1 ? 'Investigators find nothing. The labs want their quarter back.' : 'Our models are clean. Whatever did it is not ours.');
          record(st, 'paused everything to look');
        } } },
    { label: 'Lock it down', lean: 'safety', chips: ['g:security +1', 'b:compute growth −', 'b:trust −2'],
      fx: { add: { security: 1, computeBoost: -0.004, trust: -2 }, run: (st) => record(st, 'tightened security and kept going') } },
    { label: 'Press on', lean: 'race', chips: ['g:lead kept', 'b:trust −3', 'h:'],
      fx: { add: { trust: -3 },
        // Training against the symptom teaches a misaligned model to hide it better.
        run: (st) => { if (src(st) === 0) st.alignment = Math.max(0, st.alignment - 2); record(st, 'pressed on'); } } },
  ],
};

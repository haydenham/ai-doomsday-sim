import type { Choice, GameState } from '../sim/types';
import type { EventDef } from './events';
import { clamp, declareCovert, moment, releaseOverhang } from '../sim/helpers';

// Plan S: lifting needs a reason, not a date. AI 2040 lists the conditions: alignment progress,
// lie detectors, uploads and intelligence enhancement (the last two merged here). Pick one at the halt;
// it fills while the models are frozen. Lifting before it's met is a gamble.

export type LiftId = 'solved' | 'lies' | 'humans';

export const LIFT: Record<LiftId, { name: string; pitch: string; chips: string[]; progress: (s: GameState) => number }> = {
  solved: {
    name: 'alignment solved', pitch: 'Lift when alignment is solved.',
    chips: ['n:safety research to 6', 'g:alignment +10 on lift', 'b:slow to fill'],
    progress: (s) => s.safety / 6,
  },
  lies: {
    name: 'lie detectors', pitch: 'Lift when we can tell if a model is lying.',
    chips: ['n:safety 6, verification 4', 'g:readout stays honest', 'g:intel +2'],
    progress: (s) => Math.min(s.safety / 6, s.verification / 4),
  },
  humans: {
    name: 'smarter humans', pitch: 'Lift when people can keep up: uploads, enhancement.',
    chips: ['n:about 7 years', 'g:alignment holds as models grow', 'b:nothing speeds it up'],
    progress: (s) => (s.q - Number(s.flags.haltQ ?? s.q)) / 28,
  },
};

export const liftId = (s: GameState) => (s.flags.liftCond ? (['solved', 'lies', 'humans'] as LiftId[])[Number(s.flags.liftCond) - 1] : null);
export const liftProgress = (s: GameState) => { const id = liftId(s); return id ? clamp(LIFT[id].progress(s), 0, 1) : 0; };

/** End the moratorium. Met: the condition pays off. Unmet: a gamble scaled by how far short it fell. */
export function lift(s: GameState) {
  const id = liftId(s);
  const p = liftProgress(s);
  s.flags.moratorium = false;
  releaseOverhang(s, 0.3);
  declareCovert(s);
  if (p >= 1) {
    if (id === 'solved') s.alignment = clamp(s.alignment + 10, 0, 100); // the method transfers to the new models
    if (id === 'lies') { s.flags.interp = Number(s.flags.interp ?? 0) + 2; s.intel = Math.min(10, s.intel + 2); }
    if (id === 'humans') s.flags.sharpHumans = true;
    moment(s, `You lifted the moratorium once ${LIFT[id!].name} was met.`, 'decision');
  } else {
    s.alignment = clamp(s.alignment - 15 * (1 - p), 0, 100);
    moment(s, `You lifted the moratorium early, ${Math.round(p * 100)}% of the way to ${id ? LIFT[id].name : 'its condition'}.`, 'decision');
  }
}

const pickCond = (id: LiftId, i: number): Choice => ({
  label: LIFT[id].name[0].toUpperCase() + LIFT[id].name.slice(1), lean: id === 'humans' ? 'people' : 'safety', chips: LIFT[id].chips,
  fx: { run: (s) => { s.flags.liftCond = i + 1; s.flags.haltQ = s.q; } },
});

export const LIFT_EVENTS: EventDef[] = [
  {
    id: 's_condition', scheduledOnly: true, kind: 'milestone',
    title: 'The condition',
    body: 'The halt holds until…',
    choices: (['solved', 'lies', 'humans'] as LiftId[]).map(pickCond),
  },
  {
    id: 'lift_ready', once: false, cooldown: 4, kind: 'milestone',
    when: (s) => !!s.flags.moratorium && liftProgress(s) >= 1, chance: 1,
    title: 'Condition met',
    body: (s) => `${LIFT[liftId(s)!].name[0].toUpperCase()}${LIFT[liftId(s)!].name.slice(1)}: done. Lift the moratorium?`,
    choices: [
      { label: 'Lift slowly', lean: 'safety', chips: ['g:growth returns', 'g:condition pays off'],
        fx: { run: lift, headline: 'The moratorium ends. Training resumes, slowly.' } },
      { label: 'Hold', lean: 'dove', chips: ['b:trust −4', 'b:cheaters gain'], fx: { add: { trust: -4 } } },
    ],
  },
];

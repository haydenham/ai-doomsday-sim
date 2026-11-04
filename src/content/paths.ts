import type { GameState, PathId } from '../sim/types';
import { leadMonths } from '../sim/derived';
import { levelWord } from '../ui/format';

export interface PathDef {
  id: PathId;
  code: string;
  name: string;
  oneLine: string;
  body: string;
  feel: string;
  available: (s: GameState) => { ok: boolean; reason?: string; note?: string };
}

export const PATHS: PathDef[] = [
  {
    id: 'D', code: 'PLAN D', name: 'Race to Superintelligence',
    oneLine: 'Let the AIs build the next AIs. Win first, figure it out later.',
    body: 'Remove the brakes. AIs run the labs, safety reviews are streamlined, and every resource goes to staying ahead.',
    feel: 'Fastest growth. You will see very little of what is happening inside the models.',
    available: () => ({ ok: true }),
  },
  {
    id: 'C', code: 'PLAN C', name: 'Burn the Lead',
    oneLine: 'Spend your head start on safety before China catches up.',
    body: 'Stay ahead, but use the margin for alignment work. Slow down whenever the lead allows it.',
    feel: 'A balancing act. If the lead runs out, so does your patience.',
    available: (s) => {
      const lead = leadMonths(s);
      return lead >= 3
        ? { ok: true, note: `You have a ${lead.toFixed(0)}-month lead to spend.` }
        : { ok: false, reason: `Needs a lead of at least 3 months (you have ${lead.toFixed(1)}).` };
    },
  },
  {
    id: 'B', code: 'PLAN B', name: 'Fight China',
    oneLine: 'Sabotage, sanctions, and pressure. Make sure they never get there.',
    body: 'Treat the race as a conflict. Slow China down by any means, and centralize control at home to do it.',
    feel: 'Your lead grows, and so do tension and the power of a few people.',
    available: () => ({ ok: true }),
  },
  {
    id: 'A', code: 'PLAN A', name: 'Verified Slowdown',
    oneLine: 'Make a deal with China. Scale slowly, together, under inspection.',
    body: 'Pause training, then scale together under a shared ceiling until 2040. Verify that no one cheats.',
    feel: 'Slow and political. Only as strong as your ability to verify.',
    available: (s) => {
      if (s.verification < 1)
        return { ok: true, note: 'No verification tools funded. The deal will start weak.' };
      return { ok: true, note: `Verification is ${levelWord(s.verification)}: the deal starts stronger.` };
    },
  },
  {
    id: 'S', code: 'PLAN S', name: 'Shut It All Down',
    oneLine: 'Halt frontier AI everywhere. Enforce it.',
    body: 'A global moratorium on training beyond current levels. Datacenters are inspected, and violators are stopped.',
    feel: 'Safe from the AI, maybe. Not from everyone who wants to break the rules.',
    available: (s) =>
      s.trust >= 40
        ? { ok: true }
        : { ok: false, reason: `Needs public trust of 40+ (you have ${s.trust.toFixed(0)}). The public will not accept it.` },
  },
];

export const pathDef = (id: PathId) => PATHS.find((p) => p.id === id)!;

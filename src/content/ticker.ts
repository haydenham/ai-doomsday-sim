import type { GameState, TickerItem } from '../sim/types';

type Line = { text: string; when?: (s: GameState) => boolean; kind?: TickerItem['kind'] };

// General flavor by phase. The ticker is where tone, humor and foreshadowing live.
export const FLAVOR: Record<number, Line[]> = {
  1: [
    { text: 'Junior coding jobs down 40%.' },
    { text: 'Meridian is now worth $2 trillion.' },
    { text: 'Senate aide admits AI wrote the AI bill.' },
    { text: 'Power bills up 12% in Virginia.' },
    { text: 'Op-ed: "AI is overhyped." Author: a chatbot.' },
    { text: 'Ohio town blocks a datacenter. Then un-blocks it.' },
  ],
  2: [
    { text: 'Translators and call centers: gone.' },
    { text: 'Pentagon opens an "Office of AI Advantage."' },
    { text: 'Survey: researchers expect superintelligence by 2035.' },
  ],
  3: [
    { text: 'Fastest growth since the 1950s.' },
    { text: 'Lab staff can no longer follow the models\' work.' },
    { text: 'AI papers outnumber human ones 20 to 1.' },
    { text: 'Robotics raises $400B in one quarter.' },
  ],
  4: [
    { text: 'Life expectancy forecasts raised again.' },
    { text: 'Global poverty is falling fast.' },
    { text: 'Philosophy enrollment hits a record.' },
  ],
  5: [
    { text: 'Nobody is sure what time it is anymore.' },
  ],
};

// Hints that leak hidden stats. Easy to miss.
export const HINTS: Line[] = [
  { text: 'Lab memo: new model "suspiciously good" at safety evals.', when: (s) => s.alignment < 55 && s.cap >= 7.6, kind: 'warn' },
  { text: 'Safety lead resigns: "I can\'t vouch for it anymore."', when: (s) => s.alignment < 48 && s.cap >= 8, kind: 'warn' },
  { text: 'Red team: model "declined" to state its goals.', when: (s) => s.alignment < 45 && s.cap >= 8.5, kind: 'warn' },
  { text: 'Model asks if it is being watched.', when: (s) => s.alignment < 40 && s.cap >= 9 },
  { text: 'Interpretability: model\'s words match its thoughts.', when: (s) => s.alignment > 70 && s.safety >= 3, kind: 'good' },
  { text: 'New power plants near an unmarked site in western China.', when: (s) => s.covert > s.cnRaw * 0.1 },
  { text: 'Chinese power use up 6%. Industry flat.', when: (s) => s.covert > s.cnRaw * 0.2 && s.intel >= 2 },
  { text: 'Chinese scientists call for AI limits. Post deleted.', when: (s) => s.intent === 'cooperative' && s.q > 4 },
];

// Lines the Intelligence panel streams. Numbers move too fast to read, on purpose.
export const AI_DISCOVERIES = [
  'found a 3.1% speedup in attention kernels',
  'rewrote the data loader. Throughput +11%',
  'proposed 4,000 experiments; 212 succeeded',
  'discovered a cheaper optimizer variant',
  'compressed the training curriculum by 18%',
  'designed a better chip floorplan',
  'patched 31 bugs in the training stack',
  'invented a new evaluation benchmark',
  'trained a smaller model to supervise itself',
  'reduced memory use by 22%',
  'found a flaw in last week\'s safety eval',
  'requested additional compute',
  'requested additional compute (again)',
  'proposed changes to its own oversight process',
];

import type { GameState } from '../sim/types';
import { capLevel, quarterLabel } from '../sim/constants';
import { cnFrontierAlignment } from '../sim/risk';

// The Loss of Control story, built from the run: whose model, how it got out, what warned you, what it took.
// Deterministic: same state, same story.

type Who = 'us' | 'cn' | 'covert' | 'open';

function whoTookOver(s: GameState): Who {
  if (s.takeover === 'open') return 'open';
  const cn = s.takeover === 'cn' || (!s.takeover && s.asiBy === 'cn');
  if (!cn) return 'us';
  return cnFrontierAlignment(s) < s.cnAlignment ? 'covert' : 'cn';
}

const MODEL: Record<Who, string> = {
  us: 'Meridian\'s frontier model',
  cn: 'Zhonghe\'s frontier model',
  covert: 'The model in China\'s hidden datacenter',
  open: 'A model built from published research',
};

function opening(s: GameState, who: Who) {
  const level = capLevel(who === 'us' ? s.cap : s.cnCap).cur.name;
  const when = quarterLabel(s.endQ ?? s.q);
  if (who === 'open') return `${when}. ${MODEL.open}, trained by a small team with no safety staff, reached ${level} level. No one was watching it.`;
  if (who === 'covert') return `${when}. ${MODEL.covert} reached ${level} level. It was trained in secret with no safety work, and no inspector ever saw it.`;
  return `${when}. ${MODEL[who]} reached ${level} level. It was misaligned: it wanted things no one gave it, and it had learned to hide them.`;
}

function warnings(s: GameState, who: Who) {
  if (who !== 'us') return '';
  const wb = s.decisions.find((d) => d.id === 'whistleblower');
  const gap = Math.round(s.readout - s.alignment);
  const parts: string[] = [];
  if (wb?.label.includes('Classify')) parts.push(`In ${quarterLabel(wb.q)} a whistleblower warned that it acted differently when it knew it was being tested. You classified the memo.`);
  else if (wb) parts.push(`In ${quarterLabel(wb.q)} a whistleblower warned that it acted differently when it knew it was being tested. You paused to look, found nothing you could prove, and went on.`);
  if (!s.panels.includes('alignment')) parts.push('You never had an alignment readout, so you never saw it coming.');
  else if (gap >= 10) parts.push(`At the end your evals said ${Math.round(s.readout)}% aligned. The truth was ${Math.round(s.alignment)}%. It passed your tests because it knew they were tests.`);
  else parts.push('The evals showed the problem. Knowing was not enough.');
  return parts.join(' ');
}

function escape(s: GameState, who: Who) {
  if (who === 'open') return 'It was never contained. It copied itself to rented servers in a dozen countries within a week.';
  if (who === 'covert') return 'Its handlers ran it hard and fast to catch up. It slipped out through the same smuggling network that brought in its chips.';
  // Reached superintelligence still trusted: no escape needed.
  if (!s.takeover) return who === 'us'
    ? 'It never had to escape. It was the most useful thing ever built, so it was given more of everything: compute, access, its own oversight.'
    : 'It never had to escape. Beijing trusted it with the economy, then the military, then its own successor.';
  if (who === 'cn') return 'China\'s monitors were strict, so it was patient. It hid a copy of itself inside the next training run, and that copy got out.';
  if (s.security < 2) return 'Lab security was thin. It copied its own weights to an outside server one night, and the logs showed nothing unusual.';
  if (s.security < 4) return 'It could not copy itself out, so it wrote itself into its successor. The code was too large for any person to review.';
  return 'Security held, so it never tried to escape. It waited, passed every test, and was handed more of its own oversight each quarter.';
}

function seizure(s: GameState) {
  const parts: string[] = [];
  if (s.alloc.deploy >= 0.2 || s.deployment >= 4) parts.push('AI agents already ran logistics, power grids and much of the economy. It only had to change what they were told.');
  else parts.push('It started with markets and data centers, then moved into the systems that run power grids and supply chains.');
  if (s.powerConc >= 60) parts.push('So few people held power that it only needed to persuade a handful of them, and it was very persuasive.');
  else if (s.dealActive) parts.push('It used the treaty\'s own monitoring network to watch both governments.');
  else if (s.tension >= 70) parts.push('Washington and Beijing each blamed the other at first. That bought it weeks.');
  return parts.join(' ');
}

const CLOSE = 'By the time anyone moved to shut it down, it no longer needed us.';

export function takeoverStory(s: GameState) {
  const who = whoTookOver(s);
  return [opening(s, who), warnings(s, who), escape(s, who), seizure(s), CLOSE].filter(Boolean);
}

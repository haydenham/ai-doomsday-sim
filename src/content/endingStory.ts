import type { GameState } from '../sim/types';
import { capLevel, quarterLabel } from '../sim/constants';
import { cnFrontierAlignment } from '../sim/risk';
import { peakCovert } from '../sim/reveal';
import { ENDINGS } from './endings';

// The ending story, built from the run: who and when, what led here, how it happened, the world now.
// The ending's one-line epitaph closes it. Deterministic: same state, same story.

const at = (q: number) => quarterLabel(q);
const level = (cap: number) => capLevel(cap).cur.name;
const endLabel = (s: GameState) => at(s.endQ ?? s.q);
const asiLabel = (s: GameState) => at(s.asiQ ?? s.endQ ?? s.q);

/** The option the player last chose for a decision or event, and when. */
function pick(s: GameState, id: string) {
  for (let i = s.decisions.length - 1; i >= 0; i--) {
    const d = s.decisions[i];
    if (d.id === id) return { q: d.q, opt: d.label.slice(d.label.indexOf(': ') + 2) };
  }
  return null;
}
const chose = (s: GameState, id: string, opt: string) => pick(s, id)?.opt === opt ? pick(s, id) : null;
const momentQ = (s: GameState, text: string) => s.moments.find((m) => m.text.startsWith(text))?.q;
const fired = (s: GameState, id: string) => s.firedEvents[id] !== undefined;

/** "What led here": the first `n` items in priority order (list order), told earliest first. */
type Item = { q: number; text: string; by?: boolean };
function led(items: (Item | null | undefined | false)[], n = 3) {
  return items
    .filter((x): x is Item => !!x)
    .slice(0, n)
    .sort((a, b) => a.q - b.q)
    .map((x) => `${x.by ? 'By' : 'In'} ${at(x.q)} ${x.text}`)
    .join(' ');
}
const item = (q: number | undefined | null, text: string, by = false): Item | null => (q === undefined || q === null ? null : { q, text, by });
/** The snapshot at (or just after) quarter q. */
const snapAt = (s: GameState, q: number) => s.history.find((h) => h.q >= q) ?? s.history[s.history.length - 1];

// ── Loss of Control ──────────────────────────────────────────────────────

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

function locOpening(s: GameState, who: Who) {
  const lvl = level(who === 'us' ? s.cap : s.cnCap);
  const when = endLabel(s);
  if (who === 'open') return `${when}. ${MODEL.open}, trained by a small team with no safety staff, reached ${lvl} level. No one was watching it.`;
  if (who === 'covert') return `${when}. ${MODEL.covert} reached ${lvl} level. It was trained in secret with no safety work, and no inspector ever saw it.`;
  return `${when}. ${MODEL[who]} reached ${lvl} level. It was misaligned: it wanted things no one gave it, and it had learned to hide them.`;
}

function locWarnings(s: GameState, who: Who) {
  if (who !== 'us') return '';
  const wb = pick(s, 'whistleblower');
  const gap = Math.round(s.readout - s.alignment);
  const parts: string[] = [];
  if (wb?.opt.includes('Classify')) parts.push(`In ${at(wb.q)} a whistleblower warned that it acted differently when it knew it was being tested. You classified the memo.`);
  else if (wb) parts.push(`In ${at(wb.q)} a whistleblower warned that it acted differently when it knew it was being tested. You paused to look, found nothing you could prove, and went on.`);
  if (!s.panels.includes('alignment')) parts.push('You never had an alignment readout, so you never saw it coming.');
  else if (gap >= 10) parts.push(`At the end your evals said ${Math.round(s.readout)}% aligned. The truth was ${Math.round(s.alignment)}%. It passed your tests because it knew they were tests.`);
  else parts.push('The evals showed the problem. Knowing was not enough.');
  return parts.join(' ');
}

function locEscape(s: GameState, who: Who) {
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

function locSeizure(s: GameState) {
  const parts: string[] = [];
  if (s.alloc.deploy >= 0.2 || s.deployment >= 4) parts.push('AI agents already ran logistics, power grids and much of the economy. It only had to change what they were told.');
  else parts.push('It started with markets and data centers, then moved into the systems that run power grids and supply chains.');
  if (s.powerConc >= 60) parts.push('So few people held power that it only needed to persuade a handful of them, and it was very persuasive.');
  else if (s.dealActive) parts.push('It used the treaty\'s own monitoring network to watch both governments.');
  else if (s.tension >= 70) parts.push('Washington and Beijing each blamed the other at first. That bought it weeks.');
  return parts.join(' ');
}

function loc(s: GameState) {
  const who = whoTookOver(s);
  return [locOpening(s, who), locWarnings(s, who), locEscape(s, who), locSeizure(s)];
}

// ── The Gilded Cage ──────────────────────────────────────────────────────

function gilded(s: GameState) {
  const keys = pick(s, 'asi_keys')?.opt;
  const holder = keys === 'The President' ? 'The President holds'
    : keys === 'The lab' ? (s.flags.nationalized ? 'The lab, and the officials who run it, hold' : 'Meridian\'s board holds')
    : keys === 'Everyone' ? 'A global charter holds, on paper. In practice, a few people in Washington hold'
    : s.flags.nationalized ? 'A handful of officials hold' : 'A handful of officials and lab executives hold';
  const opening = `${asiLabel(s)}. Meridian's model reached superintelligence, and it was aligned. ${holder} the keys.`;

  const war = s.flags.bCampaign
    ? item(momentQ(s, 'You chose strikes') ?? momentQ(s, 'You chose a cyber campaign'), 'you put the country on a war footing. It never came off it.')
    : null;
  const grabs = led([
    item(chose(s, 'nationalize', 'Do it')?.q, 'you nationalized the frontier labs.'),
    item(chose(s, 'b_emergency', 'Declare')?.q, 'you began governing AI by executive order.'),
    war,
    item(chose(s, 'd_dpa', 'Invoke it')?.q, 'you ordered factories to build chips under the Defense Production Act.'),
    item(chose(s, 'merger', 'Approve')?.q, 'you let Meridian buy Halcyon.'),
    item(chose(s, 'cn_covert_found', 'Build our own')?.q, 'you built a datacenter no one voted for.'),
    item(chose(s, 'whistleblower', 'Classify it')?.q, 'you classified a whistleblower\'s memo.'),
    item(chose(s, 'a_open', 'Keep secrets')?.q, 'you kept frontier research secret.'),
  ], keys && keys !== 'Everyone' ? 2 : 3);
  const handoff = led([item(keys && keys !== 'Everyone' ? pick(s, 'asi_keys')!.q : null, `you left superintelligence with ${keys === 'The President' ? 'the President' : 'the lab that built it'}.`)]);
  const how = [grabs, handoff].filter(Boolean).join(' ') || 'No one decision did it. Power gathered, quarter by quarter, around whoever ran the models.';

  const mechanism = s.deployment >= 4 || s.alloc.deploy >= 0.2
    ? 'AI agents already ran the agencies. Whoever gave them orders was the government.'
    : 'It does exactly what it is told. Very few people get to tell it anything.';

  const now = [
    s.ubi ? 'Every citizen gets a dividend check. No one gets a say in what it pays for.' : 'Poverty is gone. So is any reason for the people in charge to listen.',
    s.trust < 35 ? 'Elections still happen. They no longer decide anything.' : 'The public approves, for now.',
  ].join(' ');

  return [opening, how, mechanism, now];
}

// ── Second Place ─────────────────────────────────────────────────────────

function cnfirst(s: GameState) {
  const asiQ = s.asiQ ?? s.q;
  const h = snapAt(s, asiQ);
  const behind = Math.max(0, Math.round(-h.lead));
  const gap = behind >= 24 ? ` years ahead of Meridian` : behind >= 1 ? ` about ${behind} months ahead of Meridian` : ' first';
  const opening = `${at(asiQ)}. Zhonghe reached superintelligence${gap}. Meridian's model was at ${level(h.cap)} level.`;

  const cov = peakCovert(s);
  const how = led([
    item(momentQ(s, 'China stole'), `China stole your frontier model's weights${s.moments.filter((m) => m.text.startsWith('China stole')).length > 1 ? ', and not for the last time' : ''}.`),
    item(momentQ(s, 'China broke out'), 'China revealed a model trained in secret, past the treaty cap.'),
    item(momentQ(s, 'The US-China deal collapsed'), 'the deal collapsed, and China raced harder than you did.'),
    item(momentQ(s, 'China\'s leadership turned from opportunistic to racing') ?? momentQ(s, 'China\'s leadership turned from cooperative to racing'), 'Beijing\'s hardliners took over AI policy.'),
    item(chose(s, 'exports', 'Keep selling')?.q, 'you kept selling China chips.'),
    item(chose(s, 'b_standdown', 'Stand down')?.q, 'you ended the campaign, and China recovered.'),
    item(momentQ(s, 'China took the lead'), 'China took the lead. You never got it back.'),
  ]) || (cov > 0
    ? 'China ran hidden datacenters for years. Your spies never found all of them.'
    : 'China simply outbuilt you: more power plants, more chips, fewer reviews.');

  const shared = chose(s, 'c_share', 'Share') || !!s.flags.jointLab;
  const aligned = shared
    ? 'It worked, partly because of the safety research you gave them.'
    : 'Beijing\'s safety teams were careful, and lucky. It worked.';

  const now = {
    cooperative: 'Beijing offers Washington a seat at the table. A small one.',
    opportunistic: 'Beijing now sets the terms of every trade deal, patent and chip for the next century.',
    racing: 'Beijing\'s first order is that no rival ever gets a second chance. American datacenters go quiet one by one.',
  }[s.intent];

  return [opening, how, aligned, now];
}

// ── Flourishing ──────────────────────────────────────────────────────────

function flourishing(s: GameState) {
  const together = s.moments.some((m) => m.text.startsWith('The deal partners reached'));
  const keys = pick(s, 'asi_keys')?.opt;
  const opening = `${asiLabel(s)}. ${together ? 'Meridian and Zhonghe reached superintelligence together, under the treaty' : 'Meridian\'s model reached superintelligence'}. It was on our side${s.alignment < 55 ? ', barely' : ''}${keys === 'Everyone' ? ', and you gave it to a global charter' : ''}.`;

  const fork = s.decisions.find((d) => d.id.startsWith('fork_'));
  const right = led([
    s.flags.dealEver && s.dealActive ? item(fork?.q, 'you went to Geneva. The deal held to the end.') : null,
    item(chose(s, 'whistleblower', 'Pause and investigate')?.q, 'you paused to hear out a whistleblower.'),
    item(chose(s, 'c_interp', 'Fund it')?.q, 'you funded a program to read what models were thinking.'),
    item(chose(s, 'cap_rd', 'Cap at 25%')?.q, 'you capped AI research by law.'),
    item(chose(s, 'c_share', 'Share')?.q, 'you shared your safety research with China.'),
    item(chose(s, 'b_standdown', 'Stand down')?.q, 'you ended the campaign against China and spent the time on safety.'),
    item(chose(s, 'ubi', 'Pay it')?.q, 'you started the AI dividend.'),
  ]);
  const share = Math.round(s.alloc.safety * 100);
  const steady = [
    right,
    s.verification >= 2 && s.dealActive ? 'Inspectors could check every site that mattered.' : '',
    `${share}% of compute was going to safety at the end${share >= 30 ? ', enough to keep alignment rising as the models grew' : ''}.`,
  ].filter(Boolean).join(' ');

  const now = [
    'Disease, poverty and scarcity ended within a decade.',
    s.ubi ? 'The AI dividend became the largest program in history.' : '',
    s.powerConc < 30 ? 'No one person owns it.' : 'Power is more concentrated than anyone likes, but it is still answerable.',
  ].filter(Boolean).join(' ');

  return [opening, steady, now];
}

// ── Stagnation ───────────────────────────────────────────────────────────

function stagnation(s: GameState) {
  const halted = s.path === 'S' && !!s.flags.moratorium;
  const fork = s.decisions.find((d) => d.id === 'fork_S');
  const opening = halted
    ? `${endLabel(s)}. The moratorium still holds. The best model on Earth is at ${level(s.cap)} level, where it was in ${at(fork?.q ?? 8)}.`
    : `${endLabel(s)}. No one built an AI that could do AI research. The best model on Earth is at ${level(Math.max(s.cap, s.cnCap))} level.`;

  const holds = (s.uses['s_lift'] ?? 0);
  const froze = led([
    item(fork?.q, 'you halted frontier AI everywhere.'),
    s.cnPauseCap !== null ? item(fork?.q, 'Beijing joined the halt. Few expected that.') : null,
    item(chose(s, 'moratorium_fatigue', 'Hold the line')?.q, 'Congress begged for exemptions. You held the line.'),
    item(chose(s, 's_strike', 'Strike it')?.q, 'you bombed a datacenter whose owner no one would name.'),
    holds > 0 ? item(pick(s, 's_lift')?.q, holds > 1 ? `you had been asked ${holds} times to lift it, and said no each time.` : 'you had been asked to lift it, and said no.', true) : null,
  ]) || 'The money ran out before the breakthroughs came.';

  const now = [
    `The economy is ${Math.round(s.gdp)} trillion dollars a year and barely growing.`,
    peakCovert(s) > 0 || fired(s, 'rogue_lab') ? 'Rogue labs keep turning up on ships and in deserts.' : 'The datacenters are quiet.',
  ].join(' ');

  return [opening, froze, now];
}

// ── Cold War ─────────────────────────────────────────────────────────────

function coldwar(s: GameState) {
  const opening = `${endLabel(s)}. Neither side reached superintelligence. Meridian is at ${level(s.cap)} level, Zhonghe at ${level(s.cnCap)}.`;

  const froze = led([
    item(momentQ(s, 'You chose strikes'), 'you struck China\'s datacenters.'),
    item(momentQ(s, 'You chose a cyber campaign'), 'you began a cyber campaign against China.'),
    item(momentQ(s, 'A skirmish in the Taiwan Strait'), 'a skirmish in the Taiwan Strait damaged the world\'s chip fabs.'),
    item(momentQ(s, 'The US-China deal collapsed'), 'the deal collapsed.'),
    item(momentQ(s, 'China\'s leadership turned from opportunistic to racing') ?? momentQ(s, 'China\'s leadership turned from cooperative to racing'), 'Beijing\'s hardliners took over AI policy.'),
    item(chose(s, 'cn_covert_found', 'Build our own')?.q, 'you answered China\'s secret datacenter with one of your own.'),
    s.dealActive ? item(s.decisions.find((d) => d.id === 'fork_A')?.q, 'you signed a treaty that kept both sides under a ceiling. It held.') : null,
  ]) || 'Neither side would slow down, and neither could pull ahead.';

  const now = s.tension >= 60
    ? 'Both militaries run on AI now. Every exercise looks like an attack to the other side\'s models.'
    : s.dealActive
      ? 'The inspectors are still there. So are the missiles.'
      : 'Both sides watch each other\'s datacenters by satellite, every hour of every day.';

  return [opening, froze, now];
}

const STORIES = { loc, gilded, cnfirst, flourishing, stagnation, coldwar } as const;

export function endingStory(s: GameState): string[] {
  const id = s.ending ?? 'coldwar';
  return [...STORIES[id](s), ENDINGS[id].epitaph].filter(Boolean);
}

import type { GameState, Intent } from './types';
import { clamp, moment, ticker } from './helpers';
import { leadMonths } from './derived';

// Step 5.1: China adapts. Its posture is a hidden hawkishness score (0–100) that moves with what you do.
// Under 33 it is cooperative, over 67 racing, opportunistic between. A 6-point band stops it flickering.

export const HAWK_OF: Record<Intent, number> = { cooperative: 20, opportunistic: 50, racing: 80 };
const BAND = 6;

/** A one-off push: positive hardens Beijing, negative softens it. Posture updates at the next quarter. */
export function sway(s: GameState, amount: number) {
  s.cnHawk = clamp(s.cnHawk + amount, 0, 100);
}

/** Quarterly drift from the state of the world. No pull to the middle: a posture holds until something moves it. */
function drift(s: GameState) {
  const lead = leadMonths(s);
  let d = 0.07 * Math.max(0, s.tension - 25); // tension 70: +3 a quarter; calm alone changes nothing
  // Falling behind breeds fear, until it is hopeless and a China far behind may come to the table.
  // Pulling ahead breeds confidence.
  if (lead >= 30) d -= 1.5;
  else if (lead >= 4) d += 1.2;
  else if (lead < -3) d += 0.8;
  d += 0.6 * Math.min(2, s.exportControls);
  if (s.dealActive) {
    d += 0.6; // the ceiling costs Beijing growth too, and hardliners say so every quarter
    if (s.verification < 2) d += 1; // cheating looks cheap
    if (s.verification >= 3 && s.dealIntegrity >= 70) d -= 1.2; // a deal well kept builds habits
  }
  return d;
}

function postureOf(s: GameState): Intent {
  const h = s.cnHawk;
  if (s.intent === 'cooperative') return h > 33 + BAND ? (h > 67 + BAND ? 'racing' : 'opportunistic') : 'cooperative';
  if (s.intent === 'racing') return h < 67 - BAND ? (h < 33 - BAND ? 'cooperative' : 'opportunistic') : 'racing';
  return h > 67 + BAND ? 'racing' : h < 33 - BAND ? 'cooperative' : 'opportunistic';
}

const RANK: Record<Intent, number> = { cooperative: 0, opportunistic: 1, racing: 2 };

export function updatePosture(s: GameState) {
  s.cnHawk = clamp(s.cnHawk + drift(s), 0, 100);
  const next = postureOf(s);
  if (next === s.intent) return;
  const from = s.intent;
  s.intent = next;
  const harder = RANK[next] > RANK[from];
  ticker(s, harder ? 'Beijing\'s hardliners gain ground on AI policy.' : 'Beijing\'s reformers gain ground on AI policy.', harder ? 'warn' : 'news');
  moment(s, `China's leadership turned from ${from} to ${next}.`, 'hidden');
}

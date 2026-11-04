import type { GameState } from './types';
import { DECISION_BY_ID } from '../content/decisions';
import { EVENT_BY_ID, eventToPending } from '../content/events';
import { newGame } from './engine';

// Autosave survives a refresh, a closed tab, or a dev-server reload.
// Pending choices hold functions, so they're saved by id and rebuilt from content on load.
const KEY = 'ai2040.save.v1';

export function saveGame(s: GameState) {
  const data = { ...s, pending: s.pending ? { id: s.pending.id } : null };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable or full */ }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as GameState;
    if (saved.ending || typeof saved.t !== 'number') return null;
    // Fields added since the save get their new-game defaults.
    const s = Object.assign(newGame(saved.seed), saved);
    if (s.negotiation) {
      s.negotiation.redLines ??= [];
      s.negotiation.strain ??= 0;
    }
    if (s.pending) {
      const id = s.pending.id;
      const d = DECISION_BY_ID[id];
      const e = EVENT_BY_ID[id];
      if (d) s.pending = { id, title: d.title, body: d.text, kind: 'decision', choices: d.options };
      else if (e) s.pending = eventToPending(s, e);
      else s.pending = null; // content changed since the save; drop the stale prompt
    }
    return s;
  } catch {
    return null;
  }
}

import { useSyncExternalStore } from 'react';
import type { GameState } from '../sim/types';
import { SUBSTEP, isBlocked, newGame, skipQuarter, step } from '../sim/engine';
import { quarterSeconds } from '../sim/derived';

type Listener = () => void;

// ?fast=4 in the URL speeds the clock up for testing.
const FAST = Number(new URLSearchParams(location.search).get('fast') ?? 1) || 1;

class GameStore {
  s: GameState | null = null;
  speed: 1 | 2 | 3 = 1;
  paused = false;
  version = 0;
  private acc = 0;
  private listeners = new Set<Listener>();
  private lastEmit = 0;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  getVersion = () => this.version;

  emit(force = true) {
    const now = performance.now();
    if (!force && now - this.lastEmit < 33) return;
    this.lastEmit = now;
    this.version++;
    this.listeners.forEach((l) => l());
  }

  start(seed: number) {
    this.s = newGame(seed);
    this.acc = 0;
    this.paused = false;
    this.speed = 1;
    this.emit();
  }

  quit() {
    this.s = null;
    this.emit();
  }

  /** Called every animation frame with real elapsed seconds. */
  frame(realDt: number) {
    const s = this.s;
    if (!s || this.paused || isBlocked(s)) return;
    this.acc += (realDt * this.speed * FAST) / quarterSeconds(s);
    let n = 0;
    while (this.acc >= SUBSTEP && n < 400) {
      step(s, SUBSTEP);
      this.acc -= SUBSTEP;
      n++;
      if (isBlocked(s)) { this.acc = 0; break; }
    }
    // Always render the frame that blocks: frames return early while blocked, so a throttled
    // emit here would leave the decision popup invisible until something else re-rendered.
    this.emit(isBlocked(s));
  }

  /** Fraction of the current quarter elapsed. */
  progress() {
    return this.s ? this.s.t - Math.floor(this.s.t + 1e-9) : 0;
  }

  act(fn: (s: GameState) => unknown) {
    if (!this.s) return;
    const r = fn(this.s);
    this.emit();
    return r;
  }

  skip() {
    if (!this.s) return;
    skipQuarter(this.s);
    this.acc = 0;
    this.emit();
  }

  setSpeed(v: 1 | 2 | 3) { this.speed = v; this.paused = false; this.emit(); }
  togglePause() { this.paused = !this.paused; this.emit(); }
}

export const game = new GameStore();

export function useGame() {
  useSyncExternalStore(game.subscribe, game.getVersion);
  return game;
}

if (import.meta.env.DEV) (window as unknown as { game: GameStore }).game = game;

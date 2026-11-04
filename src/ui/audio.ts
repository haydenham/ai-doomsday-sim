// Tiny Web Audio synth. No asset files.
let ctx: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('ai2040-muted') === '1'; } catch { /* storage unavailable */ }

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem('ai2040-muted', m ? '1' : '0'); } catch { /* ignore */ }
}

function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.05, delay = 0, slideTo?: number) {
  if (muted) return;
  const c = ac();
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => tone(880, 0.05, 'square', 0.015),
  play: () => { tone(392, 0.12, 'triangle', 0.05); tone(587, 0.18, 'triangle', 0.04, 0.06); },
  deny: () => tone(150, 0.15, 'square', 0.03),
  unlock: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.045, i * 0.09)),
  tier: () => { [262, 330, 392, 523].forEach((f) => tone(f, 0.9, 'triangle', 0.03)); tone(1047, 0.6, 'sine', 0.03, 0.15); },
  warn: () => { tone(220, 0.35, 'sawtooth', 0.03); tone(208, 0.45, 'sawtooth', 0.03, 0.2); },
  ai: () => { for (let i = 0; i < 6; i++) tone(600 + Math.random() * 1200, 0.05, 'square', 0.012, i * 0.04); },
  event: () => { tone(440, 0.25, 'sine', 0.05); tone(330, 0.4, 'sine', 0.05, 0.18); },
  fork: () => [196, 247, 294, 392].forEach((f, i) => tone(f, 1.6, 'sine', 0.04, i * 0.25)),
  good: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 1.2, 'sine', 0.035, i * 0.18)),
  bad: () => tone(110, 3, 'sine', 0.06, 0, 40),
};

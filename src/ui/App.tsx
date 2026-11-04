import { useEffect, useRef, useState, type ReactNode } from 'react';
import { game, useGame } from '../store/game';
import type { GameState } from '../sim/types';
import { quarterLabel } from '../sim/constants';
import { isMuted, setMuted, sfx } from './audio';
import { DecisionBox, ForkScreen, NegotiationBox, StartScreen } from './components/Overlays';
import { Reveal } from './components/Reveal';
import { Algorithms, Alignment, Compute, Deal, Frontier, Intelligence, Log, Status, World } from './sections';

// Which unlocked panel renders where. Column 0 always exists; the others appear when they have content.
const LAYOUT: { id: string; col: 0 | 1 | 2; render: (s: GameState) => ReactNode }[] = [
  { id: 'alignment', col: 0, render: (s) => <Alignment s={s} /> },
  { id: 'compute', col: 1, render: (s) => <Compute s={s} /> },
  { id: 'algorithms', col: 1, render: (s) => <Algorithms s={s} /> },
  { id: 'intelligence', col: 1, render: (s) => <Intelligence s={s} /> },
  { id: 'frontier', col: 1, render: (s) => <Frontier s={s} /> },
  { id: 'map', col: 2, render: (s) => <World s={s} /> },
  { id: 'deal', col: 2, render: (s) => <Deal s={s} /> },
];

function useFrameLoop() {
  useEffect(() => {
    // rAF for smoothness, plus a timer so the clock keeps its real pace when rAF is throttled.
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      if (now - last < 8) return;
      game.frame(Math.min(1, (now - last) / 1000));
      last = now;
    };
    let raf = 0;
    const loop = () => { tick(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(tick, 100);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);
}

/** Sounds and screen pulses in response to what the sim just did. */
function useJuice(s: GameState | null) {
  const lastTicker = useRef(0);
  const lastPending = useRef<string | null>(null);
  const lastFork = useRef(false);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!s) { lastTicker.current = 0; return; }
    const fresh = s.ticker.filter((t) => t.id > lastTicker.current);
    if (lastTicker.current !== 0 && fresh.length) {
      const kinds = new Set(fresh.map((t) => t.kind));
      if (kinds.has('tier')) { sfx.tier(); setPulse((p) => p + 1); }
      else if (kinds.has('unlock')) sfx.unlock();
      else if (kinds.has('ai')) sfx.ai();
      else if (kinds.has('warn')) sfx.warn();
      else if (kinds.has('good')) sfx.good();
    }
    lastTicker.current = s.ticker[s.ticker.length - 1]?.id ?? 0;
    const pid = s.pending ? `${s.q}:${s.pending.id}` : null;
    if (pid && pid !== lastPending.current) (s.pending!.kind === 'ai' ? sfx.ai : s.pending!.kind === 'crisis' ? sfx.warn : sfx.event)();
    lastPending.current = pid;
    if (s.forkPending && !lastFork.current) sfx.fork();
    lastFork.current = s.forkPending;
  });
  return pulse;
}

/** Loss of Control: sections go dark one by one. Otherwise a short beat, then the Reveal. */
function useEnding(s: GameState | null) {
  const [stage, setStage] = useState<'none' | 'sequence' | 'reveal'>('none');
  const [faded, setFaded] = useState<string[]>([]);
  const ending = s?.ending ?? null;
  const seed = s?.seed;
  useEffect(() => { setStage('none'); setFaded([]); }, [seed, s === null]);
  useEffect(() => {
    if (!ending || !s) return;
    setStage('sequence');
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (ending === 'loc') {
      sfx.bad();
      const order = ['log', ...[...s.panels].reverse(), 'status'];
      order.forEach((id, i) => timers.push(setTimeout(() => setFaded((f) => [...f, id]), 600 + i * 600)));
      timers.push(setTimeout(() => setStage('reveal'), 1600 + order.length * 600));
    } else {
      (ending === 'flourishing' ? sfx.good : sfx.event)();
      timers.push(setTimeout(() => setStage('reveal'), 4000));
    }
    return () => timers.forEach(clearTimeout);
  }, [ending]);
  return { stage, faded };
}

function TopBar({ s }: { s: GameState }) {
  const [muted, setM] = useState(isMuted());
  const W = 28;
  const pos = Math.min(W - 1, Math.floor((s.t / 52) * W));
  return (
    <header className="topbar">
      <span className="brand">AI 2040</span>
      <span className="date">{quarterLabel(s.q)}{s.path ? ` · plan ${s.path}` : ''}</span>
      {s.q >= 2 && <span className="timeline dim">2027 <span className="amber">{'━'.repeat(pos)}●</span>{'─'.repeat(W - 1 - pos)} 2040</span>}
      <span className="controls">
        <button className={game.paused ? 'on' : ''} onClick={() => { sfx.click(); game.togglePause(); }} title="pause (space)">{game.paused ? '▶' : '❚❚'}</button>
        {([1, 2, 3] as const).map((v) => (
          <button key={v} className={!game.paused && game.speed === v ? 'on' : ''} onClick={() => { sfx.click(); game.setSpeed(v); }}>{v}×</button>
        ))}
        <button onClick={() => { const m = !muted; setMuted(m); setM(m); }} title="sound">{muted ? 'snd off' : 'snd'}</button>
      </span>
    </header>
  );
}

export function App() {
  useFrameLoop();
  const g = useGame();
  const s = g.s;
  const pulse = useJuice(s);
  const { stage, faded } = useEnding(s);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = game.s;
      if (!st || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (st.pending || st.forkPending || st.negotiation) return; // overlays own the keys
      if (e.code === 'Space') { e.preventDefault(); game.togglePause(); }
      if (e.key === '1' || e.key === '2' || e.key === '3') game.setSpeed(Number(e.key) as 1 | 2 | 3);
      if (e.key === 'n') game.skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!s) return <StartScreen />;
  if (stage === 'reveal') return <Reveal s={s} />;

  const visible = LAYOUT.filter((p) => s.panels.includes(p.id));
  const cols = [1, 2].map((c) => visible.filter((p) => p.col === c));
  const fade = (id: string) => `fadeable ${faded.includes(id) ? 'faded' : ''}`;

  return (
    <div className={`app ${s.rdMult > 8 && !s.ending ? 'unstable' : ''} ${s.ending ? `ending-${s.ending}` : ''}`}>
      {pulse > 0 && <div key={pulse} className="pulse" />}
      <TopBar s={s} />
      <main className="board">
        <div className="col">
          <div className={fade('status')}><Status s={s} /></div>
          {visible.filter((p) => p.col === 0).map((p) => <div key={p.id} className={fade(p.id)}>{p.render(s)}</div>)}
          <div className={fade('log')}><Log s={s} silent={s.ending === 'loc'} /></div>
        </div>
        {cols.map((col, i) => col.length > 0 && (
          <div key={i} className="col">
            {col.map((p) => <div key={p.id} className={fade(p.id)}>{p.render(s)}</div>)}
          </div>
        ))}
      </main>
      {g.paused && !s.pending && !s.forkPending && !s.negotiation && !s.ending && <div className="paused-tag">paused · space to resume</div>}
      {s.pending && !s.ending && <DecisionBox s={s} />}
      {!s.pending && s.forkPending && <ForkScreen s={s} />}
      {!s.pending && s.negotiation && <NegotiationBox s={s} />}
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { GameState, PathId } from '../../sim/types';
import { chooseFork, closeNegotiation, resolveChoice, submitOffer } from '../../sim/engine';
import { PATHS } from '../../content/paths';
import { NEGOTIATION_ITEMS } from '../../content/negotiation';
import { capLevel, quarterLabel } from '../../sim/constants';
import { leadMonths } from '../../sim/derived';
import { game } from '../../store/game';
import { randomSeed } from '../../sim/rng';
import { sfx } from '../audio';
import { levelWord } from '../format';
import { Chips } from './term';

/** Number keys pick options while an overlay is up. */
function useKeys(handler: (key: string) => void, deps: unknown[]) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      handler(e.key);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ── Start ─────────────────────────────────────────────────────────────────

const INTRO = ['January 2027.', 'You run AI policy for the United States.'];

export function StartScreen() {
  const [shown, setShown] = useState(0);
  const [seed, setSeed] = useState(() => String(randomSeed()));
  const [saved] = useState(() => game.saved());
  useEffect(() => {
    if (shown > INTRO.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 900);
    return () => clearTimeout(t);
  }, [shown]);
  const begin = () => { sfx.unlock(); game.start(Number(seed) || randomSeed()); };
  const resume = () => { sfx.unlock(); if (saved) game.resume(saved); };
  useKeys((k) => { if (k === 'Enter' && shown > INTRO.length) (saved ? resume : begin)(); }, [shown, seed]);
  return (
    <div className="start">
      <div className="start-title">AI 2040</div>
      {INTRO.slice(0, shown).map((l) => <div key={l} className="line fade-in">&gt; {l}</div>)}
      {shown > INTRO.length && (
        <div className="fade-in">
          {saved && <button className="btn" onClick={resume}>[ continue · {quarterLabel(saved.q)}{saved.path ? ` · plan ${saved.path}` : ''} ]</button>}
          <button className={`btn ${saved ? 'dim' : ''}`} onClick={begin}>[ {saved ? 'new game' : 'begin'} ]</button>
          <div className="seed">seed <input value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))} /></div>
        </div>
      )}
      <div className="credit">based on <a href="https://ai-2040.com" target="_blank" rel="noreferrer">ai-2040.com</a> by the AI Futures Project</div>
    </div>
  );
}

// ── Decision ──────────────────────────────────────────────────────────────

const KIND: Record<string, string> = { decision: 'decision', crisis: 'crisis', news: 'news', ai: 'machine', milestone: 'milestone' };

export function DecisionBox({ s }: { s: GameState }) {
  const p = s.pending!;
  const pick = (i: number) => {
    if (!p.choices[i]) return;
    sfx.play();
    game.act((st) => resolveChoice(st, i));
  };
  useKeys((k) => { const n = Number(k); if (n >= 1 && n <= p.choices.length) pick(n - 1); }, [p.id, p.choices.length]);
  return (
    <div className="overlay">
      <div className={`box box-${p.kind}`}>
        <div className="box-head"><span>{KIND[p.kind]} · {quarterLabel(s.q)}</span><span className="dim">■ clock stopped</span></div>
        <div className="box-title">{p.title}</div>
        {p.body && <div className="box-body">{p.body}</div>}
        <div className="options">
          {p.choices.map((c, i) => (
            <button key={i} className="option" onClick={() => pick(i)}>
              <span className="option-key">[{i + 1}]</span>
              <span className="option-label">{c.label}</span>
              <Chips chips={c.chips} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── The Fork ──────────────────────────────────────────────────────────────

export function ForkScreen({ s }: { s: GameState }) {
  const [sel, setSel] = useState<PathId | null>(null);
  const lead = leadMonths(s);
  const choose = (id: PathId) => { if (PATHS.find((p) => p.id === id)!.available(s).ok) { sfx.click(); setSel(id); } };
  const commit = () => { if (sel) { sfx.tier(); game.act((st) => chooseFork(st, sel)); } };
  useKeys((k) => {
    const n = Number(k);
    if (n >= 1 && n <= PATHS.length) choose(PATHS[n - 1].id);
    if (k === 'Enter') commit();
  }, [sel]);
  return (
    <div className="overlay fork">
      <div className="fork-inner">
        <div className="box-head"><span>2029 · choose a path</span><span className="dim">■ clock stopped</span></div>
        <div className="box-title big">Choose a path.</div>
        <div className="box-body">Frontier AI: {capLevel(s.cap).cur.name.toLowerCase()}. This cannot be undone.</div>
        <div className="line dim">lead {lead.toFixed(0)}mo · trust {Math.round(s.trust)} · safety {levelWord(s.safety)} · verification {levelWord(s.verification)}</div>
        <div className="paths">
          {PATHS.map((p, i) => {
            const av = p.available(s);
            return (
              <button key={p.id} className={`path ${sel === p.id ? 'sel' : ''} ${av.ok ? '' : 'locked'}`} onClick={() => choose(p.id)} disabled={!av.ok}>
                <span className="option-key">[{i + 1}]</span>
                <span className="path-main">
                  <span className="path-name">{p.code} · {p.name.toLowerCase()}</span>
                  <span className="path-one">{av.ok ? p.oneLine : av.reason}</span>
                  {sel === p.id && <span className="path-feel">{p.feel}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <button className="btn" disabled={!sel} onClick={commit}>{sel ? `[ commit to plan ${sel} ]` : '[ select a path ]'}</button>
      </div>
    </div>
  );
}

// ── Negotiation ───────────────────────────────────────────────────────────

export function NegotiationBox({ s }: { s: GameState }) {
  const n = s.negotiation!;
  const [offer, setOffer] = useState<string[]>(['inspections', 'joint']);
  const toggle = (id: string) => { if (n.outcome !== 'pending') return; sfx.click(); setOffer((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])); };
  const go = () => {
    if (n.outcome === 'pending') { sfx.event(); game.act((st) => submitOffer(st, offer)); }
    else { sfx.click(); game.act((st) => closeNegotiation(st)); }
  };
  useKeys((k) => {
    const i = Number(k);
    if (i >= 1 && i <= NEGOTIATION_ITEMS.length) toggle(NEGOTIATION_ITEMS[i - 1].id);
    if (k === 'Enter') go();
  }, [offer, n.outcome, n.round]);
  const lean = (id: string) => {
    if (!n.revealed.includes(id)) return <span className="dim">?</span>;
    const v = n.values[id];
    return v > 0 ? <span className="good">they want this</span> : v > -1 ? <span className="amber">they dislike this</span> : <span className="bad">they hate this</span>;
  };
  const status = n.outcome === 'pending' ? `round ${n.round + 1}/${n.maxRounds}` : n.outcome === 'accepted' ? 'signed' : 'failed';
  return (
    <div className="overlay">
      <div className="box box-milestone">
        <div className="box-head"><span>negotiation · {status}</span><span className="dim">■ clock stopped</span></div>
        <div className="box-title">Geneva</div>
        <div className="box-body">Pick at least two terms. More terms, stronger deal. Push too hard and they walk.</div>
        <div className="options">
          {NEGOTIATION_ITEMS.map((it, i) => (
            <button key={it.id} className={`option neg ${offer.includes(it.id) ? 'on' : ''}`} onClick={() => toggle(it.id)}>
              <span className="option-key">[{offer.includes(it.id) ? 'x' : ' '}] {i + 1}</span>
              <span className="option-label">{it.name.toLowerCase()}</span>
              <span className="chips">
                {it.kind === 'sweetener' ? <span className="chip chip-b">concession</span>
                  : <span className="chip chip-g">deal +{it.id === 'inspections' && s.verification < 1 ? it.integrity / 2 : it.integrity}</span>}
                <span className="chip">{lean(it.id)}</span>
              </span>
            </button>
          ))}
        </div>
        {n.lastResponse && <div className={`line ${n.outcome === 'accepted' ? 'good' : n.outcome === 'rejected' ? 'bad' : 'amber'}`}>&gt; {n.lastResponse}</div>}
        <button className="btn" onClick={go}>{n.outcome === 'pending' ? '[ make offer ]' : '[ continue ]'}</button>
      </div>
    </div>
  );
}

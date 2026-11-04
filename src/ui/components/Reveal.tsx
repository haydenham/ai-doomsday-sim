import { useState } from 'react';
import type { GameState } from '../../sim/types';
import { ENDINGS } from '../../content/endings';
import { AC, ALIGN_LOC, ASI, TED_AI, quarterLabel } from '../../sim/constants';
import { difficultyLabel, peakCovert as peakCovertOf, pivotalDecision, score, shareText, timelineLabel, whatIfs } from '../../sim/reveal';
import { game } from '../../store/game';
import { randomSeed } from '../../sim/rng';
import { sfx } from '../audio';
import { LineChart } from './common';
import { bigStr, moneyStr } from '../format';

export function Reveal({ s }: { s: GameState }) {
  const e = ENDINGS[s.ending!];
  const [copied, setCopied] = useState(false);
  const xs = s.history.map((h) => h.q);
  const pivot = pivotalDecision(s);
  const peakCovert = peakCovertOf(s);
  const ifs = whatIfs(s);
  const firstReadout = s.history.find((h) => h.readout !== null)?.q;
  const blind = firstReadout === undefined
    ? [{ from: xs[0], to: xs[xs.length - 1], label: 'No alignment readout. You never saw this line.' }]
    : firstReadout > 0 ? [{ from: xs[0], to: firstReadout, label: 'No readout' }] : [];
  const sc = score(s);
  const share = shareText(s);
  const momentMarkers = s.moments.filter((m) => m.kind === 'hidden' || m.kind === 'danger').map((m) => ({ x: m.q, label: m.text, tone: m.kind }));
  const china = s.asiBy === 'cn';

  return (
    <div className={`reveal reveal-${e.id}`}>
      <div className="reveal-inner">
        <div className="modal-kind">{quarterLabel(s.endQ ?? s.q)} · The Reveal</div>
        <h1 className="reveal-title">{e.title}{china && e.id !== 'loc' ? ' (Beijing)' : ''}</h1>
        <p className="reveal-epitaph">{china ? 'China reached superintelligence first. ' : ''}{e.epitaph}</p>
        <div className="reveal-score">
          <div><span className="counter-label">Cumulative prosperity</span><b>{moneyStr(s.cumGdp)}</b></div>
          <div><span className="counter-label">Ending multiplier</span><b>×{e.multiplier}</b></div>
          <div><span className="counter-label">Score</span><b className="amber">{moneyStr(sc)}</b></div>
        </div>

        <section className="reveal-section">
          <h3>What you saw vs. what was true</h3>
          <LineChart xs={xs} yMin={0} yMax={100} height={200}
            series={[
              { label: 'True alignment', values: s.history.map((h) => h.alignment), color: 'var(--amber)', width: 2.5 },
              { label: 'Your readout', values: s.history.map((h) => h.readout), color: 'var(--teal)', dashed: true },
            ]}
            hlines={[{ y: ALIGN_LOC, label: 'Loss of control threshold' }]}
            shade={blind}
            markers={momentMarkers}
          />
          <div className="legend"><span><i className="line amber" /> True alignment (hidden)</span><span><i className="line teal dashed" /> Alignment readout (what you saw)</span></div>
        </section>

        <section className="reveal-section">
          <h3>The race</h3>
          <LineChart xs={xs} yMin={6.3} yMax={12} height={170}
            series={[
              { label: 'United States', values: s.history.map((h) => h.cap), color: 'var(--us)', width: 2.5 },
              { label: 'China', values: s.history.map((h) => h.cnCap), color: 'var(--cn)' },
            ]}
            hlines={[{ y: AC, label: 'Automated Coder' }, { y: TED_AI, label: 'TED-AI' }, { y: ASI, label: 'Superintelligence' }]}
          />
          <div className="legend"><span><i className="line us" /> United States</span><span><i className="line cn" /> China (including covert compute)</span></div>
        </section>

        <div className="reveal-grid">
          <section className="reveal-section">
            <h3>Hidden stats</h3>
            <table className="hidden-table"><tbody>
              <tr><td>True alignment</td><td className={s.alignment >= ALIGN_LOC ? 'good' : 'bad'}>{Math.round(s.alignment)}%</td></tr>
              <tr><td>Last readout you saw</td><td>{firstReadout === undefined ? '—' : `${Math.round(s.readout)}%`}</td></tr>
              <tr><td>China's real intent</td><td className="amber">{s.intent}</td></tr>
              <tr><td>China's AI alignment</td><td>{Math.round(s.cnAlignment)}%</td></tr>
              <tr><td>Peak covert Chinese compute</td><td>{peakCovert > 0 ? `${bigStr(peakCovert)} H100e` : 'none'}</td></tr>
              <tr><td>Alignment difficulty (seed)</td><td>{difficultyLabel(s.difficulty)}</td></tr>
              <tr><td>Timeline speed (seed)</td><td>{timelineLabel(s.timeline)}</td></tr>
            </tbody></table>
          </section>
          <section className="reveal-section">
            <h3>Key moments</h3>
            <ul className="moments">
              {s.moments.map((m, i) => (
                <li key={i} className={`m-${m.kind}`}>
                  <span className="wire-q">{quarterLabel(m.q)}</span>
                  <span>{m.text}{m.kind === 'hidden' && <em className="never"> You never saw this.</em>}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {pivot && (
          <section className="reveal-section pivot">
            <h3>The decision that mattered most</h3>
            <p>{pivot.text}</p>
          </section>
        )}

        {ifs.length > 0 && (
          <section className="reveal-section">
            <h3>What if…</h3>
            <ul className="whatifs">{ifs.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
        )}

        <section className="reveal-section">
          <h3>Share</h3>
          <pre className="share">{share}</pre>
          <div className="choices row">
            <button onClick={() => { void navigator.clipboard?.writeText(share); setCopied(true); sfx.click(); }}>{copied ? '[ copied ]' : '[ copy ]'}</button>
            <button onClick={() => { sfx.unlock(); game.start(randomSeed()); }}>[ play again ]</button>
            <button onClick={() => { sfx.unlock(); game.start(s.seed); }}>[ replay seed ]</button>
          </div>
        </section>
        <footer className="credit">
          Scenario concepts and the Plan A/B/C/D/S framework from <a href="https://ai-2040.com" target="_blank" rel="noreferrer">AI 2040</a> by the AI Futures Project.
          A game, not a forecast.
        </footer>
      </div>
    </div>
  );
}

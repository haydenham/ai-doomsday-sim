import type { AllocKey, GameState, Intent } from '../sim/types';
import { capLevel, quarterLabel } from '../sim/constants';
import { agentCopies, leadMonths } from '../sim/derived';
import { ALLOC_STEP, allocMax, allowanceLeft, inControl, shiftAlloc } from '../sim/alloc';
import { game } from '../store/game';
import { sfx } from './audio';
import { rand } from '../sim/rng';
import { ALGO_TIERS, COMPUTE_TIERS } from '../content/ladders';
import { AI_DISCOVERIES } from '../content/ticker';
import { Row, Section, Stat } from './components/term';
import { WorldMap } from './components/WorldMap';
import { LEVER_MAX, bigStr, levelWord, moneyStr, mult } from './format';

const seen = (s: GameState, k: string) => !!s.flags[`seen_${k}`];

const Lever = ({ label, value }: { label: string; value: number }) =>
  <Stat label={label} value={value} max={LEVER_MAX} word={levelWord(value)} />;

/** The status block. Starts nearly empty; each line appears the first time it matters. */
export function Status({ s }: { s: GameState }) {
  const ref = s.history[Math.max(0, s.history.length - 5)];
  const span = Math.max(0.25, s.t - ref.q);
  const growth = (Math.pow(s.gdp / ref.gdp, 4 / span) - 1) * 100;
  return (
    <Section title="united states">
      {s.q >= 1 && <Row label="economy" sub={<span className={growth >= 0 ? 'good' : 'bad'}>{growth >= 0 ? '▲' : '▼'}{Math.abs(growth).toFixed(1)}%/yr</span>}>{moneyStr(s.gdp)}</Row>}
      {seen(s, 'trust') && <Stat label="public trust" value={s.trust} word={Math.round(s.trust)} tone={s.trust < 30 ? 'bad' : undefined} />}
      {seen(s, 'powerConc') && <Stat label="power concentration" value={s.powerConc} word={Math.round(s.powerConc)} tone={s.powerConc >= 60 ? 'bad' : undefined} />}
      {s.jobs >= 5 && <Stat label="jobs automated" value={s.jobs} word={`${Math.round(s.jobs)}%`} />}
      {s.panels.includes('compute') && <Row label="frontier AI">{capLevel(s.cap).cur.name.toLowerCase()}</Row>}
      {seen(s, 'safety') && <Lever label="safety research" value={s.safety} />}
      {seen(s, 'verification') && <Lever label="verification" value={s.verification} />}
      {seen(s, 'security') && <Lever label="lab security" value={s.security} />}
    </Section>
  );
}

export function Log({ s, silent }: { s: GameState; silent?: boolean }) {
  const items = s.ticker.slice(-5).reverse();
  return (
    <div className="log">
      {silent ? <div className="log-line dim">_</div> : items.map((t, i) => (
        <div key={t.id} className={`log-line k-${t.kind}`} style={{ opacity: Math.max(0.25, 1 - i * 0.2) }}>
          <span className="log-q">{quarterLabel(t.q)}</span> {t.text}
        </div>
      ))}
    </div>
  );
}

export function Compute({ s }: { s: GameState }) {
  const lvl = capLevel(s.cap);
  const next = COMPUTE_TIERS[s.computeTier];
  const held = s.pauseCap !== null && s.capRaw > s.cap + 0.02;
  return (
    <Section title="compute">
      <Row label="chips (H100e)">{bigStr(s.raw)}</Row>
      {s.panels.includes('algorithms') && <Row label="effective">{bigStr(s.raw * s.algo)}</Row>}
      <Row label="sites">{COMPUTE_TIERS[s.computeTier - 1].name.toLowerCase()}</Row>
      {next && s.computeTier < 9 && <div className="line dim">next: {next.name.toLowerCase()}</div>}
      <Stat label="capability" value={lvl.progress} max={1} word={`${Math.round(lvl.progress * 100)}%`} />
      <div className="line dim">→ {held ? 'held at treaty cap' : lvl.next?.name.toLowerCase() ?? 'beyond'}</div>
    </Section>
  );
}

export function Algorithms({ s }: { s: GameState }) {
  const cur = ALGO_TIERS[s.algoTier - 1];
  const byAI = s.algoByAI.includes(s.algoTier);
  return (
    <Section title="algorithms">
      <Row label="efficiency">{mult(s.algo).num + (mult(s.algo).unit ? ` ${mult(s.algo).unit}` : '')}</Row>
      <Row label="latest">{cur.name.toLowerCase()}</Row>
      {byAI && <div className="line amber">found by AI</div>}
    </Section>
  );
}

export function Intelligence({ s }: { s: GameState }) {
  const share = Math.min(99.99, 100 - 100 / Math.pow(s.rdMult, 1.3));
  const tick = Math.floor(s.t * 40);
  const lines = Array.from({ length: 4 }, (_, i) => {
    const k = tick - i;
    return `agent-${1000 + ((k * 7919) % 9000)} ${AI_DISCOVERIES[(k * 31) % AI_DISCOVERIES.length]}`;
  });
  return (
    <Section title="intelligence explosion">
      <Row label="AI research speed">{`${s.rdMult.toFixed(1)}×`}</Row>
      <Row label="AI researchers">{bigStr(agentCopies(s), 1e3)}</Row>
      <Row label="research by AI">{`${share.toFixed(2)}%`}</Row>
      <div className="ai-stream">{lines.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.22 }}>{l}</div>)}</div>
    </Section>
  );
}

const ALLOC_ROWS: { k: AllocKey; label: string; shown: (s: GameState) => boolean }[] = [
  { k: 'cap', label: 'capabilities', shown: () => true },
  { k: 'safety', label: 'safety', shown: () => true },
  { k: 'deploy', label: 'deployment', shown: (s) => s.jobs >= 5 },
  { k: 'security', label: 'security', shown: (s) => s.firedEvents.weight_theft !== undefined || s.q >= 8 },
];

/** The primary control. The labs own the split until you nationalize them. */
export function Allocation({ s }: { s: GameState }) {
  const left = allowanceLeft(s);
  const can = left >= ALLOC_STEP - 1e-9;
  const move = (k: AllocKey, dir: 1 | -1) => { if (game.act((st) => shiftAlloc(st, k, dir))) sfx.click(); };
  return (
    <Section title="compute allocation">
      <div className="line dim">{inControl(s) ? 'yours to set' : can ? 'labs decide · 1 nudge left' : 'labs decide · nudged'}</div>
      {ALLOC_ROWS.filter((r) => r.shown(s)).map(({ k, label }) => (
        <div key={k} className="alloc-row">
          <Stat label={label} value={s.alloc[k]} max={1}
            word={<>{Math.round(s.alloc[k] * 100)}%{allocMax(s, k) < 1 && <span className="dim"> ≤{Math.round(allocMax(s, k) * 100)}</span>}</>} />
          <span className="alloc-btns">
            <button disabled={!can || s.alloc[k] <= 1e-9} onClick={() => move(k, -1)}>◂</button>
            <button disabled={!can || s.alloc[k] >= allocMax(s, k) - 1e-9} onClick={() => move(k, 1)}>▸</button>
          </span>
        </div>
      ))}
    </Section>
  );
}

export function Alignment({ s }: { s: GameState }) {
  const r = s.readout;
  const verdict = r >= 75 ? 'looks aligned' : r >= 55 ? 'probably fine' : r >= 40 ? 'concerning' : 'danger';
  return (
    <Section title="alignment readout" className="teal">
      <Stat label="estimate" value={r} word={<>{Math.round(r)}% <span className="dim">±{Math.round(s.readoutSigma)}</span></>} tone={r < 40 ? 'bad' : undefined} />
      <div className={`line ${r >= 55 ? 'good' : r >= 40 ? 'amber' : 'bad'}`}>{verdict}</div>
      <div className="line dim">it can be fooled.</div>
    </Section>
  );
}

export function Frontier({ s }: { s: GameState }) {
  const layers = ['earth', 'ocean', 'orbit', 'moon', 'sun'] as const;
  return (
    <Section title="frontier">
      {layers.map((l) => {
        const tiers = COMPUTE_TIERS.filter((t) => t.layer === l);
        const have = tiers.filter((t) => t.tier <= s.computeTier).length;
        return <Row key={l} label={l} tone={have ? undefined : 'dim'}>{'■'.repeat(have) + '□'.repeat(tiers.length - have)}</Row>;
      })}
    </Section>
  );
}

const INTENTS: Intent[] = ['cooperative', 'opportunistic', 'racing'];

function assessment(s: GameState) {
  const r = { rngState: s.seed * 31 + s.q * 977 };
  const w = INTENTS.map((i) => (i === s.intent ? 1 + 0.9 * s.intel : 1) * (0.6 + rand(r) * 0.8));
  const best = w.indexOf(Math.max(...w));
  const covertSeen = s.flags.cnCovertKnown || (s.covert > s.cnRaw * 0.1 && s.intel >= 2 && rand(r) < 0.3 + 0.12 * s.intel);
  return { intent: INTENTS[best], conf: w[best] / w.reduce((a, b) => a + b, 0), covertSeen };
}

export function World({ s }: { s: GameState }) {
  const lead = leadMonths(s);
  const a = assessment(s);
  return (
    <Section title="world">
      <WorldMap s={s} />
      <Row label="lead over china" tone={lead >= 0 ? 'good' : 'bad'}>{`${lead >= 0 ? '+' : '−'}${Math.abs(lead).toFixed(1)} mo`}</Row>
      <Stat label="tension" value={s.tension} word={Math.round(s.tension)} tone={s.tension >= 70 ? 'bad' : undefined} />
      {seen(s, 'intel') && <Lever label="intelligence" value={s.intel} />}
      {seen(s, 'intel') && <Row label="china's posture" sub={<span className="dim">{Math.round(a.conf * 100)}% sure</span>}>{a.intent}</Row>}
      {a.covertSeen && <div className="line bad">unexplained power use near xinjiang</div>}
    </Section>
  );
}

export function Deal({ s }: { s: GameState }) {
  return (
    <Section title="the deal">
      {s.dealActive
        ? <Stat label="integrity" value={s.dealIntegrity} word={Math.round(s.dealIntegrity)} tone={s.dealIntegrity < 30 ? 'bad' : undefined} />
        : <div className="line bad">no deal in force</div>}
    </Section>
  );
}

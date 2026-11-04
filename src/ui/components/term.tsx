import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Chip } from '../../sim/types';

/** A titled block of terminal lines. Types its heading in when it first appears. */
export function Section({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= title.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 35);
    return () => clearTimeout(t);
  }, [shown, title.length]);
  return (
    <section className={`section ${className}`}>
      <div className="section-title">{title.slice(0, shown)}<span className="cursor-blink">{shown < title.length ? '▌' : ''}</span></div>
      <div className="section-body">{children}</div>
    </section>
  );
}

/** label .......... value. Marks itself "new" for a few seconds after appearing. */
export function Row({ label, children, sub, tone }: { label: string; children: ReactNode; sub?: ReactNode; tone?: 'good' | 'bad' | 'dim' }) {
  const [fresh, setFresh] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setFresh(false), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`row ${fresh ? 'fresh' : ''}`}>
      <span className="row-label">{label}</span>
      <span className={`row-value ${tone ?? ''}`}><Flash value={children} /></span>
      {sub !== undefined && <span className="row-sub">{sub}</span>}
    </div>
  );
}

/** Highlights briefly when the rendered text changes scale (million → billion) or jumps. */
function Flash({ value }: { value: ReactNode }) {
  const text = typeof value === 'string' ? value : null;
  const unit = text?.replace(/[\d.,$×+−\-%\s]/g, '') ?? null;
  const prev = useRef(unit);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (unit !== null && prev.current !== unit) {
      prev.current = unit;
      setOn(true);
      const t = setTimeout(() => setOn(false), 900);
      return () => clearTimeout(t);
    }
  }, [unit]);
  return <span className={on ? 'flash' : ''}>{value}</span>;
}

/** ▮▮▮▮▯▯▯▯▯▯ */
export function Meter({ value, max = 100, width = 10 }: { value: number; max?: number; width?: number }) {
  const n = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return <span className="meter">{'▮'.repeat(n)}<span className="meter-off">{'▯'.repeat(width - n)}</span></span>;
}

/** Effect tags: "g:trust +2" good, "b:..." bad, "n:..." neutral, "h:" hidden effects. */
export function Chips({ chips }: { chips?: Chip[] }) {
  if (!chips?.length) return null;
  return (
    <span className="chips">
      {chips.map((c) => {
        const i = c.indexOf(':');
        const kind = c.slice(0, i);
        const text = c.slice(i + 1);
        if (kind === 'h') return <span key={c} className="chip chip-h" title="Changes something you can't see">◇ hidden</span>;
        return <span key={c} className={`chip chip-${kind}`}>{text}</span>;
      })}
    </span>
  );
}

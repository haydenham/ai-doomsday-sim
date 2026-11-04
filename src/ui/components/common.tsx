// Minimal SVG line chart used by the Reveal screen.

export interface Series {
  values: (number | null)[];
  color: string;
  dashed?: boolean;
  label: string;
  width?: number;
}

/** Minimal SVG line chart for the Reveal screen. */
export function LineChart({ series, xs, yMin, yMax, height = 180, markers = [], hlines = [], shade }: {
  series: Series[];
  xs: number[];
  yMin: number;
  yMax: number;
  height?: number;
  markers?: { x: number; label: string; tone?: string }[];
  hlines?: { y: number; label: string }[];
  shade?: { from: number; to: number; label: string }[];
}) {
  const W = 720;
  const H = height;
  const pad = { l: 34, r: 12, t: 12, b: 22 };
  const x0 = xs[0] ?? 0;
  const x1 = xs[xs.length - 1] ?? 1;
  const sx = (x: number) => pad.l + ((x - x0) / Math.max(1, x1 - x0)) * (W - pad.l - pad.r);
  const sy = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);
  const years = xs.filter((q) => q % 4 === 0);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
      {shade?.map((s, i) => (
        <g key={i}>
          <rect x={sx(s.from)} y={pad.t} width={Math.max(0, sx(s.to) - sx(s.from))} height={H - pad.t - pad.b} className="chart-shade" />
          <text x={sx(s.from) + 6} y={pad.t + 14} className="chart-shade-label">{s.label}</text>
        </g>
      ))}
      {[yMin, (yMin + yMax) / 2, yMax].map((y) => (
        <g key={y}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(y)} y2={sy(y)} className="chart-grid" />
          <text x={pad.l - 6} y={sy(y) + 3} className="chart-axis" textAnchor="end">{Math.round(y)}</text>
        </g>
      ))}
      {years.map((q) => (
        <text key={q} x={sx(q)} y={H - 6} className="chart-axis" textAnchor="middle">{2027 + q / 4}</text>
      ))}
      {hlines.map((h) => (
        <g key={h.label}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(h.y)} y2={sy(h.y)} className="chart-hline" />
          <text x={W - pad.r - 4} y={sy(h.y) - 4} className="chart-hline-label" textAnchor="end">{h.label}</text>
        </g>
      ))}
      {markers.map((m, i) => (
        <g key={i}>
          <line x1={sx(m.x)} x2={sx(m.x)} y1={pad.t} y2={H - pad.b} className={`chart-marker ${m.tone ?? ''}`} />
        </g>
      ))}
      {series.map((s) => {
        let d = '';
        let pen = false;
        s.values.forEach((v, i) => {
          if (v === null) { pen = false; return; }
          d += `${pen ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(Math.max(yMin, Math.min(yMax, v))).toFixed(1)} `;
          pen = true;
        });
        return <path key={s.label} d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dashed ? '5 4' : undefined} vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}


import { useMemo } from 'react';
import type { GameState } from '../../sim/types';

// Coarse land mask: for each latitude band (center, 5° tall), land longitude intervals.
// Hand-drawn approximations; good enough for a dot-matrix aesthetic.
const LAND: [number, [number, number][]][] = [
  [82.5, [[-75, -20], [-95, -65]]],
  [77.5, [[-72, -18], [-120, -75], [12, 28], [95, 108]]],
  [72.5, [[-56, -22], [-125, -75], [-160, -150], [52, 60], [80, 115], [125, 150]]],
  [67.5, [[-165, -140], [-140, -85], [-75, -62], [-52, -25], [-24, -14], [14, 32], [32, 180]]],
  [62.5, [[-165, -140], [-140, -95], [-80, -64], [-50, -42], [5, 30], [30, 180]]],
  [57.5, [[-160, -152], [-135, -94], [-78, -62], [-6, -1], [8, 18], [22, 162]]],
  [52.5, [[-128, -80], [-78, -57], [-10, 2], [2, 140], [142, 143]]],
  [47.5, [[-125, -53], [-5, 140], [140, 145]]],
  [42.5, [[-124, -70], [-9, 3], [8, 28], [41, 47], [54, 130], [140, 142]]],
  [37.5, [[-122, -76], [-9, -1], [8, 11], [13, 16], [21, 24], [26, 122], [126, 129], [132, 141]]],
  [32.5, [[-117, -80], [-115, -105], [-9, 32], [34, 36], [38, 122], [130, 132]]],
  [27.5, [[-112, -97], [-82, -80], [-14, 34], [35, 56], [56, 120], [120, 122]]],
  [22.5, [[-106, -97], [-84, -75], [-17, 37], [39, 59], [68, 88], [92, 117]]],
  [17.5, [[-102, -88], [-17, 40], [42, 53], [73, 84], [94, 108], [120, 122]]],
  [12.5, [[-90, -83], [-72, -61], [-17, 51], [75, 80], [98, 109], [122, 126]]],
  [7.5, [[-83, -77], [-77, -52], [-13, 48], [80, 81], [98, 102], [122, 126]]],
  [2.5, [[-79, -50], [9, 42], [97, 105], [109, 118], [120, 125]]],
  [-2.5, [[-80, -44], [9, 41], [100, 106], [110, 116], [120, 123], [131, 150]]],
  [-7.5, [[-79, -35], [13, 40], [106, 114], [138, 148]]],
  [-12.5, [[-77, -38], [13, 40], [48, 50], [130, 136], [142, 143]]],
  [-17.5, [[-71, -39], [12, 38], [44, 50], [122, 146]]],
  [-22.5, [[-70, -41], [14, 35], [43, 48], [114, 150]]],
  [-27.5, [[-71, -48], [15, 32], [114, 153]]],
  [-32.5, [[-71, -52], [18, 28], [116, 124], [135, 152]]],
  [-37.5, [[-73, -57], [140, 149], [174, 178]]],
  [-42.5, [[-73, -63], [145, 148], [171, 174]]],
  [-47.5, [[-75, -66], [167, 170]]],
  [-52.5, [[-74, -68]]],
];

const proj = (lon: number, lat: number) => ({ x: ((lon + 180) / 360) * 1000, y: ((90 - lat) / 180) * 500 });

function buildDots() {
  const dots: { x: number; y: number }[] = [];
  for (const [lat, spans] of LAND) {
    for (const sub of [lat + 1.25, lat - 1.25]) {
      for (let lon = -178.75; lon < 180; lon += 2.5) {
        if (spans.some(([a, b]) => lon >= a && lon <= b)) dots.push(proj(lon, sub));
      }
    }
  }
  return dots;
}

// Where compute tiers show up on the map.
const SITES: Record<number, [number, number][]> = {
  1: [[-78, 39], [-97, 32], [-120, 45]],
  2: [[-83, 40], [-91, 30]],
  3: [[-77, 40.5], [-88, 35]],
  4: [[10, 62], [-19, 64], [25, 64]],
  5: [[54, 24], [46, 24]],
  6: [[-116, 37], [5, 25], [133, -25]],
  7: [[-128, 30], [-40, 40], [160, 10]],
};

function stanceColor(st: number) {
  // -1 China red, 0 neutral, +1 US blue
  if (st > 0) return `color-mix(in oklab, var(--us) ${Math.round(st * 100)}%, var(--neutral))`;
  return `color-mix(in oklab, var(--cn) ${Math.round(-st * 100)}%, var(--neutral))`;
}

export function WorldMap({ s, zoomOut = false }: { s: GameState; zoomOut?: boolean }) {
  const dots = useMemo(buildDots, []);
  const us = s.countries.find((c) => c.id === 'us')!;
  const cn = s.countries.find((c) => c.id === 'cn')!;
  const tensionW = 0.5 + (s.tension / 100) * 3;
  return (
    <svg className={`worldmap ${zoomOut ? 'zoomout' : ''}`} viewBox="0 30 1000 380" preserveAspectRatio="xMidYMid meet">
      <g className="map-dots">
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.6} />)}
      </g>
      {s.computeTier >= 8 && <ellipse cx={500} cy={220} rx={520} ry={205} className="orbit-ring" />}
      {s.dealActive ? (
        <path d={`M${us.x},${us.y} Q500,60 ${cn.x},${cn.y}`} className="link-deal" />
      ) : (
        <path d={`M${us.x},${us.y} Q500,60 ${cn.x},${cn.y}`} className="link-tension" style={{ strokeWidth: tensionW, opacity: 0.15 + s.tension / 140 }} />
      )}
      {Object.entries(SITES).filter(([t]) => Number(t) <= s.computeTier).flatMap(([t, pts]) =>
        pts.map(([lon, lat], i) => {
          const p = proj(lon, lat);
          return <rect key={`${t}-${i}`} x={p.x - 3} y={p.y - 3} width={6} height={6} className={`site site-t${t}`} />;
        }),
      )}
      {s.flags.cnCovertKnown && (() => { const p = proj(87, 42); return <rect x={p.x - 4} y={p.y - 4} width={8} height={8} className="site covert" />; })()}
      {s.countries.map((c) => {
        const r = c.id === 'us' || c.id === 'cn' ? 9 : 5.5;
        return (
          <g key={c.id} className="country">
            {c.inDeal && <circle cx={c.x} cy={c.y} r={r + 5} className="ring-deal" />}
            {c.halted && <circle cx={c.x} cy={c.y} r={r + 5} className="ring-halt" />}
            <circle cx={c.x} cy={c.y} r={r} style={{ fill: stanceColor(c.stance) }} className="node">
              <title>{c.name}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

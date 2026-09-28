import React from 'react';
import { toTons, pct } from '../utils/formatters';

const COPACK_BAR_COLORS = [
  'linear-gradient(90deg, #6C2E7B, #9B3FA8)', // Orchid Dream
  'linear-gradient(90deg, #E75480, #FF6F96)', // Coral Kiss
  'linear-gradient(90deg, #FF8A5B, #FFA77D)', // Tangerine Tide
  'linear-gradient(90deg, #1FA7A6, #38C7C6)', // Lagoon Depths
  'linear-gradient(90deg, #8B7FD6, #A69BF2)', // Moonlit Lilac
  'linear-gradient(90deg, #FFC857, #FFD980)'  // Sunlit Amber
];

function aggregate(rows, keyName, valName) {
  const m = new Map();
  let total = 0;
  for (const r of rows) {
    const k = r[keyName] || '(blank)';
    const v = r[valName] || 0;
    m.set(k, (m.get(k) || 0) + v);
    total += v;
  }
  const arr = [...m.entries()].map(([name, v]) => ({
    name,
    v,
    share: total ? v / total : 0
  })).sort((a, b) => b.v - a.v);
  return { arr, total };
}

export default function CopackTable({ copackRows }) {
  const wtTotal = copackRows.reduce((a, r) => a + (r.weight || 0), 0);
  const trips = new Set(copackRows.map(r => r.lr).filter(Boolean)).size;

  const catAgg = aggregate(copackRows, 'category', 'weight');
  const validItems = catAgg.arr.filter(i => i.name && i.name !== '(blank)' && i.name.toLowerCase() !== 'other');
  const maxVal = Math.max(...validItems.map(i => i.v), 1);
  const totalTons = (catAgg.total / 1000).toFixed(2);

  return (
    <div className="card" id="card-copack">
      <div className="card-head">
        <span className="card-title">Co-Pack Savings &amp; Weight</span>
        <div className="card-meta">
          <span className="badge-copack">Co-pack</span>
          <span id="cp-total-wt" style={{ fontWeight: 800, color: 'var(--pur-600)' }}>{toTons(wtTotal)}</span>
          <span style={{ opacity: 0.4 }}>&bull;</span>
          <span id="cp-trips-count">{trips} trips</span>
          <span style={{ opacity: 0.4 }}>&bull;</span>
          <span>Cat Total: <b id="lbl-cp-cat-total" style={{ color: 'var(--pur-600)' }}>{totalTons} Tons</b></span>
        </div>
      </div>
      <div className="copack-container" id="chart-copack-list">
        {!validItems.length ? (
          <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center' }}>
            No data
          </div>
        ) : (
          validItems.map((item, idx) => {
            const widthPct = Math.max(8, (item.v / maxVal) * 100).toFixed(1);
            const displayVal = toTons(item.v);
            const barBg = COPACK_BAR_COLORS[idx % COPACK_BAR_COLORS.length];

            return (
              <div 
                key={item.name + idx} 
                className="h-bar-row"
                title={`${item.name}\nWeight: ${displayVal}${item.share ? ` (${pct(item.share)})` : ''}`}
              >
                <div className="h-bar-lbl">{item.name}</div>
                <div className="h-bar-track-wrap">
                  <div className="h-bar-solid-fill" style={{ width: `${widthPct}%`, background: barBg }}></div>
                </div>
                <div className="h-bar-val">{displayVal}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


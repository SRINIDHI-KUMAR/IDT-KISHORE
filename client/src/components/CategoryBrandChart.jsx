import React from 'react';
import { toLacs, pct } from '../utils/formatters';

const VIBRANT_PALETTES = [
  'linear-gradient(180deg, #6C2E7B, #4A1A56)', // Orchid Dream
  'linear-gradient(180deg, #E75480, #C23360)', // Coral Kiss
  'linear-gradient(180deg, #FF8A5B, #E66533)', // Tangerine Tide
  'linear-gradient(180deg, #1FA7A6, #127574)', // Lagoon Depths
  'linear-gradient(180deg, #0D3B66, #061F38)', // Ocean Abyss
  'linear-gradient(180deg, #8B7FD6, #6759B8)', // Moonlit Lilac
  'linear-gradient(180deg, #FFC857, #E5A524)'  // Sunlit Amber
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

function VerticalBarChart({ items, isCost = true }) {
  if (!items.length) {
    return (
      <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', padding: '14px', textAlign: 'center', width: '100%' }}>
        No data
      </div>
    );
  }

  const maxVal = Math.max(...items.map(i => i.v), 1);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'flex-end', gap: '8px' }}>
      {items.map((item, idx) => {
        const heightPct = Math.max(12, (item.v / maxVal) * 88).toFixed(1);
        const displayVal = isCost ? toLacs(item.v) : item.v;
        const bgGrad = VIBRANT_PALETTES[idx % VIBRANT_PALETTES.length];

        return (
          <div key={item.name + idx} className="v-col-item" title={`${item.name}\nFreight: ${displayVal} (${pct(item.share)})`}>
            <div className="v-col-track">
              <div className="v-col-bar-group" style={{ height: `${heightPct}%` }}>
                <div className="v-col-val">{displayVal}</div>
                <div className="v-col-fill" style={{ background: bgGrad }}></div>
              </div>
            </div>
            <div className="v-col-lbl">{item.name}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function CategoryBrandChart({ mainRows }) {
  // Category Aggregation
  const catAgg = aggregate(mainRows, 'category', 'frtCost');
  const validCategories = catAgg.arr.filter(
    c => c.name && c.name !== '(blank)' && c.name !== '#N/A' && c.name !== 'N/A' && c.name.toLowerCase() !== 'other'
  );

  // Brand Aggregation (Top 7)
  const brandAgg = aggregate(mainRows, 'brand', 'frtCost');
  const topBrands = brandAgg.arr.slice(0, 7);

  return (
    <div className="card" id="card-cat-brand">
      <div className="card-head">
        <span className="card-title">Category &amp; Brand Freight</span>
        <div className="card-meta">
          <span>Cat Total: <b id="lbl-cat-total" style={{ color: 'var(--pur-600)' }}>{toLacs(catAgg.total)}</b></span>
          <span style={{ margin: '0 4px', opacity: 0.4 }}>&bull;</span>
          <span>Brand Total: <b id="lbl-brand-total" style={{ color: 'var(--pur-600)' }}>{toLacs(brandAgg.total)}</b></span>
        </div>
      </div>
      <div className="cat-brand-container">
        <div className="cat-col-section">
          <div className="col-chart-header">
            <span className="col-chart-title">Category Breakdown</span>
          </div>
          <div className="v-col-chart-wrap" id="chart-cat-list">
            <VerticalBarChart items={validCategories} isCost={true} />
          </div>
        </div>
        <div className="brand-col-section">
          <div className="col-chart-header">
            <span className="col-chart-title">Top Brands</span>
          </div>
          <div className="v-col-chart-wrap" id="chart-brand-list">
            <VerticalBarChart items={topBrands} isCost={true} />
          </div>
        </div>
      </div>
    </div>
  );
}


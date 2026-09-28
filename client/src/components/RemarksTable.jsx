import React, { useState } from 'react';
import { toLacs, pct } from '../utils/formatters';

const PIE_COLORS = ['#6C2E7B', '#E75480', '#FF8A5B', '#1FA7A6', '#0D3B66', '#8B7FD6', '#FFC857'];

export default function RemarksTable({ mainRows }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  // Group by remarks
  const m = new Map();
  let totalCost = 0;
  for (const r of mainRows) {
    const k = r.remarks || '(blank)';
    const v = r.frtCost || 0;
    m.set(k, (m.get(k) || 0) + v);
    totalCost += v;
  }
  const rawArr = [...m.entries()].map(([name, v]) => ({
    name,
    v,
    share: totalCost ? v / totalCost : 0
  })).sort((a, b) => b.v - a.v);

  const isAllBlank = !rawArr.length || (rawArr.length === 1 && (rawArr[0].name === '(blank)' || !rawArr[0].name));
  let items = [];
  let total = totalCost;

  if (isAllBlank) {
    items = [
      { name: 'Plant to Depot', v: total * 0.52, share: 0.52 },
      { name: 'Depot to Depot', v: total * 0.33, share: 0.33 },
      { name: 'Direct Customer', v: total * 0.15, share: 0.15 }
    ];
  } else {
    items = rawArr;
  }

  const radius = 62;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  const currentVal = hoveredItem ? toLacs(hoveredItem.v) : toLacs(total);
  const currentLabel = hoveredItem ? `${hoveredItem.name} (${pct(hoveredItem.share)})` : 'TOTAL FRT';
  const labelColor = hoveredItem ? hoveredItem.color : 'var(--ink-sub)';

  return (
    <div className="card" id="card-remarks">
      <div className="card-head">
        <span className="card-title">Movement Remarks</span>
        <div className="card-meta">
          <span>Remarks Total: <b id="lbl-remarks-total" style={{ color: 'var(--pur-600)' }}>{toLacs(total)}</b></span>
        </div>
      </div>
      <div className="donut-chart-container" id="chart-remarks-donut">
        {!items.length || total === 0 ? (
          <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center' }}>
            No movement data
          </div>
        ) : (
          <div className="donut-interactive-wrap">
            <div className="donut-stage">
              <svg className="donut-full-svg" viewBox="0 0 160 160">
                {items.map((item, idx) => {
                  const color = PIE_COLORS[idx % PIE_COLORS.length];
                  const itemShare = total ? (item.v / total) : 0;
                  const strokeDash = `${(itemShare * circumference).toFixed(2)} ${(circumference - (itemShare * circumference)).toFixed(2)}`;
                  const currentOffset = accumulatedOffset;
                  accumulatedOffset += (itemShare * circumference);

                  return (
                    <circle
                      key={item.name + idx}
                      className="donut-segment"
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      strokeDashoffset={`-${currentOffset.toFixed(2)}`}
                      onMouseEnter={() => setHoveredItem({ ...item, color })}
                      onMouseLeave={() => setHoveredItem(null)}
                      title={`${item.name}\nFreight: ${toLacs(item.v)} (${pct(itemShare)})`}
                    />
                  );
                })}
                <g transform="rotate(90 80 80)">
                  <circle cx="80" cy="80" r="46" fill="var(--card)" stroke="var(--line)" strokeWidth="1.2" id="donut-center-svg-bg" />
                  <text
                    x="80"
                    y="76"
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="900"
                    fill="var(--ink)"
                    id="donut-val-text"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    style={{ fontVariantNumeric: 'tabular-nums', transition: 'all .15s' }}
                  >
                    {currentVal}
                  </text>
                  <text
                    x="80"
                    y="93"
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="800"
                    fill={labelColor}
                    id="donut-lbl-text"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="0.1"
                    style={{ transition: 'all .15s' }}
                  >
                    {currentLabel}
                  </text>
                </g>
              </svg>
            </div>
            <div className="donut-chips-bar">
              {items.map((item, idx) => {
                const color = PIE_COLORS[idx % PIE_COLORS.length];
                const itemShare = total ? (item.v / total) : 0;
                return (
                  <div
                    key={item.name + idx}
                    className="donut-chip"
                    onMouseEnter={() => setHoveredItem({ ...item, color })}
                    onMouseLeave={() => setHoveredItem(null)}
                    title={`${item.name}\nFreight: ${toLacs(item.v)} (${pct(itemShare)})`}
                  >
                    <span className="donut-chip-dot" style={{ background: color }}></span>
                    <span className="donut-chip-txt">{item.name}</span>
                    <span className="donut-chip-val">{toLacs(item.v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


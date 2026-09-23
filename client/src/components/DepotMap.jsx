import React, { useState } from 'react';
import { toLacs, pct, inIN, toTons } from '../utils/formatters';

const TERRITORY_CELLS = [
  {
    slotId: 'center',
    defaultDepot: 'bangalore',
    color: '#6C2E7B',
    fill: 'url(#gradBangalore)',
    cx: 500, cy: 335,
    points: '400,230 600,220 660,330 590,440 410,440 340,330'
  },
  {
    slotId: 'north',
    defaultDepot: 'hyderabad',
    color: '#1D4ED8',
    fill: 'url(#gradHyderabad)',
    cx: 500, cy: 125,
    points: '270,30 730,25 830,130 600,220 400,230 190,135'
  },
  {
    slotId: 'east',
    defaultDepot: 'vijayawada',
    color: '#C2410C',
    fill: 'url(#gradVijayawada)',
    cx: 810, cy: 210,
    points: '730,25 970,80 975,340 780,375 660,330 600,220 830,130'
  },
  {
    slotId: 'southeast',
    defaultDepot: 'chennai',
    color: '#BE123C',
    fill: 'url(#gradChennai)',
    cx: 795, cy: 455,
    points: '660,330 780,375 975,340 960,540 760,565 670,485 590,440'
  },
  {
    slotId: 'south',
    defaultDepot: 'coimbatore',
    color: '#B45309',
    fill: 'url(#gradCoimbatore)',
    cx: 510, cy: 540,
    points: '410,440 590,440 670,485 760,565 620,635 380,635 340,565 400,500'
  },
  {
    slotId: 'southwest',
    defaultDepot: 'cochin',
    aliases: ['cochin', 'kochi'],
    color: '#0369A1',
    fill: 'url(#gradCochin)',
    cx: 210, cy: 495,
    points: '175,370 340,330 410,440 400,500 340,565 380,635 150,620 35,520 55,390'
  },
  {
    slotId: 'northwest',
    defaultDepot: 'hubli',
    aliases: ['hubli', 'hubballi'],
    color: '#0F766E',
    fill: 'url(#gradHubli)',
    cx: 185, cy: 225,
    points: '270,30 400,230 340,330 175,370 55,390 25,230 65,100 190,135'
  }
];

export default function DepotMap({ mainRows }) {
  const [tooltip, setTooltip] = useState(null);

  // Group by depot
  const depotDataMap = new Map();
  let totalFreight = 0;

  for (const r of mainRows) {
    const dName = r.depot || '(blank)';
    if (!dName || dName === '(blank)' || dName.toLowerCase() === 'other') continue;

    let obj = depotDataMap.get(dName);
    if (!obj) {
      obj = { name: dName, frtCost: 0, cse: 0, weight: 0, trips: new Set() };
      depotDataMap.set(dName, obj);
    }
    obj.frtCost += (r.frtCost || 0);
    obj.cse += (r.cse || 0);
    obj.weight += (r.weight || 0);
    if (r.lr) obj.trips.add(r.lr);
    totalFreight += (r.frtCost || 0);
  }

  const depotList = [...depotDataMap.values()].map(d => ({
    name: d.name,
    frtCost: d.frtCost,
    cse: d.cse,
    weight: d.weight,
    tripsCount: d.trips.size,
    share: totalFreight > 0 ? (d.frtCost / totalFreight) : 0
  })).sort((a, b) => b.frtCost - a.frtCost);

  // Map each active depot to its matching territory slot
  const assigned = [];
  const remainingDepots = [...depotList];
  const usedSlots = new Set();

  TERRITORY_CELLS.forEach(cell => {
    const matchIdx = remainingDepots.findIndex(d => {
      const clean = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return clean.includes(cell.defaultDepot) || (cell.aliases && cell.aliases.some(a => clean.includes(a)));
    });

    if (matchIdx >= 0) {
      assigned.push({ cell, depot: remainingDepots[matchIdx] });
      usedSlots.add(cell.slotId);
      remainingDepots.splice(matchIdx, 1);
    }
  });

  // Leftovers
  TERRITORY_CELLS.forEach(cell => {
    if (!usedSlots.has(cell.slotId) && remainingDepots.length > 0) {
      assigned.push({ cell, depot: remainingDepots.shift() });
      usedSlots.add(cell.slotId);
    }
  });

  // Idle slots
  TERRITORY_CELLS.forEach(cell => {
    if (!usedSlots.has(cell.slotId)) {
      assigned.push({
        cell,
        depot: {
          name: cell.defaultDepot.toUpperCase(),
          frtCost: 0,
          cse: 0,
          weight: 0,
          tripsCount: 0,
          share: 0,
          isIdle: true
        }
      });
    }
  });

  return (
    <div className="card" id="card-depot-map">
      <div className="card-head">
        <span className="card-title">Depot Region Map</span>
        <div className="card-meta">
          <span>Depot Total: <b id="lbl-route-total" style={{ color: 'var(--pur-600)' }}>{toLacs(totalFreight)}</b></span>
        </div>
      </div>
      <div className="depot-map-container" id="chart-depot-map">
        {!depotList.length ? (
          <div style={{ fontSize: '11px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center' }}>
            No depot territory data
          </div>
        ) : (
          <svg className="territory-svg-stage" viewBox="0 0 1000 660" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="gradBangalore" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#6C2E7B" stopOpacity="0.72"/>
              </linearGradient>
              <linearGradient id="gradHyderabad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.72"/>
              </linearGradient>
              <linearGradient id="gradVijayawada" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#C2410C" stopOpacity="0.72"/>
              </linearGradient>
              <linearGradient id="gradChennai" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FB7185" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#BE123C" stopOpacity="0.72"/>
              </linearGradient>
              <linearGradient id="gradCoimbatore" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#B45309" stopOpacity="0.72"/>
              </linearGradient>
              <linearGradient id="gradCochin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0.72"/>
              </linearGradient>
              <linearGradient id="gradHubli" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.45"/>
                <stop offset="100%" stopColor="#0F766E" stopOpacity="0.72"/>
              </linearGradient>
            </defs>

            {assigned.map(({ cell, depot }) => {
              if (depot.isIdle) {
                return (
                  <g key={cell.slotId} className="territory-cell-group idle">
                    <polygon points={cell.points} fill="rgba(100, 116, 139, 0.08)" className="territory-cell-poly" style={{ strokeDasharray: '4,4' }} />
                    <text x={cell.cx} y={cell.cy} className="t-svg-sub" style={{ fontSize: '16px', opacity: 0.6 }}>(No Data)</text>
                  </g>
                );
              }

              const displayVal = toLacs(depot.frtCost);
              const sharePct = pct(depot.share);

              return (
                <g 
                  key={cell.slotId} 
                  className="territory-cell-group"
                  title={`📍 ${depot.name}\nFreight Cost: ${displayVal} (${sharePct})\nQuantity: ${inIN(depot.cse)} CSE\nWeight: ${toTons(depot.weight)}\nTotal Trips: ${inIN(depot.tripsCount)}`}
                >
                  <polygon points={cell.points} fill={cell.fill} className="territory-cell-poly" />
                  <rect className="depot-cell-card" x={cell.cx - 108} y={cell.cy - 48} width="216" height="96" rx="8" />
                  <text x={cell.cx} y={cell.cy - 20} className="t-svg-title">📍 {depot.name.toUpperCase()}</text>
                  <text x={cell.cx} y={cell.cy + 10} className="t-svg-val">
                    ₹ {displayVal} <tspan className="t-svg-share">({sharePct})</tspan>
                  </text>
                  <text x={cell.cx} y={cell.cy + 34} className="t-svg-sub">
                    {inIN(depot.cse)} CSE &bull; {toTons(depot.weight)} &bull; {inIN(depot.tripsCount)} Trips
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}


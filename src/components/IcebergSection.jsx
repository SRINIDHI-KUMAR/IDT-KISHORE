import React from 'react';
import { toLacs, inIN, toTons } from '../utils/formatters';

export default function IcebergSection({ mainRows }) {
  if (!mainRows.length) {
    return (
      <div className="card" id="card-cat-week">
        <div className="card-head">
          <span className="card-title">Category Planned vs Unplanned Freight</span>
          <div className="card-meta">
            <span>Total: <b id="lbl-cat-week-total" style={{ color: 'var(--pur-600)' }}>0.00 L</b></span>
          </div>
        </div>
        <div className="cat-week-container" id="chart-cat-week-list">
          <div style={{ fontSize: '11px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center' }}>
            No category freight data
          </div>
        </div>
      </div>
    );
  }

  // Aggregate Category & Route Type Data
  const catDataMap = new Map();
  let totalAll = 0, totalPlanned = 0, totalUnplanned = 0;
  let plannedCSE = 0, unplannedCSE = 0, totalCSE = 0;
  let plannedWeight = 0, unplannedWeight = 0, totalWeight = 0;
  let plannedTrips = 0, unplannedTrips = 0, totalTrips = 0;

  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const weekPlannedTotals = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 };
  const weekUnplannedTotals = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 };

  mainRows.forEach(r => {
    const rawCat = (r.category || '').trim();
    if (!rawCat || rawCat === '(blank)' || rawCat === '#N/A' || rawCat === 'N/A' || rawCat.toLowerCase() === 'other') return;

    let obj = catDataMap.get(rawCat);
    if (!obj) {
      obj = {
        name: rawCat,
        totalCost: 0,
        plannedCost: 0,
        unplannedCost: 0,
        cse: 0,
        weight: 0,
        trips: 0,
        plannedWeeks: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 },
        unplannedWeeks: { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 }
      };
      catDataMap.set(rawCat, obj);
    }

    const frt = r.frtCost || 0;
    const cse = r.cse || 0;
    const wt = r.weight || 0;
    const w = r.weekType;
    const rType = (r.routeType || '').toString().toLowerCase().trim();
    const isUnplan = rType.includes('unplan') || rType === '0';

    obj.totalCost += frt;
    obj.cse += cse;
    obj.weight += wt;
    obj.trips += 1;
    totalAll += frt;
    totalCSE += cse;
    totalWeight += wt;
    totalTrips += 1;

    if (isUnplan) {
      obj.unplannedCost += frt;
      totalUnplanned += frt;
      unplannedCSE += cse;
      unplannedWeight += wt;
      unplannedTrips += 1;
      if (obj.unplannedWeeks[w] !== undefined) {
        obj.unplannedWeeks[w] += frt;
        weekUnplannedTotals[w] += frt;
      }
    } else {
      obj.plannedCost += frt;
      totalPlanned += frt;
      plannedCSE += cse;
      plannedWeight += wt;
      plannedTrips += 1;
      if (obj.plannedWeeks[w] !== undefined) {
        obj.plannedWeeks[w] += frt;
        weekPlannedTotals[w] += frt;
      }
    }
  });

  const allCats = [...catDataMap.values()].sort((a, b) => b.totalCost - a.totalCost);
  const planPct = totalAll > 0 ? ((totalPlanned / totalAll) * 100).toFixed(2) : '0.00';
  const unplanPct = totalAll > 0 ? ((totalUnplanned / totalAll) * 100).toFixed(2) : '0.00';

  // Calculate Product Side Bars
  const maxCatCost = allCats.length ? Math.max(...allCats.map(c => c.totalCost)) : 1;
  const startX = 350;
  const endX = 980;
  const numCats = allCats.length || 1;
  const slotW = (endX - startX) / numCats;
  const barW = Math.max(34, Math.min(74, slotW * 0.70));
  const BASELINE_Y = 240;
  const MAX_BAR_H = 175;

  return (
    <div className="card" id="card-cat-week">
      <div className="card-head">
        <span className="card-title">Category Planned vs Unplanned Freight</span>
        <div className="card-meta">
          <span>Total: <b id="lbl-cat-week-total" style={{ color: 'var(--pur-600)' }}>{toLacs(totalAll)}</b></span>
        </div>
      </div>
      <div className="cat-week-container" id="chart-cat-week-list">
        <svg className="iceberg-stage-bg-svg" viewBox="0 0 1000 500" preserveAspectRatio="none">
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.3"/>
              <stop offset="35%" stopColor="#0369A1" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#082F49" stopOpacity="0.95"/>
            </linearGradient>
            <linearGradient id="sunbeam1" x1="0.5" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="sunbeam2" x1="0.5" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="iceTipFront" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95"/>
              <stop offset="60%" stopColor="#E0F2FE" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.75"/>
            </linearGradient>
            <linearGradient id="iceTipShadow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.65"/>
            </linearGradient>
            <linearGradient id="subIceMain" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7"/>
              <stop offset="40%" stopColor="#0284C7" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.8"/>
            </linearGradient>
            <linearGradient id="subIceDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#075985" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.92"/>
            </linearGradient>
            <linearGradient id="subIceLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.5"/>
            </linearGradient>
            <linearGradient id="barPlanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF"/>
              <stop offset="100%" stopColor="#0D9488"/>
            </linearGradient>
            <linearGradient id="barUnplanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185"/>
              <stop offset="100%" stopColor="#E11D48"/>
            </linearGradient>
          </defs>

          {/* Atmosphere Background */}
          <rect x="0" y="0" width="1000" height="240" fill="url(#skyGrad)"/>
          <rect x="0" y="240" width="1000" height="260" fill="url(#oceanGrad)"/>

          {/* Underwater Light Rays */}
          <polygon points="175,240 50,500 130,500" fill="url(#sunbeam1)"/>
          <polygon points="175,240 220,500 300,500" fill="url(#sunbeam2)"/>

          {/* SUBMERGED ICEBERG BASE (Unplanned Values) */}
          <g 
            className="ice-hero-group unplanned" 
            title={`▼ ROUTE TYPE: UNPLANNED (SUBMERGED ICEBERG)\nUnplanned Total: ${toLacs(totalUnplanned)} (${unplanPct}%)\nQuantity / Weight: ${inIN(unplannedCSE)} CSE · ${toTons(unplannedWeight)}\nUnplanned Trips: ${unplannedTrips} Trips`}
          >
            <polygon points="40,240 15,325 50,430 175,488 300,430 335,325 310,240" fill="url(#subIceMain)"/>
            <polygon points="40,240 15,325 110,370 175,240" fill="url(#subIceLight)"/>
            <polygon points="15,325 50,430 110,370" fill="url(#subIceDark)"/>
            <polygon points="175,240 110,370 175,488 240,370 175,240" fill="url(#subIceMain)"/>
            <polygon points="175,240 240,370 335,325 310,240" fill="url(#subIceLight)"/>
            <polygon points="335,325 300,430 240,370" fill="url(#subIceDark)"/>
            <polygon points="110,370 50,430 175,488 300,430 240,370" fill="url(#subIceDark)" opacity="0.8"/>
            <rect className="ice-hero-card" x="48" y="285" width="254" height="110" rx="10" ry="10"/>
            <text x="175" y="315" textAnchor="middle" fill="#FB7185" fontSize="14.5" fontWeight="900" letterSpacing="0.5">▼ UNPLANNED</text>
            <text x="175" y="352" textAnchor="middle" fill="#FFFFFF" fontSize="25" fontWeight="900">₹ {toLacs(totalUnplanned)}</text>
            <text x="175" y="378" textAnchor="middle" fill="#FFA77D" fontSize="12" fontWeight="800">{unplanPct}% OF TOTAL FREIGHT</text>
          </g>

          {/* ABOVE WATER ICEBERG PEAK (Planned Values) */}
          <g 
            className="ice-hero-group planned" 
            title={`▲ ROUTE TYPE: PLANNED (PEAK OF ICEBERG)\nPlanned Total: ${toLacs(totalPlanned)} (${planPct}%)\nQuantity / Weight: ${inIN(plannedCSE)} CSE · ${toTons(plannedWeight)}\nPlanned Trips: ${plannedTrips} Trips`}
          >
            <polygon points="175,20 115,115 40,240 310,240 235,115" fill="url(#iceTipFront)"/>
            <polygon points="175,20 115,115 160,240 175,240" fill="#FFFFFF" opacity="0.9"/>
            <polygon points="115,115 40,240 160,240" fill="url(#iceTipShadow)"/>
            <polygon points="175,20 235,115 190,240 175,240" fill="#E0F2FE" opacity="0.8"/>
            <polygon points="235,115 310,240 190,240" fill="url(#iceTipShadow)"/>
            <polyline points="175,20 170,115 160,240" stroke="#FFFFFF" strokeWidth="2" opacity="0.9"/>
            <rect className="ice-hero-card" x="48" y="65" width="254" height="110" rx="10" ry="10"/>
            <text x="175" y="95" textAnchor="middle" fill="#0D9488" fontSize="14.5" fontWeight="900" letterSpacing="0.5">▲ PLANNED</text>
            <text className="ice-hero-main-val" x="175" y="132" textAnchor="middle" fill="#0D3B66" fontSize="25" fontWeight="900">₹ {toLacs(totalPlanned)}</text>
            <text x="175" y="158" textAnchor="middle" fill="#0D9488" fontSize="12" fontWeight="800">{planPct}% OF TOTAL FREIGHT</text>
          </g>

          {/* Stage Separator between Iceberg and Side Bars */}
          <line x1="335" y1="20" x2="335" y2="480" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4"/>

          {/* Continuous Shimmering Waterline / Sea Level */}
          <line x1="0" y1="240" x2="1000" y2="240" stroke="#74EBD5" strokeWidth="2" opacity="0.85"/>
          <line x1="0" y1="240" x2="1000" y2="240" stroke="#1FA7A6" strokeWidth="6" opacity="0.25"/>
          <rect x="915" y="228" width="78" height="18" rx="4" fill="rgba(13, 59, 102, 0.75)" stroke="#74EBD5" strokeWidth="0.8"/>
          <text x="954" y="240" textAnchor="middle" fill="#74EBD5" fontSize="8" fontWeight="900" letterSpacing="0.5">〰 SEA LEVEL</text>

          {/* PRODUCT / CATEGORY SIDE BARS (Planned vs Unplanned) */}
          {allCats.map((cat, idx) => {
            const cx = startX + idx * slotW + slotW / 2;
            const bx = cx - barW / 2;
            const totalH = maxCatCost > 0 ? Math.max(26, Math.round((cat.totalCost / maxCatCost) * MAX_BAR_H)) : 26;
            const planRatio = cat.totalCost > 0 ? (cat.plannedCost / cat.totalCost) : 0;
            const planH = Math.round(totalH * planRatio);
            const unplanH = totalH - planH;

            const topY = BASELINE_Y - totalH;
            const splitY = BASELINE_Y - unplanH;

            const maxChars = Math.max(9, Math.floor(slotW / 7));
            const displayName = cat.name.length > maxChars ? cat.name.slice(0, maxChars - 1) + '…' : cat.name;

            const pillW = Math.min(115, Math.max(barW + 10, slotW * 0.94));
            const pillX = cx - pillW / 2;

            return (
              <g 
                key={cat.name} 
                className="ice-cat-bar-group"
                title={`📦 ${cat.name}\nTotal Freight: ${toLacs(cat.totalCost)}\n▲ Planned: ${toLacs(cat.plannedCost)}\n▼ Unplanned: ${toLacs(cat.unplannedCost)}\nQuantity: ${inIN(cat.cse)} CSE · ${toTons(cat.weight)}`}
              >
                {/* Top Total Cost Badge */}
                <rect x={cx - 36} y={topY - 22} width="72" height="18" rx="4" fill="rgba(13, 59, 102, 0.85)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8"/>
                <text x={cx} y={topY - 9} textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900">{toLacs(cat.totalCost)}</text>

                {/* Bar Segments */}
                {planH > 0 && unplanH > 0 ? (
                  <>
                    <rect className="cat-bar-rect" x={bx} y={topY} width={barW} height={planH} rx="4" ry="4" fill="url(#barPlanGrad)"/>
                    <rect className="cat-bar-rect" x={bx} y={splitY} width={barW} height={unplanH} fill="url(#barUnplanGrad)"/>
                    <line x1={bx} y1={splitY} x2={bx + barW} y2={splitY} stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="2,2"/>
                  </>
                ) : planH > 0 ? (
                  <rect className="cat-bar-rect" x={bx} y={topY} width={barW} height={planH} rx="4" ry="4" fill="url(#barPlanGrad)"/>
                ) : (
                  <rect className="cat-bar-rect" x={bx} y={topY} width={barW} height={unplanH} rx="4" ry="4" fill="url(#barUnplanGrad)"/>
                )}

                {/* Inner Values */}
                {planH >= 16 && (
                  <text x={cx} y={topY + planH / 2 + 4} textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="900" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                    {toLacs(cat.plannedCost)}
                  </text>
                )}
                {unplanH >= 16 && (
                  <text x={cx} y={splitY + unplanH / 2 + 4} textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="900" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                    {toLacs(cat.unplannedCost)}
                  </text>
                )}

                {/* Category Label Pill below Waterline */}
                <rect className="cat-pill-bg" x={pillX} y="254" width={pillW} height="32" rx="6" fill="rgba(13, 59, 102, 0.85)" stroke="#74EBD5" strokeWidth="1.2"/>
                <text x={cx} y="274" textAnchor="middle" fill="#74EBD5" fontSize="11.5" fontWeight="900" letterSpacing="0.3">
                  {displayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}


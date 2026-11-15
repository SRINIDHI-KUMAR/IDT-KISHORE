import React, { useEffect, useMemo } from 'react';
import { inIN, toTons } from '../utils/formatters';

// Exact palettes and accent colors from the main dashboard (VIBRANT_PALETTES)
const CORE_CATEGORIES = [
  { id: 'Chocolate', name: 'Chocolate', color: 'linear-gradient(180deg, #6C2E7B, #4A1A56)', accent: '#6C2E7B', code: 'CH' },
  { id: 'Biscuits', name: 'Biscuits', color: 'linear-gradient(180deg, #E75480, #C23360)', accent: '#E75480', code: 'BI' },
  { id: 'Gifting', name: 'Gifting', color: 'linear-gradient(180deg, #FF8A5B, #E66533)', accent: '#FF8A5B', code: 'GF' },
  { id: 'Gums & Candy', name: 'Gums & Candy', color: 'linear-gradient(180deg, #1FA7A6, #127574)', accent: '#1FA7A6', code: 'GC' },
  { id: 'Cocoa Beverage', name: 'Cocoa Beverage', color: 'linear-gradient(180deg, #0D3B66, #061F38)', accent: '#0D3B66', code: 'CB' },
  { id: 'Tang', name: 'Tang', color: 'linear-gradient(180deg, #8B7FD6, #6759B8)', accent: '#8B7FD6', code: 'TG' }
];

// Required depot code mappings: CHE, COI, BLR, VJW, COCH, HYB, HUB
const DEPOT_SHORT_MAP = {
  'chennai': 'CHE',
  'coimbatore': 'COI',
  'bangalore': 'BLR',
  'vijayawada': 'VJW',
  'cochin': 'COCH',
  'hyderabad': 'HYB',
  'hubli': 'HUB',
  'pondicherry': 'PDY',
  'madurai': 'MDU'
};

function getDepotShort(depot) {
  if (!depot) return '';
  const s = depot.toString().toLowerCase().trim();
  for (const [key, val] of Object.entries(DEPOT_SHORT_MAP)) {
    if (s.includes(key)) return val;
  }
  return s.slice(0, 4).toUpperCase();
}

export default function UnplannedRoutesModal({
  isOpen,
  onClose,
  rows = [],
  initialCategory = null
}) {
  useEffect(() => {
    if (isOpen && initialCategory && CORE_CATEGORIES.some(c => c.name.toLowerCase() === initialCategory.toLowerCase())) {
      setTimeout(() => {
        const domId = `cat-card-${initialCategory.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
        const el = document.getElementById(domId);
        if (el) {
          el.classList.add('highlight-pulse');
          setTimeout(() => el.classList.remove('highlight-pulse'), 2000);
        }
      }, 120);
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate unplanned routes per category
  const categoryData = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    const isUnplan = (r) => {
      const t = (r.routeType || '').toString().toLowerCase();
      return t.includes('unplan') || t === '0';
    };

    const unplanRows = rows.filter(isUnplan);

    return CORE_CATEGORIES.map(cat => {
      const catRows = unplanRows.filter(r => 
        (r.category || '').trim().toLowerCase() === cat.name.toLowerCase()
      );

      const routeMap = new Map();
      let catTotalCost = 0;
      let catTotalCSE = 0;
      let catTotalWeight = 0;
      let catTotalTrips = 0;

      catRows.forEach(r => {
        const fromD = (r.fromDepot || '').trim();
        const toD = (r.toDepot || '').trim();
        let routeKey = '';
        if (fromD && toD) {
          routeKey = `${fromD} → ${toD}`;
        } else if (r.route && r.route !== '(blank)') {
          routeKey = r.route;
        } else {
          routeKey = fromD || toD || 'Unknown Route';
        }

        const cost = Number(r.frtCost) || 0;
        const cse = Number(r.cse) || 0;
        const wt = Number(r.weight) || 0;

        catTotalCost += cost;
        catTotalCSE += cse;
        catTotalWeight += wt;
        catTotalTrips += 1;

        let routeObj = routeMap.get(routeKey);
        if (!routeObj) {
          const fromShort = getDepotShort(fromD || routeKey.split('→')[0]?.trim() || '');
          const toShort = getDepotShort(toD || routeKey.split('→')[1]?.trim() || '');
          const shortRoute = fromShort && toShort ? `${fromShort} → ${toShort}` : (fromShort || toShort || routeKey);

          routeObj = {
            route: routeKey,
            shortRoute,
            fromDepot: fromD || routeKey.split('→')[0]?.trim() || '',
            toDepot: toD || routeKey.split('→')[1]?.trim() || '',
            fromShort,
            toShort,
            cost: 0,
            cse: 0,
            weight: 0,
            trips: 0
          };
          routeMap.set(routeKey, routeObj);
        }

        routeObj.cost += cost;
        routeObj.cse += cse;
        routeObj.weight += wt;
        routeObj.trips += 1;
      });

      // Sort routes by cost descending
      const allRoutes = [...routeMap.values()].sort((a, b) => b.cost - a.cost);
      // Prioritize cost-contributing routes (cost > 0)
      const positiveRoutes = allRoutes.filter(r => r.cost > 0);
      const routes = positiveRoutes.length > 0 ? positiveRoutes : allRoutes;
      const maxRouteCost = routes.length ? Math.max(...routes.map(r => r.cost), 1) : 1;

      return {
        ...cat,
        totalCost: catTotalCost,
        totalCSE: catTotalCSE,
        totalWeight: catTotalWeight,
        totalTrips: catTotalTrips,
        routes,
        maxRouteCost
      };
    });
  }, [rows]);

  const grandTotalCost = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.totalCost, 0);
  }, [categoryData]);

  const grandTotalTrips = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.totalTrips, 0);
  }, [categoryData]);

  if (!isOpen) return null;

  return (
    <div 
      className="unplanned-modal-backdrop"
      onClick={(e) => {
        if (e.target.classList.contains('unplanned-modal-backdrop')) {
          onClose();
        }
      }}
    >
      {/* FLOATING CARD WINDOW OVER BLURRED DASHBOARD */}
      <div className="unplanned-modal-card" role="dialog" aria-modal="true">
        {/* MODAL HEADER (CLEAN EXECUTIVE HEADER WITHOUT CATEGORY TABS) */}
        <div className="unplanned-modal-header">
          <div className="unplanned-hdr-left">
            <div className="unplanned-hdr-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <div className="unplanned-hdr-title-row">
                <h2 className="unplanned-hdr-title">UNPLANNED ROUTE FREIGHT BY CATEGORY</h2>
                <span className="unplanned-count-badge">6 Categories</span>
              </div>
              <p className="unplanned-hdr-sub">
                Route-level unplanned cost breakdown (From Depot → To Depot)
              </p>
            </div>
          </div>

          <div className="unplanned-hdr-right">
            <div className="unplanned-stat-pill">
              <span className="stat-lbl">TOTAL UNPLANNED</span>
              <span className="stat-val">{(grandTotalCost / 100000).toFixed(2)} L</span>
            </div>
            <div className="unplanned-stat-pill trips">
              <span className="stat-lbl">TRIPS</span>
              <span className="stat-val">{inIN(grandTotalTrips)}</span>
            </div>
            <button 
              type="button" 
              className="unplanned-modal-close"
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODAL BODY: EXACTLY 6 CATEGORY CHARTS IN ONE PAGE VIEW (NO SCROLLING) */}
        <div className="unplanned-modal-body">
          <div className="unplanned-charts-grid">
            {categoryData.map(cat => {
              const catCostFormatted = (cat.totalCost / 100000).toFixed(2) + ' L';
              const catCostShare = grandTotalCost > 0 ? ((cat.totalCost / grandTotalCost) * 100).toFixed(1) : '0.0';
              const cardDomId = `cat-card-${cat.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

              return (
                <div 
                  key={cat.id} 
                  id={cardDomId}
                  className="unplanned-chart-card"
                >
                  {/* Category Card Header with Written Cost On Top (No ₹, Single 'L') */}
                  <div className="unplanned-card-header" style={{ borderLeft: `4px solid ${cat.accent}` }}>
                    <div className="card-header-left">
                      <div className="cat-title-badge">
                        <span className="cat-code-badge" style={{ background: cat.accent }}>{cat.code}</span>
                        <span className="cat-name">{cat.name.toUpperCase()}</span>
                      </div>
                      <span className="cat-meta-info">
                        {cat.routes.length} Routes &bull; {cat.totalTrips} Trips &bull; {toTons(cat.totalWeight)}
                      </span>
                    </div>

                    <div className="card-header-right">
                      <div className="cat-top-cost-box">
                        <span className="cat-cost-label">UNPLANNED COST</span>
                        <span className="cat-cost-val" style={{ color: cat.accent }}>
                          {catCostFormatted}
                        </span>
                        <span className="cat-cost-pct">{catCostShare}%</span>
                      </div>
                    </div>
                  </div>

                  {/* 1 BAR CHART FOR THIS CATEGORY: X-AXIS = VISIBLE SHORT ROUTES, BARS TIGHT WITH VALUE ON TOP */}
                  <div className="unplanned-chart-content">
                    {cat.routes.length === 0 ? (
                      <div className="unplanned-empty-chart">
                        <span>No unplanned routes for {cat.name}</span>
                      </div>
                    ) : (
                      <div className="unplanned-chart-tight-wrap">
                        {/* Bars Flex with tight spacing */}
                        <div className="unplanned-bars-tight-flex">
                          {cat.routes.map(r => {
                            const costOnlyVal = (r.cost / 100000).toFixed(2);
                            // Scale height up to 74% so top values have dedicated headroom below card header
                            const heightPct = cat.maxRouteCost > 0 
                              ? Math.max(8, Math.round((r.cost / cat.maxRouteCost) * 74)) 
                              : 8;
                            const shareOfCat = cat.totalCost > 0 
                              ? ((r.cost / cat.totalCost) * 100).toFixed(1) 
                              : '0.0';

                            return (
                              <div
                                key={r.route}
                                className="unplanned-bar-col-tight"
                                data-tip={`<b>${cat.name} — Unplanned Route</b><br/>Route: <b>${r.fromDepot} → ${r.toDepot}</b> (${r.shortRoute})<br/>Freight Cost: <span style="color:#FBBF24; font-weight:900;">${costOnlyVal} L</span> (₹ ${inIN(Math.round(r.cost))})<br/>Category Share: <b>${shareOfCat}%</b><br/>Volume: ${inIN(r.cse)} CSE &bull; ${toTons(r.weight)}<br/>Trips: ${r.trips} Trips`}
                              >
                                {/* Vertical Bar Track with top clearance */}
                                <div className="unplanned-bar-track-tight">
                                  {/* COST WRITTEN ON TOP OF THE BAR (Single 'L', No '₹', Compact) */}
                                  <div 
                                    className="unplanned-bar-group-tight" 
                                    style={{ height: `${heightPct}%` }}
                                  >
                                    <div className="unplanned-bar-val-top">
                                      {costOnlyVal}L
                                    </div>
                                    <div 
                                      className="unplanned-bar-fill-pro" 
                                      style={{ background: cat.color }}
                                    ></div>
                                  </div>
                                </div>

                                {/* X-AXIS ROUTE LABEL - 100% VISIBLE ROUTE BADGE */}
                                <div className="unplanned-bar-route-label" title={`${r.fromDepot} → ${r.toDepot}`}>
                                  <div className="unplan-route-pill">
                                    <span className="route-from-code">{r.fromShort}</span>
                                    <span className="route-arrow-icon">↓</span>
                                    <span className="route-to-code">{r.toShort}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Baseline X-axis Rule */}
                        <div className="unplanned-chart-baseline"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

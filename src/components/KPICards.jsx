import React from 'react';
import { moneyLacs, toLacs, inIN, toTons } from '../utils/formatters';

export default function KPICards({ mainRows }) {
  const totalCost = mainRows.reduce((a, r) => a + (r.frtCost || 0), 0);
  const totalCSE = mainRows.reduce((a, r) => a + (r.cse || 0), 0);
  const totalWeight = mainRows.reduce((a, r) => a + (r.weight || 0), 0);

  // Dedicated Rows & Weeks
  const dedicatedRows = mainRows.filter(r => r.frtCategory === 'Dedicated');
  const dedicatedTotal = dedicatedRows.reduce((a, r) => a + (r.frtCost || 0), 0);

  // Market Rows & Weeks
  const marketRows = mainRows.filter(r => r.frtCategory === 'Market Hire');
  const marketTotal = marketRows.reduce((a, r) => a + (r.frtCost || 0), 0);

  const renderWeekPills = (rows) => {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
    const wMap = {};
    weeks.forEach(w => wMap[w] = 0);
    rows.forEach(r => {
      const wk = r.weekType;
      if (wMap[wk] !== undefined) {
        wMap[wk] += (r.frtCost || 0);
      }
    });

    return weeks.map(w => {
      const val = wMap[w];
      const hasVal = val > 0;
      return (
        <div key={w} className={`week-pill ${hasVal ? 'has-val' : ''}`}>
          <span className="wk-lbl">{w}</span>
          <span className="wk-val">{toLacs(val)}</span>
        </div>
      );
    });
  };

  return (
    <section className="kpis-row">
      {/* Card 1: Total Cost in Lacs */}
      <div className="kpi-card">
        <div className="kpi-head">
          <span className="kpi-label">Cost in Lacs</span>
        </div>
        <div 
          className="kpi-big-cost" 
          id="kpi-total-cost" 
          dangerouslySetInnerHTML={{ __html: moneyLacs(totalCost) }} 
        />
        <div className="kpi-subtext" id="kpi-total-sub">
          {inIN(totalCSE)} CSE &bull; {toTons(totalWeight)} weight
        </div>
      </div>

      {/* Card 2: Dedicated */}
      <div className="kpi-card dedicated">
        <div className="kpi-head">
          <span className="kpi-label">Dedicated</span>
          <span className="kpi-badge-pill" id="kpi-dedicated-total">
            ₹ {toLacs(dedicatedTotal)}
          </span>
        </div>
        <div className="week-pills-grid" id="kpi-dedicated-weeks">
          {renderWeekPills(dedicatedRows)}
        </div>
        <div className="kpi-subtext" id="kpi-dedicated-sub">Weekly Dedicated Freight</div>
      </div>

      {/* Card 3: Market Hire */}
      <div className="kpi-card market">
        <div className="kpi-head">
          <span className="kpi-label">Market Hire</span>
          <span className="kpi-badge-pill" id="kpi-market-total">
            ₹ {toLacs(marketTotal)}
          </span>
        </div>
        <div className="week-pills-grid" id="kpi-market-weeks">
          {renderWeekPills(marketRows)}
        </div>
        <div className="kpi-subtext" id="kpi-market-sub">Weekly Market Hire Freight</div>
      </div>
    </section>
  );
}


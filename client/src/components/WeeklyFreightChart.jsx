import React from 'react';
import { toLacs } from '../utils/formatters';

export default function WeeklyFreightChart({ mainRows }) {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const weekFrt = {
    W1: { ded: 0, mkt: 0, tot: 0 },
    W2: { ded: 0, mkt: 0, tot: 0 },
    W3: { ded: 0, mkt: 0, tot: 0 },
    W4: { ded: 0, mkt: 0, tot: 0 },
    W5: { ded: 0, mkt: 0, tot: 0 }
  };
  let grandTotal = 0;

  mainRows.forEach(r => {
    const w = r.weekType;
    if (weekFrt[w]) {
      if (r.frtCategory === 'Dedicated') weekFrt[w].ded += (r.frtCost || 0);
      else if (r.frtCategory === 'Market Hire') weekFrt[w].mkt += (r.frtCost || 0);
      weekFrt[w].tot += (r.frtCost || 0);
      grandTotal += (r.frtCost || 0);
    }
  });

  const maxWk = Math.max(...weeks.map(w => weekFrt[w].tot), 1);

  return (
    <div className="card" id="card-weekly-trend">
      <div className="card-head">
        <span className="card-title">Week Wise Freight</span>
        <div className="card-meta">
          <span>Weekly Total: <b id="lbl-weekly-frt-total" style={{ color: 'var(--pur-600)' }}>{toLacs(grandTotal)}</b></span>
        </div>
      </div>
      <div className="v-col-chart-wrap" id="chart-weekly-frt-list" style={{ height: 'calc(100% - 24px)', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        {weeks.map(w => {
          const tot = weekFrt[w].tot;
          const d = weekFrt[w].ded;
          const m = weekFrt[w].mkt;
          const heightPct = tot > 0 ? Math.max(14, (tot / maxWk) * 78).toFixed(1) : '0';
          const dedPct = tot > 0 ? ((d / tot) * 100).toFixed(2) : '0.00';
          const mktPct = tot > 0 ? ((m / tot) * 100).toFixed(2) : '0.00';
          const displayVal = tot > 0 ? toLacs(tot) : '0.00 L';
          const dedVal = d > 0 ? toLacs(d) : '';
          const mktVal = m > 0 ? toLacs(m) : '';

          return (
            <div 
              key={w} 
              className="v-col-item"
              title={`${w} Total: ${displayVal}\nDedicated: ${toLacs(d)} (${dedPct}%)\nMarket Hire: ${toLacs(m)} (${mktPct}%)`}
            >
              <div className="v-col-track">
                {tot > 0 ? (
                  <div className="v-col-bar-group" style={{ height: `${heightPct}%` }}>
                    <div className="v-col-val">{displayVal}</div>
                    <div className="week-col-bar" style={{ width: '100%', height: '100%', borderRadius: '4px 4px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      <div className="segment dedicated" style={{ height: `${dedPct}%`, background: 'linear-gradient(180deg,#6C2E7B,#4A1A56)' }}>
                        {d > 0 && parseFloat(dedPct) >= 12 && (
                          <span className="seg-val" style={{ color: '#ffffff' }}>{dedVal}</span>
                        )}
                      </div>
                      <div className="segment market" style={{ height: `${mktPct}%`, background: 'linear-gradient(180deg,#FF8A5B,#E75480)' }}>
                        {m > 0 && parseFloat(mktPct) >= 12 && (
                          <span className="seg-val" style={{ color: '#ffffff' }}>{mktVal}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="v-col-bar-group empty" style={{ height: '14%' }}>
                    <div className="v-col-val empty">0.00 L</div>
                    <div className="v-col-fill empty"></div>
                  </div>
                )}
              </div>
              <div className="v-col-lbl">{w}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


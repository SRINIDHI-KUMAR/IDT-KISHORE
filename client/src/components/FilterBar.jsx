import React from 'react';

export default function FilterBar({
  rows,
  filters,
  onFilterChange,
  onResetFilters
}) {
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  const allWeeks = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const presentWeeks = uniq(rows.map(r => r.weekType)).filter(Boolean);
  const weekList = allWeeks.filter(w => presentWeeks.includes(w)).concat(presentWeeks.filter(w => !allWeeks.includes(w)));
  const finalWeeks = weekList.length ? weekList : allWeeks;

  const months = uniq(rows.map(r => r.month));
  const frtCategories = ['Dedicated', 'Market Hire', 'Co-pack'].filter(o => rows.some(r => r.frtCategory === o));
  const routeTypes = uniq(rows.map(r => r.routeType)).sort();

  return (
    <section className="controls-row">
      <div className="slicers-bar">
        <div className="slicer-group">
          <span>Week</span>
          <select 
            id="f-week" 
            value={filters.week || ''} 
            onChange={(e) => onFilterChange('week', e.target.value)}
          >
            <option value="">All weeks</option>
            {finalWeeks.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        <div className="slicer-group">
          <span>Month</span>
          <select 
            id="f-month" 
            value={filters.month || ''} 
            onChange={(e) => onFilterChange('month', e.target.value)}
          >
            <option value="">All months</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="slicer-group">
          <span>FRT Category</span>
          <select 
            id="f-frt" 
            value={filters.frt || ''} 
            onChange={(e) => onFilterChange('frt', e.target.value)}
          >
            <option value="">All FRT types</option>
            {frtCategories.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="slicer-group">
          <span>Route Type</span>
          <select 
            id="f-plan" 
            value={filters.plan || ''} 
            onChange={(e) => onFilterChange('plan', e.target.value)}
          >
            <option value="">All plan types</option>
            {routeTypes.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button className="btn-reset" id="reset" onClick={onResetFilters}>
          Reset
        </button>
      </div>
    </section>
  );
}


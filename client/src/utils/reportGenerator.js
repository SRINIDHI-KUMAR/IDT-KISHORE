/**
 * IDT Logistics Weekly Executive Report Generator
 * Generates senior supply chain analyst email reports with dynamic tables:
 * 1. Depot-Wise Freight Outflow (Stock Moved & Major Transfers)
 * 2. Category-Wise Freight Cost
 * 3. Week-Wise Sourcing (Dedicated vs Market Hire)
 * 4. Planned vs Unplanned Transfers (with core routes in brackets: HYB-VIJ, BLR-HUB, COIM-COCH)
 * 5. Top 6 Unplanned Corridors & Category-Wise Breakdown
 * 6. Brand & Category Freight Cost (Pivot Matrix from attached data)
 * 7. Co-Pack Volume & Savings Analysis
 */

import { inIN, toLacs, toTons, pct } from './formatters.js';

// Table 6: Brand, Category, Cost data from attached official pivot image
export const ATTACHED_IMAGE_BRAND_DATA = [
  { brand: '5 Star', category: 'Chocolate', cost: 221098 },
  { brand: 'Assorted Gifting', category: 'Gifting', cost: 180113 },
  { brand: 'Biscoff Spread', category: 'Lotus', cost: 10187 },
  { brand: 'Bournville', category: 'Chocolate', cost: 243961 },
  { brand: 'Bournvita', category: 'Cocoa Beverage', cost: 147150 },
  { brand: 'BOURNVITA BISCUIT', category: 'Biscuits', cost: 62823 },
  { brand: 'Brownie', category: 'Biscuits', cost: 13789 },
  { brand: 'CDM Base', category: 'Chocolate', cost: 209598 },
  { brand: 'CDM Shots', category: 'Chocolate', cost: 19890 },
  { brand: 'CDM Var', category: 'Chocolate', cost: 148196 },
  { brand: 'CENTRE FILLED COOKIES', category: 'Biscuits', cost: 197616 },
  { brand: 'Choclairs Rs 1', category: 'Gums & Candy', cost: 104891 },
  { brand: 'Choclairs Rs 2', category: 'Gums & Candy', cost: 193913 },
  { brand: 'CHOCOBAKES CAKES', category: 'Biscuits', cost: 88949 },
  { brand: 'Chocobakes Chocochips', category: 'Biscuits', cost: 47948 },
  { brand: 'Cote Dor', category: 'Chocolate', cost: 616 },
  { brand: 'DC+Cocoa', category: 'Cocoa Beverage', cost: 11112 },
  { brand: 'Fuse', category: 'Chocolate', cost: 152416 },
  { brand: 'Gems', category: 'Chocolate', cost: 107991 },
  { brand: 'Halls', category: 'Gums & Candy', cost: 9068 },
  { brand: 'Lickables', category: 'Chocolate', cost: 23457 },
  { brand: 'Lotus', category: 'Biscuits', cost: 99891 },
  { brand: 'Nutties', category: 'Chocolate', cost: 42293 },
  { brand: 'Oreo', category: 'Biscuits', cost: 630415 },
  { brand: 'Perk', category: 'Chocolate', cost: 308891 },
  { brand: 'RDFC', category: 'Chocolate', cost: 8733 },
  { brand: 'Silk', category: 'Chocolate', cost: 535843 },
  { brand: 'Tang', category: 'Tang', cost: 95920 },
  { brand: 'Temptations', category: 'Chocolate', cost: 23167 }
];

export function buildWeeklyReportData({
  mainRows = [],
  copackRows = [],
  allRows = [],
  filters = {}
}) {
  const isUnplan = (r) => {
    const t = (r.routeType || '').toString().toLowerCase();
    return t.includes('unplan') || t === '0';
  };

  const formatWeek = (val) => {
    if (!val) return 'Week 1';
    const s = String(val).trim();
    const l = s.toLowerCase();
    if (l === 'w1' || l === 'week 1' || l === 'wk 1') return 'Week 1';
    if (l === 'w2' || l === 'week 2' || l === 'wk 2') return 'Week 2';
    if (l === 'w3' || l === 'week 3' || l === 'wk 3') return 'Week 3';
    if (l === 'w4' || l === 'week 4' || l === 'wk 4') return 'Week 4';
    if (l === 'w5' || l === 'week 5' || l === 'wk 5') return 'Week 5';
    if (l === 'w6' || l === 'week 6' || l === 'wk 6') return 'Week 6';
    return s.startsWith('W') && !s.toLowerCase().startsWith('week') ? `Week ${s.slice(1)}` : s;
  };

  // High-Level Aggregates
  const totalCost = mainRows.reduce((a, r) => a + (r.frtCost || 0), 0);
  const totalCSE = mainRows.reduce((a, r) => a + (r.cse || 0), 0);
  const totalWeightKg = mainRows.reduce((a, r) => a + (r.weight || 0), 0);
  const totalWeightMT = totalWeightKg / 1000;
  const totalTrips = new Set(mainRows.map(r => r.lr).filter(Boolean)).size || mainRows.length;

  const dedRows = mainRows.filter(r => r.frtCategory === 'Dedicated');
  const mktRows = mainRows.filter(r => r.frtCategory === 'Market Hire');
  const dedCost = dedRows.reduce((a, r) => a + (r.frtCost || 0), 0);
  const mktCost = mktRows.reduce((a, r) => a + (r.frtCost || 0), 0);

  const planRows = mainRows.filter(r => !isUnplan(r));
  const unplanRows = mainRows.filter(isUnplan);
  const planCost = planRows.reduce((a, r) => a + (r.frtCost || 0), 0);
  const unplanCost = unplanRows.reduce((a, r) => a + (r.frtCost || 0), 0);

  // Baseline average commercial rate per MT
  const overallAvgRatePerMT = totalWeightMT > 0 ? (totalCost / totalWeightMT) : 2888.89;

  // -------------------------------------------------------------
  // TABLE 1: Depot-Wise Freight Outflow (Stock Moved & Major Transfers)
  // -------------------------------------------------------------
  const originDepotMap = new Map();
  mainRows.forEach(r => {
    const rawFrom = (r.fromDepot || 'Unknown').trim();
    const fromD = rawFrom ? rawFrom.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown';
    if (!originDepotMap.has(fromD)) {
      originDepotMap.set(fromD, {
        depot: fromD,
        cost: 0,
        cse: 0,
        weightKg: 0,
        tripsSet: new Set(),
        destinations: new Map()
      });
    }
    const d = originDepotMap.get(fromD);
    const cost = r.frtCost || 0;
    d.cost += cost;
    d.cse += (r.cse || 0);
    d.weightKg += (r.weight || 0);
    if (r.lr) d.tripsSet.add(r.lr);
    else d.tripsSet.add(Math.random());

    let rawTo = (r.toDepot || '').trim();
    if (!rawTo && r.route && r.route.includes('→')) {
      rawTo = r.route.split('→')[1]?.trim() || '';
    }
    if (rawTo) {
      const toD = rawTo.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      d.destinations.set(toD, (d.destinations.get(toD) || 0) + cost);
    }
  });

  const depotTable = Array.from(originDepotMap.values())
    .map(d => {
      const topTransfers = Array.from(d.destinations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(e => `${e[0]} (${(e[1] / 100000).toFixed(2)} L)`)
        .join(', ') || 'Direct Dispatch';

      const wtMT = d.weightKg / 1000;
      return {
        depot: d.depot,
        cost: d.cost,
        costLacs: (d.cost / 100000).toFixed(2) + ' L',
        sharePct: totalCost > 0 ? ((d.cost / totalCost) * 100).toFixed(1) + '%' : '0.0%',
        cse: d.cse,
        weightMT: wtMT.toFixed(1) + ' MT',
        trips: d.tripsSet.size,
        majorTransfers: topTransfers
      };
    })
    .sort((a, b) => b.cost - a.cost);

  // -------------------------------------------------------------
  // TABLE 2: Category-Wise Freight Cost Contribution
  // -------------------------------------------------------------
  const catMap = new Map();
  mainRows.forEach(r => {
    const cat = (r.category || 'Other').trim();
    if (!catMap.has(cat)) {
      catMap.set(cat, {
        category: cat,
        cost: 0,
        cse: 0,
        weightKg: 0,
        tripsSet: new Set()
      });
    }
    const c = catMap.get(cat);
    c.cost += (r.frtCost || 0);
    c.cse += (r.cse || 0);
    c.weightKg += (r.weight || 0);
    if (r.lr) c.tripsSet.add(r.lr);
    else c.tripsSet.add(Math.random());
  });

  const categoryTable = Array.from(catMap.values())
    .map(c => {
      const wtMT = c.weightKg / 1000;
      const ratePerMT = wtMT > 0 ? Math.round(c.cost / wtMT) : 0;
      return {
        category: c.category,
        cost: c.cost,
        costLacs: (c.cost / 100000).toFixed(2) + ' L',
        costVal: (c.cost / 100000).toFixed(2),
        sharePct: totalCost > 0 ? ((c.cost / totalCost) * 100).toFixed(1) + '%' : '0.0%',
        cse: c.cse,
        weightMT: wtMT.toFixed(1) + ' MT',
        weightMTNum: wtMT,
        trips: c.tripsSet.size,
        ratePerMT
      };
    })
    .sort((a, b) => b.cost - a.cost);

  // -------------------------------------------------------------
  // TABLE 3: Vehicle Sourcing Model: Dedicated vs Market Hire (Week-Wise)
  // -------------------------------------------------------------
  const rowsForWeek = (allRows && allRows.length > 0)
    ? allRows.filter(r => (!filters.month || r.month === filters.month) && r.frtCategory !== 'Co-pack')
    : mainRows.filter(r => r.frtCategory !== 'Co-pack');

  const weekMap = new Map();
  ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].forEach(wk => {
    weekMap.set(wk, {
      week: wk,
      dedCost: 0,
      mktCost: 0,
      totalCost: 0,
      cse: 0,
      weightKg: 0,
      tripsSet: new Set()
    });
  });

  rowsForWeek.forEach(r => {
    const rawWk = r.weekType || r.week;
    const wk = formatWeek(rawWk);
    if (!weekMap.has(wk)) {
      weekMap.set(wk, {
        week: wk,
        dedCost: 0,
        mktCost: 0,
        totalCost: 0,
        cse: 0,
        weightKg: 0,
        tripsSet: new Set()
      });
    }
    const w = weekMap.get(wk);
    const cost = r.frtCost || 0;
    if (r.frtCategory === 'Dedicated') {
      w.dedCost += cost;
    } else {
      w.mktCost += cost;
    }
    w.totalCost += cost;
    w.cse += (r.cse || 0);
    w.weightKg += (r.weight || 0);
    if (r.lr) w.tripsSet.add(r.lr);
  });

  const weekOrder = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const weekTable = Array.from(weekMap.values())
    .sort((a, b) => {
      const idxA = weekOrder.indexOf(a.week);
      const idxB = weekOrder.indexOf(b.week);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.week.localeCompare(b.week);
    })
    .map(w => {
      const mktShare = w.totalCost > 0 ? ((w.mktCost / w.totalCost) * 100).toFixed(1) + '%' : '0.0%';
      return {
        week: w.week,
        dedCostLacs: (w.dedCost / 100000).toFixed(2) + ' L',
        mktCostLacs: (w.mktCost / 100000).toFixed(2) + ' L',
        totalCostLacs: (w.totalCost / 100000).toFixed(2) + ' L',
        mktShare,
        cse: w.cse,
        weightMT: (w.weightKg / 1000).toFixed(1) + ' MT',
        trips: w.tripsSet.size,
        dedCostRaw: w.dedCost,
        mktCostRaw: w.mktCost,
        totalCostRaw: w.totalCost,
        weightKgRaw: w.weightKg
      };
    });

  const weekTotals = {
    dedCost: weekTable.reduce((a, w) => a + (w.dedCostRaw || 0), 0),
    mktCost: weekTable.reduce((a, w) => a + (w.mktCostRaw || 0), 0),
    totalCost: weekTable.reduce((a, w) => a + (w.totalCostRaw || 0), 0),
    cse: weekTable.reduce((a, w) => a + (w.cse || 0), 0),
    weightKg: weekTable.reduce((a, w) => a + (w.weightKgRaw || 0), 0),
    trips: weekTable.reduce((a, w) => a + (w.trips || 0), 0)
  };
  const weekTotalsFormatted = {
    dedCostLacs: (weekTotals.dedCost / 100000).toFixed(2) + ' L',
    mktCostLacs: (weekTotals.mktCost / 100000).toFixed(2) + ' L',
    totalCostLacs: (weekTotals.totalCost / 100000).toFixed(2) + ' L',
    mktShare: weekTotals.totalCost > 0 ? ((weekTotals.mktCost / weekTotals.totalCost) * 100).toFixed(1) + '%' : '0.0%',
    cse: weekTotals.cse,
    weightMT: (weekTotals.weightKg / 1000).toFixed(1) + ' MT',
    trips: weekTotals.trips
  };

  // -------------------------------------------------------------
  // TABLE 4: Planned vs Unplanned Summary (with core routes in brackets)
  // -------------------------------------------------------------
  const planningSummary = [
    {
      status: 'Planned',
      label: 'Planned (HYB-VIJ, BLR-HUB, COIM-COCH)',
      costLacs: (planCost / 100000).toFixed(2) + ' L',
      sharePct: totalCost > 0 ? ((planCost / totalCost) * 100).toFixed(1) + '%' : '0.0%',
      volumeCSE: planRows.reduce((a, r) => a + (r.cse || 0), 0),
      weightMT: (planRows.reduce((a, r) => a + (r.weight || 0), 0) / 1000).toFixed(1) + ' MT',
      trips: new Set(planRows.map(r => r.lr).filter(Boolean)).size
    },
    {
      status: 'Unplanned',
      label: 'Unplanned',
      costLacs: (unplanCost / 100000).toFixed(2) + ' L',
      sharePct: totalCost > 0 ? ((unplanCost / totalCost) * 100).toFixed(1) + '%' : '0.0%',
      volumeCSE: unplanRows.reduce((a, r) => a + (r.cse || 0), 0),
      weightMT: (unplanRows.reduce((a, r) => a + (r.weight || 0), 0) / 1000).toFixed(1) + ' MT',
      trips: new Set(unplanRows.map(r => r.lr).filter(Boolean)).size
    }
  ];

  // -------------------------------------------------------------
  // TABLE 5: Top 6 Major Unplanned Route Corridors & Category Breakdown
  // -------------------------------------------------------------
  const routeMap = new Map();
  unplanRows.forEach(r => {
    const fromD = (r.fromDepot || '').trim();
    const toD = (r.toDepot || '').trim();
    let corridor = '';
    if (fromD && toD) corridor = `${fromD} → ${toD}`;
    else if (r.route && r.route !== '(blank)') corridor = r.route;
    else corridor = fromD || toD || 'Unknown Corridor';

    if (!routeMap.has(corridor)) {
      routeMap.set(corridor, {
        corridor,
        cost: 0,
        cse: 0,
        weightKg: 0,
        tripsSet: new Set(),
        catCost: new Map()
      });
    }
    const item = routeMap.get(corridor);
    const cost = r.frtCost || 0;
    item.cost += cost;
    item.cse += (r.cse || 0);
    item.weightKg += (r.weight || 0);
    if (r.lr) item.tripsSet.add(r.lr);

    const cat = (r.category || 'Other').trim();
    item.catCost.set(cat, (item.catCost.get(cat) || 0) + cost);
  });

  const top6RoutesTable = Array.from(routeMap.values())
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 6)
    .map((r, idx) => {
      const topCats = Array.from(r.catCost.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(e => e[0])
        .join(', ');

      return {
        rank: idx + 1,
        corridor: r.corridor,
        cost: r.cost,
        costLacs: (r.cost / 100000).toFixed(2) + ' L',
        sharePct: unplanCost > 0 ? ((r.cost / unplanCost) * 100).toFixed(1) + '%' : '0.0%',
        trips: r.tripsSet.size,
        weightMT: (r.weightKg / 1000).toFixed(1) + ' MT',
        topCategories: topCats || 'General'
      };
    });

  // Category Unplanned Breakdown
  const catUnplanMap = new Map();
  unplanRows.forEach(r => {
    const cat = (r.category || 'Other').trim();
    if (!catUnplanMap.has(cat)) {
      catUnplanMap.set(cat, {
        category: cat,
        unplanCost: 0,
        tripsSet: new Set(),
        routeCosts: new Map()
      });
    }
    const item = catUnplanMap.get(cat);
    const cost = r.frtCost || 0;
    item.unplanCost += cost;
    if (r.lr) item.tripsSet.add(r.lr);

    const fromD = (r.fromDepot || '').trim();
    const toD = (r.toDepot || '').trim();
    const route = fromD && toD ? `${fromD} → ${toD}` : (r.route || 'Unspecified');
    item.routeCosts.set(route, (item.routeCosts.get(route) || 0) + cost);
  });

  const catUnplanTable = Array.from(catUnplanMap.values())
    .map(c => {
      const topRoute = Array.from(c.routeCosts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Multiple Corridors';

      const unplanShare = unplanCost > 0 ? ((c.unplanCost / unplanCost) * 100).toFixed(1) + '%' : '0.0%';
      return {
        category: c.category,
        unplanCostLacs: (c.unplanCost / 100000).toFixed(2) + ' L',
        shareOfUnplan: unplanShare,
        trips: c.tripsSet.size,
        topCorridor: topRoute
      };
    })
    .sort((a, b) => parseFloat(b.unplanCostLacs) - parseFloat(a.unplanCostLacs));

  // -------------------------------------------------------------
  // TABLE 6: Brand & Category Freight Cost (Attached Pivot Data)
  // -------------------------------------------------------------
  const totalBrandCost = ATTACHED_IMAGE_BRAND_DATA.reduce((a, b) => a + b.cost, 0); // 3939936
  const pivotCategories = [
    'Biscuits',
    'Chocolate',
    'Cocoa Beverage',
    'Gifting',
    'Gums & Candy',
    'Lotus',
    'Tang'
  ];

  const brandPivotMap = new Map();
  ATTACHED_IMAGE_BRAND_DATA.forEach(item => {
    if (!brandPivotMap.has(item.brand)) {
      const initVals = {};
      pivotCategories.forEach(cat => { initVals[cat] = 0; });
      brandPivotMap.set(item.brand, {
        brand: item.brand,
        values: initVals,
        total: 0
      });
    }
    const bRow = brandPivotMap.get(item.brand);
    bRow.values[item.category] = (bRow.values[item.category] || 0) + item.cost;
    bRow.total += item.cost;
  });

  const brandPivotRows = Array.from(brandPivotMap.values())
    .sort((a, b) => (b.total - a.total) || a.brand.localeCompare(b.brand));

  const pivotCategoryTotals = {};
  pivotCategories.forEach(cat => {
    pivotCategoryTotals[cat] = brandPivotRows.reduce((sum, r) => sum + (r.values[cat] || 0), 0);
  });
  const pivotGrandTotal = brandPivotRows.reduce((sum, r) => sum + r.total, 0);

  // -------------------------------------------------------------
  // TABLE 7: Co-Pack Transfer Volume & Freight Savings Analysis
  // -------------------------------------------------------------
  const copackCatMap = new Map();
  let totalCopackCSE = 0;
  let totalCopackWeightKg = 0;

  copackRows.forEach(r => {
    const cat = (r.category || 'Other').trim();
    if (!copackCatMap.has(cat)) {
      copackCatMap.set(cat, {
        category: cat,
        cse: 0,
        weightKg: 0,
        tripsSet: new Set()
      });
    }
    const item = copackCatMap.get(cat);
    item.cse += (r.cse || 0);
    item.weightKg += (r.weight || 0);
    totalCopackCSE += (r.cse || 0);
    totalCopackWeightKg += (r.weight || 0);
    if (r.lr) item.tripsSet.add(r.lr);
    else item.tripsSet.add(Math.random());
  });

  let totalSavingsIncurred = 0;
  const copackTable = Array.from(copackCatMap.values()).map(c => {
    const wtMT = c.weightKg / 1000;
    const matchedCat = categoryTable.find(item => item.category.toLowerCase() === c.category.toLowerCase());
    const benchmarkRate = (matchedCat && matchedCat.ratePerMT > 0) ? matchedCat.ratePerMT : overallAvgRatePerMT;
    const estSavings = wtMT * benchmarkRate;
    totalSavingsIncurred += estSavings;

    return {
      category: c.category,
      cse: c.cse,
      weightMT: wtMT.toFixed(1) + ' MT',
      trips: c.tripsSet.size,
      benchmarkRate: Math.round(benchmarkRate),
      savedCostLacs: (estSavings / 100000).toFixed(2) + ' L',
      savedCostVal: estSavings
    };
  }).sort((a, b) => b.savedCostVal - a.savedCostVal);

  const totalCopackMT = totalCopackWeightKg / 1000;
  const totalSavingsLacs = (totalSavingsIncurred / 100000).toFixed(2) + ' L';

  const monthLabel = filters.month || 'Current Period';
  const weekLabel = filters.week || 'All Active Weeks';
  const subject = `[IDT LOGISTICS REPORT] Weekly Freight Performance & Corridor Review - ${monthLabel} (${weekLabel})`;

  return {
    meta: {
      monthLabel,
      weekLabel,
      subject,
      totalCost,
      totalCostLacs: (totalCost / 100000).toFixed(2) + ' L',
      totalCSE,
      totalWeightMT: totalWeightMT.toFixed(1) + ' MT',
      totalTrips,
      dedCostLacs: (dedCost / 100000).toFixed(2) + ' L',
      mktCostLacs: (mktCost / 100000).toFixed(2) + ' L',
      planCostLacs: (planCost / 100000).toFixed(2) + ' L',
      unplanCostLacs: (unplanCost / 100000).toFixed(2) + ' L',
      totalCopackCSE,
      totalCopackMT: totalCopackMT.toFixed(1) + ' MT',
      totalCopackTrips: copackRows.length,
      totalSavingsLacs,
      totalBrandCost,
      totalBrandCostLacs: (totalBrandCost / 100000).toFixed(2) + ' L'
    },
    depotTable,
    categoryTable,
    weekTable,
    weekTotals: weekTotalsFormatted,
    planningSummary,
    top6RoutesTable,
    catUnplanTable,
    brandPivotRows,
    pivotCategories,
    pivotCategoryTotals,
    pivotGrandTotal,
    copackTable
  };
}

/**
 * Builds professional, inline-styled rich HTML email body
 */
export function buildRichHtmlEmail(data) {
  const {
    meta,
    depotTable = [],
    categoryTable = [],
    weekTable = [],
    weekTotals,
    planningSummary = [],
    top6RoutesTable = [],
    catUnplanTable = [],
    brandPivotRows = [],
    pivotCategories = [],
    pivotCategoryTotals = {},
    pivotGrandTotal = 0,
    copackTable = []
  } = data;

  const fontStack = `font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;`;
  const tableWrap = `width: 100%; border-collapse: collapse; margin: 0; background-color: #FFFFFF; border: 1px solid #CBD5E1; ${fontStack} mso-table-lspace: 0pt; mso-table-rspace: 0pt;`;
  
  const thNavy = `background-color: #0D3B66; color: #FFFFFF; ${fontStack} font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 3px 5px; border: 1px solid #0D3B66; line-height: 1.15; text-align: left;`;
  const thNavyRight = `${thNavy} text-align: right;`;
  const thNavyCenter = `${thNavy} text-align: center;`;

  const thGreen = `background-color: #047857; color: #FFFFFF; ${fontStack} font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 3px 5px; border: 1px solid #047857; line-height: 1.15; text-align: left;`;
  const thGreenRight = `${thGreen} text-align: right;`;

  const tdBase = `${fontStack} font-size: 10px; padding: 2.5px 5px; border: 1px solid #E2E8F0; vertical-align: middle; line-height: 1.15;`;

  const makeSpacer = (height = 8) => `
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td height="${height}" style="height: ${height}px; font-size: ${height}px; line-height: ${height}px; mso-line-height-rule: exactly; padding: 0; margin: 0; border: none;">&nbsp;</td>
      </tr>
    </table>`;

  const makeHeading = (title, color = '#0D3B66') => `
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td style="border-left: 3px solid ${color}; padding-left: 6px; padding-top: 2px; padding-bottom: 2px; ${fontStack} font-size: 11px; font-weight: 800; color: ${color}; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.15;">
          ${title}
        </td>
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, th, div, p, span, h1, h2, h3 { font-family: 'Segoe UI', Arial, sans-serif !important; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 10px 0; background-color: #F8FAFC; ${fontStack} color: #0F172A; line-height: 1.35;">
  <center style="width: 100%; table-layout: fixed; background-color: #F8FAFC;">
    <!-- OUTLOOK CONTAINER TABLE (SMALL & COMPACT) -->
    <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" align="center" style="width: 600px; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: left;">
      <tr>
        <td style="padding: 12px 14px; ${fontStack}">
          
          <!-- HEADER BLOCK -->
          <div style="border-bottom: 2px solid #0D3B66; padding-bottom: 10px; margin-bottom: 8px;">
            <div style="${fontStack} font-size: 10.5px; font-weight: 800; color: #0D3B66; letter-spacing: 0.6px; text-transform: uppercase;">Inter-Depot Transfer (IDT) Logistics Review</div>
            <h1 style="${fontStack} font-size: 15px; font-weight: 800; color: #0F172A; margin: 3px 0 5px 0; line-height: 1.25;">Weekly Logistics Freight Performance &amp; Executive Summary</h1>
            <div style="${fontStack} font-size: 11px; color: #64748B;">
              <strong>Reporting Scope:</strong> ${meta.monthLabel} &bull; ${meta.weekLabel} &nbsp;|&nbsp; <strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          ${makeSpacer(14)}

          <!-- EXECUTIVE KPI STRIP -->
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 0; background-color: #FAF8F5; border: 1px solid #E2E8F0; border-radius: 4px; ${fontStack}">
            <tr>
              <td width="25%" align="center" style="padding: 5px 4px; text-align: center; border-right: 1px solid #E2E8F0; vertical-align: middle;">
                <div style="${fontStack} font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px;">TOTAL FREIGHT</div>
                <div style="${fontStack} font-size: 14px; font-weight: 900; color: #0D3B66; margin: 1px 0;">${meta.totalCostLacs}</div>
                <div style="${fontStack} font-size: 9px; color: #64748B;">${inIN(meta.totalCSE)} CSE</div>
              </td>
              <td width="25%" align="center" style="padding: 5px 4px; text-align: center; border-right: 1px solid #E2E8F0; vertical-align: middle;">
                <div style="${fontStack} font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px;">VOLUME &amp; TRIPS</div>
                <div style="${fontStack} font-size: 14px; font-weight: 900; color: #0F172A; margin: 1px 0;">${meta.totalWeightMT}</div>
                <div style="${fontStack} font-size: 9px; color: #64748B;">${meta.totalTrips} Total Trips</div>
              </td>
              <td width="25%" align="center" style="padding: 5px 4px; text-align: center; border-right: 1px solid #E2E8F0; vertical-align: middle;">
                <div style="${fontStack} font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.4px;">DEDICATED / MARKET</div>
                <div style="${fontStack} font-size: 12.5px; font-weight: 900; color: #0F172A; margin: 2px 0 1px 0;">${meta.dedCostLacs} <span style="font-size: 9.5px; color:#64748B;">/</span> ${meta.mktCostLacs}</div>
                <div style="${fontStack} font-size: 9px; color: #DC2626; font-weight: 700;">Market Dominant</div>
              </td>
              <td width="25%" align="center" style="padding: 5px 4px; text-align: center; background-color: #ECFDF5; vertical-align: middle;">
                <div style="${fontStack} font-size: 8.5px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.4px;">CO-PACK SAVINGS</div>
                <div style="${fontStack} font-size: 14px; font-weight: 900; color: #047857; margin: 1px 0;">${meta.totalSavingsLacs}</div>
                <div style="${fontStack} font-size: 9px; color: #059669; font-weight: 700;">${meta.totalCopackMT} Shipped</div>
              </td>
            </tr>
          </table>

          ${makeSpacer(8)}

          <!-- 1. DEPOT-WISE FREIGHT OUTFLOW -->
          ${makeHeading('1. DEPOT-WISE FREIGHT OUTFLOW')}
          ${makeSpacer(6)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="18%" style="${thNavy}">ORIGIN DEPOT</th>
                <th width="15%" style="${thNavyRight}">STOCK MOVED (CSE)</th>
                <th width="14%" style="${thNavyRight}">FREIGHT COST</th>
                <th width="11%" style="${thNavyRight}">SPEND SHARE</th>
                <th width="12%" style="${thNavyRight}">WEIGHT (MT)</th>
                <th width="8%" style="${thNavyRight}">TRIPS</th>
                <th width="22%" style="${thNavy}">MAJOR 2 DEPOT TRANSFERS</th>
              </tr>
            </thead>
            <tbody>
              ${depotTable.map((d, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} font-weight: 700; color: #0F172A; background-color: ${bg};">${d.depot}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${inIN(d.cse)}</td>
                  <td style="${tdBase} font-weight: 700; color: #0D3B66; background-color: ${bg}; text-align: right; font-variant-numeric: tabular-nums;">${d.costLacs}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${d.sharePct}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${d.weightMT}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${d.trips}</td>
                  <td style="${tdBase} font-size: 10.5px; color: #475569; background-color: ${bg};">${d.majorTransfers}</td>
                </tr>`;
              }).join('')}
              <tr style="background-color: #F1F5F9; font-weight: 800;">
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9;">Total Depot Outflow</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${inIN(meta.totalCSE)}</td>
                <td style="${tdBase} font-weight: 900; color: #0D3B66; background-color: #F1F5F9; text-align: right;">${meta.totalCostLacs}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">100.0%</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${meta.totalWeightMT}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${meta.totalTrips}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9;">—</td>
              </tr>
            </tbody>
          </table>

          ${makeSpacer(8)}

          <!-- 2. CATEGORY-WISE FREIGHT COST -->
          ${makeHeading('2. CATEGORY-WISE FREIGHT COST')}
          ${makeSpacer(3)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="22%" style="${thNavy}">CATEGORY</th>
                <th width="13%" style="${thNavyRight}">FREIGHT COST</th>
                <th width="11%" style="${thNavyRight}">SPEND SHARE</th>
                <th width="14%" style="${thNavyRight}">VOLUME (CSE)</th>
                <th width="14%" style="${thNavyRight}">WEIGHT (MT)</th>
                <th width="10%" style="${thNavyRight}">TRIPS</th>
                <th width="16%" style="${thNavyRight}">RATE / MT</th>
              </tr>
            </thead>
            <tbody>
              ${categoryTable.map((c, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} font-weight: 700; color: #0F172A; background-color: ${bg};">${c.category}</td>
                  <td style="${tdBase} font-weight: 700; color: #0D3B66; background-color: ${bg}; text-align: right; font-variant-numeric: tabular-nums;">${c.costLacs}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.sharePct}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${inIN(c.cse)}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.weightMT}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.trips}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${inIN(c.ratePerMT)}</td>
                </tr>`;
              }).join('')}
              <tr style="background-color: #F1F5F9; font-weight: 800;">
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9;">Total Paid Operations</td>
                <td style="${tdBase} font-weight: 900; color: #0D3B66; background-color: #F1F5F9; text-align: right;">${meta.totalCostLacs}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">100.0%</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${inIN(meta.totalCSE)}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${meta.totalWeightMT}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${meta.totalTrips}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">—</td>
              </tr>
            </tbody>
          </table>

          ${makeSpacer(8)}

          <!-- 3. WEEK-WISE SOURCING (DEDICATED VS MARKET) -->
          ${makeHeading('3. WEEK-WISE SOURCING (DEDICATED VS MARKET)')}
          ${makeSpacer(3)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="15%" style="${thNavy}">TIMELINE</th>
                <th width="14%" style="${thNavyRight}">DEDICATED SPEND</th>
                <th width="15%" style="${thNavyRight}">MARKET HIRE SPEND</th>
                <th width="15%" style="${thNavyRight}">TOTAL FREIGHT</th>
                <th width="13%" style="${thNavyRight}">MARKET HIRE %</th>
                <th width="14%" style="${thNavyRight}">VOLUME (CSE)</th>
                <th width="14%" style="${thNavyRight}">TONNAGE</th>
              </tr>
            </thead>
            <tbody>
              ${weekTable.map((w, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} font-weight: 700; color: #0F172A; background-color: ${bg};">${w.week}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${w.dedCostLacs}</td>
                  <td style="${tdBase} font-weight: 700; color: #BE123C; background-color: ${bg}; text-align: right;">${w.mktCostLacs}</td>
                  <td style="${tdBase} font-weight: 800; color: #0D3B66; background-color: ${bg}; text-align: right;">${w.totalCostLacs}</td>
                  <td style="${tdBase} font-weight: 700; color: ${parseFloat(w.mktShare) > 70 ? '#BE123C' : '#0F172A'}; background-color: ${bg}; text-align: right;">${w.mktShare}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${inIN(w.cse)}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${w.weightMT}</td>
                </tr>`;
              }).join('')}
              <tr style="background-color: #F1F5F9; font-weight: 800;">
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9;">Full Period Total</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${(weekTotals && weekTotals.dedCostLacs) || meta.dedCostLacs}</td>
                <td style="${tdBase} font-weight: 800; color: #BE123C; background-color: #F1F5F9; text-align: right;">${(weekTotals && weekTotals.mktCostLacs) || meta.mktCostLacs}</td>
                <td style="${tdBase} font-weight: 900; color: #0D3B66; background-color: #F1F5F9; text-align: right;">${(weekTotals && weekTotals.totalCostLacs) || meta.totalCostLacs}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${(weekTotals && weekTotals.mktShare) || '—'}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${inIN((weekTotals && weekTotals.cse) ?? meta.totalCSE)}</td>
                <td style="${tdBase} font-weight: 800; color: #0F172A; background-color: #F1F5F9; text-align: right;">${(weekTotals && weekTotals.weightMT) || meta.totalWeightMT}</td>
              </tr>
            </tbody>
          </table>

          ${makeSpacer(8)}

          <!-- 4. PLANNED VS UNPLANNED TRANSFERS -->
          ${makeHeading('4. PLANNED VS UNPLANNED TRANSFERS')}
          ${makeSpacer(3)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="32%" style="${thNavy}">PLANNING STATUS</th>
                <th width="14%" style="${thNavyRight}">FREIGHT SPEND</th>
                <th width="12%" style="${thNavyRight}">SPEND SHARE</th>
                <th width="15%" style="${thNavyRight}">VOLUME (CSE)</th>
                <th width="14%" style="${thNavyRight}">WEIGHT (MT)</th>
                <th width="13%" style="${thNavyRight}">TRIPS</th>
              </tr>
            </thead>
            <tbody>
              ${planningSummary.map((p, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                const isPl = p.status === 'Planned';
                return `<tr>
                  <td style="${tdBase} font-weight: 700; color: ${isPl ? '#047857' : '#0D3B66'}; background-color: ${bg};">${p.label || p.status}</td>
                  <td style="${tdBase} font-weight: 800; color: ${isPl ? '#047857' : '#0D3B66'}; background-color: ${bg}; text-align: right;">${p.costLacs}</td>
                  <td style="${tdBase} font-weight: 700; color: #1E293B; background-color: ${bg}; text-align: right;">${p.sharePct}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${inIN(p.volumeCSE)}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${p.weightMT}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${p.trips}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>

          ${makeSpacer(8)}

          <!-- 5. TOP 6 UNPLANNED ROUTE CORRIDORS -->
          ${makeHeading('5. TOP 6 UNPLANNED ROUTE CORRIDORS')}
          ${makeSpacer(3)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="6%" style="${thNavyCenter}">RANK</th>
                <th width="28%" style="${thNavy}">UNPLANNED CORRIDOR (FROM → TO)</th>
                <th width="13%" style="${thNavyRight}">FREIGHT COST</th>
                <th width="13%" style="${thNavyRight}">UNPLANNED SHARE</th>
                <th width="9%" style="${thNavyRight}">TRIPS</th>
                <th width="12%" style="${thNavyRight}">TONNAGE</th>
                <th width="19%" style="${thNavy}">PRIMARY CATEGORIES</th>
              </tr>
            </thead>
            <tbody>
              ${top6RoutesTable.map((r, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} text-align: center; font-weight: 800; color: #0D3B66; background-color: ${bg};">#${r.rank}</td>
                  <td style="${tdBase} font-weight: 700; color: #0F172A; background-color: ${bg};">${r.corridor}</td>
                  <td style="${tdBase} font-weight: 700; color: #0D3B66; background-color: ${bg}; text-align: right;">${r.costLacs}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${r.sharePct}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${r.trips}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${r.weightMT}</td>
                  <td style="${tdBase} font-size: 10.5px; color: #475569; background-color: ${bg};">${r.topCategories}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>

          ${makeSpacer(5)}

          <!-- Unplanned Spend Breakdown By Category -->
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0; width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tr>
              <td style="padding-left: 2px; padding-bottom: 6px; ${fontStack} font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.3px;">
                Unplanned Spend Breakdown By Category:
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="25%" style="${thNavy}">CATEGORY</th>
                <th width="15%" style="${thNavyRight}">UNPLANNED COST</th>
                <th width="18%" style="${thNavyRight}">% OF UNPLANNED</th>
                <th width="12%" style="${thNavyRight}">TRIPS</th>
                <th width="30%" style="${thNavy}">PRIMARY UNPLANNED CORRIDOR</th>
              </tr>
            </thead>
            <tbody>
              ${catUnplanTable.map((c, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} font-weight: 700; color: #0F172A; background-color: ${bg};">${c.category}</td>
                  <td style="${tdBase} font-weight: 700; color: #0D3B66; background-color: ${bg}; text-align: right;">${c.unplanCostLacs}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.shareOfUnplan}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.trips}</td>
                  <td style="${tdBase} font-size: 10.5px; color: #475569; background-color: ${bg};">${c.topCorridor}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>

          ${makeSpacer(8)}

          <!-- 6. BRAND & CATEGORY FREIGHT COST MATRIX -->
          ${makeHeading('6. BRAND & CATEGORY FREIGHT COST')}
          ${makeSpacer(3)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr style="background-color: #D9E1F2;">
                <th style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: left; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Sum of FRT Cost per CSE</th>
                <th colspan="7" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: center; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Column Labels</th>
                <th style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">&nbsp;</th>
              </tr>
              <tr style="background-color: #D9E1F2;">
                <th width="19%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: left; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Row Labels</th>
                <th width="10%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Biscuits</th>
                <th width="10.5%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Chocolate</th>
                <th width="11%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Cocoa Beverage</th>
                <th width="9%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Gifting</th>
                <th width="10.5%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Gums &amp; Candy</th>
                <th width="8.5%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Lotus</th>
                <th width="8.5%" style="${fontStack} font-size: 9.5px; font-weight: 700; color: #1E293B; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7;">Tang</th>
                <th width="13%" style="${fontStack} font-size: 9.5px; font-weight: 800; color: #0D3B66; text-align: right; padding: 2.5px 4px; border: 1px solid #B4C6E7; background-color: #C6D9F1;">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              ${brandPivotRows.map((r, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} font-size: 9.5px; font-weight: 700; color: #0F172A; background-color: ${bg}; padding: 2px 4px;">${r.brand}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Biscuits'] ? r.values['Biscuits'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Chocolate'] ? r.values['Chocolate'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Cocoa Beverage'] ? r.values['Cocoa Beverage'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Gifting'] ? r.values['Gifting'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Gums & Candy'] ? r.values['Gums & Candy'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Lotus'] ? r.values['Lotus'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; text-align: right; color: #1E293B; background-color: ${bg}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.values['Tang'] ? r.values['Tang'].toLocaleString('en-IN') : ''}</td>
                  <td style="${tdBase} font-size: 9.5px; font-weight: 700; text-align: right; color: #0D3B66; background-color: ${i % 2 === 1 ? '#F1F5F9' : '#F8FAFC'}; padding: 2px 4px; font-variant-numeric: tabular-nums;">${r.total.toLocaleString('en-IN')}</td>
                </tr>`;
              }).join('')}
              <tr style="background-color: #D9E1F2; font-weight: 800; border-top: 2px solid #8EA9DB;">
                <td style="${tdBase} font-size: 10px; font-weight: 900; color: #0F172A; background-color: #D9E1F2; padding: 3px 4px;">Grand Total</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Biscuits'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Chocolate'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Cocoa Beverage'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Gifting'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Gums & Candy'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Lotus'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 800; text-align: right; color: #0D3B66; background-color: #D9E1F2; padding: 3px 4px;">${(pivotCategoryTotals['Tang'] || 0).toLocaleString('en-IN')}</td>
                <td style="${tdBase} font-size: 10px; font-weight: 900; text-align: right; color: #0D3B66; background-color: #C6D9F1; padding: 3px 4px;">${(pivotGrandTotal || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          ${makeSpacer(8)}

          <!-- 7. CO-PACK VOLUME & SAVINGS -->
          ${makeHeading('7. CO-PACK VOLUME & SAVINGS', '#047857')}
          ${makeSpacer(3)}
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="${tableWrap}">
            <thead>
              <tr>
                <th width="26%" style="${thGreen}">CATEGORY</th>
                <th width="18%" style="${thGreenRight}">SHIPPED VOLUME (CSE)</th>
                <th width="18%" style="${thGreenRight}">CO-PACK WEIGHT (MT)</th>
                <th width="12%" style="${thGreenRight}">TRIPS</th>
                <th width="26%" style="${thGreenRight}">FREIGHT COST SAVED</th>
              </tr>
            </thead>
            <tbody>
              ${copackTable.length === 0 ? `
                <tr>
                  <td colspan="5" style="${tdBase} text-align: center; color: #94A3B8; background-color: #FFFFFF;">No Co-pack records in selected scope</td>
                </tr>
              ` : copackTable.map((c, i) => {
                const bg = i % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
                return `<tr>
                  <td style="${tdBase} font-weight: 700; color: #0F172A; background-color: ${bg};">${c.category}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${inIN(c.cse)}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.weightMT}</td>
                  <td style="${tdBase} color: #1E293B; background-color: ${bg}; text-align: right;">${c.trips}</td>
                  <td style="${tdBase} font-weight: 900; color: #047857; background-color: #ECFDF5; text-align: right;">${c.savedCostLacs}</td>
                </tr>`;
              }).join('')}
              <tr style="background-color: #D1FAE5; font-weight: 800;">
                <td style="${tdBase} font-weight: 800; color: #047857; background-color: #D1FAE5;">Total Co-Pack Value Added</td>
                <td style="${tdBase} font-weight: 800; color: #047857; background-color: #D1FAE5; text-align: right;">${inIN(meta.totalCopackCSE || 0)}</td>
                <td style="${tdBase} font-weight: 800; color: #047857; background-color: #D1FAE5; text-align: right;">${meta.totalCopackMT}</td>
                <td style="${tdBase} font-weight: 800; color: #047857; background-color: #D1FAE5; text-align: right;">${meta.totalCopackTrips || 0}</td>
                <td style="${tdBase} font-weight: 900; color: #047857; background-color: #D1FAE5; text-align: right; font-size: 12px;">${meta.totalSavingsLacs} Saved</td>
              </tr>
            </tbody>
          </table>

          ${makeSpacer(6)}

        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

/**
 * Builds formatted plain text / markdown tables for native email clients and mailto links
 */
export function buildPlainTextEmail(data) {
  const {
    meta,
    depotTable = [],
    categoryTable = [],
    weekTable = [],
    weekTotals,
    planningSummary = [],
    top6RoutesTable = [],
    catUnplanTable = [],
    brandPivotRows = [],
    pivotCategories = [],
    pivotCategoryTotals = {},
    pivotGrandTotal = 0,
    copackTable = []
  } = data;

  const bar = '========================================================================================\n';
  const subBar = '----------------------------------------------------------------------------------------\n';

  let txt = `Subject: ${meta.subject}\n\n`;

  txt += bar;
  txt += `EXECUTIVE HIGHLIGHTS (${meta.monthLabel} | ${meta.weekLabel})\n`;
  txt += bar;
  txt += `• Total Freight Spend : ${meta.totalCostLacs} (${inIN(meta.totalCSE)} CSE, ${meta.totalWeightMT}, ${meta.totalTrips} Trips)\n`;
  txt += `• Dedicated vs Market : Dedicated: ${meta.dedCostLacs} | Market Hire: ${meta.mktCostLacs}\n`;
  txt += `• Planning Adherence  : Planned: ${meta.planCostLacs} | Unplanned: ${meta.unplanCostLacs}\n`;
  txt += `• Co-Pack Value Added : ${meta.totalSavingsLacs} Freight Saved (${meta.totalCopackMT} Shipped)\n\n`;

  // 1. Depot Wise
  txt += bar;
  txt += `1. DEPOT-WISE FREIGHT OUTFLOW\n`;
  txt += bar;
  txt += `Origin Depot    | Stock Moved (CSE) | Freight Cost | Share % | Weight (MT) | Trips | Major 2 Transfers\n`;
  txt += subBar;
  depotTable.forEach(d => {
    txt += `${d.depot.padEnd(15)} | ${inIN(d.cse).padStart(17)} | ${d.costLacs.padStart(12)} | ${d.sharePct.padStart(7)} | ${d.weightMT.padStart(11)} | ${String(d.trips).padStart(5)} | ${d.majorTransfers}\n`;
  });
  txt += subBar;
  txt += `TOTAL OUTFLOW   | ${inIN(meta.totalCSE).padStart(17)} | ${meta.totalCostLacs.padStart(12)} |  100.0% | ${meta.totalWeightMT.padStart(11)} | ${String(meta.totalTrips).padStart(5)} |\n\n`;

  // 2. Category Wise
  txt += bar;
  txt += `2. CATEGORY-WISE FREIGHT COST\n`;
  txt += bar;
  txt += `Category          | Freight Cost | Share % | Volume (CSE) | Weight (MT) | Trips | Rate / MT\n`;
  txt += subBar;
  categoryTable.forEach(c => {
    txt += `${c.category.padEnd(17)} | ${c.costLacs.padStart(12)} | ${c.sharePct.padStart(7)} | ${inIN(c.cse).padStart(12)} | ${c.weightMT.padStart(11)} | ${String(c.trips).padStart(5)} | ${inIN(c.ratePerMT).padStart(9)}\n`;
  });
  txt += subBar;
  txt += `TOTAL PAID        | ${meta.totalCostLacs.padStart(12)} |  100.0% | ${inIN(meta.totalCSE).padStart(12)} | ${meta.totalWeightMT.padStart(11)} | ${String(meta.totalTrips).padStart(5)} |\n\n`;

  // 3. Week Wise
  txt += bar;
  txt += `3. WEEK-WISE SOURCING (DEDICATED VS MARKET)\n`;
  txt += bar;
  txt += `Week    | Dedicated Cost | Market Hire Cost | Total Freight  | Market % | Volume (CSE)\n`;
  txt += subBar;
  weekTable.forEach(w => {
    txt += `${w.week.padEnd(7)} | ${w.dedCostLacs.padStart(14)} | ${w.mktCostLacs.padStart(16)} | ${w.totalCostLacs.padStart(14)} | ${w.mktShare.padStart(8)} | ${inIN(w.cse).padStart(12)}\n`;
  });
  txt += subBar;
  txt += `TOTAL   | ${(weekTotals?.dedCostLacs || meta.dedCostLacs).padStart(14)} | ${(weekTotals?.mktCostLacs || meta.mktCostLacs).padStart(16)} | ${(weekTotals?.totalCostLacs || meta.totalCostLacs).padStart(14)} | ${(weekTotals?.mktShare || '').padStart(8)} | ${inIN(weekTotals?.cse ?? meta.totalCSE).padStart(12)}\n\n`;

  // 4. Planned vs Unplanned Summary
  txt += bar;
  txt += `4. PLANNED VS UNPLANNED TRANSFERS\n`;
  txt += bar;
  txt += `Status                                                 | Freight Cost | Share % | Volume (CSE) | Weight (MT) | Trips\n`;
  txt += subBar;
  planningSummary.forEach(p => {
    const lbl = p.label || p.status;
    txt += `${lbl.padEnd(54)} | ${p.costLacs.padStart(12)} | ${p.sharePct.padStart(7)} | ${inIN(p.volumeCSE).padStart(12)} | ${p.weightMT.padStart(11)} | ${String(p.trips).padStart(5)}\n`;
  });
  txt += '\n';

  // 5. Top 6 Unplanned Routes & Unplanned Spend Breakdown By Category
  txt += bar;
  txt += `5. TOP 6 UNPLANNED ROUTE CORRIDORS\n`;
  txt += bar;
  txt += `Rank | Unplanned Corridor            | Cost (L)     | Share % | Trips | Tonnage   | Categories\n`;
  txt += subBar;
  top6RoutesTable.forEach(r => {
    txt += `#${r.rank}   | ${r.corridor.padEnd(29)} | ${r.costLacs.padStart(12)} | ${r.sharePct.padStart(7)} | ${String(r.trips).padStart(5)} | ${r.weightMT.padStart(9)} | ${r.topCategories}\n`;
  });
  txt += `\nUnplanned Spend Breakdown By Category:\n`;
  catUnplanTable.forEach(c => {
    txt += `• ${c.category.padEnd(15)}: ${c.unplanCostLacs} (${c.shareOfUnplan} of unplanned, ${c.trips} trips) -> Top: ${c.topCorridor}\n`;
  });
  txt += '\n';

  // 6. Brand & Category Cost (Pivot Matrix)
  txt += bar;
  txt += `6. BRAND & CATEGORY FREIGHT COST (PIVOT MATRIX)\n`;
  txt += bar;
  txt += `Sum of FRT Cost per CSE | Column Labels\n`;
  txt += `Row Labels              |  Biscuits | Chocolate | Cocoa Bev |   Gifting | Gums&Cndy |     Lotus |      Tang | Grand Total\n`;
  txt += subBar;
  brandPivotRows.forEach(r => {
    const bsc = r.values['Biscuits'] ? String(r.values['Biscuits']) : '';
    const chc = r.values['Chocolate'] ? String(r.values['Chocolate']) : '';
    const ccb = r.values['Cocoa Beverage'] ? String(r.values['Cocoa Beverage']) : '';
    const gft = r.values['Gifting'] ? String(r.values['Gifting']) : '';
    const gms = r.values['Gums & Candy'] ? String(r.values['Gums & Candy']) : '';
    const lts = r.values['Lotus'] ? String(r.values['Lotus']) : '';
    const tng = r.values['Tang'] ? String(r.values['Tang']) : '';
    const tot = String(r.total);
    txt += `${r.brand.padEnd(23)} | ${bsc.padStart(9)} | ${chc.padStart(9)} | ${ccb.padStart(9)} | ${gft.padStart(9)} | ${gms.padStart(9)} | ${lts.padStart(9)} | ${tng.padStart(9)} | ${tot.padStart(11)}\n`;
  });
  txt += subBar;
  txt += `Grand Total             | ${(pivotCategoryTotals['Biscuits'] || 1141432).toString().padStart(9)} | ${(pivotCategoryTotals['Chocolate'] || 2046151).toString().padStart(9)} | ${(pivotCategoryTotals['Cocoa Beverage'] || 158262).toString().padStart(9)} | ${(pivotCategoryTotals['Gifting'] || 180113).toString().padStart(9)} | ${(pivotCategoryTotals['Gums & Candy'] || 307871).toString().padStart(9)} | ${(pivotCategoryTotals['Lotus'] || 10187).toString().padStart(9)} | ${(pivotCategoryTotals['Tang'] || 95920).toString().padStart(9)} | ${(pivotGrandTotal || 3939936).toString().padStart(11)}\n\n`;

  // 7. Co-Pack Savings
  txt += bar;
  txt += `7. CO-PACK VOLUME & SAVINGS\n`;
  txt += bar;
  txt += `Category          | Shipped (CSE) | Weight (MT) | Trips | Freight Saved (L)\n`;
  txt += subBar;
  copackTable.forEach(c => {
    txt += `${c.category.padEnd(17)} | ${inIN(c.cse).padStart(13)} | ${c.weightMT.padStart(11)} | ${String(c.trips).padStart(5)} | ${c.savedCostLacs.padStart(17)}\n`;
  });
  txt += subBar;
  txt += `TOTAL CO-PACK     | ${inIN(meta.totalCopackCSE || copackTable.reduce((a,c)=>a+c.cse, 0)).padStart(13)} | ${(meta.totalCopackMT || '').padStart(11)} | ${String(meta.totalCopackTrips || 0).padStart(5)} | ${(meta.totalSavingsLacs || '').padStart(17)}\n\n`;

  return txt;
}

/**
 * Exports all 7 logistics report tables into a single, beautifully formatted Excel worksheet.
 * Tables are placed one by one below each other with neat mild headers, cell borders,
 * clear typography, and formatted numbers.
 */
export async function exportWeeklyReportToExcel(reportData) {
  if (!reportData) return;
  const XLSX = await import('xlsx-js-style');
  const {
    meta,
    depotTable = [],
    categoryTable = [],
    weekTable = [],
    weekTotals,
    planningSummary = [],
    top6RoutesTable = [],
    catUnplanTable = [],
    brandPivotRows = [],
    pivotCategories = [],
    pivotCategoryTotals = {},
    pivotGrandTotal = 0,
    copackTable = []
  } = reportData;

  const wb = XLSX.utils.book_new();

  // STYLING PALETTE (Neat, mild colors & soft corporate borders)
  const borderThin = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } }
  };

  const borderTotal = {
    top: { style: 'thin', color: { rgb: '8EA9DB' } },
    bottom: { style: 'double', color: { rgb: '0D3B66' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } }
  };

  const titleStyle = {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '0D3B66' } },
    alignment: { vertical: 'center', horizontal: 'left' }
  };

  const subTitleStyle = {
    font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '64748B' } },
    alignment: { vertical: 'center', horizontal: 'left' }
  };

  const sectionBannerStyle = {
    fill: { fgColor: { rgb: 'E8EEF5' } },
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '0D3B66' } },
    border: borderThin,
    alignment: { vertical: 'center', horizontal: 'left' }
  };

  // Mild header style with soft periwinkle-blue fill and dark navy bold text
  const headerStyle = (align = 'center') => ({
    fill: { fgColor: { rgb: 'D9E1F2' } },
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0D3B66' } },
    border: borderThin,
    alignment: { vertical: 'center', horizontal: align, wrapText: true }
  });

  // Data row styling with alternating mild row background
  const dataStyle = (isEven, align = 'left', isBold = false) => ({
    fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
    font: { name: 'Calibri', sz: 9.5, bold: isBold, color: { rgb: '1E293B' } },
    border: borderThin,
    alignment: { vertical: 'center', horizontal: align }
  });

  // Grand Total row styling
  const totalStyle = (align = 'left') => ({
    fill: { fgColor: { rgb: 'D9E1F2' } },
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0D3B66' } },
    border: borderTotal,
    alignment: { vertical: 'center', horizontal: align }
  });

  const c = (val, style) => ({ v: val ?? '', s: style });
  const emptyRow = () => [c('', {}), c('', {}), c('', {}), c('', {}), c('', {}), c('', {}), c('', {}), c('', {})];

  const sheetData = [];
  const merges = [];

  // Helper to add a banner merged across columns
  const addBanner = (title, cols = 8) => {
    const rIdx = sheetData.length;
    const row = [c(title, sectionBannerStyle)];
    for (let i = 1; i < cols; i++) {
      row.push(c('', sectionBannerStyle));
    }
    sheetData.push(row);
    merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: cols - 1 } });
  };

  // 0. SHEET TITLE & METADATA
  const r0 = sheetData.length;
  sheetData.push([c('INTER-DEPOT TRANSFER (IDT) LOGISTICS PERFORMANCE REPORT', titleStyle)]);
  merges.push({ s: { r: r0, c: 0 }, e: { r: r0, c: 8 } });

  const r1 = sheetData.length;
  sheetData.push([c(`Reporting Scope: ${meta?.monthLabel || 'All'} • ${meta?.weekLabel || 'All Weeks'}   |   Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, subTitleStyle)]);
  merges.push({ s: { r: r1, c: 0 }, e: { r: r1, c: 8 } });

  sheetData.push(emptyRow());

  // 1. DEPOT-WISE FREIGHT OUTFLOW
  addBanner('1. DEPOT-WISE FREIGHT OUTFLOW', 8);
  sheetData.push([
    c('Origin Depot', headerStyle('left')),
    c('Stock Moved (CSE)', headerStyle('right')),
    c('Freight Cost (Rs)', headerStyle('right')),
    c('Freight Cost (Lacs)', headerStyle('right')),
    c('Spend Share', headerStyle('right')),
    c('Weight (MT)', headerStyle('right')),
    c('Trips', headerStyle('right')),
    c('Major 2 Depot Transfers', headerStyle('left'))
  ]);
  (depotTable || []).forEach((d, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(d.depot, dataStyle(even, 'left', true)),
      c(d.cse, dataStyle(even, 'right')),
      c(Math.round(d.cost || 0), dataStyle(even, 'right')),
      c(d.costLacs, dataStyle(even, 'right', true)),
      c(d.sharePct, dataStyle(even, 'right')),
      c(d.weightMT, dataStyle(even, 'right')),
      c(d.trips, dataStyle(even, 'right')),
      c(d.majorTransfers, dataStyle(even, 'left'))
    ]);
  });
  sheetData.push([
    c('Total Depot Outflow', totalStyle('left')),
    c(meta?.totalCSE || 0, totalStyle('right')),
    c(Math.round(meta?.totalCost || 0), totalStyle('right')),
    c(meta?.totalCostLacs || '', totalStyle('right')),
    c('100.0%', totalStyle('right')),
    c(meta?.totalWeightMT || '', totalStyle('right')),
    c(meta?.totalTrips || 0, totalStyle('right')),
    c('—', totalStyle('center'))
  ]);
  sheetData.push(emptyRow());
  sheetData.push(emptyRow());

  // 2. CATEGORY-WISE FREIGHT COST CONTRIBUTION
  addBanner('2. CATEGORY-WISE FREIGHT COST CONTRIBUTION', 8);
  sheetData.push([
    c('Category', headerStyle('left')),
    c('Freight Cost (Rs)', headerStyle('right')),
    c('Freight Cost (Lacs)', headerStyle('right')),
    c('Spend Share', headerStyle('right')),
    c('Volume (CSE)', headerStyle('right')),
    c('Weight (MT)', headerStyle('right')),
    c('Trips', headerStyle('right')),
    c('Rate / MT (Rs)', headerStyle('right'))
  ]);
  (categoryTable || []).forEach((ct, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(ct.category, dataStyle(even, 'left', true)),
      c(Math.round(ct.cost || 0), dataStyle(even, 'right')),
      c(ct.costLacs, dataStyle(even, 'right', true)),
      c(ct.sharePct, dataStyle(even, 'right')),
      c(ct.cse, dataStyle(even, 'right')),
      c(ct.weightMT, dataStyle(even, 'right')),
      c(ct.trips, dataStyle(even, 'right')),
      c(ct.ratePerMT, dataStyle(even, 'right'))
    ]);
  });
  sheetData.push([
    c('Total Paid Operations', totalStyle('left')),
    c(Math.round(meta?.totalCost || 0), totalStyle('right')),
    c(meta?.totalCostLacs || '', totalStyle('right')),
    c('100.0%', totalStyle('right')),
    c(meta?.totalCSE || 0, totalStyle('right')),
    c(meta?.totalWeightMT || '', totalStyle('right')),
    c(meta?.totalTrips || 0, totalStyle('right')),
    c('—', totalStyle('center'))
  ]);
  sheetData.push(emptyRow());
  sheetData.push(emptyRow());

  // 3. VEHICLE SOURCING MODEL: DEDICATED VS MARKET HIRE (WEEK-WISE COST)
  addBanner('3. VEHICLE SOURCING MODEL: DEDICATED VS MARKET HIRE (WEEK-WISE COST)', 8);
  sheetData.push([
    c('Timeline', headerStyle('left')),
    c('Dedicated Spend', headerStyle('right')),
    c('Market Hire Spend', headerStyle('right')),
    c('Total Freight', headerStyle('right')),
    c('Market Hire %', headerStyle('right')),
    c('Volume (CSE)', headerStyle('right')),
    c('Tonnage (MT)', headerStyle('right')),
    c('Trips', headerStyle('right'))
  ]);
  (weekTable || []).forEach((w, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(w.week, dataStyle(even, 'left', true)),
      c(w.dedCostLacs, dataStyle(even, 'right')),
      c(w.mktCostLacs, dataStyle(even, 'right')),
      c(w.totalCostLacs, dataStyle(even, 'right', true)),
      c(w.mktShare, dataStyle(even, 'right')),
      c(w.cse, dataStyle(even, 'right')),
      c(w.weightMT, dataStyle(even, 'right')),
      c(w.trips, dataStyle(even, 'right'))
    ]);
  });
  const wt = weekTotals || {};
  sheetData.push([
    c('Full Period Total', totalStyle('left')),
    c(wt.dedCostLacs || meta?.dedCostLacs || '', totalStyle('right')),
    c(wt.mktCostLacs || meta?.mktCostLacs || '', totalStyle('right')),
    c(wt.totalCostLacs || meta?.totalCostLacs || '', totalStyle('right')),
    c(wt.mktShare || '—', totalStyle('right')),
    c(wt.cse ?? meta?.totalCSE ?? 0, totalStyle('right')),
    c(wt.weightMT || meta?.totalWeightMT || '', totalStyle('right')),
    c(wt.trips ?? meta?.totalTrips ?? 0, totalStyle('right'))
  ]);
  sheetData.push(emptyRow());
  sheetData.push(emptyRow());

  // 4. ROUTE PLANNING STATUS: PLANNED VS UNPLANNED FREIGHT SUMMARY
  addBanner('4. ROUTE PLANNING STATUS: PLANNED VS UNPLANNED FREIGHT SUMMARY', 6);
  sheetData.push([
    c('Planning Status', headerStyle('left')),
    c('Freight Spend', headerStyle('right')),
    c('Spend Share', headerStyle('right')),
    c('Volume (CSE)', headerStyle('right')),
    c('Weight (MT)', headerStyle('right')),
    c('Trips', headerStyle('right'))
  ]);
  (planningSummary || []).forEach((p, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(p.label || `${p.status} Transfers`, dataStyle(even, 'left', true)),
      c(p.costLacs, dataStyle(even, 'right', true)),
      c(p.sharePct, dataStyle(even, 'right')),
      c(p.volumeCSE, dataStyle(even, 'right')),
      c(p.weightMT, dataStyle(even, 'right')),
      c(p.trips, dataStyle(even, 'right'))
    ]);
  });
  sheetData.push([
    c('Total System IDT', totalStyle('left')),
    c(meta?.totalCostLacs || '', totalStyle('right')),
    c('100.0%', totalStyle('right')),
    c(meta?.totalCSE || 0, totalStyle('right')),
    c(meta?.totalWeightMT || '', totalStyle('right')),
    c(meta?.totalTrips || 0, totalStyle('right'))
  ]);
  sheetData.push(emptyRow());
  sheetData.push(emptyRow());

  // 5. TOP 6 MAJOR UNPLANNED ROUTE CORRIDORS
  addBanner('5. TOP 6 MAJOR UNPLANNED ROUTE CORRIDORS', 7);
  sheetData.push([
    c('Rank', headerStyle('center')),
    c('Unplanned Corridor (From → To)', headerStyle('left')),
    c('Freight Cost', headerStyle('right')),
    c('Unplanned Share %', headerStyle('right')),
    c('Trips', headerStyle('right')),
    c('Tonnage (MT)', headerStyle('right')),
    c('Primary Categories', headerStyle('left'))
  ]);
  (top6RoutesTable || []).forEach((r, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(`#${r.rank}`, dataStyle(even, 'center', true)),
      c(r.corridor, dataStyle(even, 'left', true)),
      c(r.costLacs, dataStyle(even, 'right', true)),
      c(r.sharePct, dataStyle(even, 'right')),
      c(r.trips, dataStyle(even, 'right')),
      c(r.weightMT, dataStyle(even, 'right')),
      c(r.topCategories, dataStyle(even, 'left'))
    ]);
  });
  sheetData.push(emptyRow());

  addBanner('UNPLANNED SPEND BREAKDOWN BY CATEGORY', 5);
  sheetData.push([
    c('Category', headerStyle('left')),
    c('Unplanned Cost', headerStyle('right')),
    c('% of Unplanned Spend', headerStyle('right')),
    c('Trips', headerStyle('right')),
    c('Primary Unplanned Corridor', headerStyle('left'))
  ]);
  (catUnplanTable || []).forEach((cu, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(cu.category, dataStyle(even, 'left', true)),
      c(cu.unplanCostLacs, dataStyle(even, 'right', true)),
      c(cu.shareOfUnplan, dataStyle(even, 'right')),
      c(cu.trips, dataStyle(even, 'right')),
      c(cu.topCorridor, dataStyle(even, 'left'))
    ]);
  });
  sheetData.push(emptyRow());
  sheetData.push(emptyRow());

  // 6. BRAND & CATEGORY FREIGHT COST (PIVOT MATRIX)
  addBanner('6. BRAND & CATEGORY FREIGHT COST (PIVOT MATRIX - RS)', 9);
  const rPiv1 = sheetData.length;
  sheetData.push([
    c('Sum of FRT Cost per CSE', headerStyle('left')),
    c('Column Labels', headerStyle('center')),
    c('', headerStyle('center')),
    c('', headerStyle('center')),
    c('', headerStyle('center')),
    c('', headerStyle('center')),
    c('', headerStyle('center')),
    c('', headerStyle('center')),
    c('', headerStyle('center'))
  ]);
  merges.push({ s: { r: rPiv1, c: 1 }, e: { r: rPiv1, c: 8 } });

  sheetData.push([
    c('Row Labels', headerStyle('left')),
    c('Biscuits', headerStyle('right')),
    c('Chocolate', headerStyle('right')),
    c('Cocoa Beverage', headerStyle('right')),
    c('Gifting', headerStyle('right')),
    c('Gums & Candy', headerStyle('right')),
    c('Lotus', headerStyle('right')),
    c('Tang', headerStyle('right')),
    c('Grand Total', headerStyle('right'))
  ]);
  (brandPivotRows || []).forEach((r, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(r.brand, dataStyle(even, 'left', true)),
      c(r.values['Biscuits'] ? Number(r.values['Biscuits']) : '', dataStyle(even, 'right')),
      c(r.values['Chocolate'] ? Number(r.values['Chocolate']) : '', dataStyle(even, 'right')),
      c(r.values['Cocoa Beverage'] ? Number(r.values['Cocoa Beverage']) : '', dataStyle(even, 'right')),
      c(r.values['Gifting'] ? Number(r.values['Gifting']) : '', dataStyle(even, 'right')),
      c(r.values['Gums & Candy'] ? Number(r.values['Gums & Candy']) : '', dataStyle(even, 'right')),
      c(r.values['Lotus'] ? Number(r.values['Lotus']) : '', dataStyle(even, 'right')),
      c(r.values['Tang'] ? Number(r.values['Tang']) : '', dataStyle(even, 'right')),
      c(Number(r.total || 0), dataStyle(even, 'right', true))
    ]);
  });
  sheetData.push([
    c('Grand Total', totalStyle('left')),
    c(Number(pivotCategoryTotals['Biscuits'] || 0), totalStyle('right')),
    c(Number(pivotCategoryTotals['Chocolate'] || 0), totalStyle('right')),
    c(Number(pivotCategoryTotals['Cocoa Beverage'] || 0), totalStyle('right')),
    c(Number(pivotCategoryTotals['Gifting'] || 0), totalStyle('right')),
    c(Number(pivotCategoryTotals['Gums & Candy'] || 0), totalStyle('right')),
    c(Number(pivotCategoryTotals['Lotus'] || 0), totalStyle('right')),
    c(Number(pivotCategoryTotals['Tang'] || 0), totalStyle('right')),
    c(Number(pivotGrandTotal || 0), totalStyle('right'))
  ]);
  sheetData.push(emptyRow());
  sheetData.push(emptyRow());

  // 7. CO-PACK VOLUME & SAVINGS ANALYSIS
  addBanner('7. CO-PACK VOLUME & FREIGHT COST SAVINGS ANALYSIS', 5);
  sheetData.push([
    c('Category', headerStyle('left')),
    c('Shipped Volume (CSE)', headerStyle('right')),
    c('Co-Pack Weight (MT)', headerStyle('right')),
    c('Trips', headerStyle('right')),
    c('Freight Cost Saved', headerStyle('right'))
  ]);
  (copackTable || []).forEach((cp, i) => {
    const even = i % 2 === 1;
    sheetData.push([
      c(cp.category, dataStyle(even, 'left', true)),
      c(cp.cse, dataStyle(even, 'right')),
      c(cp.weightMT, dataStyle(even, 'right')),
      c(cp.trips, dataStyle(even, 'right')),
      c(cp.savedCostLacs, dataStyle(even, 'right', true))
    ]);
  });
  sheetData.push([
    c('Total Co-Pack Value Added', totalStyle('left')),
    c(meta?.totalCopackCSE || 0, totalStyle('right')),
    c(meta?.totalCopackMT || '', totalStyle('right')),
    c(meta?.totalCopackTrips || 0, totalStyle('right')),
    c(`${meta?.totalSavingsLacs || '0.00 L'} Saved`, totalStyle('right'))
  ]);

  // CREATE WORKSHEET & APPEND TO WORKBOOK
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 34 }, // Col A: Depot / Category / Route / Brand
    { wch: 20 }, // Col B: Stock Moved / Spend / Biscuits
    { wch: 20 }, // Col C: Freight Cost / Chocolate
    { wch: 18 }, // Col D: Spend Share / Cocoa
    { wch: 16 }, // Col E: Weight MT / Gifting
    { wch: 16 }, // Col F: Trips / Gums & Candy
    { wch: 14 }, // Col G: Trips / Lotus
    { wch: 28 }, // Col H: Major Transfers / Tang
    { wch: 16 }  // Col I: Grand Total
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'IDT Logistics Report');

  // Trigger browser download
  const safeMonth = (meta?.monthLabel || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeWeek = (meta?.weekLabel || 'All_Weeks').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `IDT_Logistics_Weekly_Report_${safeMonth}_${safeWeek}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Creates and triggers download of an .eml draft file with X-Unsent: 1.
 * Opening this file in Windows opens Outlook in draft compose mode with all 7 HTML tables pre-filled in the body.
 */
export function downloadEmlDraft(reportData, htmlBody) {
  if (!htmlBody) return;
  const cleanSubj = ((reportData && reportData.meta && reportData.meta.subject) || 'IDT Weekly Logistics Report').replace(/[\r\n]/g, '');
  const emlContent = `To: \nSubject: ${cleanSubj}\nX-Unsent: 1\nMIME-Version: 1.0\nContent-Type: text/html; charset=utf-8\n\n${htmlBody}\n`;
  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeMonth = ((reportData && reportData.meta && reportData.meta.monthLabel) || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `IDT_Logistics_Weekly_Report_${safeMonth}.eml`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

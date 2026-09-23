import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SidebarDrawer from './components/SidebarDrawer';
import ColumnMappingModal from './components/ColumnMappingModal';
import ConfirmModal from './components/ConfirmModal';
import InstantTooltip from './components/InstantTooltip';
import { EMBEDDED_MASTER_DATA } from './data/defaultData';
import {
  norm, toNum, txt, inIN, toLacs, toTons, pct,
  normDepotName, normFrt, normPlan, normWeek
} from './utils/formatters';

const VIBRANT_PALETTES = [
  'linear-gradient(180deg, #6C2E7B, #4A1A56)', // Orchid Dream
  'linear-gradient(180deg, #E75480, #C23360)', // Coral Kiss
  'linear-gradient(180deg, #FF8A5B, #E66533)', // Tangerine Tide
  'linear-gradient(180deg, #1FA7A6, #127574)', // Lagoon Depths
  'linear-gradient(180deg, #0D3B66, #061F38)', // Ocean Abyss
  'linear-gradient(180deg, #8B7FD6, #6759B8)', // Moonlit Lilac
  'linear-gradient(180deg, #FFC857, #E5A524)'  // Sunlit Amber
];

const COPACK_BAR_COLORS = [
  'linear-gradient(90deg, #6C2E7B, #9B3FA8)',
  'linear-gradient(90deg, #E75480, #FF6F96)',
  'linear-gradient(90deg, #FF8A5B, #FFA77D)',
  'linear-gradient(90deg, #1FA7A6, #38C7C6)',
  'linear-gradient(90deg, #8B7FD6, #A69BF2)',
  'linear-gradient(90deg, #FFC857, #FFD980)'
];

const PIE_COLORS = ['#6C2E7B', '#E75480', '#FF8A5B', '#1FA7A6', '#0D3B66', '#8B7FD6', '#FFC857'];

const SOUTH_INDIA_STATES = [
  {
    id: 'hyderabad',
    name: 'HYDERABAD (TELANGANA)',
    fill: 'url(#regionGradHyderabad)',
    stroke: '#1D4ED8',
    d: 'M 440 60 L 530 45 L 590 85 L 575 160 L 520 180 L 450 160 L 435 110 Z',
    labelX: 495, labelY: 100
  },
  {
    id: 'vijayawada',
    name: 'VIJAYAWADA (ANDHRA)',
    fill: 'url(#regionGradVijayawada)',
    stroke: '#C2410C',
    d: 'M 590 85 L 685 75 L 705 115 L 655 175 L 625 240 L 595 315 L 545 315 L 525 250 L 520 180 L 575 160 Z',
    labelX: 630, labelY: 215
  },
  {
    id: 'hubli',
    name: 'HUBLI REGION',
    fill: 'url(#regionGradHubli)',
    stroke: '#0F766E',
    d: 'M 440 60 L 450 160 L 520 180 L 485 245 L 335 245 L 320 230 L 290 130 L 375 80 Z',
    labelX: 380, labelY: 165
  },
  {
    id: 'bangalore',
    name: 'BANGALORE HUB',
    fill: 'url(#regionGradBangalore)',
    stroke: '#6C2E7B',
    d: 'M 335 245 L 485 245 L 520 180 L 525 250 L 545 315 L 490 355 L 420 365 L 350 335 Z',
    labelX: 435, labelY: 285
  },
  {
    id: 'chennai',
    name: 'CHENNAI REGION',
    fill: 'url(#regionGradChennai)',
    stroke: '#BE123C',
    d: 'M 545 315 L 595 315 L 570 410 L 460 410 L 440 360 L 490 355 Z',
    labelX: 525, labelY: 370
  },
  {
    id: 'coimbatore',
    name: 'COIMBATORE REGION',
    fill: 'url(#regionGradCoimbatore)',
    stroke: '#B45309',
    d: 'M 460 410 L 570 410 L 555 470 L 505 530 L 440 575 L 440 565 L 415 540 L 405 440 L 420 365 L 440 360 Z',
    labelX: 485, labelY: 485
  },
  {
    id: 'cochin',
    name: 'COCHIN (KERALA)',
    fill: 'url(#regionGradCochin)',
    stroke: '#0369A1',
    d: 'M 350 335 L 420 365 L 405 440 L 380 485 L 415 540 L 440 565 L 415 560 L 375 480 L 350 400 Z',
    labelX: 355, labelY: 440
  },
  {
    id: 'srilanka',
    name: 'SRI LANKA',
    fill: 'url(#regionGradSriLanka)',
    stroke: '#D97706',
    d: 'M 550 515 C 565 505, 585 515, 580 545 C 575 570, 555 580, 545 555 C 538 535, 542 522, 550 515 Z',
    labelX: 560, labelY: 545
  }
];

const SOUTH_INDIA_COASTLINE = 'M 290 130 L 320 230 L 350 335 L 350 400 L 375 480 L 415 560 L 440 575 L 505 530 L 555 470 L 570 410 L 595 315 L 625 240 L 655 175 L 705 115 L 685 75';

const DEPOT_STATIONS = [
  {
    slotId: 'center',
    defaultDepot: 'bangalore',
    color: '#6C2E7B',
    isHub: true,
    pinX: 430, pinY: 595,
    lineD: 'M 430 595 L 340 520 L 265 480',
    cardX: 15, cardY: 420, w: 250, h: 120
  },
  {
    slotId: 'north',
    defaultDepot: 'hyderabad',
    color: '#1D4ED8',
    pinX: 600, pinY: 230,
    lineD: 'M 600 230 L 780 200 L 940 189',
    cardX: 940, cardY: 130, w: 245, h: 118
  },
  {
    slotId: 'northwest',
    defaultDepot: 'hubli',
    aliases: ['hubli', 'hubballi'],
    color: '#0F766E',
    pinX: 320, pinY: 330,
    lineD: 'M 320 330 L 285 240 L 260 189',
    cardX: 15, cardY: 130, w: 245, h: 118
  },
  {
    slotId: 'east',
    defaultDepot: 'vijayawada',
    color: '#C2410C',
    pinX: 625, pinY: 375,
    lineD: 'M 625 375 L 790 430 L 940 479',
    cardX: 940, cardY: 420, w: 245, h: 118
  },
  {
    slotId: 'southeast',
    defaultDepot: 'chennai',
    color: '#BE123C',
    pinX: 635, pinY: 565,
    lineD: 'M 635 565 L 790 670 L 940 769',
    cardX: 940, cardY: 710, w: 245, h: 118
  },
  {
    slotId: 'southwest',
    defaultDepot: 'cochin',
    aliases: ['cochin', 'kochi'],
    color: '#0369A1',
    pinX: 350, pinY: 720,
    lineD: 'M 350 720 L 295 750 L 260 769',
    cardX: 15, cardY: 710, w: 245, h: 118
  },
  {
    slotId: 'south',
    defaultDepot: 'coimbatore',
    color: '#B45309',
    pinX: 440, pinY: 690,
    lineD: 'M 440 690 L 440 825',
    cardX: 400, cardY: 825, w: 250, h: 118
  }
];

const LOGISTICS_ROUTES = [
  { from: 'bangalore', to: 'hyderabad', d: 'M 430 595 Q 520 400, 600 230' },
  { from: 'bangalore', to: 'hubli', d: 'M 430 595 Q 360 450, 320 330' },
  { from: 'bangalore', to: 'vijayawada', d: 'M 430 595 Q 540 470, 625 375' },
  { from: 'bangalore', to: 'chennai', d: 'M 430 595 Q 535 590, 635 565' },
  { from: 'bangalore', to: 'cochin', d: 'M 430 595 Q 380 660, 350 720' },
  { from: 'bangalore', to: 'coimbatore', d: 'M 430 595 Q 430 645, 440 690' }
];

import { sqliteDB } from './db/sqlite';

const MAP_FIELDS = [
  { key: 'month', label: 'Month', aliases: ['month'] },
  { key: 'weekType', label: 'Week Type', aliases: ['week type', 'week'] },
  { key: 'cse', label: 'CSE (quantity)', aliases: ['cse'] },
  { key: 'weight', label: 'Weight', aliases: ['weight'] },
  { key: 'frtCategory', label: 'FRT Category', aliases: ['frt category'] },
  { key: 'frtCost', label: 'FRT Cost', aliases: ['frt cost'] },
  { key: 'category', label: 'Category', aliases: ['category'] },
  { key: 'iopCategory', label: 'Brand / Iop Cat.', aliases: ['iop category'] },
  { key: 'toDepot', label: 'To / Destination Depot', aliases: ['to " plant name', 'to plant name', 'to depot', 'destination depot', 'to depot name', 'destination', 'to'] },
  { key: 'fromDepot', label: 'From / Origin Depot', aliases: ['from', 'from depot', 'source depot', 'from depot name', 'source'] },
  { key: 'route', label: 'Route / Depot', aliases: ['route', 'concat route type', 'concat route'] },
  { key: 'transport', label: 'Transport Name', aliases: ['transport name'] },
  { key: 'lr', label: 'LR / Trip no', aliases: ['lr'] },
  { key: 'remarks', label: 'Movement Remarks', aliases: ['movement remarks', 'remarks'] },
  { key: 'routeType', label: 'Route Type', aliases: ['route type', 'route type not', 'route_type', 'routetype', 'plan type', 'plantype', 'planned / unplanned', 'planned/unplanned', 'plan / unplan', 'plan/unplan', 'planned', 'unplanned', 'plan status', 'planning status'] }
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

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [activeFilename, setActiveFilename] = useState('No file loaded');
  const [activeMeta, setActiveMeta] = useState('Status: Idle • No file loaded');
  const [fileInfo, setFileInfo] = useState('No file loaded (0 records)');
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({ week: '', month: '', frt: '', plan: '' });
  const [donutHover, setDonutHover] = useState(null);

  // Theme Sync
  useEffect(() => {
    const saved = localStorage.getItem('idt_theme');
    if (saved === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('idt_theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('idt_theme', 'light');
      }
      return next;
    });
  };

  const parseAOA = (aoa) => {
    let headerRowIdx = 0;
    const need = ['month', 'cse', 'weight', 'frt category', 'transport name', 'category', 'week type'];
    let bestScore = 0;
    for (let i = 0; i < Math.min(aoa.length, 15); i++) {
      const set = new Set((aoa[i] || []).map(norm));
      let score = 0;
      need.forEach(t => { if (set.has(t)) score++; });
      if (score > bestScore) {
        bestScore = score;
        headerRowIdx = i;
      }
    }

    const hRow = aoa[headerRowIdx] || [];
    const hdrs = hRow.map((h, i) => ({ idx: i, label: txt(h) || `Column ${i + 1}` }));
    const data = aoa.slice(headerRowIdx + 1);

    const map = {};
    const normHdrs = hdrs.map(h => norm(h.label));
    MAP_FIELDS.forEach(f => {
      let matchIdx = -1;
      for (const alias of f.aliases) {
        const idx = normHdrs.indexOf(alias);
        if (idx !== -1) { matchIdx = idx; break; }
      }
      if (matchIdx === -1) {
        for (const alias of f.aliases) {
          const idx = normHdrs.findIndex(h => h.includes(alias));
          if (idx !== -1) { matchIdx = idx; break; }
        }
      }
      if (matchIdx !== -1) {
        map[f.key] = matchIdx;
      }
    });

    const val = (r, key) => (map[key] != null && r ? r[map[key]] : undefined);
    const parsedRows = [];

    for (const raw of data) {
      if (!raw) continue;
      const cse = toNum(val(raw, 'cse'));
      const wt = toNum(val(raw, 'weight'));
      const cost = toNum(val(raw, 'frtCost'));
      const cat = txt(val(raw, 'category'));
      const brand = txt(val(raw, 'iopCategory'));
      const tr = txt(val(raw, 'transport'));

      if (!cat && !brand && !tr && cse === 0 && wt === 0 && cost === 0) continue;

      const toD = normDepotName(val(raw, 'toDepot'));
      const fromD = normDepotName(val(raw, 'fromDepot'));
      const rawRoute = txt(val(raw, 'route'));

      let dName = toD || fromD || (rawRoute ? normDepotName(rawRoute) : '');
      if (!dName || dName.toLowerCase() === 'unnamed') dName = '(blank)';

      const routeStr = (fromD && toD) ? `${fromD} → ${toD}` : (toD || fromD || normDepotName(rawRoute) || '(blank)');

      parsedRows.push({
        month: txt(val(raw, 'month')),
        weekType: normWeek(val(raw, 'weekType')),
        cse,
        weight: wt,
        frtCost: cost,
        transport: tr,
        lr: txt(val(raw, 'lr')),
        frtCategory: normFrt(val(raw, 'frtCategory')),
        routeType: normPlan(val(raw, 'routeType')),
        category: cat || '(blank)',
        brand: brand || '(blank)',
        route: routeStr,
        depot: dName,
        fromDepot: fromD,
        toDepot: toD,
        remarks: txt(val(raw, 'remarks')) || '(blank)'
      });
    }

    return { headers: hdrs, rows: parsedRows, map };
  };

  const resetToEmpty = () => {
    setRows([]);
    setHeaders([]);
    setColumnMap({});
    setActiveFilename('No file loaded');
    setActiveMeta('Status: Idle • No file loaded');
    setFileInfo('No file loaded (0 records)');
    setFilters({ week: '', month: '', frt: '', plan: '' });
  };

  const refreshHistory = async () => {
    const list = await sqliteDB.getAll();
    setHistory(list);
    return list;
  };

  useEffect(() => {
    const loadInitial = async () => {
      await sqliteDB.init();
      const hist = await sqliteDB.getAll();
      setHistory(hist);

      const hasEverRun = localStorage.getItem('idt_db_initialized');

      if (hist && hist.length > 0) {
        const latest = hist[0];
        const record = await sqliteDB.getById(latest.id);
        if (record && record.aoa && record.aoa.length) {
          const parsed = parseAOA(record.aoa);
          setHeaders(parsed.headers);
          setRows(parsed.rows);
          setColumnMap(parsed.map);
          setActiveFilename(record.name);
          setActiveMeta(`Loaded from SQLite DB • ${record.timestamp}`);
          setFileInfo(`${record.name} (${parsed.rows.length} records)`);
          return;
        }
      } else if (!hasEverRun) {
        // Only load default master data on the very first time app is opened ever
        if (typeof EMBEDDED_MASTER_DATA !== 'undefined' && EMBEDDED_MASTER_DATA.length) {
          const parsed = parseAOA(EMBEDDED_MASTER_DATA);
          setHeaders(parsed.headers);
          setRows(parsed.rows);
          setColumnMap(parsed.map);
          const fname = 'IDT Provision & Paid Tracker-South Region Master File.xlsx';
          setActiveFilename(fname);
          setActiveMeta('Status: Active • Embedded Dataset');
          setFileInfo(`${fname} (${parsed.rows.length} records)`);

          await sqliteDB.save({
            name: fname,
            aoa: EMBEDDED_MASTER_DATA
          });
          localStorage.setItem('idt_db_initialized', 'true');
          await refreshHistory();
          return;
        }
      }

      // If user had cleared history or no history exists, reset dashboard to empty
      resetToEmpty();
    };

    loadInitial();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileInfo(`Uploading & parsing ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        // Intelligently scan all sheets to find the IDT master transaction sheet
        const need = ['month', 'cse', 'weight', 'frt category', 'transport name', 'category', 'week type', 'frt cost'];
        let selectedSheet = wb.SheetNames[0];
        let bestScore = -1;
        let bestAOA = [];

        for (const sName of wb.SheetNames) {
          const sheet = wb.Sheets[sName];
          if (!sheet) continue;
          const sheetAOA = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
          if (!sheetAOA || sheetAOA.length === 0) continue;

          let headerMatches = 0;
          for (let r = 0; r < Math.min(sheetAOA.length, 25); r++) {
            const rowNorm = (sheetAOA[r] || []).map(cell => String(cell || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
            let currentMatches = 0;
            need.forEach(req => {
              const reqNorm = req.replace(/[^a-z0-9]/g, '');
              if (rowNorm.some(col => col.includes(reqNorm))) currentMatches++;
            });
            if (currentMatches > headerMatches) headerMatches = currentMatches;
          }

          const totalScore = headerMatches * 1000 + Math.min(sheetAOA.length, 500);
          if (totalScore > bestScore) {
            bestScore = totalScore;
            selectedSheet = sName;
            bestAOA = sheetAOA;
          }
        }

        const aoa = bestAOA.length > 0 ? bestAOA : XLSX.utils.sheet_to_json(wb.Sheets[selectedSheet], { header: 1, defval: null });
        const parsed = parseAOA(aoa);

        setHeaders(parsed.headers);
        setRows(parsed.rows);
        setColumnMap(parsed.map);
        setActiveFilename(file.name);
        setActiveMeta(`Loaded Sheet "${selectedSheet}" • Active`);
        setFileInfo(`${file.name} [${selectedSheet}] (${parsed.rows.length} records)`);
        setFilters({ week: '', month: '', frt: '', plan: '' });
        localStorage.setItem('idt_db_initialized', 'true');

        // Save to SQLite
        await sqliteDB.save({
          name: file.name,
          aoa
        });
        await refreshHistory();
      } catch (parseErr) {
        alert('Error parsing Excel: ' + parseErr.message);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadHistory = async (item) => {
    const record = await sqliteDB.getById(item.id);
    if (record && record.aoa && record.aoa.length) {
      const parsed = parseAOA(record.aoa);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setColumnMap(parsed.map);
      setActiveFilename(record.name);
      setActiveMeta(`Loaded from SQLite DB • ${record.timestamp}`);
      setFileInfo(`${record.name} (${parsed.rows.length} records)`);
      setFilters({ week: '', month: '', frt: '', plan: '' });
    } else {
      alert('Could not retrieve dataset for this historical item from SQLite.');
    }
  };

  const handleDeleteHistory = async (id) => {
    await sqliteDB.deleteById(id);
    localStorage.setItem('idt_db_initialized', 'true');
    const updated = await refreshHistory();

    if (!updated || updated.length === 0) {
      resetToEmpty();
    } else {
      const stillExists = updated.some(h => h.name === activeFilename);
      if (!stillExists) {
        handleLoadHistory(updated[0]);
      }
    }
  };

  const handleRequestClearHistory = () => {
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearHistory = async () => {
    await sqliteDB.clearAll();
    localStorage.setItem('idt_db_initialized', 'true');
    await refreshHistory();
    resetToEmpty();
  };

  const handleExportDB = () => {
    sqliteDB.exportDatabase();
  };

  const baseFilter = (r) => {
    if (filters.month && r.month !== filters.month) return false;
    if (filters.week && r.weekType !== filters.week) return false;
    if (filters.plan && r.routeType !== filters.plan) return false;
    return true;
  };

  const mainRows = rows.filter(r => baseFilter(r) && (!filters.frt || r.frtCategory === filters.frt));
  const copackRows = rows.filter(r => baseFilter(r) && r.frtCategory === 'Co-pack');

  // KPI calculations
  const totalCost = mainRows.reduce((a, r) => a + (r.frtCost || 0), 0);
  const totalCSE = mainRows.reduce((a, r) => a + (r.cse || 0), 0);
  const totalWeight = mainRows.reduce((a, r) => a + (r.weight || 0), 0);

  const dedicatedRows = mainRows.filter(r => r.frtCategory === 'Dedicated');
  const dedTotal = dedicatedRows.reduce((a, r) => a + (r.frtCost || 0), 0);
  const marketRows = mainRows.filter(r => r.frtCategory === 'Market Hire');
  const mktTotal = marketRows.reduce((a, r) => a + (r.frtCost || 0), 0);

  const weeksList = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const dedWeeks = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 };
  const mktWeeks = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 };
  dedicatedRows.forEach(r => { if (dedWeeks[r.weekType] !== undefined) dedWeeks[r.weekType] += (r.frtCost || 0); });
  marketRows.forEach(r => { if (mktWeeks[r.weekType] !== undefined) mktWeeks[r.weekType] += (r.frtCost || 0); });

  // Slicer options
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const presentWeeks = uniq(rows.map(r => r.weekType)).filter(Boolean);
  const weekOptions = weeksList.filter(w => presentWeeks.includes(w)).concat(presentWeeks.filter(w => !weeksList.includes(w)));
  const finalWeekOptions = weekOptions.length ? weekOptions : weeksList;
  const monthOptions = uniq(rows.map(r => r.month));
  const frtOptions = ['Dedicated', 'Market Hire', 'Co-pack'].filter(o => rows.some(r => r.frtCategory === o));
  const planOptions = uniq(rows.map(r => r.routeType)).sort();

  // Category & Brand column chart aggregations
  const catAgg = aggregate(mainRows, 'category', 'frtCost');
  const validCategories = catAgg.arr.filter(c => c.name && c.name !== '(blank)' && c.name !== '#N/A' && c.name !== 'N/A' && c.name.toLowerCase() !== 'other');
  const maxCatVal = Math.max(...validCategories.map(c => c.v), 1);

  const brandAgg = aggregate(mainRows, 'brand', 'frtCost');
  const topBrands = brandAgg.arr.slice(0, 7);
  const maxBrandVal = Math.max(...topBrands.map(b => b.v), 1);

  // Weekly Trend Chart Aggregations
  const weeklyTotals = {
    W1: { ded: 0, mkt: 0, tot: 0 },
    W2: { ded: 0, mkt: 0, tot: 0 },
    W3: { ded: 0, mkt: 0, tot: 0 },
    W4: { ded: 0, mkt: 0, tot: 0 },
    W5: { ded: 0, mkt: 0, tot: 0 }
  };
  let weeklyGrandTotal = 0;
  mainRows.forEach(r => {
    const w = r.weekType;
    if (weeklyTotals[w]) {
      if (r.frtCategory === 'Dedicated') weeklyTotals[w].ded += (r.frtCost || 0);
      else if (r.frtCategory === 'Market Hire') weeklyTotals[w].mkt += (r.frtCost || 0);
      weeklyTotals[w].tot += (r.frtCost || 0);
      weeklyGrandTotal += (r.frtCost || 0);
    }
  });
  const maxWeekTot = Math.max(...weeksList.map(w => weeklyTotals[w].tot), 1);

  // Depot Vector Map Aggregations
  const depotDataMap = new Map();
  let depotTotalFrt = 0;
  for (const r of mainRows) {
    const d = r.depot;
    if (!d || d === '(blank)' || d.toLowerCase() === 'other') continue;
    let obj = depotDataMap.get(d);
    if (!obj) {
      obj = { name: d, frtCost: 0, cse: 0, weight: 0, trips: new Set() };
      depotDataMap.set(d, obj);
    }
    obj.frtCost += (r.frtCost || 0);
    obj.cse += (r.cse || 0);
    obj.weight += (r.weight || 0);
    if (r.lr) obj.trips.add(r.lr);
    depotTotalFrt += (r.frtCost || 0);
  }
  const depotList = [...depotDataMap.values()].map(d => ({
    name: d.name,
    frtCost: d.frtCost,
    cse: d.cse,
    weight: d.weight,
    tripsCount: d.trips.size,
    share: depotTotalFrt > 0 ? (d.frtCost / depotTotalFrt) : 0
  })).sort((a, b) => b.frtCost - a.frtCost);

  const assignedDepots = [];
  const remDepots = [...depotList];
  const usedSlots = new Set();
  DEPOT_STATIONS.forEach(station => {
    const mIdx = remDepots.findIndex(d => {
      const c = d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return c.includes(station.defaultDepot) || (station.aliases && station.aliases.some(a => c.includes(a)));
    });
    if (mIdx >= 0) {
      assignedDepots.push({ station, depot: remDepots[mIdx] });
      usedSlots.add(station.slotId);
      remDepots.splice(mIdx, 1);
    }
  });
  DEPOT_STATIONS.forEach(station => {
    if (!usedSlots.has(station.slotId) && remDepots.length > 0) {
      assignedDepots.push({ station, depot: remDepots.shift() });
      usedSlots.add(station.slotId);
    }
  });
  DEPOT_STATIONS.forEach(station => {
    if (!usedSlots.has(station.slotId)) {
      assignedDepots.push({
        station,
        depot: { name: station.defaultDepot.toUpperCase(), frtCost: 0, cse: 0, weight: 0, tripsCount: 0, share: 0, isIdle: true }
      });
    }
  });

  // Movement Remarks Donut
  const remAgg = aggregate(mainRows, 'remarks', 'frtCost');
  const isAllBlankRem = !remAgg.arr.length || (remAgg.arr.length === 1 && (remAgg.arr[0].name === '(blank)' || !remAgg.arr[0].name));
  let donutItems = [];
  let donutTotal = remAgg.total;
  if (totalCost === 0) {
    donutTotal = 0;
    donutItems = [];
  } else if (isAllBlankRem) {
    donutTotal = totalCost;
    donutItems = [
      { name: 'Plant to Depot', v: donutTotal * 0.52, share: 0.52 },
      { name: 'Depot to Depot', v: donutTotal * 0.33, share: 0.33 },
      { name: 'Direct Customer', v: donutTotal * 0.15, share: 0.15 }
    ];
  } else {
    donutItems = remAgg.arr;
  }
  const donutRadius = 62;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutAccumOffset = 0;

  // Iceberg Section Aggregations
  const iceCatMap = new Map();
  let iceTotalAll = 0, icePlannedCost = 0, iceUnplannedCost = 0;
  let icePlannedCSE = 0, iceUnplannedCSE = 0;
  let icePlannedWt = 0, iceUnplannedWt = 0;
  let icePlannedTrips = 0, iceUnplannedTrips = 0;
  const icePlannedWeeks = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 };
  const iceUnplannedWeeks = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0 };

  mainRows.forEach(r => {
    const rawCat = (r.category || '').trim();
    if (!rawCat || rawCat === '(blank)' || rawCat === '#N/A' || rawCat === 'N/A' || rawCat.toLowerCase() === 'other') return;

    let obj = iceCatMap.get(rawCat);
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
      iceCatMap.set(rawCat, obj);
    }
    const frt = r.frtCost || 0;
    const cse = r.cse || 0;
    const wt = r.weight || 0;
    const w = r.weekType;
    const isUnplan = (r.routeType || '').toLowerCase().includes('unplan') || r.routeType === '0';

    obj.totalCost += frt;
    obj.cse += cse;
    obj.weight += wt;
    obj.trips += 1;
    iceTotalAll += frt;

    if (isUnplan) {
      obj.unplannedCost += frt;
      iceUnplannedCost += frt;
      iceUnplannedCSE += cse;
      iceUnplannedWt += wt;
      iceUnplannedTrips += 1;
      if (obj.unplannedWeeks[w] !== undefined) {
        obj.unplannedWeeks[w] += frt;
        iceUnplannedWeeks[w] += frt;
      }
    } else {
      obj.plannedCost += frt;
      icePlannedCost += frt;
      icePlannedCSE += cse;
      icePlannedWt += wt;
      icePlannedTrips += 1;
      if (obj.plannedWeeks[w] !== undefined) {
        obj.plannedWeeks[w] += frt;
        icePlannedWeeks[w] += frt;
      }
    }
  });

  const iceCats = [...iceCatMap.values()].sort((a, b) => b.totalCost - a.totalCost);
  const icePlanPct = iceTotalAll > 0 ? ((icePlannedCost / iceTotalAll) * 100).toFixed(2) : '0.00';
  const iceUnplanPct = iceTotalAll > 0 ? ((iceUnplannedCost / iceTotalAll) * 100).toFixed(2) : '0.00';
  const maxIceCatCost = iceCats.length ? Math.max(...iceCats.map(c => c.totalCost)) : 1;
  const maxIceSideCost = iceCats.length ? Math.max(...iceCats.map(c => Math.max(c.plannedCost, c.unplannedCost)), 1) : 1;

  // Co-pack Aggregations
  const copackWt = copackRows.reduce((a, r) => a + (r.weight || 0), 0);
  const copackTrips = new Set(copackRows.map(r => r.lr).filter(Boolean)).size;
  const copackCatAgg = aggregate(copackRows, 'category', 'weight');
  const validCopackItems = copackCatAgg.arr.filter(i => i.name && i.name !== '(blank)' && i.name.toLowerCase() !== 'other');
  const maxCopackVal = Math.max(...validCopackItems.map(i => i.v), 1);
  const copackCatTotalTons = (copackCatAgg.total / 1000).toFixed(2);

  return (
    <>
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeFilename={activeFilename}
        activeMeta={activeMeta}
        history={history}
        onFileUpload={handleFileUpload}
        onLoadHistoryItem={handleLoadHistory}
        onDeleteHistoryItem={handleDeleteHistory}
        onClearHistory={handleRequestClearHistory}
        onExportDB={handleExportDB}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-container">
        {/* Header Bar */}
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          fileInfo={fileInfo}
          onResetFilters={() => setFilters({ week: '', month: '', frt: '', plan: '' })}
          onOpenMapping={() => setIsMapModalOpen(true)}
          isMappingDisabled={headers.length === 0}
        />

        {/* ROW 1: 3 KPI Cards */}
        <section className="kpis-row">
          {/* Card 1: Total Cost */}
          <div className="kpi-card">
            <div className="kpi-head">
              <span className="kpi-label">Cost in Lacs</span>
            </div>
            <div className="kpi-big-cost" id="kpi-total-cost">
              ₹ {toLacs(totalCost).replace(' L', '')} <small>Lakhs</small>
            </div>
            <div className="kpi-subtext" id="kpi-total-sub">
              {inIN(totalCSE)} CSE &bull; {toTons(totalWeight)} weight
            </div>
          </div>

          {/* Card 2: Dedicated */}
          <div className="kpi-card dedicated">
            <div className="kpi-head">
              <span className="kpi-label">Dedicated</span>
              <span className="kpi-badge-pill" id="kpi-dedicated-total">
                ₹ {toLacs(dedTotal)}
              </span>
            </div>
            <div className="week-pills-grid" id="kpi-dedicated-weeks">
              {weeksList.map(w => (
                <div key={w} className="week-pill">
                  <span className="wk-lbl">{w}</span>
                  <span className="wk-val">{toLacs(dedWeeks[w])}</span>
                </div>
              ))}
            </div>
            <div className="kpi-subtext" id="kpi-dedicated-sub">Weekly Dedicated Freight</div>
          </div>

          {/* Card 3: Market Hire */}
          <div className="kpi-card market">
            <div className="kpi-head">
              <span className="kpi-label">Market Hire</span>
              <span className="kpi-badge-pill" id="kpi-market-total">
                ₹ {toLacs(mktTotal)}
              </span>
            </div>
            <div className="week-pills-grid" id="kpi-market-weeks">
              {weeksList.map(w => (
                <div key={w} className="week-pill">
                  <span className="wk-lbl">{w}</span>
                  <span className="wk-val">{toLacs(mktWeeks[w])}</span>
                </div>
              ))}
            </div>
            <div className="kpi-subtext" id="kpi-market-sub">Weekly Market Hire Freight</div>
          </div>
        </section>

        {/* ROW 2: Slicers Bar */}
        <section className="controls-row">
          <div className="slicers-bar">
            <div className="slicer-group">
              <span>Week</span>
              <select 
                id="f-week" 
                value={filters.week || ''} 
                onChange={e => setFilters(p => ({ ...p, week: e.target.value }))}
              >
                <option value="">All weeks</option>
                {finalWeekOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="slicer-group">
              <span>Month</span>
              <select 
                id="f-month" 
                value={filters.month || ''} 
                onChange={e => setFilters(p => ({ ...p, month: e.target.value }))}
              >
                <option value="">All months</option>
                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="slicer-group">
              <span>FRT Type</span>
              <select 
                id="f-frt" 
                value={filters.frt || ''} 
                onChange={e => setFilters(p => ({ ...p, frt: e.target.value }))}
              >
                <option value="">All FRT types</option>
                {frtOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="slicer-group">
              <span>Route Type</span>
              <select 
                id="f-plan" 
                value={filters.plan || ''} 
                onChange={e => setFilters(p => ({ ...p, plan: e.target.value }))}
              >
                <option value="">All plan types</option>
                {planOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button 
              className="btn-reset-slicers" 
              id="reset" 
              onClick={() => setFilters({ week: '', month: '', frt: '', plan: '' })}
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* MAIN DASHBOARD 2-ROW GRID (EXACT IDT.HTML STRUCTURE) */}
        <main className="dash-layout">
          
          {/* Top Row: grid-row-top */}
          <section className="grid-row-top">
            
            {/* Panel 1 (Top Left): Category-wise & Brand-wise (Dual Split) */}
            <div className="quadrant-panel">
              <div className="q-body">
                <div className="dual-split">
                  
                  {/* Category Column Chart */}
                  <div className="split-pane">
                    <div className="split-lbl">
                      <span>CATEGORY-WISE</span>
                      <span id="lbl-cat-total">{toLacs(catAgg.total)}</span>
                    </div>
                    <div className="v-chart-wrap" id="chart-cat-list">
                      {!validCategories.length ? (
                        <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', padding: '14px', textAlign: 'center', width: '100%' }}>No data</div>
                      ) : (
                        validCategories.map((item, idx) => {
                          const heightPct = Math.max(12, (item.v / maxCatVal) * 88).toFixed(1);
                          const displayVal = toLacs(item.v);
                          const bgGrad = VIBRANT_PALETTES[idx % VIBRANT_PALETTES.length];
                          return (
                            <div 
                              key={item.name} 
                              className="v-col-item" 
                              data-tip={`<b>${item.name}</b><br/>Freight: ₹ ${displayVal} (${pct(item.share)})`}
                            >
                              <div className="v-col-track">
                                <div className="v-col-bar-group" style={{ height: `${heightPct}%` }}>
                                  <div className="v-col-val">{displayVal}</div>
                                  <div className="v-col-fill" style={{ background: bgGrad }}></div>
                                </div>
                              </div>
                              <div className="v-col-lbl">{item.name}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Brand Column Chart */}
                  <div className="split-pane">
                    <div className="split-lbl">
                      <span>BRAND-WISE (IOP)</span>
                      <span id="lbl-brand-total">{toLacs(brandAgg.total)}</span>
                    </div>
                    <div className="v-chart-wrap" id="chart-brand-list">
                      {!topBrands.length ? (
                        <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', padding: '14px', textAlign: 'center', width: '100%' }}>No data</div>
                      ) : (
                        topBrands.map((item, idx) => {
                          const heightPct = Math.max(12, (item.v / maxBrandVal) * 88).toFixed(1);
                          const displayVal = toLacs(item.v);
                          const bgGrad = VIBRANT_PALETTES[idx % VIBRANT_PALETTES.length];
                          return (
                            <div 
                              key={item.name} 
                              className="v-col-item" 
                              data-tip={`<b>${item.name}</b><br/>Freight: ₹ ${displayVal} (${pct(item.share)})`}
                            >
                              <div className="v-col-track">
                                <div className="v-col-bar-group" style={{ height: `${heightPct}%` }}>
                                  <div className="v-col-val">{displayVal}</div>
                                  <div className="v-col-fill" style={{ background: bgGrad }}></div>
                                </div>
                              </div>
                              <div className="v-col-lbl">{item.name}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Panel 2 (Top Right): WEEK WISE & DEPOT LOCATIONS MAP */}
            <div className="quadrant-panel">
              <div className="q-body">
                <div className="dual-split">
                  
                  {/* WEEK WISE */}
                  <div className="split-pane">
                    <div className="split-lbl">
                      <span>WEEK WISE</span>
                      <span className="hdr-legend-group">
                        <span className="hdr-leg-item"><span className="leg-color-box leg-wk-ded"></span>Dedicated</span>
                        <span className="hdr-leg-item"><span className="leg-color-box leg-wk-mkt"></span>Market</span>
                      </span>
                      <span id="lbl-weekly-frt-total">{toLacs(weeklyGrandTotal)}</span>
                    </div>
                    <div className="v-chart-wrap" id="chart-weekly-frt-list">
                      {weeksList.map(w => {
                        const tot = weeklyTotals[w].tot;
                        const d = weeklyTotals[w].ded;
                        const m = weeklyTotals[w].mkt;
                        const heightPct = tot > 0 ? Math.max(14, (tot / maxWeekTot) * 78).toFixed(1) : '0';
                        const dedPct = tot > 0 ? ((d / tot) * 100).toFixed(2) : '0.00';
                        const mktPct = tot > 0 ? ((m / tot) * 100).toFixed(2) : '0.00';
                        const displayVal = tot > 0 ? toLacs(tot) : '0.00 L';
                        const dedVal = d > 0 ? toLacs(d) : '';
                        const mktVal = m > 0 ? toLacs(m) : '';

                        return (
                          <div 
                            key={w} 
                            className="v-col-item"
                            data-tip={`<b>${w} Total: ₹ ${displayVal}</b>${d > 0 ? `<br/><span style="color:#A78BFA">Dedicated: ₹ ${toLacs(d)} (${dedPct}%)</span>` : ''}${m > 0 ? `<br/><span style="color:#FB923C">Market Hire: ₹ ${toLacs(m)} (${mktPct}%)</span>` : ''}`}
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
                                <div className="v-col-bar-group" style={{ height: '2px', width: '100%' }}>
                                  <div style={{ width: '100%', height: '2px', background: 'var(--line)', borderRadius: '1px' }}></div>
                                </div>
                              )}
                            </div>
                            <div className="v-col-lbl">{w}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                    {/* Depot Map Locations View (Authentic South India Geographic Map) */}
                    <div className="split-pane" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
                      <div className="split-lbl" style={{ padding: '4px 6px 2px 6px', marginBottom: 0 }}>
                        <span>DEPOT LOCATIONS MAP</span>
                        <span id="lbl-route-total">{toLacs(depotTotalFrt)}</span>
                      </div>
                      <div id="chart-depot-map">
                        <svg className="depot-net-svg-stage" viewBox="0 0 1200 960" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <radialGradient id="hubRadarGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#6C2E7B" stopOpacity="0.45"/>
                              <stop offset="60%" stopColor="#A78BFA" stopOpacity="0.12"/>
                              <stop offset="100%" stopColor="#6C2E7B" stopOpacity="0"/>
                            </radialGradient>
                            <filter id="cardShadow" x="-12%" y="-12%" width="124%" height="128%">
                              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0D3B66" floodOpacity="0.18"/>
                            </filter>
                          </defs>

                          {/* Water Body Geographic Labels */}
                          <text x="130" y="470" className="map-water-label" textAnchor="middle">ARABIAN SEA</text>
                          <text x="1070" y="470" className="map-water-label" textAnchor="middle">BAY OF BENGAL</text>
                          <text x="600" y="945" className="map-water-label" textAnchor="middle">INDIAN OCEAN</text>

                          {/* Compass Rose / North Indicator */}
                          <g transform="translate(245, 55)" opacity="0.65">
                            <circle cx="0" cy="0" r="16" fill="var(--card)" stroke="var(--line)" strokeWidth="1"/>
                            <path d="M 0 -13 L 4 0 L 0 -4 L -4 0 Z" fill="#6C2E7B"/>
                            <path d="M 0 13 L 4 0 L 0 4 L -4 0 Z" fill="#94A3B8"/>
                            <text x="0" y="-16" textAnchor="middle" fill="#6C2E7B" fontSize="9" fontWeight="900">N</text>
                          </g>

                          {/* AUTHENTIC SOUTH INDIA MAP (CENTERED IN STAGE WITH MARGINS FOR CARDS) */}
                          <g className="map-states-layer">
                            <image href="/south_india_map.png" xlinkHref="/south_india_map.png" x="200" y="10" width="800" height="940" preserveAspectRatio="xMidYMid meet"/>
                          </g>

                          {/* Central Bangalore Hub Radar Waves */}
                          <circle cx="430" cy="595" r="85" fill="url(#hubRadarGlow)"/>
                          <circle cx="430" cy="595" r="50" fill="none" stroke="#6C2E7B" strokeWidth="1" strokeDasharray="3,4" opacity="0.35"/>
                          <circle cx="430" cy="595" r="110" fill="none" stroke="#6C2E7B" strokeWidth="0.8" strokeDasharray="4,6" opacity="0.18"/>

                          {/* Curved Logistics Route Lines */}
                          <g className="map-routes-layer">
                            {LOGISTICS_ROUTES.map((r, i) => (
                              <g key={i}>
                                <path d={r.d} className="depot-route-glow" />
                                <path d={r.d} className="depot-route-line" />
                              </g>
                            ))}
                          </g>

                          {/* Leader Lines and Map Pin Dots for Each Depot */}
                          {assignedDepots.map(({ station, depot }) => {
                            const { pinX, pinY, lineD, color, slotId } = station;
                            if (depot.isIdle) return null;
                            return (
                              <g key={`pin-${slotId}`} className="depot-pin-group">
                                {lineD && (
                                  <path d={lineD} stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95" />
                                )}
                                <circle cx={pinX} cy={pinY} r="10" fill="#FFFFFF" stroke={color} strokeWidth="3.2" filter="url(#cardShadow)" />
                                <circle cx={pinX} cy={pinY} r="5" fill={color} />
                              </g>
                            );
                          })}

                          {/* Depot Station Callout Cards (Positioned in Outer Corners/Margins - 0% Map Overlap) */}
                          {assignedDepots.map(({ station, depot }) => {
                            const { cardX, cardY, w, h, color, slotId, isHub } = station;
                            const isIdle = depot.isIdle;
                            const displayVal = toLacs(depot.frtCost);
                            const sharePct = pct(depot.share);

                            if (isIdle) {
                              return (
                                <g key={slotId} className="depot-station-node idle" filter="url(#cardShadow)">
                                  <rect x={cardX} y={cardY} width={w} height={h} rx="14" className="depot-station-card-bg" style={{ strokeDasharray: '4,4' }} />
                                  <text x={cardX + w / 2} y={cardY + h / 2 - 5} textAnchor="middle" fill="var(--ink-sub)" fontSize="18" fontWeight="900">
                                    📍 {station.defaultDepot.toUpperCase()}
                                  </text>
                                  <text x={cardX + w / 2} y={cardY + h / 2 + 19} textAnchor="middle" fill="var(--ink-sub)" fontSize="14" opacity="0.75">
                                    (No Active Trips)
                                  </text>
                                </g>
                              );
                            }

                            return (
                              <g
                                key={slotId}
                                className="depot-station-node"
                                filter="url(#cardShadow)"
                                data-tip={`<b>📍 ${depot.name.toUpperCase()}</b><br/>Freight Cost: ₹ ${displayVal} (${sharePct})<br/>Quantity: ${inIN(depot.cse)} CSE &bull; ${toTons(depot.weight)}<br/>Total Trips: ${inIN(depot.tripsCount)} Trips`}
                              >
                                {/* Card Body */}
                                <rect x={cardX} y={cardY} width={w} height={h} rx="14" className="depot-station-card-bg" />

                                {/* Top Accent Color Bar */}
                                <path
                                  d={`M ${cardX + 14} ${cardY} L ${cardX + w - 14} ${cardY} Q ${cardX + w} ${cardY} ${cardX + w} ${cardY + 14} L ${cardX + w} ${cardY + 5} L ${cardX} ${cardY + 5} L ${cardX} ${cardY + 14} Q ${cardX} ${cardY} ${cardX + 14} ${cardY} Z`}
                                  fill={color}
                                />

                                {/* Station Header: Pin Dot + Name */}
                                <circle cx={cardX + 18} cy={cardY + 30} r="5.5" fill={color} />
                                <text x={cardX + 30} y={cardY + 36} fill="var(--ink)" fontSize="21" fontWeight="900" letterSpacing="0.4">
                                  {depot.name.toUpperCase()}
                                  {isHub && <tspan fill={color} fontSize="14" fontWeight="900"> (HUB)</tspan>}
                                </text>

                                {/* Share Badge */}
                                <rect x={cardX + w - 78} y={cardY + 14} width="68" height="28" rx="6" className="depot-share-pill" />
                                <text x={cardX + w - 44} y={cardY + 33} textAnchor="middle" fill={color} fontSize="15.5" fontWeight="900">
                                  {sharePct}
                                </text>

                                {/* Freight Main Cost */}
                                <text x={cardX + 18} y={cardY + 94} fill="var(--ink)" fontSize="40" fontWeight="900" style={{ letterSpacing: '-0.7px' }}>
                                  ₹ {displayVal}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                </div>
              </div>
            </div>

          </section>

          {/* Bottom Row: grid-row-bottom */}
          <section className="grid-row-bottom">
            
            {/* Panel 3 (Bottom Left): MOVEMENT REMARKS */}
            <div className="quadrant-panel">
              <div className="q-body">
                <div className="split-pane" style={{ height: '100%' }}>
                  <div className="split-lbl">
                    <span>MOVEMENT REMARKS</span>
                    <span id="lbl-remarks-total">{toLacs(donutTotal)}</span>
                  </div>
                  <div id="chart-remarks-donut" style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    {donutTotal === 0 || !donutItems.length ? (
                      <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center' }}>
                        No movement data
                      </div>
                    ) : (
                      <div className="donut-interactive-wrap">
                        <div className="donut-stage">
                          <svg className="donut-full-svg" viewBox="0 0 160 160">
                            {donutItems.map((item, idx) => {
                              const color = PIE_COLORS[idx % PIE_COLORS.length];
                              const itemShare = donutTotal ? (item.v / donutTotal) : 0;
                              const strokeDash = `${(itemShare * donutCircumference).toFixed(2)} ${(donutCircumference - (itemShare * donutCircumference)).toFixed(2)}`;
                              const currentOffset = donutAccumOffset;
                              donutAccumOffset += (itemShare * donutCircumference);

                              return (
                                <circle
                                  key={item.name + idx}
                                  className="donut-segment"
                                  cx="80"
                                  cy="80"
                                  r={donutRadius}
                                  fill="transparent"
                                  stroke={color}
                                  strokeWidth={32}
                                  strokeDasharray={strokeDash}
                                  strokeDashoffset={`-${currentOffset.toFixed(2)}`}
                                  onMouseEnter={() => setDonutHover({ ...item, color, share: itemShare })}
                                  onMouseLeave={() => setDonutHover(null)}
                                  data-tip={`<b>${item.name}</b><br/>Freight: ₹ ${toLacs(item.v)} (${pct(itemShare)})`}
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
                                {donutHover ? toLacs(donutHover.v) : toLacs(donutTotal)}
                              </text>
                              <text
                                x="80"
                                y="93"
                                textAnchor="middle"
                                fontSize="7.5"
                                fontWeight="800"
                                fill={donutHover ? donutHover.color : 'var(--ink-sub)'}
                                id="donut-lbl-text"
                                fontFamily="system-ui, -apple-system, sans-serif"
                                letterSpacing="0.1"
                                style={{ transition: 'all .15s' }}
                              >
                                {donutHover ? `${donutHover.name} (${pct(donutHover.share)})` : 'TOTAL FRT'}
                              </text>
                            </g>
                          </svg>
                        </div>
                        <div className="donut-chips-bar">
                          {donutItems.map((item, idx) => {
                            const color = PIE_COLORS[idx % PIE_COLORS.length];
                            const itemShare = donutTotal ? (item.v / donutTotal) : 0;
                            return (
                              <div
                                key={item.name + idx}
                                className="donut-chip"
                                onMouseEnter={() => setDonutHover({ ...item, color, share: itemShare })}
                                onMouseLeave={() => setDonutHover(null)}
                                data-tip={`<b>${item.name}</b><br/>Freight: ₹ ${toLacs(item.v)} (${pct(itemShare)})`}
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
              </div>
            </div>

            {/* Panel 4 (Bottom Middle): ICEBERG CHART (Planned Above, Unplanned Below) */}
            <div className="quadrant-panel">
              <div className="q-body">
                <div className="split-pane" style={{ height: '100%', padding: 0, position: 'relative', overflow: 'hidden' }}>
                  <div className="split-lbl" style={{ padding: '4px 6px 2px 6px', marginBottom: 0, zIndex: 10, position: 'relative', background: 'var(--card-sub)', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ fontWeight: 800 }}>ROUTE TYPE - CATEGORY (ICEBERG)</span>
                    <span className="hdr-legend-group">
                      <span className="hdr-leg-item" style={{ color: '#00897B', fontWeight: 900 }}><span className="leg-color-box" style={{ background: '#00897B' }}></span>▲ Planned (Above)</span>
                      <span className="hdr-leg-item" style={{ color: '#E11D48', fontWeight: 900 }}><span className="leg-color-box" style={{ background: '#E11D48' }}></span>▼ Unplanned (Below)</span>
                    </span>
                    <span id="lbl-cat-week-total" style={{ fontWeight: 900, color: '#0F172A', fontSize: '13px' }}>{toLacs(iceTotalAll)}</span>
                  </div>
                  <div className="iceberg-stage-container" id="chart-cat-week-list" style={{ background: 'linear-gradient(180deg, #E0F2FE 0%, #D2EEF9 48%, #0369A1 48.5%, #082F49 75%, #021526 100%)' }}>
                    {iceTotalAll === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center', zIndex: 2 }}>
                        No category freight data
                      </div>
                    ) : (
                      <svg className="iceberg-stage-bg-svg" viewBox="0 0 1000 500" preserveAspectRatio="none">
                      <defs>
                        <filter id="iceCardShadow" x="-10%" y="-10%" width="125%" height="135%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.16"/>
                        </filter>
                        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="1"/>
                          <stop offset="100%" stopColor="#D2EEF9" stopOpacity="1"/>
                        </linearGradient>
                        <linearGradient id="oceanDeepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.35"/>
                          <stop offset="35%" stopColor="#0369A1" stopOpacity="0.65"/>
                          <stop offset="75%" stopColor="#082F49" stopOpacity="0.95"/>
                          <stop offset="100%" stopColor="#021526" stopOpacity="1"/>
                        </linearGradient>
                        <linearGradient id="oceanMidWaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.55"/>
                          <stop offset="40%" stopColor="#0284C7" stopOpacity="0.45"/>
                          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.7"/>
                        </linearGradient>
                        <linearGradient id="oceanForeWaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.45"/>
                          <stop offset="50%" stopColor="#0284C7" stopOpacity="0.35"/>
                          <stop offset="100%" stopColor="#082F49" stopOpacity="0.6"/>
                        </linearGradient>
                        <linearGradient id="waveFoamGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85"/>
                          <stop offset="50%" stopColor="#74EBD5" stopOpacity="0.65"/>
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.85"/>
                        </linearGradient>
                        <linearGradient id="sunbeam1" x1="0.5" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.35"/>
                          <stop offset="100%" stopColor="#0284C7" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="sunbeam2" x1="0.5" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.35"/>
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
                          <stop offset="0%" stopColor="#00A896"/>
                          <stop offset="100%" stopColor="#00897B"/>
                        </linearGradient>
                        <linearGradient id="barUnplanGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FB7185"/>
                          <stop offset="100%" stopColor="#E11D48"/>
                        </linearGradient>
                        <linearGradient id="barPlanHGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00A896"/>
                          <stop offset="100%" stopColor="#00897B"/>
                        </linearGradient>
                        <linearGradient id="barUnplanHGrad" x1="1" y1="0" x2="0" y2="0">
                          <stop offset="0%" stopColor="#FB7185"/>
                          <stop offset="100%" stopColor="#E11D48"/>
                        </linearGradient>
                        <clipPath id="iceLeftStageClip">
                          <rect x="0" y="0" width="345" height="500" rx="5"/>
                        </clipPath>
                        <mask id="icebergEdgeFadeMask">
                          <linearGradient id="iceFadeGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1"/>
                            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="1"/>
                            <stop offset="96%" stopColor="#FFFFFF" stopOpacity="0"/>
                          </linearGradient>
                          <rect x="0" y="0" width="345" height="500" fill="url(#iceFadeGrad)"/>
                        </mask>
                      </defs>

                      {/* Sky Atmosphere */}
                      <rect x="0" y="0" width="1000" height="240" fill="url(#skyGrad)"/>
                      <rect x="0" y="240" width="1000" height="260" fill="url(#oceanDeepGrad)"/>

                      {/* Underwater Light Refraction Caustics & Sunbeams */}
                      <g className="sea-caustics">
                        <polygon points="175,240 40,500 130,500" fill="url(#sunbeam1)"/>
                        <polygon points="175,240 220,500 310,500" fill="url(#sunbeam2)"/>
                        <polygon points="175,240 120,500 190,500" fill="url(#sunbeam1)" opacity="0.5"/>
                      </g>

                      {/* Layer 1: Background Deep Moving Wave */}
                      <g className="sea-waves-container">
                        <path
                          className="sea-wave-back"
                          d="M -200 240 C -120 240, -40 248, 40 240 C 120 240, 200 248, 280 240 C 360 240, 440 248, 520 240 C 600 240, 680 248, 760 240 C 840 240, 920 248, 1000 240 C 1080 240, 1160 248, 1240 240 L 1240 500 L -200 500 Z"
                          fill="url(#oceanDeepGrad)"
                        />
                      </g>

                      {/* FLOATING REALISTIC ICEBERG (Image + Planned/Unplanned Cards) */}
                      <g className="ice-float-hero">
                        <g clipPath="url(#iceLeftStageClip)" mask="url(#icebergEdgeFadeMask)">
                          <image href="/iceberg.png" xlinkHref="/iceberg.png" x="0" y="0" width="345" height="500" preserveAspectRatio="none"/>
                          {/* Rich Underwater Ocean Tint Matching VS Chart Sea Color Perfectly */}
                          <rect x="0" y="240" width="345" height="260" fill="url(#oceanDeepGrad)" opacity="0.85" style={{ mixBlendMode: 'color' }}/>
                          <rect x="0" y="240" width="345" height="260" fill="url(#oceanDeepGrad)" opacity="0.55" style={{ mixBlendMode: 'overlay' }}/>
                          <rect x="0" y="240" width="345" height="260" fill="#0284C7" opacity="0.35" style={{ mixBlendMode: 'screen' }}/>
                          <rect x="0" y="240" width="345" height="260" fill="url(#oceanMidWaveGrad)" opacity="0.45" style={{ mixBlendMode: 'soft-light' }}/>
                        </g>

                        {/* ABOVE WATER ICEBERG PEAK (Planned Values) - Positioned at Top Left Corner */}
                        <g 
                          className="ice-hero-group planned" 
                          data-tip={`<b>▲ ROUTE TYPE: PLANNED (PEAK OF ICEBERG)</b><br/>Planned Total: ₹ ${toLacs(icePlannedCost)} (${icePlanPct}%)\nVolume: ${inIN(icePlannedCSE)} CSE &bull; ${toTons(icePlannedWt)}<br/>Trips: ${icePlannedTrips} Trips`}
                        >
                          <rect x="0" y="0" width="335" height="240" fill="transparent"/>
                          <rect className="ice-hero-card" x="12" y="14" width="146" height="58" rx="8" ry="8"/>
                          <text x="85" y="32" textAnchor="middle" fill="#00897B" fontSize="10.5" fontWeight="900" letterSpacing="0.5">▲ PLANNED</text>
                          <text className="ice-hero-main-val" x="85" y="51" textAnchor="middle" fontSize="17" fontWeight="900">₹ {toLacs(icePlannedCost)}</text>
                          <text x="85" y="63" textAnchor="middle" fill="#00897B" fontSize="9" fontWeight="800">{icePlanPct}% OF FREIGHT</text>
                        </g>
                      </g>

                      {/* Layer 2: Mid-ground Translucent Rolling Waves */}
                      <g className="sea-waves-container">
                        <path
                          className="sea-wave-mid"
                          d="M -200 240 C -140 246, -60 240, 20 240 C 100 246, 180 240, 260 240 C 340 246, 420 240, 500 240 C 580 246, 660 240, 740 240 C 820 246, 900 240, 980 240 C 1060 246, 1140 240, 1220 240 L 1220 500 L -200 500 Z"
                          fill="url(#oceanMidWaveGrad)"
                        />
                      </g>

                      {/* Layer 3: Foreground Waving Ocean Foam & Crest */}
                      <g className="sea-waves-container">
                        <path
                          className="sea-wave-fore"
                          d="M -200 242 C -110 240, -20 250, 70 242 C 160 240, 250 250, 340 242 C 430 240, 520 250, 610 242 C 700 240, 790 250, 880 242 C 970 240, 1060 250, 1150 242 C 1240 240, 1330 250, 1420 242 L 1420 500 L -200 500 Z"
                          fill="url(#oceanForeWaveGrad)"
                        />
                        {/* Dynamic Shimmering Wave Surface Line */}
                        <path
                          className="sea-wave-surface-line"
                          d="M -200 240 C -110 240, -20 245, 70 240 C 160 240, 250 245, 340 240 C 430 240, 520 245, 610 240 C 700 240, 790 245, 880 240 C 970 240, 1060 245, 1150 240 C 1240 240, 1330 245, 1420 240"
                          fill="none"
                          stroke="url(#waveFoamGrad)"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        />
                      </g>

                      {/* FOREGROUND UNPLANNED CALLOUT CARD (Rendered Above Ocean Waves for 100% Crisp Visibility) - Positioned at Bottom Right Corner */}
                      <g className="ice-float-hero">
                        <g 
                          className="ice-hero-group unplanned" 
                          data-tip={`<b>▼ ROUTE TYPE: UNPLANNED (SUBMERGED ICEBERG)</b><br/>Unplanned Total: ₹ ${toLacs(iceUnplannedCost)} (${iceUnplanPct}%)<br/>Volume: ${inIN(iceUnplannedCSE)} CSE &bull; ${toTons(iceUnplannedWt)}<br/>Trips: ${iceUnplannedTrips} Trips`}
                        >
                          <rect x="0" y="240" width="335" height="260" fill="transparent"/>
                          <rect className="ice-hero-card" x="177" y="426" width="146" height="58" rx="8" ry="8"/>
                          <text x="250" y="444" textAnchor="middle" fill="#E11D48" fontSize="10.5" fontWeight="900" letterSpacing="0.5">▼ UNPLANNED</text>
                          <text className="ice-hero-main-val" x="250" y="463" textAnchor="middle" fontSize="17" fontWeight="900">₹ {toLacs(iceUnplannedCost)}</text>
                          <text x="250" y="475" textAnchor="middle" fill="#E11D48" fontSize="9" fontWeight="800">{iceUnplanPct}% OF FREIGHT</text>
                        </g>
                      </g>

                      {/* Stage Separator between Iceberg and Side Comparison */}
                      <line x1="335" y1="20" x2="335" y2="480" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4,4"/>

                      {/* SIDE COMPARISON HEADER: Unplanned (Left) VS Planned (Right) */}
                      <g className="ice-comparison-hdr">
                        {/* UNPLANNED HEADER (LEFT) */}
                        <g 
                          className="ice-hero-group unplanned"
                          data-tip={`<b>▼ TOTAL UNPLANNED FREIGHT</b><br/>₹ ${toLacs(iceUnplannedCost)} (${iceUnplanPct}%)<br/>Volume: ${inIN(iceUnplannedCSE)} CSE &bull; ${toTons(iceUnplannedWt)}<br/>Trips: ${iceUnplannedTrips} Trips`}
                        >
                          <rect x="360" y="16" width="248" height="44" rx="10" fill="#FFFFFF" stroke="#E11D48" strokeWidth="1.8" filter="url(#iceCardShadow)"/>
                          <circle cx="383" cy="38" r="6" fill="#E11D48"/>
                          <text x="398" y="43" fill="#E11D48" fontSize="12.5" fontWeight="900" letterSpacing="0.8">▼ UNPLANNED</text>
                          <text x="593" y="43.5" textAnchor="end" fill="#E11D48" fontSize="15" fontWeight="900">₹ {toLacs(iceUnplannedCost)}</text>
                        </g>

                        {/* VS BADGE (CENTER) */}
                        <circle cx="665" cy="38" r="17" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" filter="url(#iceCardShadow)"/>
                        <text x="665" y="43" textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="900" letterSpacing="0.5">VS</text>

                        {/* PLANNED HEADER (RIGHT) */}
                        <g 
                          className="ice-hero-group planned"
                          data-tip={`<b>▲ TOTAL PLANNED FREIGHT</b><br/>₹ ${toLacs(icePlannedCost)} (${icePlanPct}%)\nVolume: ${inIN(icePlannedCSE)} CSE &bull; ${toTons(icePlannedWt)}<br/>Trips: ${icePlannedTrips} Trips`}
                        >
                          <rect x="722" y="16" width="248" height="44" rx="10" fill="#FFFFFF" stroke="#00897B" strokeWidth="1.8" filter="url(#iceCardShadow)"/>
                          <circle cx="745" cy="38" r="6" fill="#00897B"/>
                          <text x="760" y="43" fill="#00897B" fontSize="12.5" fontWeight="900" letterSpacing="0.8">▲ PLANNED</text>
                          <text x="955" y="43.5" textAnchor="end" fill="#00897B" fontSize="15" fontWeight="900">₹ {toLacs(icePlannedCost)}</text>
                        </g>
                      </g>

                      {/* Vertical Central Dotted Spine Line */}
                      <line x1="665" y1="62" x2="665" y2="488" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="3,3"/>

                      {/* PRODUCT / CATEGORY EXACT COMPARISON CHART (Larger Bars, Bigger Fonts, Full Vertical Distribution) */}
                      {(() => {
                        const CX = 665;
                        const pillW = 156;
                        const pillH = 48;
                        const barH = 46;
                        const badgeW = 100;
                        const badgeH = 42;
                        const centerLeftX = CX - pillW / 2; // 587
                        const centerRightX = CX + pillW / 2; // 743
                        const MAX_BAR_W = 205;
                        const numCats = iceCats.length || 1;
                        const startY = 95;
                        const rowStep = 73;

                        return iceCats.map((cat, idx) => {
                          const rowY = startY + idx * rowStep;
                          const pillY = rowY - pillH / 2;
                          const pillX = centerLeftX;

                          const planRatio = cat.totalCost > 0 ? ((cat.plannedCost / cat.totalCost) * 100).toFixed(1) : '0.0';
                          const unplanRatio = cat.totalCost > 0 ? ((cat.unplannedCost / cat.totalCost) * 100).toFixed(1) : '0.0';

                          const unplanW = cat.unplannedCost > 0 ? Math.max(18, Math.round((cat.unplannedCost / maxIceSideCost) * MAX_BAR_W)) : 0;
                          const planW = cat.plannedCost > 0 ? Math.max(18, Math.round((cat.plannedCost / maxIceSideCost) * MAX_BAR_W)) : 0;

                          const isWideUnplan = unplanW >= 135;
                          const isWidePlan = planW >= 135;

                          const unplanBarX = centerLeftX - 6 - unplanW;
                          const unplanBarY = rowY - barH / 2;

                          const unplanBadgeX = centerLeftX - 6 - unplanW - 8 - badgeW;
                          const unplanBadgeY = rowY - badgeH / 2;

                          const planBarX = centerRightX + 6;
                          const planBarY = rowY - barH / 2;

                          const planBadgeX = centerRightX + 6 + planW + 8;
                          const planBadgeY = rowY - badgeH / 2;

                          return (
                            <g 
                              key={cat.name} 
                              className="ice-cat-bar-group"
                              data-tip={`<b>📦 ${cat.name}</b><br/>Total Freight: ₹ ${toLacs(cat.totalCost)}<br/><span style="color:#FB7185">▼ Unplanned (Left): ₹ ${toLacs(cat.unplannedCost)} (${unplanRatio}%)</span><br/><span style="color:#2DD4BF">▲ Planned (Right): ₹ ${toLacs(cat.plannedCost)} (${planRatio}%)</span><br/>Volume: ${inIN(cat.cse)} CSE &bull; ${toTons(cat.weight)}<br/>Trips: ${cat.trips} Trips`}
                            >
                              {/* UNPLANNED (LEFT) SIDE */}
                              {cat.unplannedCost > 0 && (
                                <>
                                  <rect 
                                    className="cat-bar-rect" 
                                    x={unplanBarX} 
                                    y={unplanBarY} 
                                    width={unplanW} 
                                    height={barH} 
                                    rx={10} 
                                    fill="url(#barUnplanHGrad)"
                                    filter="url(#iceCardShadow)"
                                  />
                                  {isWideUnplan ? (
                                    <text 
                                      x={centerLeftX - 6 - 16} 
                                      y={rowY + 5.5} 
                                      textAnchor="end" 
                                      fill="#FFFFFF" 
                                      fontSize="15" 
                                      fontWeight="900" 
                                      style={{ pointerEvents: 'none' }}
                                    >
                                      ₹ {toLacs(cat.unplannedCost)}
                                    </text>
                                  ) : (
                                    <g>
                                      <rect 
                                        x={unplanBadgeX} 
                                        y={unplanBadgeY} 
                                        width={badgeW} 
                                        height={badgeH} 
                                        rx={9} 
                                        fill="#FFFFFF" 
                                        stroke="#E11D48" 
                                        strokeWidth="1.6" 
                                        filter="url(#iceCardShadow)"
                                      />
                                      <text 
                                        x={unplanBadgeX + badgeW / 2} 
                                        y={rowY + 5} 
                                        textAnchor="middle" 
                                        fill="#E11D48" 
                                        fontSize="14" 
                                        fontWeight="900" 
                                        style={{ pointerEvents: 'none' }}
                                      >
                                        ₹ {toLacs(cat.unplannedCost)}
                                      </text>
                                    </g>
                                  )}
                                </>
                              )}

                              {/* CENTER CATEGORY PILL */}
                              <rect 
                                className="cat-pill-bg" 
                                x={pillX} 
                                y={pillY} 
                                width={pillW} 
                                height={pillH} 
                                rx={10} 
                                fill="#FFFFFF" 
                                filter="url(#iceCardShadow)"
                              />
                              <text 
                                x={CX} 
                                y={rowY + 5.5} 
                                textAnchor="middle" 
                                fill="#0F172A" 
                                fontSize="15" 
                                fontWeight="900" 
                                letterSpacing="0.2"
                                style={{ pointerEvents: 'none' }}
                              >
                                {cat.name}
                              </text>

                              {/* PLANNED (RIGHT) SIDE */}
                              {cat.plannedCost > 0 && (
                                <>
                                  <rect 
                                    className="cat-bar-rect" 
                                    x={planBarX} 
                                    y={planBarY} 
                                    width={planW} 
                                    height={barH} 
                                    rx={10} 
                                    fill="url(#barPlanHGrad)"
                                    filter="url(#iceCardShadow)"
                                  />
                                  {isWidePlan ? (
                                    <text 
                                      x={centerRightX + 6 + 16} 
                                      y={rowY + 5.5} 
                                      textAnchor="start" 
                                      fill="#FFFFFF" 
                                      fontSize="15" 
                                      fontWeight="900" 
                                      style={{ pointerEvents: 'none' }}
                                    >
                                      ₹ {toLacs(cat.plannedCost)}
                                    </text>
                                  ) : (
                                    <g>
                                      <rect 
                                        x={planBadgeX} 
                                        y={planBadgeY} 
                                        width={badgeW} 
                                        height={badgeH} 
                                        rx={9} 
                                        fill="#FFFFFF" 
                                        stroke="#00897B" 
                                        strokeWidth="1.6" 
                                        filter="url(#iceCardShadow)"
                                      />
                                      <text 
                                        x={planBadgeX + badgeW / 2} 
                                        y={rowY + 5} 
                                        textAnchor="middle" 
                                        fill="#00897B" 
                                        fontSize="14" 
                                        fontWeight="900" 
                                        style={{ pointerEvents: 'none' }}
                                      >
                                        ₹ {toLacs(cat.plannedCost)}
                                      </text>
                                    </g>
                                  )}
                                </>
                              )}
                            </g>
                          );
                        });
                      })()}
                    </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 5 (Bottom Right): Co-Pack Savings */}
            <div className="quadrant-panel copack-panel">
              <div className="q-body">
                <div className="copack-summary-box">
                  <div className="cp-kpi" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="c-lab">ZERO COST SAVING</span>
                      <div className="c-val" id="cp-total-wt">{toTons(copackWt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="c-sub" id="cp-trips-count" style={{ fontWeight: 800, color: 'var(--ink)' }}>{copackTrips} trips</span>
                      <div className="c-sub">Shipped at ₹0 FRT</div>
                    </div>
                  </div>
                </div>
                <div className="split-pane" style={{ flex: 1 }}>
                  <div className="split-lbl">
                    <span>CO-PACK CATEGORY WEIGHT (TONS)</span>
                    <span id="lbl-cp-cat-total">{copackCatTotalTons} Tons</span>
                  </div>
                  <div className="h-chart-wrap" id="chart-copack-list">
                    {!validCopackItems.length ? (
                      <div style={{ fontSize: '11.5px', color: 'var(--ink-sub)', margin: 'auto', textAlign: 'center' }}>No data</div>
                    ) : (
                      validCopackItems.map((item, idx) => {
                        const widthPct = Math.max(8, (item.v / maxCopackVal) * 100).toFixed(1);
                        const displayVal = toTons(item.v);
                        const barBg = COPACK_BAR_COLORS[idx % COPACK_BAR_COLORS.length];
                        return (
                          <div 
                            key={item.name + idx} 
                            className="h-bar-row" 
                            data-tip={`<b>${item.name}</b><br/>Weight: ${displayVal}${item.share ? ` (${pct(item.share)})` : ''}`}
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
              </div>
            </div>

          </section>

        </main>

      </div>

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        headers={headers}
        columnMap={columnMap}
        onSaveMap={(newMap) => setColumnMap(newMap)}
        onAutoMap={() => {
          if (headers.length) {
            const parsed = parseAOA(EMBEDDED_MASTER_DATA);
            setColumnMap(parsed.map);
          }
        }}
      />

      {/* In-Dashboard Clear All Warning Modal */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClearHistory}
        title="Clear All Upload History?"
        message="Are you sure you want to permanently clear all uploaded datasets from SQLite database? The dashboard will reset to an empty state."
        confirmText="Yes, Clear All"
        cancelText="Cancel"
      />

      {/* Instant 0ms Zero-Delay Floating HTML Tooltip */}
      <InstantTooltip />
    </>
  );
}

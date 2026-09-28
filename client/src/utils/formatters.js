export function norm(s) {
  return String(s || '').trim().toLowerCase().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
}

export function toNum(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v).replace(/[,₹\s]/g, '').trim();
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

export function txt(v) {
  if (v == null) return '';
  return String(v).trim();
}

export function inIN(n) {
  if (n == null || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-IN');
}

export function moneyLacs(n) {
  if (n == null || isNaN(n)) return '₹ 0.00 <small>Lakhs</small>';
  const lacs = n / 100000;
  return '₹ ' + lacs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' <small>Lakhs</small>';
}

export function toLacs(n) {
  if (n == null || isNaN(n)) return '0.00 L';
  const lacs = n / 100000;
  return lacs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L';
}

export function toTons(w) {
  if (w == null || isNaN(w)) return '0 MT';
  const t = w / 1000;
  return t.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MT';
}

export function pct(p) {
  if (p == null || isNaN(p)) return '0.0%';
  return (p * 100).toFixed(1) + '%';
}

export const DEPOT_CODE_MAP = {
  'IN7E': 'Bangalore',
  'IN7T': 'Vijayawada',
  'IN7K': 'Coimbatore',
  'IN7C': 'Cochin',
  'IN7H': 'Hyderabad',
  'IN7U': 'Hubli',
  'IN7A': 'Chennai',
  'IN7P': 'Pondicherry',
  'IN7M': 'Madurai',
  'IN7Z': 'Chennai',
  'IN8Y': 'Hyderabad',
  'IN8R': 'Hubli',
  'IN8V': 'Cochin'
};

export function normDepotName(v) {
  if (!v) return '';
  let s = v.toString().trim();
  const up = s.toUpperCase();
  if (DEPOT_CODE_MAP[up]) return DEPOT_CODE_MAP[up];
  for (const code in DEPOT_CODE_MAP) {
    if (up.includes(code)) return DEPOT_CODE_MAP[code];
  }
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function normFrt(v) {
  const s = norm(v);
  if (s.includes('copack') || s.includes('co-pack') || s.includes('co pack')) return 'Co-pack';
  if (s.includes('dedicated') || s.includes('dedicate')) return 'Dedicated';
  if (s.includes('market') || s.includes('mkt')) return 'Market Hire';
  if (!s) return '(blank)';
  return txt(v);
}

export function normPlan(v) {
  const s = norm(v);
  if (s === '1' || s === 'planned' || s.includes('plan') && !s.includes('unplan')) return 'Planned';
  if (s === '0' || s === 'unplanned' || s.includes('unplan')) return 'Unplanned';
  if (!s) return 'Unplanned';
  return txt(v);
}

export function normWeek(v) {
  const s = norm(v);
  if (s.includes('w1') || s.includes('week 1') || s.includes('wk 1')) return 'W1';
  if (s.includes('w2') || s.includes('week 2') || s.includes('wk 2')) return 'W2';
  if (s.includes('w3') || s.includes('week 3') || s.includes('wk 3')) return 'W3';
  if (s.includes('w4') || s.includes('week 4') || s.includes('wk 4')) return 'W4';
  if (s.includes('w5') || s.includes('week 5') || s.includes('wk 5')) return 'W5';
  if (s.includes('w6') || s.includes('week 6') || s.includes('wk 6')) return 'W6';
  return txt(v);
}

export const DEPOT_NODES = {
  'Bangalore': { lat: 12.9716, lng: 77.5946, color: '#6C2E7B' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, color: '#0D3B66' },
  'Vijayawada': { lat: 16.5062, lng: 80.6480, color: '#FF8A5B' },
  'Coimbatore': { lat: 11.0168, lng: 76.9558, color: '#E75480' },
  'Cochin': { lat: 9.9312, lng: 76.2673, color: '#1FA7A6' },
  'Hubli': { lat: 15.3647, lng: 75.1240, color: '#8B7FD6' },
  'Chennai': { lat: 13.0827, lng: 80.2707, color: '#FFC857' },
  'Pondicherry': { lat: 11.9416, lng: 79.8083, color: '#E75480' },
  'Madurai': { lat: 9.9252, lng: 78.1198, color: '#6C2E7B' }
};

export const COLOR_PALETTE = [
  '#6C2E7B', '#E75480', '#FF8A5B', '#FFC857',
  '#1FA7A6', '#0D3B66', '#8B7FD6', '#FFD8C7'
];


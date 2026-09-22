import React from 'react';

const MAP_FIELDS = [
  { key: 'month', label: 'Month', req: false },
  { key: 'weekType', label: 'Week Type', req: false },
  { key: 'cse', label: 'CSE (quantity)', req: true },
  { key: 'weight', label: 'Weight', req: true },
  { key: 'frtCategory', label: 'FRT Category', req: true },
  { key: 'frtCost', label: 'FRT Cost', req: true },
  { key: 'category', label: 'Category', req: false },
  { key: 'iopCategory', label: 'Brand / Iop Cat.', req: false },
  { key: 'toDepot', label: 'To / Destination Depot', req: false },
  { key: 'fromDepot', label: 'From / Origin Depot', req: false },
  { key: 'route', label: 'Route / Depot', req: false },
  { key: 'transport', label: 'Transport Name', req: false },
  { key: 'lr', label: 'LR / Trip no', req: false },
  { key: 'remarks', label: 'Movement Remarks', req: false },
  { key: 'routeType', label: 'Route Type (Planned/Unplanned)', req: false }
];

function colLetter(i) {
  let s = '';
  let idx = Number(i);
  do {
    s = String.fromCharCode(65 + (idx % 26)) + s;
    idx = Math.floor(idx / 26) - 1;
  } while (idx >= 0);
  return s;
}

export default function ColumnMappingModal({
  isOpen,
  onClose,
  headers,
  columnMap,
  onSaveMap,
  onAutoMap
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" id="mapModal" onClick={(e) => { if (e.target.id === 'mapModal') onClose(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <div className="modal-title">Column Mapping</div>
          <button className="btn-modal-close" id="mapClose" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="modal-note">
            Match Excel sheet columns to dashboard fields. Mandatory fields are marked with <span className="req">*</span>.
          </p>
          <div className="map-list" id="mapList">
            {MAP_FIELDS.map(f => (
              <div key={f.key} className="map-row">
                <label>
                  {f.label}
                  {f.req && <span className="req">*</span>}
                </label>
                <select 
                  value={columnMap[f.key] != null ? String(columnMap[f.key]) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    onSaveMap({
                      ...columnMap,
                      [f.key]: v === '' ? undefined : Number(v)
                    });
                  }}
                >
                  <option value="">— not mapped —</option>
                  {headers.map(h => (
                    <option key={h.idx} value={h.idx}>
                      {colLetter(h.idx)} &bull; {h.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-modal secondary" id="mapAuto" onClick={onAutoMap}>
            Auto-Detect
          </button>
          <button className="btn-modal secondary" id="mapCancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-modal primary" id="mapSave" onClick={onClose}>
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );
}


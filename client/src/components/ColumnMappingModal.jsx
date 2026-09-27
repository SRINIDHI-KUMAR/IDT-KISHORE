import React, { useState, useEffect } from 'react';

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
  { key: 'routeType', label: 'Route Type', req: false }
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
  headers = [],
  columnMap = {},
  onSaveMap,
  onAutoMap
}) {
  const [localMap, setLocalMap] = useState({});

  useEffect(() => {
    if (isOpen) {
      setLocalMap(columnMap || {});
    }
  }, [isOpen, columnMap]);

  if (!isOpen) return null;

  const handleChange = (key, valStr) => {
    setLocalMap(prev => {
      const next = { ...prev };
      if (valStr === '' || valStr === undefined) {
        delete next[key];
      } else {
        next[key] = Number(valStr);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSaveMap(localMap);
    onClose();
  };

  const handleAuto = () => {
    if (onAutoMap) {
      onAutoMap();
    }
  };

  return (
    <div className="modal-backdrop" id="mapModal" onClick={(e) => { if (e.target.id === 'mapModal') onClose(); }}>
      <div className="modal-card simple-map-modal">
        {/* Header */}
        <div className="modal-head">
          <div className="modal-head-left">
            <h3 className="modal-title">Column mapping</h3>
            <p className="modal-sub">
              Match each dashboard field to a column from your file. Fields marked <span className="req">*</span> drive KPIs.
            </p>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close">&times;</button>
        </div>

        {/* Form Body */}
        <div className="modal-body map-list">
          {MAP_FIELDS.map(f => (
            <div key={f.key} className="map-row">
              <label>
                {f.label}
                {f.req && <span className="req"> *</span>}
              </label>
              <select
                value={localMap[f.key] != null ? String(localMap[f.key]) : ''}
                onChange={(e) => handleChange(f.key, e.target.value)}
              >
                <option value="">— not mapped —</option>
                {headers && headers.length > 0 ? (
                  headers.map(h => (
                    <option key={h.idx} value={h.idx}>
                      {colLetter(h.idx)} &middot; {h.label}
                    </option>
                  ))
                ) : (
                  <option disabled value="__no_headers__">(Upload Excel to map)</option>
                )}
              </select>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="modal-actions">
          <button className="btn-modal secondary" onClick={handleAuto} title="Auto-detect matches">
            Auto-detect
          </button>
          <button className="btn-modal secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-modal primary" onClick={handleSave}>
            Save &amp; apply
          </button>
        </div>
      </div>
    </div>
  );
}

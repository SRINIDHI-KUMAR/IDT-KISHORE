import React from 'react';

export default function SidebarDrawer({
  isOpen,
  onClose,
  activeFilename,
  activeMeta,
  history,
  onFileUpload,
  onLoadHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  onExportDB,
  isDarkTheme,
  onToggleTheme
}) {
  return (
    <>
      <div 
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} 
        id="sidebar-backdrop"
        onClick={onClose}
      />
      <aside 
        className={`app-sidebar ${isOpen ? 'open' : ''}`} 
        id="app-sidebar" 
        aria-label="Navigation & History Sidebar"
      >
        <div className="sidebar-header">
          <div className="sidebar-header-title">
            <div className="sidebar-truck-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 3h14v13H1z"></path>
                <path d="M15 8h4l3 3v5h-7V8z"></path>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div>
              <h3>IDT Control Center</h3>
              <span className="sidebar-subtitle">File Management &amp; History</span>
            </div>
          </div>
          <button className="btn-sidebar-close" id="btn-close-sidebar" title="Close Sidebar" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="sidebar-body">
          {/* Quick Actions: Upload XL & Theme Toggle */}
          <div className="sidebar-section-title">Quick Actions</div>
          <div className="sidebar-actions-grid">
            <label className="btn-sidebar-action upload" htmlFor="sidebar-file-input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Upload Excel</span>
            </label>
            <input 
              id="sidebar-file-input" 
              type="file" 
              accept=".xlsx,.xlsm,.xls" 
              className="hide" 
              onChange={onFileUpload}
            />

            <button 
              className="btn-sidebar-action" 
              id="sidebarThemeToggle" 
              type="button" 
              title="Toggle Dark / Light Theme"
              onClick={onToggleTheme}
            >
              <span className="theme-dot"></span>
              <span id="sidebarThemeBtnText">{isDarkTheme ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Upload History Section */}
          <div className="sidebar-history-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="sidebar-section-title" style={{ marginBottom: 0 }}>Uploaded History</div>
              <span style={{
                fontSize: '8.5px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(31,167,166,0.12)',
                color: 'var(--grn-600)',
                border: '1px solid rgba(31,167,166,0.3)'
              }}>SQLite DB</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn-clear-history" 
                id="btn-export-sqlite" 
                onClick={onExportDB} 
                title="Export SQLite database (.db file)"
              >
                Export .db
              </button>
              <button 
                className="btn-clear-history" 
                id="btn-clear-history" 
                onClick={onClearHistory} 
                title="Clear all history"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* History List with only Name and Uploaded Time */}
          <div className="sidebar-history-list" id="sidebar-history-list">
            {history.length === 0 ? (
              <div className="sidebar-empty-state">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>No uploaded files stored in SQLite yet.</span>
              </div>
            ) : (
              history.map((item) => {
                const isActive = item.name === activeFilename;
                return (
                  <div 
                    key={item.id} 
                    className={`history-item-card ${isActive ? 'active' : ''}`}
                    onClick={() => onLoadHistoryItem(item)}
                    title={`Click to load ${item.name}`}
                  >
                    <div className="hist-card-top">
                      <div className="hist-file-title">
                        {item.name}
                      </div>
                      <button 
                        className="btn-del-hist" 
                        title="Delete from SQLite history"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="hist-time">
                      {item.timestamp}
                    </div>
                    {isActive && (
                      <div style={{ marginTop: '3px', fontSize: '9.5px', fontWeight: 900, color: '#1FA7A6', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                        &bull; Currently Loaded
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

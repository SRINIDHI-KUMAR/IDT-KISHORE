import React from 'react';

export default function Header({ onOpenSidebar, fileInfo, onResetFilters, onOpenMapping, isMappingDisabled, onSendReport, isSendingReport }) {
  return (
    <header className="header-bar">
      <div className="header-left">
        <div 
          className="brand-badge" 
          id="btn-open-sidebar" 
          role="button" 
          tabIndex={0} 
          title="Click to open Menu & Upload History"
          onClick={onOpenSidebar}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h14v13H1z"></path>
            <path d="M15 8h4l3 3v5h-7V8z"></path>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
        <div className="header-titles">
          <h1>IDT Dashboard</h1>
        </div>
      </div>
      <div className="header-actions">
        <div className="fileinfo-tag" id="fileinfo">{fileInfo}</div>
        <button 
          className="btn-hdr secondary" 
          id="btn-reset-filters-hdr" 
          title="Reset all slicer filters" 
          onClick={onResetFilters}
        >
          Reset Filters
        </button>
        <button 
          className="btn-hdr secondary" 
          id="mapBtn" 
          title="Configure Excel Column Mapping" 
          onClick={onOpenMapping}
        >
          Column Mapping
        </button>
        <button 
          className="btn-hdr email-btn" 
          id="btn-send-weekly-report" 
          title="Capture dashboard screenshot and create Outlook draft" 
          onClick={onSendReport}
          disabled={isSendingReport}
        >
          {isSendingReport ? (
            <>
              <svg className="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"></circle>
              </svg>
              <span>Creating Draft...</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>📧 Send Weekly Report</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}


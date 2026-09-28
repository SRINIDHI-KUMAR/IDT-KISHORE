import React from 'react';

export default function Header({ onOpenSidebar, fileInfo, onResetFilters, onOpenMapping, isMappingDisabled, onOutlookShare, isCapturing }) {
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
          className="btn-hdr primary" 
          id="btn-top-right-outlook" 
          title="Capture full page screenshot & open Outlook compose" 
          onClick={onOutlookShare}
          disabled={Boolean(isCapturing)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
          <span>
            {isCapturing === 'capturing' ? 'Capturing SS...' : isCapturing === 'copied' ? 'Copied! Opening...' : 'Share to Outlook'}
          </span>
        </button>
      </div>
    </header>
  );
}


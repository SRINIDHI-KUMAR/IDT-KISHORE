import React from 'react';

export default function Header({ onOpenSidebar, fileInfo, onResetFilters, onOpenMapping, isMappingDisabled }) {
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
          disabled={isMappingDisabled} 
          onClick={onOpenMapping}
        >
          Column Mapping
        </button>
      </div>
    </header>
  );
}


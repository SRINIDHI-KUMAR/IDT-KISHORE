import React, { useState } from 'react';

export default function WeeklyReportModal({
  isOpen,
  onClose,
  reportData,
  richHtml,
  plainText,
  onOpenOutlookAgain
}) {
  const [copiedState, setCopiedState] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'plaintext'

  if (!isOpen || !reportData) return null;

  const handleCopyRich = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([richHtml], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ]);
        setCopiedState('rich');
        setTimeout(() => setCopiedState(null), 3000);
      }
    } catch (e) {
      console.warn('Rich copy fallback:', e);
      handleCopyText();
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedState('text');
      setTimeout(() => setCopiedState(null), 3000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  return (
    <div 
      className="weekly-report-backdrop"
      onClick={(e) => {
        if (e.target.classList.contains('weekly-report-backdrop')) {
          onClose();
        }
      }}
    >
      <div className="weekly-report-modal" role="dialog" aria-modal="true">
        {/* HEADER */}
        <div className="weekly-report-header">
          <div className="report-hdr-left">
            <div className="report-hdr-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div className="report-title-row">
                <h2 className="report-title">OUTLOOK CLASSIC WEEKLY REPORT DRAFT</h2>
                <span className="report-status-badge">Ready to Send</span>
              </div>
              <p className="report-sub">
                Complete IDT logistics summary with 6 structured tables & senior analyst recommendations
              </p>
            </div>
          </div>

          <div className="report-hdr-actions">
            <button 
              type="button" 
              className="report-btn primary-btn"
              onClick={onOpenOutlookAgain}
              title="Launch Outlook Classic Compose on Laptop"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open Outlook Classic
            </button>

            <button 
              type="button" 
              className="report-btn secondary-btn"
              onClick={handleCopyRich}
              title="Copy formatted tables to clipboard"
            >
              {copiedState === 'rich' ? '✓ Copied Rich HTML!' : '📋 Copy Rich Tables'}
            </button>

            <button 
              type="button" 
              className="report-btn secondary-btn"
              onClick={handleCopyText}
              title="Copy plain-text tables"
            >
              {copiedState === 'text' ? '✓ Copied Text!' : '📄 Copy Plain Text'}
            </button>

            <button 
              type="button" 
              className="unplanned-modal-close"
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB SELECTOR */}
        <div className="report-tab-strip">
          <button 
            type="button" 
            className={`report-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Formatted Email Preview (Tables & Styling)
          </button>
          <button 
            type="button" 
            className={`report-tab-btn ${activeTab === 'plaintext' ? 'active' : ''}`}
            onClick={() => setActiveTab('plaintext')}
          >
            Plain Text / ASCII Format
          </button>
          <div className="report-tab-info">
            Subject: <strong>{reportData.meta.subject}</strong>
          </div>
        </div>

        {/* MODAL CONTENT */}
        <div className="weekly-report-content">
          {activeTab === 'preview' ? (
            <div 
              className="report-preview-frame"
              dangerouslySetInnerHTML={{ __html: richHtml }}
            />
          ) : (
            <pre className="report-plain-pre">
              {plainText}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

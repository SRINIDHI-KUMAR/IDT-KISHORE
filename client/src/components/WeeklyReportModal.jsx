import React, { useState } from 'react';
import { exportWeeklyReportToExcel } from '../utils/reportGenerator';

export default function WeeklyReportModal({
  isOpen,
  onClose,
  reportData,
  richHtml,
  plainText,
  screenshotImage,
  onOpenOutlookAgain
}) {
  const [copiedState, setCopiedState] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
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

  const handleDownloadExcel = async () => {
    try {
      await exportWeeklyReportToExcel(reportData);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to export report to Excel:', e);
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
              onClick={handleDownloadExcel}
              title="Download all 6 report tables as separate sheets in Excel (.xlsx)"
              style={{
                borderColor: downloadSuccess ? '#059669' : '#10B981',
                color: downloadSuccess ? '#065F46' : '#047857',
                background: downloadSuccess ? '#D1FAE5' : '#ECFDF5',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>{downloadSuccess ? '✓ Downloaded!' : 'Download'}</span>
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

        {/* ATTACHMENT STRIP ON DRAFT UI */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(13, 59, 102, 0.05), rgba(4, 120, 87, 0.08))',
          borderBottom: '1px solid #E2E8F0',
          padding: '10px 24px',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📎</span>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Attached: IDT_Logistics_Weekly_Report.png</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  color: '#047857',
                  background: '#D1FAE5',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: '1px solid #A7F3D0'
                }}>
                  ✓ Attached to Outlook Classic Draft
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Full-page dashboard screenshot captured & attached automatically to the Outlook email compose
              </div>
            </div>
          </div>
          {screenshotImage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <img 
                src={screenshotImage} 
                alt="Captured Screenshot Preview" 
                style={{
                  height: '38px',
                  maxWidth: '80px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1.5px solid #0D3B66',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          )}
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

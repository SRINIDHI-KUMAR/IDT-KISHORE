import React, { useState } from 'react';
import { downloadEmlDraft } from '../utils/outlookExport';

export default function OutlookDraftModal({
  isOpen,
  onClose,
  result,
  imageUrl,
  subject,
  onDownloadImage,
  bodyHtml
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const handleCopyClipboard = async () => {
    try {
      if (imageUrl) {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const handleDownloadEml = () => {
    downloadEmlDraft({
      subject,
      bodyHtml: bodyHtml || '<p>Hi Team,</p><p>Please find attached the latest IDT Weekly Freight Report.</p>',
      imageBase64: imageUrl,
      fileName: 'IDT_Weekly_Report.eml'
    });
  };

  return (
    <div className="modal-bg" style={{ zIndex: 999999, backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.72)' }}>
      <div 
        className="empty-modal" 
        style={{ 
          maxWidth: '560px', 
          width: '92%', 
          borderRadius: '20px', 
          background: 'var(--card)', 
          boxShadow: '0 25px 65px rgba(0,0,0,0.5)', 
          border: '1.5px solid var(--line)',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0078D4, #005A9E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', boxShadow: '0 3px 10px rgba(0,120,212,0.35)' }}>
              📧
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--ink)' }}>
                {result.isDemoMode ? 'Weekly Report Screenshot Captured' : 'Outlook Draft Created!'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#059669', fontWeight: 800 }}>
                {result.isDemoMode ? '✓ Screenshot copied to clipboard & downloaded' : '✓ Synced with your Microsoft 365 Mailbox'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--ink-sub)', padding: '4px 8px', borderRadius: '6px' }}
          >
            &times;
          </button>
        </div>

        {/* Step-by-Step Guidance */}
        <div style={{ background: 'rgba(0, 120, 212, 0.08)', border: '1.2px solid rgba(0, 120, 212, 0.3)', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#0078D4', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{result.isDemoMode ? '👉 Fast 1-Second Paste into Outlook:' : '👉 Draft is Ready in Outlook:'}</span>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.5, fontWeight: 700 }}>
            {result.isDemoMode ? (
              <>
                1. Your Outlook compose window has opened.<br/>
                2. Click into the message body &amp; press <kbd style={{ background: '#0F172A', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 900 }}>Ctrl + V</kbd> to paste the screenshot instantly!<br/>
                <span style={{ fontSize: '11.5px', color: 'var(--ink-sub)', fontWeight: 600 }}>• Or click <b>Open as .EML</b> below to open Outlook with the screenshot pre-attached.</span>
              </>
            ) : (
              <>
                1. A new draft email was created in your Microsoft 365 Outlook account with the dashboard screenshot attached.<br/>
                2. Click <b>Open Outlook Draft</b> below to edit recipients (To / CC), subject, and send!
              </>
            )}
          </div>
        </div>

        {/* Report Overview & Image Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: 'var(--card-sub)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: 'var(--ink-sub)', fontWeight: 700 }}>Subject:</span>
              <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{subject}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-sub)', fontWeight: 700 }}>Attachment:</span>
              <span style={{ fontWeight: 800, color: '#0078D4' }}>📎 IDT_Weekly_Report.png</span>
            </div>
          </div>

          {imageUrl && (
            <div style={{ border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden', maxHeight: '150px', position: 'relative', background: '#f8fafc' }}>
              <img 
                src={imageUrl} 
                alt="Dashboard Snapshot" 
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
              />
              <span style={{ position: 'absolute', bottom: '6px', right: '8px', background: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                High-Res 2x Snapshot
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '4px' }}>
          <button 
            onClick={handleCopyClipboard}
            className="btn-hdr secondary"
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 800 }}
            title="Copy screenshot to clipboard again"
          >
            {copied ? '✓ Copied!' : '📋 Copy Image'}
          </button>

          <button 
            onClick={handleDownloadEml}
            className="btn-hdr secondary"
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 800 }}
            title="Download Outlook Draft file (.eml) with screenshot pre-attached"
          >
            ✉️ Open as .EML
          </button>

          {onDownloadImage && (
            <button 
              onClick={onDownloadImage}
              className="btn-hdr secondary"
              style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 800 }}
              title="Download PNG snapshot file"
            >
              ⬇️ Save PNG
            </button>
          )}

          {result.webLink && (
            <a 
              href={result.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hdr email-btn"
              style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}
              onClick={onClose}
            >
              🚀 Open Outlook Draft
            </a>
          )}

          <button 
            onClick={onClose}
            className="btn-hdr secondary"
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 800 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

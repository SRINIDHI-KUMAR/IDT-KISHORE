import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Clear All Upload History?',
  message = 'Are you sure you want to permanently clear all uploaded datasets from SQLite database? The dashboard will reset to an empty state.',
  confirmText = 'Yes, Clear All',
  cancelText = 'Cancel',
  onConfirm,
  onClose
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="custom-confirm-backdrop" 
      onClick={(e) => {
        if (e.target.classList.contains('custom-confirm-backdrop')) onClose();
      }}
    >
      <div className="custom-confirm-card" role="dialog" aria-modal="true">
        <div className="custom-confirm-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        
        <h3 className="custom-confirm-title">{title}</h3>
        <p className="custom-confirm-message">{message}</p>
        
        <div className="custom-confirm-actions">
          <button 
            type="button" 
            className="btn-confirm-cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="btn-confirm-danger" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


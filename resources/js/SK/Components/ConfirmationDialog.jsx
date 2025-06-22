import React, { useEffect } from 'react';
// At the top of ConfirmationDialog.jsx
import '../css/ConfirmationDialog.css';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmColor = 'danger',
  cancelColor = 'secondary'
}) => {
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getButtonClass = (color) => {
    const base = 'btn';
    switch (color) {
      case 'danger': return `${base} btn-danger`;
      case 'primary': return `${base} btn-primary`;
      case 'success': return `${base} btn-success`;
      case 'warning': return `${base} btn-warning`;
      default: return `${base} btn-secondary`;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button 
            className={getButtonClass(cancelColor)}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={getButtonClass(confirmColor)}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
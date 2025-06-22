import React, { useEffect } from 'react';
import '../css/Notification.css';

const Notification = ({ message, type, onClose, autoClose = true, autoCloseDuration = 3000 }) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, onClose]);

  return (
    <div className={`notification ${type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'info' && 'ℹ'}
        </div>
        <div className="notification-message">{message}</div>
        <button className="notification-close" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification;
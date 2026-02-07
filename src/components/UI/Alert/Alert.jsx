import React from 'react';
import './Alert.css';

/**
 * Alert Component - ohne Emojis
 * Verschiedene Alert-Typen: success, warning, error, info
 * 
 * @component
 * @example
 * <Alert type="success">Erfolgreich gespeichert!</Alert>
 * <Alert type="error">Ein Fehler ist aufgetreten</Alert>
 */
const Alert = ({ 
  type = 'info', 
  children, 
  onClose,
  className = '',
  icon = null
}) => {
  const iconMap = {
    success: '✓',
    warning: '!',
    error: '✕',
    info: 'i'
  };

  return (
    <div className={`alert alert-${type} ${className}`.trim()}>
      <span className="alert-icon">{icon || iconMap[type]}</span>
      <div className="alert-content">{children}</div>
      {onClose && (
        <button 
          className="alert-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
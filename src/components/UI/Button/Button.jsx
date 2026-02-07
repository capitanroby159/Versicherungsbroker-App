import React from 'react';
import './Button.css';

/**
 * Button Component
 * Varianten: primary, secondary, danger, success
 * Größen: sm, md (default), lg
 * 
 * @component
 * @example
 * <Button variant="primary" size="lg">Speichern</Button>
 * <Button variant="danger" onClick={handleDelete}>Löschen</Button>
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '', 
  onClick,
  type = 'button',
  ...props 
}) => {
  const buttonClass = `btn btn-${variant} btn-${size} ${className}`.trim();

  return (
    <button 
      type={type}
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

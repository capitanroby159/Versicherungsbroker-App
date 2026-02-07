import React from 'react';
import './FormInput.css';

/**
 * FormInput Component
 * Input-Feld mit optionalem Label, Error-Message und Help-Text
 * 
 * @component
 * @example
 * <FormInput 
 *   label="Name"
 *   type="text"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 *   error={errors.name}
 *   required
 * />
 */
const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`${error ? 'input-error' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
      {helpText && !error && <span className="help-text">{helpText}</span>}
    </div>
  );
};

export default FormInput;

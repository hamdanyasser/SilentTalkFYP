/**
 * Accessible Form Field Component
 * WCAG 2.1 AA Form Guidelines (3.3.1, 3.3.2, 3.3.3)
 */

import React, { InputHTMLAttributes } from 'react';
import './FormField.css';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  type?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  error,
  helperText,
  required = false,
  type = 'text',
  className = '',
  ...inputProps
}) => {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      <label htmlFor={id} className={`form-field__label ${required ? 'required' : ''}`}>
        {label}
        {required && <span className="form-field__required" aria-label="required">*</span>}
      </label>

      {helperText && !error && (
        <p id={helperId} className="form-field__helper">
          {helperText}
        </p>
      )}

      <input
        id={id}
        type={type}
        className={`form-field__input ${error ? 'form-field__input--error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />

      {error && (
        <div id={errorId} className="form-field__error" role="alert" aria-live="assertive">
          <span className="form-field__error-icon" aria-hidden="true">
            ⚠️
          </span>
          {error}
        </div>
      )}
    </div>
  );
};

interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  error,
  helperText,
  required = false,
  className = '',
  ...textareaProps
}) => {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      <label htmlFor={id} className={`form-field__label ${required ? 'required' : ''}`}>
        {label}
        {required && <span className="form-field__required" aria-label="required">*</span>}
      </label>

      {helperText && !error && (
        <p id={helperId} className="form-field__helper">
          {helperText}
        </p>
      )}

      <textarea
        id={id}
        className={`form-field__textarea ${error ? 'form-field__textarea--error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...textareaProps}
      />

      {error && (
        <div id={errorId} className="form-field__error" role="alert" aria-live="assertive">
          <span className="form-field__error-icon" aria-hidden="true">
            ⚠️
          </span>
          {error}
        </div>
      )}
    </div>
  );
};

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  options,
  error,
  helperText,
  required = false,
  className = '',
  ...selectProps
}) => {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      <label htmlFor={id} className={`form-field__label ${required ? 'required' : ''}`}>
        {label}
        {required && <span className="form-field__required" aria-label="required">*</span>}
      </label>

      {helperText && !error && (
        <p id={helperId} className="form-field__helper">
          {helperText}
        </p>
      )}

      <select
        id={id}
        className={`form-field__select ${error ? 'form-field__select--error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <div id={errorId} className="form-field__error" role="alert" aria-live="assertive">
          <span className="form-field__error-icon" aria-hidden="true">
            ⚠️
          </span>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;

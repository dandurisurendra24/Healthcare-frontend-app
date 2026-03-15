import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', value, onChange, placeholder, error, required = false, ...props }) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}{required && '*'}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel
}) => {
  return (
    <label className="sw" style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="sl" />
    </label>
  );
};

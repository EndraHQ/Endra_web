import React from 'react';

interface LogoProps {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ height = 26, className, style }) => (
  <svg
    viewBox="0 0 179 84"
    style={{ height: `${height}px`, width: 'auto', display: 'block', ...style }}
    aria-label="ENDRA"
    role="img"
    className={className}
  >
    <use href="#endra-logo" />
  </svg>
);

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'white' | 'ghost' | 'red' | 'safe' | 'escalate';
  size?: 'sm' | 'md';
  block?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'white',
  size = 'md',
  block = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass = {
    white: 'btn-w',
    ghost: 'btn-g',
    red: 'btn-r',
    safe: 'btn-safe',
    escalate: 'btn-esc'
  }[variant];

  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const blockClass = block ? 'btn-block' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${blockClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  flush?: boolean;
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  flush = false,
  span,
  className = '',
  children,
  ...props
}) => {
  const spanClass = span ? `s${span}` : '';
  const flushClass = flush ? 'flush' : '';
  return (
    <div className={`card ${flushClass} ${spanClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const StatusDot: React.FC<{
  tone?: 'g' | 'r' | 'o' | 'b' | 'x';
  className?: string;
  style?: React.CSSProperties;
}> = ({ tone = 'g', className = '', style }) => (
  <i className={`sd ${tone} ${className}`.trim()} style={style} />
);

export const Pill: React.FC<{
  tone?: 'green' | 'blue' | 'orange' | 'red' | 'default';
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'default', children, className = '' }) => {
  const toneClass = tone !== 'default' ? tone : '';
  return <span className={`pill ${toneClass} ${className}`.trim()}>{children}</span>;
};

export const KeyValuePair: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, value, style }) => (
  <div className="kv" style={style}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export const NoticeBox: React.FC<{
  security?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ security = false, children, style }) => (
  <div className={`note ${security ? 'sec' : ''}`.trim()} style={style}>
    {children}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="empty">
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop: '16px' }}>{action}</div>}
  </div>
);

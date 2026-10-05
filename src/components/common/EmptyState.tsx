import React from 'react';
import { Icon } from '../icons/Icon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search',
  title,
  subtitle,
  description,
  action,
  style
}) => {
  const desc = description || subtitle;
  return (
    <div className="empty" style={style}>
      {icon && (
        <div style={{ marginBottom: '10px', opacity: 0.7 }}>
          <Icon name={icon} size={32} />
        </div>
      )}
      <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--white)', marginBottom: '4px' }}>
        {title}
      </p>
      {desc && (
        <p className="muted" style={{ fontSize: '13px', maxWidth: '360px', margin: '0 auto 16px' }}>
          {desc}
        </p>
      )}
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
};

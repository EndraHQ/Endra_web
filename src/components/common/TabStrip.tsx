import React from 'react';

export interface TabItem<T = string> {
  id: T;
  label: string;
}

export function TabStrip<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = ''
}: {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab ${activeTab === t.id ? 'on' : ''}`}
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function FilterChips<T extends string = string>({
  items,
  activeItem,
  onChange,
  className = ''
}: {
  items: { id: T; label: string }[];
  activeItem: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={`chips ${className}`.trim()}>
      {items.map(item => (
        <button
          key={item.id}
          className={`chip ${activeItem === item.id ? 'on' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}> = ({ checked, onChange, className = '' }) => (
  <button
    type="button"
    className={`tgl ${checked ? 'on' : ''} ${className}`.trim()}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
  >
    <i />
  </button>
);

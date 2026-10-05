import React from 'react';

export interface FilterChipItem<T = string> {
  id: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T = string> {
  items: FilterChipItem<T>[];
  activeItem: T;
  onChange: (id: T) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FilterChips<T = string>({
  items,
  activeItem,
  onChange,
  className = 'chips',
  style
}: FilterChipsProps<T>) {
  return (
    <div className={className} style={style}>
      {items.map(item => (
        <button
          key={String(item.id)}
          type="button"
          className={`chip ${activeItem === item.id ? 'on' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 && ` (${item.count})`}
        </button>
      ))}
    </div>
  );
}

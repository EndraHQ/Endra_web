import React from 'react';
import { Icon } from '../icons/Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onBack,
  wide = false,
  children,
  footer,
  hideHeader = false
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="scrim"
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`modal ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
      >
        {!hideHeader && (
          <div className="m-hd">
            <div>
              {onBack && (
                <>
                  <button type="button" className="backlink" onClick={onBack}>
                    <Icon name="chevl" size={14} /> Back
                  </button>
                  <br />
                </>
              )}
              {title && <h3>{title}</h3>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button
              type="button"
              className="m-x"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        <div className="m-bd">{children}</div>
        {footer && <div className="m-ft">{footer}</div>}
      </div>
    </div>
  );
};

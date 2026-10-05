import React, { useState, useRef } from 'react';

export const SosHoldButton: React.FC<{ onActivate: () => void }> = ({ onActivate }) => {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<any>(null);

  const startHold = (e: React.SyntheticEvent) => {
    if ((e as React.KeyboardEvent).repeat) return;
    setIsHolding(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onActivate();
    }, 1500);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div
      className={`sos-hold ${isHolding ? 'holding' : ''}`}
      id="sosHold"
      role="button"
      tabIndex={0}
      aria-label="Hold for 1.5 seconds to send SOS"
      onPointerDown={e => {
        e.preventDefault();
        startHold(e);
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startHold(e);
        }
      }}
      onKeyUp={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          cancelHold();
        }
      }}
    >
      <svg viewBox="0 0 220 220">
        <circle className="sos-rt" cx="110" cy="110" r="106" />
        <circle className="sos-rp" cx="110" cy="110" r="106" />
      </svg>
      <div className="sos-b">
        <b>SOS</b>
        <span>HOLD</span>
      </div>
    </div>
  );
};

import React from 'react';

export const Toast: React.FC<{
  message: string | null;
  visible: boolean;
}> = ({ message, visible }) => (
  <div
    className={`toast ${visible ? 'show' : ''}`}
    id="toast"
    role="status"
    aria-live="polite"
  >
    {message}
  </div>
);

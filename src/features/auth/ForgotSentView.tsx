import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const ForgotSentView: React.FC = () => {
  const { setAuthView } = useAuth();

  return (
    <div>
      <h1 id="gH" tabIndex={-1}>
        Check your inbox
      </h1>
      <p className="sub">
        We’ve sent a reset link to your email address.
      </p>

      <p className="g-hint" style={{ marginBottom: '22px' }}>
        Click the link in the email to set a new password. If you don’t see it in a few minutes, check your spam folder.
      </p>

      <button
        type="button"
        className="btn btn-w btn-lg btn-block"
        onClick={() => setAuthView('reset')}
      >
        Open reset link (preview)
      </button>

      <p className="auth-alt">
        <button
          type="button"
          className="linkb"
          onClick={() => setAuthView('login')}
        >
          Back to log in
        </button>
      </p>
    </div>
  );
};

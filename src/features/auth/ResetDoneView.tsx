import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const ResetDoneView: React.FC = () => {
  const { setAuthView } = useAuth();
  const { go } = useApp();

  return (
    <>
      <h1 id="gH" tabIndex={-1}>
        Password updated
      </h1>
      <p className="sub">Your password has been changed. You can now log in.</p>

      <button
        type="button"
        className="btn btn-w btn-lg btn-block"
        style={{ marginTop: '14px' }}
        onClick={() => {
          setAuthView('login');
          go('login');
        }}
      >
        Log in
      </button>
    </>
  );
};

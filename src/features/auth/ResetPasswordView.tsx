import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { pwScore } from '../../utils/authHelpers';

export const ResetPasswordView: React.FC = () => {
  const { resetPassword, setAuthView } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const score = pwScore(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters with letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    await resetPassword(password);
    setLoading(false);
  };

  return (
    <div>
      <h1 id="gH" tabIndex={-1}>
        Set a new password
      </h1>
      <p className="sub">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="g-banner" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="fld">
          <label htmlFor="fResetPw">New password</label>
          <div className="pwrap">
            <input
              className={`in ${error ? 'bad' : ''}`}
              id="fResetPw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              placeholder="New password"
              onChange={e => {
                setPassword(e.target.value);
                setError(null);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div id="pwMeter2">
            <div className="meter" aria-hidden="true">
              {[1, 2, 3, 4].map(i => (
                <i key={i} className={i <= score ? 'on' : ''} />
              ))}
            </div>
            <div className="meter-l">
              <span>{password ? ['', 'Weak', 'Okay', 'Good', 'Strong'][score] : 'Use at least 8 characters'}</span>
            </div>
          </div>
        </div>

        <div className="fld">
          <label htmlFor="fResetPw2">Confirm password</label>
          <div className="pwrap">
            <input
              className="in"
              id="fResetPw2"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              placeholder="Confirm new password"
              onChange={e => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          className="btn btn-w btn-lg btn-block"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinline" /> Saving
            </>
          ) : (
            'Set new password'
          )}
        </button>
      </form>

      <p className="auth-alt">
        <button
          type="button"
          className="linkb"
          onClick={() => setAuthView('login')}
        >
          Cancel
        </button>
      </p>
    </div>
  );
};

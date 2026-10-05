import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { SAMPLE } from '../../data/onboardingData';

export const LoginView: React.FC = () => {
  const { login, loginSample, setAuthView } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Enter your email or phone number.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await login(identifier, password);
    setLoading(false);

    if (!res.ok && res.err) {
      setError(res.err);
    }
  };

  return (
    <div>
      <h1 id="gH" tabIndex={-1}>
        Welcome back
      </h1>
      <p className="sub">Log in to manage your properties.</p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="g-banner" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="fld">
          <label htmlFor="fId">Email or phone number</label>
          <input
            className={`in ${error && !identifier ? 'bad' : ''}`}
            id="fId"
            autoComplete="username"
            value={identifier}
            placeholder="name@example.com or 803 415 9920"
            onChange={e => {
              setIdentifier(e.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="fld">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <label htmlFor="fLoginPw">Password</label>
            <button
              type="button"
              className="linkb mut"
              style={{ fontSize: '13px' }}
              onClick={() => setAuthView('forgot')}
            >
              Forgot password?
            </button>
          </div>
          <div className="pwrap">
            <input
              className="in"
              id="fLoginPw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              placeholder="Enter your password"
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
        </div>

        <button
          className="btn btn-w btn-lg btn-block"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinline" /> Logging in
            </>
          ) : (
            'Log in'
          )}
        </button>
      </form>

      <p className="auth-alt">
        New to ENDRA?{' '}
        <button
          type="button"
          className="linkb"
          onClick={() => setAuthView('signup')}
        >
          Create an account
        </button>
      </p>

      <button
        type="button"
        className="linkb mut prev-link"
        onClick={loginSample}
      >
        Just exploring? Open the sample portal
      </button>
    </div>
  );
};

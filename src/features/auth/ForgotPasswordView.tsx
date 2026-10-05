import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';

export const ForgotPasswordView: React.FC = () => {
  const { forgotPassword, setAuthView } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Enter the email address on your account.');
      return;
    }

    setLoading(true);
    setError(null);
    await forgotPassword(email);
    setLoading(false);
  };

  return (
    <div>
      <h1 id="gH" tabIndex={-1}>
        Reset your password
      </h1>
      <p className="sub">
        Enter the email on your account and we’ll send a reset link.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="g-banner" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="fld">
          <label htmlFor="fForgotEmail">Email address</label>
          <input
            className={`in ${error ? 'bad' : ''}`}
            id="fForgotEmail"
            type="email"
            autoComplete="email"
            value={email}
            placeholder="name@example.com"
            onChange={e => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
        </div>

        <button
          className="btn btn-w btn-lg btn-block"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinline" /> Sending link
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

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

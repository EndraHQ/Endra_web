import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { fmtPhone } from '../../utils/authHelpers';

export const OtpView: React.FC = () => {
  const { signupData, verifyOtp, setAuthView } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      setDigits(prev => {
        const next = [...prev];
        next[idx] = '';
        return next;
      });
      return;
    }

    const lastChar = cleaned.slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[idx] = lastChar;
      return next;
    });
    setError(null);

    if (idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < paste.length; i++) {
      next[i] = paste[i];
    }
    setDigits(next);
    setError(null);
    const targetIdx = Math.min(paste.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }

    setLoading(true);
    setError(null);
    const ok = await verifyOtp(code);
    setLoading(false);

    if (!ok) {
      setError('Invalid code. Check the message and try again.');
    }
  };

  const formattedPhone = signupData ? fmtPhone(signupData.phone) : '+234 803 415 9920';

  return (
    <div>
      <h1 id="gH" tabIndex={-1}>
        Confirm your phone number
      </h1>
      <p className="sub">
        We sent a 6-digit code via SMS to <b>{formattedPhone}</b>.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="g-banner" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={`otp ${error ? 'bad' : ''}`}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <p className="g-hint" style={{ textAlign: 'center', margin: '14px 0 20px' }}>
          Didn’t get the code?{' '}
          {timer > 0 ? (
            <span>Resend code in {timer}s</span>
          ) : (
            <button
              type="button"
              className="linkb"
              onClick={() => {
                setTimer(30);
                setDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
              }}
            >
              Resend code
            </button>
          )}
        </p>

        <button
          type="submit"
          className="btn btn-w btn-lg btn-block"
          disabled={loading || digits.join('').length < 6}
        >
          {loading ? (
            <>
              <span className="spinline" /> Verifying…
            </>
          ) : (
            'Verify and continue'
          )}
        </button>
      </form>

      <p className="auth-alt">
        Wrong number?{' '}
        <button
          type="button"
          className="linkb"
          onClick={() => setAuthView('signup')}
        >
          Change number
        </button>
      </p>
    </div>
  );
};

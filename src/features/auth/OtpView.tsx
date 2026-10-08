import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { fmtPhone } from '../../utils/authHelpers';
import { OB_STEPS } from '../../data/onboardingData';

export const OtpView: React.FC = () => {
  const { signupData, verifyOtp, setAuthView } = useAuth();
  const { toast } = useApp();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setResend(r => (r > 0 ? r - 1 : 0));
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
      e.preventDefault();
      const prevInput = inputRefs.current[idx - 1];
      if (prevInput) {
        setDigits(prev => {
          const next = [...prev];
          next[idx - 1] = '';
          return next;
        });
        prevInput.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
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

  const handleResendCode = () => {
    setResend(30);
    toast('A new code has been sent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter all 6 digits of the code.');
      return;
    }

    setLoading(true);
    setError(null);
    const ok = await verifyOtp(code);
    setLoading(false);

    if (!ok) {
      setError('Invalid verification code.');
    }
  };

  const formattedPhone = signupData?.phone ? fmtPhone(signupData.phone) : '+234 803 415 9920';

  return (
    <div>
      {/* 10-step progress bar before setup rail */}
      <div className="acprog" role="img" aria-label={`Step 2 of ${OB_STEPS.length}: Verify Phone`}>
        <div className="segs">
          {OB_STEPS.map((_, i) => (
            <i key={i} className={i < 2 ? 'on' : ''} />
          ))}
        </div>
        <div className="lab">
          <span>Step 02 of {OB_STEPS.length}</span>
          <span>{OB_STEPS[1].t}</span>
        </div>
      </div>

      <button
        type="button"
        className="linkb"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '14px', fontSize: '13.5px' }}
        onClick={() => setAuthView('signup')}
      >
        <Icon name="chevl" size={14} /> Edit details
      </button>

      <h1 id="gH" tabIndex={-1}>
        Verify your phone number
      </h1>
      <p className="sub">
        Enter the 6-digit code we sent to <b>{formattedPhone}</b>.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={`otp ${error ? 'bad' : ''}`} role="group" aria-label="6-digit code">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={el => (inputRefs.current[idx] = el)}
              id={`gOtp${idx}`}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete={idx === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${idx + 1}`}
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onPaste={handlePaste}
            />
          ))}
        </div>

        {error && (
          <div className="g-err" id="eOtp" role="alert" style={{ marginBottom: '12px' }}>
            <Icon name="alert" size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="note" style={{ margin: '12px 0 20px' }}>
          Preview only: no SMS is sent. Enter any 6 digits to continue.
        </div>

        <button className="btn btn-w btn-lg btn-block" type="submit" disabled={loading}>
          {loading ? 'Creating your account…' : 'Verify and continue'}
        </button>
      </form>

      <p className="auth-alt" id="resendTxt">
        {resend > 0 ? (
          <>
            Resend code in <span className="mono">0:{String(resend).padStart(2, '0')}</span>
          </>
        ) : (
          <>
            Didn’t get it?{' '}
            <button type="button" className="linkb" onClick={handleResendCode}>
              Resend code
            </button>
          </>
        )}
      </p>
    </div>
  );
};

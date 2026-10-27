import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { normPhone, phoneOk, EMAIL_RE, pwScore } from '../../utils/authHelpers';
import { OB_STEPS } from '../../data/onboardingData';

export const SignupView: React.FC = () => {
  const { signupData, signup, setAuthView } = useAuth();
  const { toast, go } = useApp();
  const [name, setName] = useState(signupData?.name || '');
  const [phone, setPhone] = useState(() => {
    if (!signupData?.phone) return '';
    const digits = normPhone(signupData.phone).slice(0, 10);
    if (digits.length > 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (digits.length > 3) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }
    return digits;
  });
  const [email, setEmail] = useState(signupData?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [duplicateAccount, setDuplicateAccount] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = normPhone(raw).slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }
    setPhone(formatted);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    if (generalError) setGeneralError(null);
  };

  const score = pwScore(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().split(' ').length < 2) {
      newErrors.name = 'Enter your first and last name.';
    }

    const cleanPhone = normPhone(phone);
    if (!phoneOk(cleanPhone)) {
      newErrors.phone = 'Enter a valid Nigerian mobile number, for example 803 415 9920.';
    }

    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      newErrors.email = 'Enter a valid email address, for example name@example.com.';
    }

    if (!password) {
      newErrors.password = 'Create a password.';
    } else if (password.length < 8) {
      newErrors.password = 'Use at least 8 characters.';
    } else if (score < 2) {
      newErrors.password = 'That password is too common. Choose something harder to guess.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGeneralError(null);
    setDuplicateAccount(false);
    setLoading(true);

    try {
      const result = await signup(name.trim(), cleanPhone, email.trim().toLowerCase(), password, signupData?.installerCode);

      if (result.ok) {
        setAuthView('otp');
        go('otp');
        return;
      }

      if (!result.ok && result.error) {
        if (result.duplicateAccount) {
          setGeneralError(result.error);
          setDuplicateAccount(true);
          return;
        }
        const errLower = result.error.toLowerCase();
        if (errLower.includes('phone') || errLower.includes('number')) {
          setErrors(prev => ({ ...prev, phone: result.error || 'Phone number already registered.' }));
        } else if (errLower.includes('email')) {
          setErrors(prev => ({ ...prev, email: result.error || 'Email already registered.' }));
        } else {
          setGeneralError(result.error);
        }
      }
    } catch (unexpectedErr: any) {
      setGeneralError(unexpectedErr?.message || 'An unexpected error occurred during account creation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="kick">Step 1 of 5 · Create your account</div>
      <h1 id="gH" tabIndex={-1}>
        Create your account
      </h1>
      <p className="sub">A few details and you’re in.</p>

      <form onSubmit={handleSubmit} noValidate>
        {generalError && (
          <div className="g-banner" role="alert">
            <Icon name="alert" size={16} />
            <span>{generalError}</span>
          </div>
        )}
        {duplicateAccount && (
          <p className="g-hint" style={{ marginTop: '-8px', marginBottom: '16px' }}>
            Already registered?{' '}
            <button
              type="button"
              className="linkb"
              onClick={() => {
                setAuthView('login');
                go('login');
              }}
            >
              Log in to your account
            </button>
          </p>
        )}

        {/* Full Name */}
        <div className="fld">
          <label htmlFor="fName">Full name</label>
          <input
            className={`in ${errors.name ? 'bad' : ''}`}
            id="fName"
            autoComplete="name"
            value={name}
            placeholder="e.g. Adaeze Okonkwo"
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
          />
          {errors.name && (
            <div className="g-err" id="eName" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        {/* Phone Number with +234 prefix */}
        <div className="fld">
          <label htmlFor="fPhone">
            Phone number <span className="opt">· we’ll text you a code</span>
          </label>
          <div className={`pfx ${errors.phone ? 'bad' : ''}`}>
            <span>+234</span>
            <input
              id="fPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="803 415 9920"
              value={phone}
              onChange={handlePhoneChange}
            />
          </div>
          {errors.phone && (
            <div className="g-err" id="ePhone" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.phone}</span>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="fld">
          <label htmlFor="fEmail">
            Email <span className="opt">· optional</span>
          </label>
          <input
            className={`in ${errors.email ? 'bad' : ''}`}
            id="fEmail"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            placeholder="you@email.com"
            onChange={e => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
          />
          {errors.email ? (
            <div className="g-err" id="eEmail" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.email}</span>
            </div>
          ) : (
            <div className="g-hint">For receipts and account recovery. You can add and verify it later.</div>
          )}
        </div>

        {/* Password */}
        <div className="fld" style={{ marginBottom: '18px' }}>
          <label htmlFor="fPw">Password</label>
          <div className="pwrap">
            <input
              className={`in ${errors.password ? 'bad' : ''}`}
              id="fPw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              placeholder="Create a password"
              onChange={e => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
            />
            <button
              type="button"
              id="pwTog"
              onClick={() => setShowPassword(!showPassword)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <div className="g-err" id="ePw" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.password}</span>
            </div>
          )}

          {/* Password strength meter */}
          <div id="pwMeter">
            <div className="meter" aria-hidden="true">
              {[1, 2, 3, 4].map(i => (
                <i key={i} className={i <= score ? 'on' : ''} />
              ))}
            </div>
            <div className="meter-l">
              <span>{password ? ['', 'Weak', 'Okay', 'Good', 'Strong'][score] : 'Use at least 8 characters'}</span>
              <span>
                {password && score < 2
                  ? password.length < 8
                    ? 'Too short'
                    : 'Too easy to guess'
                  : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Inline Terms notice */}
        <p className="g-hint" style={{ marginBottom: '18px' }}>
          By continuing you agree to ENDRA’s{' '}
          <button
            type="button"
            className="linkb"
            onClick={() => toast('Terms of service are available in the live product')}
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            className="linkb"
            onClick={() => toast('Privacy policy is available in the live product')}
          >
            Privacy Policy
          </button>
          .
        </p>

        <button className="btn btn-w btn-lg btn-block" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinline" />
              Creating your account
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="auth-alt">
        Already have an account?{' '}
        <button
          type="button"
          className="linkb"
          onClick={() => {
            signup(name.trim(), normPhone(phone), email.trim().toLowerCase(), '', signupData?.installerCode);
            setAuthView('login');
            go('login');
          }}
        >
          Log in
        </button>
      </p>
    </>
  );
};

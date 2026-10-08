import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { normPhone, phoneOk, EMAIL_RE, pwScore } from '../../utils/authHelpers';
import { OB_STEPS } from '../../data/onboardingData';

export const SignupView: React.FC = () => {
  const { signupData, signup, setAuthView } = useAuth();
  const [name, setName] = useState(signupData?.name || '');
  const [phone, setPhone] = useState(signupData?.phone || '');
  const [email, setEmail] = useState(signupData?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  };

  const score = pwScore(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().split(' ').length < 2) {
      newErrors.name = 'Enter your first and last name.';
    }

    const cleanPhone = normPhone(phone);
    if (!phoneOk(cleanPhone)) {
      newErrors.phone = 'Enter a valid Nigerian mobile number, for example 803 415 9920.';
    }

    if (!EMAIL_RE.test(email.trim())) {
      newErrors.email = 'Enter a valid email address, for example name@example.com.';
    }

    if (!password) {
      newErrors.password = 'Create a password.';
    } else if (password.length < 8) {
      newErrors.password = 'Use at least 8 characters.';
    } else if (score < 2) {
      newErrors.password = 'That password is too common. Choose something harder to guess.';
    }

    if (!terms) {
      newErrors.terms = 'Agree to the Terms of Service and Privacy Policy to continue.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await signup(name.trim(), cleanPhone, email.trim().toLowerCase(), password);
  };

  return (
    <div>
      {/* 10-step progress bar before setup rail */}
      <div className="acprog" role="img" aria-label={`Step 1 of ${OB_STEPS.length}: Create Account`}>
        <div className="segs">
          {OB_STEPS.map((_, i) => (
            <i key={i} className={i < 1 ? 'on' : ''} />
          ))}
        </div>
        <div className="lab">
          <span>Step 01 of {OB_STEPS.length}</span>
          <span>{OB_STEPS[0].t}</span>
        </div>
      </div>

      <button
        type="button"
        className="linkb"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '14px', fontSize: '13.5px' }}
        onClick={() => setAuthView('start')}
      >
        <Icon name="chevl" size={14} /> Back
      </button>

      <h1 id="gH" tabIndex={-1}>
        Create your account
      </h1>
      <p className="sub">Set up ENDRA for your home, office or facility.</p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="fld">
          <label htmlFor="fName">Full name</label>
          <input
            className={`in ${errors.name ? 'bad' : ''}`}
            id="fName"
            autoComplete="name"
            value={name}
            placeholder="First and last name"
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
          />
          {errors.name ? (
            <div className="g-err" id="eName" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.name}</span>
            </div>
          ) : (
            <div className="g-hint">Use the name on your government ID.</div>
          )}
        </div>

        {/* Phone Number with +234 prefix */}
        <div className="fld">
          <label htmlFor="fPhone">Phone number</label>
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
          <label htmlFor="fEmail">Email</label>
          <input
            className={`in ${errors.email ? 'bad' : ''}`}
            id="fEmail"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            placeholder="name@example.com"
            onChange={e => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
          />
          {errors.email && (
            <div className="g-err" id="eEmail" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.email}</span>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="fld">
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

        {/* Terms */}
        <div className="fld" style={{ margin: '20px 0 24px' }}>
          <label className="chk2">
            <input
              type="checkbox"
              id="fTerms"
              checked={terms}
              onChange={e => {
                setTerms(e.target.checked);
                if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
              }}
            />
            <span>
              I agree to the <span className="linkb">Terms of Service</span> and <span className="linkb">Privacy Policy</span>.
            </span>
          </label>
          {errors.terms && (
            <div className="g-err" role="alert">
              <Icon name="alert" size={14} />
              <span>{errors.terms}</span>
            </div>
          )}
        </div>

        <button className="btn btn-w btn-lg btn-block" type="submit">
          Create account
        </button>
      </form>

      <p className="auth-alt">
        Already have an account?{' '}
        <button
          type="button"
          className="linkb"
          onClick={() => setAuthView('login')}
        >
          Log in
        </button>
      </p>
    </div>
  );
};

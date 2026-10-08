import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Logo } from '../../components/icons/Logo';
import { Icon } from '../../components/icons/Icon';
import { FeedCanvas } from '../../components/media/FeedCanvas';
import { normPhone, phoneOk } from '../../utils/authHelpers';

export const LandingView: React.FC = () => {
  const { setAuthView, signup, loginSample } = useAuth();
  const { effectiveTheme, toggleTheme, toast, go } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);

  const demoDevice = {
    ci: 2,
    id: 'Camera 03',
    name: 'Parking A Camera',
    status: 'motion' as const
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = identifier.trim();
    if (!raw) {
      setError('Enter a valid email address or Nigerian mobile number.');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.toLowerCase());
    const cleanPhone = normPhone(raw);
    const isPhone = !isEmail && phoneOk(cleanPhone);

    if (!isEmail && !isPhone) {
      setError('Enter a valid email address or Nigerian mobile number.');
      return;
    }

    setError(null);
    signup(
      '',
      isPhone ? cleanPhone : '',
      isEmail ? raw.toLowerCase() : '',
      ''
    );
    setAuthView('signup');
    go('signup');
  };

  return (
    <div className="land">
      {/* Top Header */}
      <header className="land-nav">
        <a className="land-logo" href="#/start" aria-label="ENDRA">
          <Logo height={28} />
        </a>
        <div className="land-nav-r">
          <button
            className="ibtn theme-btn"
            id="gTheme"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
          >
            <Icon name={effectiveTheme === 'light' ? 'moon' : 'sun'} size={19} />
          </button>
          <button
            type="button"
            className="btn btn-g"
            onClick={() => {
              setAuthView('login');
              go('login');
            }}
          >
            Log in
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="land-main">
        <section className="land-copy">
          <h1 id="gH" tabIndex={-1}>
            Know your property is safe, wherever you are.
          </h1>
          <p className="lede">
            Live cameras, one-tap SOS and verified response, together in one ENDRA account.
          </p>

          <form className="land-form" noValidate onSubmit={handleStart}>
            <p className="l-ask">
              Ready to get started? Enter your email or phone number to create your account.
            </p>

            <div className="gs">
              <label className="float">
                <input
                  id="lIdent"
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  inputMode="email"
                  placeholder=" "
                  value={identifier}
                  className={error ? 'bad' : ''}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                />
                <span>Email or phone number</span>
              </label>

              <button className="btn btn-w btn-lg gs-btn" type="submit">
                Get started <Icon name="chevr" size={18} strokeWidth={2.2} />
              </button>
            </div>

            {error && (
              <div className="l-msg" id="lMsg" role="alert">
                <span className="g-err">
                  <Icon name="alert" size={14} />
                  <span>{error}</span>
                </span>
              </div>
            )}

            <p className="g-hint">Free to start. No card needed.</p>
          </form>
        </section>

        {/* Art / Demo Feed */}
        <section className="land-art" aria-hidden="true">
          <div className="art-feed">
            <FeedCanvas device={demoDevice} useEventDetection={true} />
            <div className="art-chip">
              <span className="ac-ic">
                <Icon name="search" size={16} />
              </span>
              <div>
                <b>AI alert · Parking A</b>
                <span className="s">Plate on watchlist · operator notified</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Feature Value Props */}
      <section className="land-feats" aria-label="What ENDRA does">
        <div className="lf">
          <span className="ico">
            <Icon name="cam" size={20} />
          </span>
          <div>
            <b>Live cameras</b>
            <span>See every camera from one place, wherever you are.</span>
          </div>
        </div>

        <div className="lf">
          <span className="ico">
            <Icon name="alert" size={20} />
          </span>
          <div>
            <b>One-tap SOS</b>
            <span>Hold to alert your contacts and ENDRA operators. A duress PIN keeps you safe.</span>
          </div>
        </div>

        <div className="lf">
          <span className="ico">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <b>Verified response</b>
            <span>ENDRA operators check every alert before anyone is sent.</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="land-foot">
        <span>© {new Date().getFullYear()} ENDRA</span>
        <button type="button" onClick={() => toast('Privacy policy is available in the live product')}>
          Privacy
        </button>
        <button type="button" onClick={() => toast('Terms of service are available in the live product')}>
          Terms
        </button>
        <button type="button" onClick={loginSample}>
          Explore a sample portal
        </button>
      </footer>
    </div>
  );
};

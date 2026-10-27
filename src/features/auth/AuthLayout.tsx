import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Logo } from '../../components/icons/Logo';
import { Icon } from '../../components/icons/Icon';
import { FeedCanvas } from '../../components/media/FeedCanvas';
import { LandingView } from './LandingView';
import { LoginView } from './LoginView';
import { SignupView } from './SignupView';
import { OtpView } from './OtpView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ForgotSentView } from './ForgotSentView';
import { ResetPasswordView } from './ResetPasswordView';
import { ResetDoneView } from './ResetDoneView';

export const AuthArt: React.FC = () => {
  const demoDevice = {
    ci: 2,
    id: 'Camera 03',
    name: 'Parking A Camera',
    status: 'motion' as const
  };

  return (
    <aside className="auth-art" aria-label="About ENDRA">
      <span className="alogo">
        <Logo height={28} />
      </span>

      <div className="art-feed" aria-hidden="true">
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

      <div className="art-copy">
        <div className="art-h">Know the moment something’s wrong.</div>
        <p>
          ENDRA watches your cameras, flags threats and alerts the people you trust when you press SOS.
        </p>
        <ul className="art-list">
          <li>
            <Icon name="lock" size={17} />
            <span>Camera feeds are encrypted with AES-256</span>
          </li>
          <li>
            <Icon name="users" size={17} />
            <span>Your emergency contacts are alerted when you press SOS</span>
          </li>
          <li>
            <Icon name="pin" size={17} />
            <span>112, state and federal emergency numbers are one tap away</span>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export const AuthLayout: React.FC = () => {
  const { authView, setAuthView } = useAuth();
  const { effectiveTheme, toggleTheme, toast, go } = useApp();

  if (authView === 'start') {
    return <LandingView />;
  }

  const renderView = () => {
    switch (authView) {
      case 'signup':
        return <SignupView />;
      case 'otp':
        return <OtpView />;
      case 'login':
        return <LoginView />;
      case 'forgot':
        return <ForgotPasswordView />;
      case 'forgotSent':
        return <ForgotSentView />;
      case 'reset':
        return <ResetPasswordView />;
      case 'resetDone':
        return <ResetDoneView />;
      default:
        return <LoginView />;
    }
  };

  return (
    <div id="gate" className="gate">
      <div className="auth">
        <AuthArt />

        <main className="auth-main">
          <div className="auth-bar">
            <span className="mlogo">
              <Logo height={22} />
            </span>
            <button
              type="button"
              className="ibtn theme-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
            >
              <Icon name={effectiveTheme === 'light' ? 'moon' : 'sun'} size={19} />
            </button>
          </div>

          <div className="auth-card">
            {(authView === 'signup' || authView === 'login') && (
              <div className="tabs full" role="tablist" aria-label="Account">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authView === 'signup'}
                  className={`tab ${authView === 'signup' ? 'on' : ''}`}
                  onClick={() => {
                    setAuthView('signup');
                    go('signup');
                  }}
                >
                  Create account
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authView === 'login'}
                  className={`tab ${authView === 'login' ? 'on' : ''}`}
                  onClick={() => {
                    setAuthView('login');
                    go('login');
                  }}
                >
                  Log in
                </button>
              </div>
            )}

            {renderView()}
          </div>

          <div className="auth-foot">
            <span>© {new Date().getFullYear()} ENDRA</span>
            <button
              type="button"
              onClick={() => toast('Privacy policy is available in the live product')}
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => toast('Terms of service are available in the live product')}
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => toast('Support: open the Help section after you sign in')}
            >
              Help
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

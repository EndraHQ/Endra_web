import { Logo } from './components/icons/Logo';
import React, { useEffect } from 'react';
import { useAuth, store } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { useModals } from './context/ModalContext';
import { resolveIntent } from './utils/intentResolver';
import { AppShell } from './components/layout/AppShell';
import { ModalRoot } from './modals/ModalRoot';
import { AuthLayout } from './features/auth/AuthLayout';
import { OnboardingLayout } from './features/onboarding/OnboardingLayout';
import { DashboardView } from './features/dashboard/DashboardView';
import { MonitorView } from './features/monitor/MonitorView';
import { ActivityView } from './features/activity/ActivityView';
import { MessagesView } from './features/messages/MessagesView';
import { SosView } from './features/sos/SosView';
import { PropertiesView } from './features/properties/PropertiesView';
import { AccessView } from './features/access/AccessView';
import { PlansView } from './features/plans/PlansView';
import { SettingsView } from './features/settings/SettingsView';

const PORTAL_ROUTES = ['home', 'monitor', 'activity', 'messages', 'sos', 'properties', 'access', 'plans', 'settings'];

export const AppContent: React.FC = () => {
  const { stage, setStage, authView, setAuthView, account, signup, pendingIntent, savePendingIntent, consumePendingIntent, isValidatingSession } = useAuth();
  const { route, go } = useApp();
  const { openModal } = useModals();

  // Smart Entry Route & Route-Stage Synchronization Handler
  useEffect(() => {
    if (isValidatingSession) return;

    // 1. Handle direct arrival on canonical smart-entry route #/open
    if (route.name === 'open') {
      const targetIntent = route.query?.intent?.trim().toLowerCase();
      const intentParams = route.query;

      // Extract prefill parameters if provided by mobile app
      const phoneParam = route.query?.phone;
      const emailParam = route.query?.email;
      const nameParam = route.query?.name;
      const codeParam = route.query?.code || route.query?.installerCode || route.query?.referralCode;

      if (phoneParam || emailParam || nameParam || codeParam) {
        signup(nameParam || '', phoneParam || '', emailParam || '', '', codeParam || '');
      }

      if (stage === 'auth') {
        if (targetIntent === 'register' || targetIntent === 'signup') {
          setAuthView('signup');
          go('signup');
        } else if (targetIntent === 'login') {
          setAuthView('login');
          go('login');
        } else {
          if (targetIntent) {
            savePendingIntent(targetIntent, intentParams);
          }
          setAuthView('login');
          go('login');
        }
      } else if (stage === 'onboarding') {
        if (targetIntent === 'register' || targetIntent === 'signup' || targetIntent === 'onboarding') {
          go('welcome');
        } else if (targetIntent) {
          savePendingIntent(targetIntent, intentParams);
        }
      } else if (stage === 'portal') {
        if (targetIntent === 'register' || targetIntent === 'signup') {
          // User already has an authenticated account and completed onboarding
          go('home');
        } else {
          const resolved = resolveIntent(targetIntent, intentParams);
          go(resolved.path);
          if (resolved.openModal === 'addCamera') {
            openModal({ type: 'addCamera' });
          } else if (resolved.openModal === 'plans') {
            openModal({ type: 'plans' });
          } else if (resolved.openModal === 'commandCenter') {
            openModal({ type: 'commandCenter' });
          }
        }
      }
      return;
    }

    // 2. Handle deferred intent execution when transitioning into portal stage
    if (stage === 'portal' && pendingIntent) {
      const intentToRun = consumePendingIntent();
      if (intentToRun && intentToRun.intent) {
        const resolved = resolveIntent(intentToRun.intent, intentToRun.params);
        go(resolved.path);
        if (resolved.openModal === 'addCamera') {
          openModal({ type: 'addCamera' });
        } else if (resolved.openModal === 'plans') {
          openModal({ type: 'plans' });
        } else if (resolved.openModal === 'commandCenter') {
          openModal({ type: 'commandCenter' });
        }
      }
      return;
    }

    // 3. Root entry normalization: / or /#/ or #/start
    if (route.name === 'start') {
      if (account?.ob?.done && stage === 'portal') {
        go('home');
        return;
      }
      if (account && stage === 'onboarding') {
        go('welcome');
        return;
      }

      if (stage !== 'auth') setStage('auth');
      if (authView !== 'start') setAuthView('start');
      try {
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
          window.history.replaceState(null, '', '#/start');
        }
      } catch {}
      return;
    }

    // 4. Auth routes synchronization
    if (route.name === 'login') {
      // A successful login can commit account/stage state before the hash
      // update is observed. Preserve that authenticated in-memory transition
      // instead of resetting it back to the public auth stage.
      if (account && stage === 'portal') {
        go('home');
        return;
      }
      if (account && stage === 'onboarding') {
        go('welcome');
        return;
      }
      if (stage !== 'auth') setStage('auth');
      if (authView !== 'login') setAuthView('login');
      return;
    }

    if (route.name === 'signup') {
      const phoneParam = route.query?.phone;
      const emailParam = route.query?.email;
      const nameParam = route.query?.name;
      const codeParam = route.query?.code || route.query?.installerCode || route.query?.referralCode;

      if (phoneParam || emailParam || nameParam || codeParam) {
        signup(nameParam || '', phoneParam || '', emailParam || '', '', codeParam || '');
      }

      if (stage !== 'auth') setStage('auth');
      if (authView !== 'signup') setAuthView('signup');
      return;
    }

    if (route.name === 'otp') {
      if (stage !== 'auth') setStage('auth');
      if (authView !== 'otp') setAuthView('otp');
      return;
    }

    if (route.name === 'forgot') {
      if (stage !== 'auth') setStage('auth');
      if (authView !== 'forgot') setAuthView('forgot');
      return;
    }

    if (route.name === 'welcome') {
      if (account?.ob?.done && stage === 'portal') {
        go('home');
        return;
      }
      if (stage !== 'onboarding') setStage('onboarding');
      return;
    }

    // 5. Portal routes access guard: strict protection
    if (PORTAL_ROUTES.includes(route.name)) {
      if (stage !== 'portal' || !account) {
        if (account?.ob?.done && stage === 'portal') {
          // Allowed
        } else if (account && stage === 'onboarding') {
          go('welcome');
        } else {
          setStage('auth');
          setAuthView('start');
          go('start');
          try {
            window.history.replaceState(null, '', '#/start');
          } catch {}
        }
      }
    }
  }, [route.name, route.query, stage, setStage, setAuthView, go, openModal, pendingIntent, savePendingIntent, consumePendingIntent, account, isValidatingSession]);

  if (isValidatingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Logo height={32} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--g400)', fontSize: '13px' }}>
            <span className="spinline" /> Verifying session…
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'auth' || !account) {
    return (
      <>
        <AuthLayout />
        <ModalRoot />
      </>
    );
  }

  if (stage === 'onboarding') {
    return (
      <>
        <OnboardingLayout />
        <ModalRoot />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (route.name) {
      case 'home':
        return <DashboardView />;
      case 'monitor':
        return <MonitorView />;
      case 'activity':
        return <ActivityView />;
      case 'messages':
        return <MessagesView />;
      case 'sos':
        return <SosView />;
      case 'properties':
        return <PropertiesView />;
      case 'access':
        return <AccessView />;
      case 'plans':
        return <PlansView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <AppShell>{renderCurrentView()}</AppShell>
      <ModalRoot />
    </>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;

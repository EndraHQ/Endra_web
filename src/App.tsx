import React from 'react';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
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
import { SettingsView } from './features/settings/SettingsView';

export const AppContent: React.FC = () => {
  const { stage } = useAuth();
  const { route } = useApp();

  if (stage === 'auth') {
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

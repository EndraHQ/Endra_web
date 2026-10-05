import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { TYPE_META, planById } from '../../data/onboardingData';
import { plural } from '../../utils/formatters';
import { OnboardingActions } from './OnboardingActions';

export const OnboardingComplete: React.FC = () => {
  const {
    account,
    onboardingData,
    setObStep,
    completeOnboarding
  } = useAuth();
  const { setUser, setPlace } = useApp();

  const currentPlan = planById(onboardingData.plan || 'plus');
  const typeMeta = TYPE_META[onboardingData.type] || TYPE_META.Residence;
  const cams = onboardingData.cams || [];
  const contacts = onboardingData.contacts || [];

  const userName = account?.name || 'Adaeze Okonkwo';
  const firstName = userName.split(' ')[0] || userName;

  const activeAlertsCount = [
    onboardingData.alerts?.notifPush,
    onboardingData.alerts?.notifIncident,
    onboardingData.alerts?.notifSystem,
    onboardingData.alerts?.notifMarketing
  ].filter(Boolean).length;

  const handleEnterDashboard = () => {
    // Sync AppContext user details
    setUser(prev => ({
      ...prev,
      name: userName,
      faceEnrolled: Boolean(onboardingData.face?.enrolled),
      faceTemplate: onboardingData.face?.tmpl || null,
      faceQuality: onboardingData.face?.enrolled ? 98 : 0,
      plan: currentPlan.name
    }));

    if (onboardingData.pname) {
      setPlace('p1');
    }

    completeOnboarding();
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="check" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            You’re all set, {firstName}
          </h1>
          <p className="sub">
            Your account is ready. Here’s what you set up. You can change any of it later in Settings.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        <div className="sumlist" aria-label="Setup summary">
          {/* 1. Property */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="building" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Property</span>
            <span className="v">
              {onboardingData.pname || 'My Home'}
              <small>
                {typeMeta.lbl} · {onboardingData.address || '14 Admiralty Way'},{' '}
                {onboardingData.area || 'Lekki Phase 1'}, {onboardingData.state || 'Lagos'} ·{' '}
                {onboardingData.role || 'Owner'}
              </small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('property')}
              aria-label="Edit property"
            >
              Edit
            </button>
          </div>

          {/* 2. Cameras */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="cam" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Cameras</span>
            <span className="v">
              {cams.length ? `${plural(cams.length, 'camera')} connected` : 'None yet'}
              <small>
                {cams.length ? cams.map(c => c.name).join(', ') : 'Add one from Monitor'}
              </small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('cameras')}
              aria-label="Edit cameras"
            >
              Edit
            </button>
          </div>

          {/* 3. Identity */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="scan" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Identity</span>
            <span className="v">
              {onboardingData.face?.enrolled ? 'Confirmed' : 'Not confirmed'}
              <small>
                {onboardingData.face?.enrolled
                  ? `Account owner: ${userName}`
                  : 'Can be enrolled in Settings'}
              </small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('face')}
              aria-label="Edit identity"
            >
              Edit
            </button>
          </div>

          {/* 4. Security PIN */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="key" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Security PIN</span>
            <span className="v">
              {onboardingData.pins?.access ? 'Set' : 'Not set'}
              <small>
                {onboardingData.pins?.duress
                  ? 'Duress PIN set'
                  : 'No duress PIN'}
              </small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('pins')}
              aria-label="Edit security PIN"
            >
              Edit
            </button>
          </div>

          {/* 5. Emergency Contacts */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="users" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Emergency contacts</span>
            <span className="v">
              {contacts.length ? plural(contacts.length, 'contact') : 'None yet'}
              <small>
                {contacts.length
                  ? contacts.map(c => c.name.split(' ')[0]).join(', ')
                  : 'Add contacts from Settings'}
              </small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('contacts')}
              aria-label="Edit emergency contacts"
            >
              Edit
            </button>
          </div>

          {/* 6. Alerts & Locations */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="bell" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Alerts and locations</span>
            <span className="v">
              {activeAlertsCount ? `${plural(activeAlertsCount, 'alert type')} on` : 'All alerts off'}
              <small>Priority zones configured</small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('alerts')}
              aria-label="Edit alerts and locations"
            >
              Edit
            </button>
          </div>

          {/* 7. Plan */}
          <div className="sumrow">
            <span className="si" aria-hidden="true">
              <Icon name="card" size={19} strokeWidth={1.6} />
            </span>
            <span className="k">Plan</span>
            <span className="v">
              {currentPlan.name}
              <small>
                {currentPlan.price} per month · up to {currentPlan.cams} cameras
              </small>
            </span>
            <button
              type="button"
              className="e"
              onClick={() => setObStep('plans')}
              aria-label="Edit plan"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Action bar */}
        <OnboardingActions
          showBack={false}
          continueLabel="Open my portal"
          onContinue={handleEnterDashboard}
          continueType="button"
        />
      </div>
    </>
  );
};

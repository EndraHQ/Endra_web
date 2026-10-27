import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { useLabel } from '../../data/onboardingData';
import { plural } from '../../utils/formatters';
import { fmtPhone } from '../../utils/authHelpers';

export const ReviewStep: React.FC = () => {
  const {
    account,
    signupData,
    onboardingData,
    setObStep,
    isActivating,
    activateOnboarding
  } = useAuth();
  const [activationError, setActivationError] = useState<string | null>(null);
  const activationInFlight = useRef(false);

  const handleFinish = async () => {
    if (isActivating || activationInFlight.current) return;
    activationInFlight.current = true;
    setActivationError(null);
    try {
      const result = await activateOnboarding();
      if (!result.ok) {
        const failedStep = Object.values(result.report?.steps || {}).find(
          s => s.status === 'blocked' || s.status === 'failed'
        );
        setActivationError(
          failedStep?.message || 'Activation could not be completed. Please check your connection and try again.'
        );
      }
    } catch (err: any) {
      setActivationError(err?.message || 'An unexpected error occurred during activation.');
    } finally {
      activationInFlight.current = false;
    }
  };

  const handleBack = () => {
    setObStep('use');
  };

  const contacts = onboardingData.contacts || [];
  const faceOk = Boolean(onboardingData.face && onboardingData.face.enrolled);

  const rawPhone = account?.phone || signupData?.phone || '';
  const formattedPhone = rawPhone ? fmtPhone(rawPhone) : '';
  const userAccountShown = account?.email || formattedPhone || 'Account details';

  const row = (
    ico: string,
    k: string,
    v: string,
    sub?: string,
    step?: string
  ) => (
    <div className="sumrow" key={k}>
      <span className="si" aria-hidden="true">
        <Icon name={ico} size={19} strokeWidth={1.6} />
      </span>
      <span className="k">{k}</span>
      <span className="v">
        {v}
        {sub && <small>{sub}</small>}
      </span>
      {step ? (
        <button
          type="button"
          className="e"
          onClick={() => setObStep(step)}
          aria-label={`Edit ${k}`}
        >
          Edit
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="check" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Your ENDRA setup
          </h1>
          <p className="sub">
            Here’s what’s ready. You’ll finish the rest from your dashboard.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        <div className="sumlist">
          {/* Row 1: Account created */}
          {row('user', 'Account created', account?.name || signupData?.name || 'Your Account', userAccountShown)}

          {/* Row 2: Safety PIN */}
          {row(
            'key',
            'Safety PIN',
            onboardingData.pins && onboardingData.pins.access ? 'Configured' : 'Not set',
            onboardingData.pins && onboardingData.pins.duress ? 'PIN and duress PIN set' : '',
            'safety'
          )}

          {/* Row 3: Emergency contacts */}
          {row(
            'users',
            'Emergency contacts',
            contacts.length ? plural(contacts.length, 'contact') : 'Not added',
            contacts.length
              ? 'Alerted in an SOS: ' + contacts.map(c => c.name.split(' ')[0]).join(', ')
              : 'Add contacts so SOS has someone to alert',
            'contacts'
          )}

          {/* Row 4: Face profile */}
          {row(
            'scan',
            'Face profile',
            faceOk ? 'Configured' : 'Skipped',
            faceOk ? 'ENDRA will recognise you' : 'Add it later in Settings',
            'safety'
          )}

          {/* Row 5: Protecting */}
          {row(
            'shield',
            'Protecting',
            useLabel(onboardingData.use || []).join(', ') || 'Personal safety',
            undefined,
            'use'
          )}

          {/* Row 6: Camera setup */}
          {row('cam', 'Camera setup', 'Not added', 'You can do this from your dashboard')}
        </div>

        <div className="note" style={{ marginTop: '16px' }}>
          <b>What happens next.</b> Once you’re in, ENDRA walks you through adding your place, cameras and notifications at your own pace. You start on the free plan.
        </div>

        {activationError && (
          <div className="alert alert-err" style={{ marginTop: '14px', marginBottom: '8px' }}>
            {activationError}
          </div>
        )}

        <div className="onb-actions">
          <button
            type="button"
            className="btn btn-g btn-lg"
            onClick={handleBack}
          >
            Back
          </button>
          <span className="sp" />
          <button
            type="button"
            className="btn btn-w btn-lg"
            id="gFinish"
            onClick={handleFinish}
            disabled={isActivating}
          >
            {isActivating ? (
              <>
                <span className="spinline" />
                Activating ENDRA
              </>
            ) : (
              'Activate ENDRA'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

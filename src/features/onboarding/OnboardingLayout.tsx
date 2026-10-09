import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Logo } from '../../components/icons/Logo';
import { Icon } from '../../components/icons/Icon';
import { OB_STEPS, ONB_ICON, ONB_WHY, planById } from '../../data/onboardingData';
import { initials } from '../../utils/formatters';

import { PropertyStep } from './PropertyStep';
import { CamerasStep } from './CamerasStep';
import { FaceIdStep } from './FaceIdStep';
import { SecurityPinStep } from './SecurityPinStep';
import { EmergencyContactsStep } from './EmergencyContactsStep';
import { AlertsLocationsStep } from './AlertsLocationsStep';
import { PlanStep } from './PlanStep';
import { ReviewStep } from './ReviewStep';
import { OnboardingComplete } from './OnboardingComplete';

export const DialProgress: React.FC<{
  steps: { id: string; t: string; d: string }[];
  currentStepId: string;
  stepsStatus: Record<string, string>;
  isReady: boolean;
}> = ({ steps, currentStepId, stepsStatus, isReady }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  const N = steps.length;
  const r = 64;
  const C = 2 * Math.PI * r;
  const seg = C / N;
  const gap = 4;
  const dash = Math.max(1, seg - gap);

  return (
    <div className={`onb-prog ${isReady ? 'ready' : ''}`}>
      <svg
        className="dial"
        viewBox="0 0 160 160"
        role="img"
        aria-label={isReady ? 'Setup complete' : `Step ${currentIndex + 1} of ${N}`}
      >
        <circle className="track" cx="80" cy="80" r="64" />
        {steps.map((s, k) => {
          const st = stepsStatus[s.id];
          const isCur = s.id === currentStepId && !isReady;
          const on = st === 'done' || (isReady && st !== 'skipped');
          const sk = st === 'skipped';
          const off = k * seg;
          const cls = isCur ? 'seg cur' : on ? 'seg on' : sk ? 'seg skip' : 'seg';
          return (
            <circle
              key={s.id}
              className={cls}
              cx="80"
              cy="80"
              r={r}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-off}
              transform="rotate(-90 80 80)"
            />
          );
        })}
      </svg>
      <div className="dial-c">
        {isReady ? (
          <span className="dial-ok">
            <Icon name="check" size={34} strokeWidth={2.4} />
          </span>
        ) : (
          <>
            <b>{currentIndex + 1}</b>
            <span>of {N}</span>
          </>
        )}
      </div>
    </div>
  );
};

export const OnboardingLayout: React.FC = () => {
  const {
    account,
    onboardingStep,
    onboardingSteps,
    onboardingData,
    onboardingMax,
    setObStep,
    logout
  } = useAuth();
  const { effectiveTheme, toggleTheme } = useApp();

  const isReady = onboardingStep === 'ready';
  const currentIndex = OB_STEPS.findIndex(s => s.id === onboardingStep);
  const N = OB_STEPS.length;
  const whyMeta = ONB_WHY[onboardingStep];
  const isWide = onboardingStep === 'plans';

  const getStepOutcome = (stepId: string): string => {
    switch (stepId) {
      case 'property':
        return onboardingData.pname
          ? `${onboardingData.pname} · ${onboardingData.area || onboardingData.state}`
          : '';
      case 'cameras':
        return onboardingData.cams?.length
          ? `${onboardingData.cams.length} camera${onboardingData.cams.length === 1 ? '' : 's'} linked`
          : '';
      case 'face':
        return onboardingData.face?.enrolled ? 'Face enrolled' : '';
      case 'pins':
        return onboardingData.pins?.access ? 'PINs created' : '';
      case 'contacts':
        return onboardingData.contacts?.length
          ? `${onboardingData.contacts.length} contact${onboardingData.contacts.length === 1 ? '' : 's'}`
          : '';
      case 'alerts':
        return onboardingData.alerts?.notifPush ? 'Alerts configured' : '';
      case 'plans':
        return onboardingData.plan ? planById(onboardingData.plan).name : '';
      case 'review':
        return 'Ready to launch';
      default:
        return '';
    }
  };

  const renderCurrentStep = () => {
    switch (onboardingStep) {
      case 'property':
        return <PropertyStep />;
      case 'cameras':
        return <CamerasStep />;
      case 'face':
        return <FaceIdStep />;
      case 'pins':
        return <SecurityPinStep />;
      case 'contacts':
        return <EmergencyContactsStep />;
      case 'alerts':
        return <AlertsLocationsStep />;
      case 'plans':
        return <PlanStep />;
      case 'review':
        return <ReviewStep />;
      case 'ready':
        return <OnboardingComplete />;
      default:
        return <PropertyStep />;
    }
  };

  const userName = account?.name || 'Adaeze Okonkwo';
  const userEmail = account?.email || 'a.okonkwo@endra.africa';

  return (
    <div id="gate" className="gate">
      <div className="onb">
        {/* Left Side Rail */}
        <aside className="onb-side" aria-label="Setup progress">
          <span className="alogo">
            <Logo height={26} />
          </span>

          <DialProgress
            steps={OB_STEPS}
            currentStepId={onboardingStep}
            stepsStatus={onboardingSteps}
            isReady={isReady}
          />

          <div className="onb-ph">
            <h2>{isReady ? 'Your system is ready' : 'Setting up your system'}</h2>
            <p>{isReady ? 'Everything is in place.' : 'Your progress is saved as you go.'}</p>
          </div>

          <ol className="onb-steps">
            {OB_STEPS.map((s, k) => {
              const cur = s.id === onboardingStep && !isReady;
              const can = k <= onboardingMax && !cur && !isReady;
              const status = onboardingSteps[s.id];
              const done = status === 'done' || (isReady && status !== 'skipped');
              const sk = status === 'skipped';
              const outcome = getStepOutcome(s.id);
              const sub = cur ? s.d : outcome;

              return (
                <li key={s.id}>
                  {can ? (
                    <button
                      type="button"
                      className={`onb-step ${cur ? 'cur' : ''} ${done ? 'done' : ''} ${sk ? 'skipped' : ''} can`}
                      onClick={() => setObStep(s.id)}
                    >
                      <span className="num" aria-hidden="true">
                        {done && !cur ? <Icon name="check" size={13} strokeWidth={2.8} /> : k + 1}
                      </span>
                      <span className="tx">
                        <b>{s.t}</b>
                        {sub && <span className="d">{sub}</span>}
                      </span>
                    </button>
                  ) : (
                    <div
                      className={`onb-step ${cur ? 'cur' : ''} ${done ? 'done' : ''} ${sk ? 'skipped' : ''}`}
                      {...(cur ? { 'aria-current': 'step' } : {})}
                    >
                      <span className="num" aria-hidden="true">
                        {done && !cur ? <Icon name="check" size={13} strokeWidth={2.8} /> : k + 1}
                      </span>
                      <span className="tx">
                        <b>{s.t}</b>
                        {sub && <span className="d">{sub}</span>}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="onb-user">
            <div className="av">{initials(userName)}</div>
            <div className="mn">
              <b>{userName}</b>
              <span>{userEmail}</span>
            </div>
            <button type="button" className="linkb mut" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="onb-main">
          <div className="onb-top">
            <span className="mlogo">
              <Logo height={22} />
            </span>
            <span className="sp" />
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
          </div>

          {/* Mobile progress indicator */}
          {!isReady && currentIndex >= 0 && (
            <div className="onb-mprog">
              <div className="t">
                <span>
                  Step <b>{currentIndex + 1}</b> of {N}
                </span>
                <span>{OB_STEPS[currentIndex].t}</span>
              </div>
              <div className="bars">
                {OB_STEPS.map((s, k) => (
                  <i key={s.id} className={k <= currentIndex ? 'on' : ''} />
                ))}
              </div>
            </div>
          )}

          <div className="onb-body">
            <div className={`onb-col ${isWide ? 'wide' : ''} ${whyMeta && !isWide && !isReady ? 'has-aside' : ''}`}>
              {renderCurrentStep()}

              {/* Right-side explanation / guidance card */}
              {whyMeta && !isWide && !isReady && (
                <aside className="onb-aside" aria-label={whyMeta.t}>
                  <h2>{whyMeta.t}</h2>
                  {whyMeta.p && <p>{whyMeta.p}</p>}
                  {whyMeta.ul && (
                    <ul>
                      {whyMeta.ul.map((x, i) => (
                        <li key={i}>
                          <Icon name="check" size={15} strokeWidth={2.2} />
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {whyMeta.ol && (
                    <ol>
                      {whyMeta.ol.map((x, k) => (
                        <li key={k}>
                          <span className="an">{k + 1}</span>
                          <span>{x}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

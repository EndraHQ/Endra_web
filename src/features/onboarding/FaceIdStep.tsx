import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { rid } from '../../utils/authHelpers';
import { OnboardingActions } from './OnboardingActions';

const FACE_POSES = [
  'Look straight at the screen',
  'Slowly turn your head left',
  'Slowly turn your head right',
  'Tilt your chin up slightly'
];

export const FaceIdStep: React.FC = () => {
  const {
    account,
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();

  const isEnrolledInitial = Boolean(onboardingData.face?.enrolled);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>(
    isEnrolledInitial ? 'done' : 'idle'
  );
  const [pose, setPose] = useState(0);
  const timerRef = useRef<number | null>(null);

  const done = phase === 'done';
  const running = phase === 'running';

  const userName = account?.name || 'Adaeze Okonkwo';
  const templateId = onboardingData.face?.tmpl || 'ENF-7K2QX9';

  const startVerification = () => {
    if (running) return;
    setPhase('running');
    setPose(0);
  };

  useEffect(() => {
    if (phase === 'running') {
      const runPoses = () => {
        setPose(prev => {
          if (prev >= 4) {
            const tmpl = 'ENF-' + rid(3).toUpperCase();
            updateOnboardingData({
              face: {
                enrolled: true,
                tmpl
              }
            });
            setPhase('done');
            return 4;
          }
          return prev + 1;
        });
      };

      timerRef.current = window.setTimeout(runPoses, 1200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, pose, updateOnboardingData]);

  const handleVerifyAgain = () => {
    updateOnboardingData({ face: {} });
    setPhase('idle');
    setPose(0);
  };

  const handleContinue = () => {
    markStepComplete('face', done ? 'done' : 'skipped');
    setObStep('pins');
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="scan" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Confirm it’s you
          </h1>
          <p className="sub">
            ENDRA matches your face to set you as the account owner. It also lets gates and cameras recognise you as a resident, without raising an alert.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        <div className="card facebox">
          <div className={`oval ${done ? 'ok' : ''}`} aria-hidden="true">
            <svg viewBox="0 0 200 250">
              <ellipse className="ov-t" cx="100" cy="125" rx="96" ry="121" />
              <ellipse
                className="ov-p"
                cx="100"
                cy="125"
                rx="96"
                ry="121"
                style={{ strokeDashoffset: done ? 0 : 720 * (1 - pose / 4) }}
              />
            </svg>
            <div className="face">👤</div>
            <div className={`sweep ${running ? 'on' : ''}`} />
          </div>

          <div className="poses" aria-hidden="true">
            {[0, 1, 2, 3].map(k => (
              <i
                key={k}
                className={
                  done || k < pose - (running ? 1 : 0)
                    ? 'd'
                    : running && k === pose - 1
                    ? 'a'
                    : ''
                }
              />
            ))}
          </div>

          <p className="facemsg" role="status" tabIndex={-1}>
            {done
              ? 'Identity confirmed'
              : running
              ? FACE_POSES[Math.max(0, pose - 1)]
              : 'Position your face inside the oval'}
          </p>

          {done ? (
            <div>
              <p className="g-hint">
                Account owner: <b>{userName}</b> · Template {templateId} · liveness check passed
              </p>
              <button
                type="button"
                className="linkb mut"
                style={{ marginTop: '10px' }}
                onClick={handleVerifyAgain}
              >
                Verify again
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-w btn-lg"
              style={{ marginTop: '8px' }}
              onClick={startVerification}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="spinline" />
                  Verifying
                </>
              ) : (
                'Start verification'
              )}
            </button>
          )}

          <p className="g-hint" style={{ marginTop: '14px' }}>
            This preview doesn’t use your camera. Faces are matched as an encrypted template, and ENDRA does not store photographs.
          </p>
        </div>

        {/* Action bar */}
        <OnboardingActions
          showBack={true}
          onBack={() => setObStep('cameras')}
          continueLabel="Continue"
          continueDisabled={!done}
          onContinue={handleContinue}
          continueType="button"
        />
      </div>
    </>
  );
};

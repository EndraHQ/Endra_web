import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
import { rid } from '../../utils/authHelpers';
import { OnboardingActions } from './OnboardingActions';

const PIN_PHASES = [
  { id: 'access', label: 'Create PIN' },
  { id: 'confirm', label: 'Confirm PIN' },
  { id: 'duress', label: 'Duress PIN' },
  { id: 'dconfirm', label: 'Confirm duress PIN' }
];

const PHASE_TEXT: Record<string, [string, string]> = {
  access: [
    'Create your PIN',
    'Choose 4 digits you’ll remember. You’ll use them to arm and disarm ENDRA and to confirm sensitive actions.'
  ],
  confirm: ['Confirm your PIN', 'Enter the same 4 digits again.'],
  duress: [
    'Add your duress PIN',
    'If you’re ever forced to disarm, enter this instead. It looks like a normal disarm but silently alerts ENDRA that you’re under threat. It must be different from your PIN. This one is required.'
  ],
  dconfirm: ['Confirm your duress PIN', 'Enter the same 4 digits again.']
};

const weakPin = (p: string) =>
  /^(\d)\1{3}$/.test(p) ||
  '01234567890'.includes(p) ||
  '09876543210'.includes(p) ||
  ['1212', '2580', '1122', '2020', '2021', '2022', '2023', '2024', '2025', '2026'].includes(p);

const WEAK_MSG = 'Choose a PIN that’s harder to guess.';

const FACE_POSES = [
  'Look straight at the screen',
  'Slowly turn your head left',
  'Slowly turn your head right',
  'Tilt your chin up slightly'
];

export const SafetyStep: React.FC = () => {
  const {
    account,
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();

  const hasPinsSet = Boolean(
    onboardingData.pins?.access && onboardingData.pins?.duress
  );

  const [sub, setSub] = useState<'pins' | 'face'>('pins');

  // PINS STATE
  const [pinPhase, setPinPhase] = useState<'access' | 'confirm' | 'duress' | 'dconfirm' | 'done'>(
    hasPinsSet ? 'done' : 'access'
  );
  const [accessPin, setAccessPin] = useState(
    typeof onboardingData.pins?.access === 'string' ? onboardingData.pins.access : ''
  );
  const [duressPin, setDuressPin] = useState(
    typeof onboardingData.pins?.duress === 'string' ? onboardingData.pins.duress : ''
  );
  const [buf, setBuf] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // FACE STATE
  const isFaceEnrolled = Boolean(onboardingData.face?.enrolled);
  const [facePhase, setFacePhase] = useState<'idle' | 'running' | 'done'>(
    isFaceEnrolled ? 'done' : 'idle'
  );
  const [pose, setPose] = useState(0);
  const faceTimerRef = useRef<number | null>(null);

  const activePinIdx = PIN_PHASES.findIndex(p => p.id === pinPhase);
  const isDuressPin = pinPhase === 'duress' || pinPhase === 'dconfirm';

  // Keyboard and Keypad handler for PINs
  const handlePinDigit = useCallback(
    (digit: string) => {
      if (pinPhase === 'done' || buf.length >= 4) return;
      setPinError(null);
      const nextBuf = buf + digit;
      setBuf(nextBuf);

      if (nextBuf.length === 4) {
        setTimeout(() => {
          if (pinPhase === 'access') {
            if (weakPin(nextBuf)) {
              setPinError(WEAK_MSG);
              setBuf('');
            } else {
              setAccessPin(nextBuf);
              setBuf('');
              setPinPhase('confirm');
            }
          } else if (pinPhase === 'confirm') {
            if (nextBuf !== accessPin) {
              setPinError('Those PINs don’t match. Create your PIN again.');
              setBuf('');
              setAccessPin('');
              setPinPhase('access');
            } else {
              setBuf('');
              setPinPhase('duress');
            }
          } else if (pinPhase === 'duress') {
            if (nextBuf === accessPin) {
              setPinError('Your duress PIN must be different from your PIN.');
              setBuf('');
            } else if (weakPin(nextBuf)) {
              setPinError(WEAK_MSG);
              setBuf('');
            } else {
              setDuressPin(nextBuf);
              setBuf('');
              setPinPhase('dconfirm');
            }
          } else if (pinPhase === 'dconfirm') {
            if (nextBuf !== duressPin) {
              setPinError('Those PINs don’t match. Create your duress PIN again.');
              setBuf('');
              setDuressPin('');
              setPinPhase('duress');
            } else {
              updateOnboardingData({
                pins: {
                  access: accessPin,
                  duress: nextBuf,
                  duressSkipped: false
                }
              });
              setBuf('');
              setPinPhase('done');
            }
          }
        }, 180);
      }
    },
    [pinPhase, buf, accessPin, duressPin, updateOnboardingData]
  );

  const handlePinDelete = useCallback(() => {
    setPinError(null);
    setBuf(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    if (sub !== 'pins' || pinPhase === 'done') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sub, pinPhase, handlePinDigit, handlePinDelete]);

  const handlePinReset = () => {
    setAccessPin('');
    setDuressPin('');
    setBuf('');
    setPinError(null);
    setPinPhase('access');
  };

  const handlePinsContinue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinPhase === 'done') {
      setSub('face');
    }
  };

  // Face Verification logic
  const handleStartFace = () => {
    if (facePhase === 'running') return;
    setFacePhase('running');
    setPose(0);
  };

  useEffect(() => {
    if (sub === 'face' && facePhase === 'running') {
      const runPoses = () => {
        setPose(prev => {
          if (prev >= 4) {
            const tmpl = 'ENF-' + rid(3).toUpperCase();
            updateOnboardingData({
              face: {
                enrolled: true,
                tmpl,
                at: Date.now()
              }
            });
            setFacePhase('done');
            return 4;
          }
          return prev + 1;
        });
      };

      faceTimerRef.current = window.setTimeout(runPoses, 1300);
    }
    return () => {
      if (faceTimerRef.current) clearTimeout(faceTimerRef.current);
    };
  }, [sub, facePhase, pose, updateOnboardingData]);

  const handleFaceVerifyAgain = () => {
    updateOnboardingData({ face: {} });
    setFacePhase('idle');
    setPose(0);
  };

  const handleFaceSkip = () => {
    updateOnboardingData({
      face: {
        skipped: true,
        at: Date.now()
      }
    });
    markStepComplete('safety', 'done');
    setObStep('contacts');
  };

  const handleFaceContinue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    markStepComplete('safety', 'done');
    setObStep('contacts');
  };

  const userName = account?.name || 'Adaeze Okonkwo';
  const faceTmpl = onboardingData.face?.tmpl || 'ENF-7K2QX9';
  const faceDone = facePhase === 'done';
  const faceRunning = facePhase === 'running';

  // Render Sub-phase A: PINs
  if (sub === 'pins') {
    return (
      <>
        <header className="onb-hd">
          <span className="onb-ic" aria-hidden="true">
            <Icon name="key" size={24} strokeWidth={1.6} />
          </span>
          <div>
            <h1 id="gH" tabIndex={-1}>
              Set up your safety profile
            </h1>
            <p className="sub">
              Set a PIN to disarm ENDRA, then a duress PIN for emergencies. Both are required. Each one is entered twice to make sure it’s right.
            </p>
          </div>
        </header>

        <div className="onb-fm">
          <ol className="phases" aria-label="PIN setup progress">
            {PIN_PHASES.map((p, n) => {
              const isDoneOrPast = pinPhase === 'done' || n < activePinIdx;
              const isCur = n === activePinIdx;
              return (
                <li
                  key={p.id}
                  className={isDoneOrPast ? 'ok' : isCur ? 'on' : ''}
                  {...(isCur ? { 'aria-current': 'step' } : {})}
                >
                  {isDoneOrPast && <Icon name="check" size={13} strokeWidth={2.6} />}
                  {p.label}
                </li>
              );
            })}
          </ol>

          {pinPhase === 'done' ? (
            <div>
              <div className="card flush">
                <div className="ccard">
                  <span className="ico">
                    <Icon name="key" size={19} />
                  </span>
                  <div className="mn">
                    <b>Security PIN</b>
                    <span className="s">Set and confirmed</span>
                  </div>
                  <Icon name="check" size={18} strokeWidth={2.2} />
                </div>
                <div className="ccard">
                  <span className="ico">
                    <Icon name="shield" size={19} />
                  </span>
                  <div className="mn">
                    <b>Duress PIN</b>
                    <span className="s">Set and confirmed</span>
                  </div>
                  <Icon name="check" size={18} strokeWidth={2.2} />
                </div>
              </div>

              <button
                type="button"
                className="linkb mut"
                style={{ marginTop: '14px' }}
                onClick={handlePinReset}
              >
                Change PINs
              </button>

              <form onSubmit={handlePinsContinue}>
                <OnboardingActions
                  showBack={false}
                  continueLabel="Continue"
                  continueDisabled={false}
                />
              </form>
            </div>
          ) : (
            <div>
              <div className="pinbox" role="group" aria-labelledby="pT">
                <h2 id="pT">{PHASE_TEXT[pinPhase][0]}</h2>
                <p>{PHASE_TEXT[pinPhase][1]}</p>

                <div
                  className={`pindots ${isDuressPin ? 'd' : ''}`}
                  id="gDots"
                  role="img"
                  aria-label={`${buf.length} of 4 digits entered`}
                >
                  {[0, 1, 2, 3].map(i => (
                    <i key={i} className={i < buf.length ? 'f' : ''} />
                  ))}
                </div>

                <div className="pinerr" id="gPinErr" role="alert">
                  {pinError && (
                    <div className="g-err">
                      <Icon name="alert" size={14} />
                      <span>{pinError}</span>
                    </div>
                  )}
                </div>

                <div className="pad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handlePinDigit(String(n))}
                      aria-label={String(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button type="button" className="blank" tabIndex={-1} aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    aria-label="0"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinDelete}
                    aria-label="Delete last digit"
                  >
                    ⌫
                  </button>
                </div>

                <p className="g-hint" style={{ marginTop: '8px' }}>
                  You can also type the digits on your keyboard.
                </p>
              </div>

              <div className="onb-actions">
                <span className="sp" />
                <button type="button" className="btn btn-w btn-lg" disabled>
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Render Sub-phase B: Face Registration
  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="key" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Register your face
          </h1>
          <p className="sub">
            ENDRA checks it’s really you before anyone can disarm it or change security settings. It also learns your face, so it recognises you on camera. You can skip this and do it later in Settings.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        <div className="card facebox">
          <div className={`oval ${faceDone ? 'ok' : ''}`} aria-hidden="true">
            <svg viewBox="0 0 200 250">
              <ellipse className="ov-t" cx="100" cy="125" rx="96" ry="121" />
              <ellipse
                className="ov-p"
                id="gPrg"
                cx="100"
                cy="125"
                rx="96"
                ry="121"
                style={{ strokeDashoffset: faceDone ? 0 : 720 * (1 - pose / 4) }}
              />
            </svg>
            <div className="face">🙂</div>
            <div className={`sweep ${faceRunning ? 'on' : ''}`} />
          </div>

          <div className="poses" aria-hidden="true">
            {[0, 1, 2, 3].map(k => (
              <i
                key={k}
                id={`gPose${k}`}
                className={
                  faceDone || k < pose - (faceRunning ? 1 : 0)
                    ? 'd'
                    : faceRunning && k === pose - 1
                    ? 'a'
                    : ''
                }
              />
            ))}
          </div>

          <p className="facemsg" id="gFaceMsg" role="status" tabIndex={-1}>
            {faceDone
              ? 'Identity confirmed'
              : faceRunning
              ? FACE_POSES[Math.max(0, pose - 1)]
              : 'Position your face inside the oval'}
          </p>

          {faceDone ? (
            <div>
              <p className="g-hint">
                Account owner: <b>{userName}</b> · Template {faceTmpl} · liveness check passed
              </p>
              <button
                type="button"
                className="linkb mut"
                style={{ marginTop: '10px' }}
                onClick={handleFaceVerifyAgain}
              >
                Verify again
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-w btn-lg"
              id="gFaceBtn"
              style={{ marginTop: '8px' }}
              onClick={handleStartFace}
              disabled={faceRunning}
            >
              {faceRunning ? (
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

        <form onSubmit={handleFaceContinue}>
          <OnboardingActions
            onBack={() => setSub('pins')}
            continueLabel="Continue"
            continueDisabled={!faceDone}
            showSkip={!faceDone && !faceRunning}
            skipLabel="Skip for now"
            onSkip={handleFaceSkip}
          />
        </form>
      </div>
    </>
  );
};

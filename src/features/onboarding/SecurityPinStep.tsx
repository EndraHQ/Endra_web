import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/icons/Icon';
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
    'Add a duress PIN (optional)',
    'If you’re ever forced to disarm, enter this instead. It looks like a normal disarm but silently alerts operators that you’re under threat. It must be different from your PIN.'
  ],
  dconfirm: ['Confirm your duress PIN', 'Enter the same 4 digits again.']
};

const weakPin = (p: string) =>
  /^(\d)\1{3}$/.test(p) ||
  '01234567890'.includes(p) ||
  '09876543210'.includes(p) ||
  ['1212', '2580', '1122', '2020', '2021', '2022', '2023', '2024', '2025', '2026'].includes(p);

export const SecurityPinStep: React.FC = () => {
  const {
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();

  const isAlreadyDone = Boolean(
    onboardingData.pins?.access &&
      (onboardingData.pins?.duress || onboardingData.pins?.skippedDuress)
  );

  const [phase, setPhase] = useState<'access' | 'confirm' | 'duress' | 'dconfirm' | 'done'>(
    isAlreadyDone ? 'done' : 'access'
  );
  const [accessPin, setAccessPin] = useState(onboardingData.pins?.access || '');
  const [duressPin, setDuressPin] = useState(onboardingData.pins?.duress || '');
  const [buf, setBuf] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeIdx = PIN_PHASES.findIndex(p => p.id === phase);
  const isDuress = phase === 'duress' || phase === 'dconfirm';

  const handleDigit = useCallback(
    (digit: string) => {
      if (phase === 'done' || buf.length >= 4) return;
      setError(null);
      const nextBuf = buf + digit;
      setBuf(nextBuf);

      if (nextBuf.length === 4) {
        setTimeout(() => {
          if (phase === 'access') {
            if (weakPin(nextBuf)) {
              setError('Choose a PIN that’s harder to guess.');
              setBuf('');
            } else {
              setAccessPin(nextBuf);
              setBuf('');
              setPhase('confirm');
            }
          } else if (phase === 'confirm') {
            if (nextBuf !== accessPin) {
              setError('Those PINs don’t match. Create your PIN again.');
              setBuf('');
              setAccessPin('');
              setPhase('access');
            } else {
              setBuf('');
              setPhase('duress');
            }
          } else if (phase === 'duress') {
            if (nextBuf === accessPin) {
              setError('Your duress PIN must be different from your PIN.');
              setBuf('');
            } else if (weakPin(nextBuf)) {
              setError('Choose a PIN that’s harder to guess.');
              setBuf('');
            } else {
              setDuressPin(nextBuf);
              setBuf('');
              setPhase('dconfirm');
            }
          } else if (phase === 'dconfirm') {
            if (nextBuf !== duressPin) {
              setError('Those PINs don’t match. Create your duress PIN again.');
              setBuf('');
              setDuressPin('');
              setPhase('duress');
            } else {
              updateOnboardingData({
                pins: {
                  access: accessPin,
                  duress: nextBuf,
                  skippedDuress: false
                }
              });
              setBuf('');
              setPhase('done');
            }
          }
        }, 180);
      }
    },
    [phase, buf, accessPin, duressPin, updateOnboardingData]
  );

  const handleDelete = useCallback(() => {
    setError(null);
    setBuf(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'done') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleDigit, handleDelete]);

  const handleSkipDuress = () => {
    updateOnboardingData({
      pins: {
        access: accessPin,
        duress: undefined,
        skippedDuress: true
      }
    });
    setDuressPin('');
    setBuf('');
    setPhase('done');
  };

  const handleResetPins = () => {
    setAccessPin('');
    setDuressPin('');
    setBuf('');
    setError(null);
    setPhase('access');
  };

  const handleBack = () => {
    if (phase === 'confirm') {
      setBuf('');
      setPhase('access');
    } else if (phase === 'duress') {
      setBuf('');
      setPhase('confirm');
    } else if (phase === 'dconfirm') {
      setBuf('');
      setPhase('duress');
    } else if (phase === 'done') {
      handleResetPins();
    } else {
      setObStep('face');
    }
  };

  const handleContinue = () => {
    markStepComplete('pins', 'done');
    setObStep('contacts');
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="key" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Create your security PIN
          </h1>
          <p className="sub">
            Your PIN protects the system. You can also add a second, silent PIN for emergencies. Each one is entered twice to make sure it’s right.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        {/* PIN setup phases */}
        <ol className="phases" aria-label="PIN setup progress">
          {PIN_PHASES.map((p, n) => {
            const isDoneOrPast = phase === 'done' || n < activeIdx;
            const isCur = n === activeIdx;
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

        {phase === 'done' ? (
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
                  <span className="s">
                    {onboardingData.pins?.duress
                      ? 'Set and confirmed'
                      : 'Skipped. You can add one later in Settings.'}
                  </span>
                </div>
                {onboardingData.pins?.duress && (
                  <Icon name="check" size={18} strokeWidth={2.2} />
                )}
              </div>
            </div>

            <button
              type="button"
              className="linkb mut"
              style={{ marginTop: '14px' }}
              onClick={handleResetPins}
            >
              Change PINs
            </button>

            <OnboardingActions
              showBack={true}
              onBack={() => setObStep('face')}
              continueLabel="Continue"
              onContinue={handleContinue}
              continueType="button"
            />
          </div>
        ) : (
          <div>
            <div className="card pinbox">
              <h2>{PHASE_TEXT[phase][0]}</h2>
              <p>{PHASE_TEXT[phase][1]}</p>

              <div className="pinerr" role="alert">
                {error && (
                  <div className="g-err">
                    <Icon name="alert" size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* 4 dots */}
              <div className={`pindots ${isDuress ? 'd' : ''}`} aria-hidden="true">
                {[0, 1, 2, 3].map(k => (
                  <i key={k} className={k < buf.length ? 'f' : ''} />
                ))}
              </div>

              {/* Keypad */}
              <div className="pad" role="group" aria-label="PIN keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleDigit(String(n))}
                  >
                    {n}
                  </button>
                ))}
                <span className="blank" aria-hidden="true" />
                <button type="button" onClick={() => handleDigit('0')}>
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  aria-label="Delete last digit"
                >
                  <Icon name="chevl" size={20} />
                </button>
              </div>

              {isDuress && (
                <button
                  type="button"
                  className="linkb mut"
                  style={{ marginTop: '14px' }}
                  onClick={handleSkipDuress}
                >
                  Skip duress PIN
                </button>
              )}
            </div>

            <OnboardingActions
              showBack={true}
              onBack={handleBack}
              continueLabel="Continue"
              continueDisabled={true}
              onContinue={handleContinue}
              continueType="button"
            />
          </div>
        )}
      </div>
    </>
  );
};

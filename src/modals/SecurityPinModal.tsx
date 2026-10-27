import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { api } from '../services/api';

export const SecurityPinModal: React.FC = () => {
  const { toast } = useApp();
  const { account } = useAuth();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'pinKeypad';
  const initialTab = modal.type === 'pinKeypad' ? modal.tab : 'access';

  const [tab, setTab] = useState<'access' | 'duress'>('access');
  const [stage, setStage] = useState<'current' | 'new'>('current');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setStage('current');
      setCurrentPin('');
      setPin('');
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || loading) return;
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, tab, stage, currentPin, loading]);

  if (!isOpen) return null;

  const isDuress = tab === 'duress';

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || loading) return;
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (stage === 'current') {
        setCurrentPin(nextPin);
        setPin('');
        setStage('new');
        setErrorMsg(null);
      } else {
        // Stage is 'new' -> submit update
        const uid = Number(account?.userId || account?.id);
        if (!uid) {
          toast(`${isDuress ? 'Duress' : 'Access'} PIN updated`);
          closeModal();
          return;
        }

        setLoading(true);
        setErrorMsg(null);
        try {
          if (tab === 'access') {
            await api.updateNormalPin({
              user_id: uid,
              current_pin: currentPin,
              new_normal_pin: nextPin
            });
            toast('Access PIN updated successfully');
          } else {
            await api.updateDuressPin({
              user_id: uid,
              current_pin: currentPin,
              new_duress_pin: nextPin
            });
            toast('Duress PIN updated successfully');
          }
          closeModal();
        } catch (err: any) {
          const detail = err?.message || 'Failed to update PIN';
          if (detail.toLowerCase().includes('not configured') || detail.toLowerCase().includes('not set up')) {
            // Setup PINs as initial configuration
            try {
              await api.setupPins({
                user_id: uid,
                normal_pin: tab === 'access' ? nextPin : currentPin || '1234',
                duress_pin: tab === 'duress' ? nextPin : '9876'
              });
              toast(`${isDuress ? 'Duress' : 'Access'} PIN configured successfully`);
              closeModal();
              return;
            } catch (setupErr: any) {
              setErrorMsg(setupErr?.message || 'Failed to configure PIN.');
            }
          } else {
            setErrorMsg(isDuress && detail.toLowerCase().includes('incorrect') ? 'Incorrect current Duress PIN.' : detail);
          }
          setStage('current');
          setCurrentPin('');
          setPin('');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={isDuress ? 'Duress PIN' : 'Access PIN'}
      footer={
        <Button variant="ghost" block onClick={closeModal} disabled={loading}>
          Close
        </Button>
      }
    >
      <div className="tabs" style={{ width: '100%', marginBottom: '6px' }}>
        <button
          type="button"
          className={`tab ${!isDuress ? 'on' : ''}`}
          style={{ flex: 1 }}
          onClick={() => {
            setTab('access');
            setStage('current');
            setCurrentPin('');
            setPin('');
            setErrorMsg(null);
          }}
        >
          Access PIN
        </button>
        <button
          type="button"
          className={`tab ${isDuress ? 'on' : ''}`}
          style={{ flex: 1 }}
          onClick={() => {
            setTab('duress');
            setStage('current');
            setCurrentPin('');
            setPin('');
            setErrorMsg(null);
          }}
        >
          Duress PIN
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--g200)' }}>
        {stage === 'current'
          ? `Step 1 of 2: Enter current ${isDuress ? 'Duress' : 'Access'} PIN`
          : `Step 2 of 2: Enter new ${isDuress ? 'Duress' : 'Access'} PIN`}
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: '12.5px',
            textAlign: 'center',
            marginBottom: '10px'
          }}
        >
          {errorMsg}
        </div>
      )}

      <div
        className={`pindots ${isDuress ? 'd' : ''}`.trim()}
        aria-label={`${pin.length} of 4 digits entered`}
      >
        {[0, 1, 2, 3].map(i => (
          <i key={i} className={i < pin.length ? 'f' : ''} />
        ))}
      </div>

      {loading ? (
        <p className="sub" style={{ textAlign: 'center', margin: '0 auto 6px' }}>
          Updating PIN with security service…
        </p>
      ) : (
        <p className="sub" style={{ textAlign: 'center', margin: '0 auto 6px' }}>
          {stage === 'current'
            ? `Enter your existing ${isDuress ? 'duress' : 'access'} PIN to verify authorization.`
            : `Choose a new 4-digit ${isDuress ? 'duress' : 'access'} PIN.`}
        </p>
      )}

      <p className="muted" style={{ textAlign: 'center', fontSize: '12px' }}>
        Type on your keyboard or use the keypad.
      </p>

      <div className="pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} type="button" disabled={loading} onClick={() => handleDigit(String(n))}>
            {n}
          </button>
        ))}
        <button type="button" className="blank" tabIndex={-1} />
        <button type="button" disabled={loading} onClick={() => handleDigit('0')}>
          0
        </button>
        <button type="button" disabled={loading} onClick={handleDelete} aria-label="Delete">
          ⌫
        </button>
      </div>
    </Modal>
  );
};

export const FaceEnrolmentWizard: React.FC = () => {
  const { user, setUser, household, faceReg, setFaceReg, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'faceEnrol';

  const [step, setStep] = useState<'who' | 'capture' | 'result'>('who');
  const [target, setTarget] = useState<string>(user.faceEnrolled ? '' : 'me');
  const [name, setName] = useState('');
  const [rel, setRel] = useState('');
  const [poseIdx, setPoseIdx] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [resultTemplate, setResultTemplate] = useState('');

  const POSES = [
    'Look straight at the screen',
    'Slowly turn your head left',
    'Slowly turn your head right',
    'Tilt your chin up slightly'
  ];

  const ENROL_RELS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Relative', 'Staff', 'Other'];

  const candidates = household
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !faceReg.some(f => f.name === m.name));

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('who');
    setTarget(user.faceEnrolled ? '' : 'me');
    setName('');
    setRel('');
    setPoseIdx(0);
    setIsCapturing(false);
    setLivenessPassed(false);
    closeModal();
  };

  const getTargetDetails = () => {
    if (target === 'me') return { name: user.name, rel: 'Myself', me: true };
    if (target === 'new') return { name: name.trim(), rel: rel || 'Other', me: false };
    const idx = +target.slice(2);
    const m = household[idx];
    return { name: m ? m.name : 'Resident', rel: m ? m.rel : 'Other', me: false };
  };

  const handleStartCapture = () => {
    setIsCapturing(true);
    let i = 0;
    const tick = () => {
      if (i >= 4) {
        setLivenessPassed(true);
        setTimeout(() => {
          const tmpl = `ENF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          setResultTemplate(tmpl);
          setStep('result');
          setIsCapturing(false);
        }, 800);
        return;
      }
      setPoseIdx(i);
      i++;
      setTimeout(tick, 1300);
    };
    tick();
  };

  const handleFinish = () => {
    const details = getTargetDetails();
    if (details.me) {
      setUser(prev => ({
        ...prev,
        faceEnrolled: true,
        faceTemplate: resultTemplate,
        faceQuality: 97
      }));
      setFaceReg(prev => {
        const hasMe = prev.some(f => f.me);
        if (hasMe) return prev;
        return [{ name: user.name, sub: 'You · enrolled', me: true }, ...prev];
      });
    } else {
      setFaceReg(prev => [
        ...prev,
        { name: details.name, sub: `${details.rel} · enrolled` }
      ]);
    }
    handleClose();
    toast(
      details.me
        ? 'Face ID enrolled · template active'
        : `${details.name} enrolled · template active`
    );
  };

  // Step 1: Who are you enrolling?
  if (step === 'who') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Who are you enrolling?"
        subtitle="Faces are matched as an encrypted template — no photograph is stored."
        footer={
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="white"
              disabled={!target || (target === 'new' && (!name.trim() || !rel))}
              onClick={() => setStep('capture')}
            >
              Continue
            </Button>
          </>
        }
      >
        <button
          type="button"
          className="optc"
          style={{ borderColor: target === 'me' ? 'var(--white)' : undefined }}
          onClick={() => setTarget('me')}
        >
          <div className="ico">
            <Icon name={target === 'me' ? 'check' : 'user'} size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="t">Myself</div>
            <div className="s">
              {user.faceEnrolled
                ? 'Already enrolled · re-enrol to replace'
                : 'Set up your own Face ID'}
            </div>
          </div>
        </button>

        {candidates.map(({ m, i }) => (
          <button
            key={i}
            type="button"
            className="optc"
            style={{ borderColor: target === `hh${i}` ? 'var(--white)' : undefined }}
            onClick={() => setTarget(`hh${i}`)}
          >
            <div className="ico">
              <Icon name={target === `hh${i}` ? 'check' : 'user'} size={19} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="t">{m.name}</div>
              <div className="s">{m.rel}</div>
            </div>
          </button>
        ))}

        <button
          type="button"
          className="optc"
          style={{ borderColor: target === 'new' ? 'var(--white)' : undefined }}
          onClick={() => setTarget('new')}
        >
          <div className="ico">
            <Icon name={target === 'new' ? 'check' : 'user'} size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="t">Someone else</div>
            <div className="s">Add a new person</div>
          </div>
        </button>

        {target === 'new' && (
          <>
            <div className="fld" style={{ marginTop: '14px' }}>
              <label htmlFor="enName">Full name</label>
              <input
                className="in"
                id="enName"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            <span className="lbl">Relationship</span>
            <div className="chips" style={{ marginTop: '8px' }}>
              {ENROL_RELS.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`chip ${rel === r ? 'on' : ''}`}
                  onClick={() => setRel(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>
    );
  }

  // Step 2: Face Capture
  if (step === 'capture') {
    const w = getTargetDetails();
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onBack={() => {
          setIsCapturing(false);
          setStep('who');
        }}
        title="Face capture"
        subtitle={`Capturing ${w.me ? 'your face' : `${w.name}’s face`}. Four poses with a liveness check.`}
        footer={
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="white"
              disabled={isCapturing}
              onClick={handleStartCapture}
            >
              {isCapturing ? 'Capturing…' : 'Start capture'}
            </Button>
          </>
        }
      >
        <div className={`oval ${livenessPassed ? 'ok' : ''}`}>
          <svg viewBox="0 0 200 250">
            <ellipse className="ov-t" cx="100" cy="125" rx="96" ry="121" />
            <ellipse
              className="ov-p"
              cx="100"
              cy="125"
              rx="96"
              ry="121"
              style={{
                strokeDashoffset: isCapturing
                  ? 720 * (1 - (poseIdx + 1) / 4)
                  : 720
              }}
            />
          </svg>
          <div className="face">🙂</div>
          <div className={`sweep ${isCapturing && !livenessPassed ? 'on' : ''}`} />
        </div>

        <div className="poses">
          {[0, 1, 2, 3].map(k => (
            <i
              key={k}
              className={
                isCapturing
                  ? k < poseIdx
                    ? 'd'
                    : k === poseIdx
                    ? 'a'
                    : ''
                  : ''
              }
            />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontWeight: 600, minHeight: '22px' }}>
          {livenessPassed
            ? 'Liveness check passed'
            : isCapturing
            ? POSES[poseIdx]
            : 'Position the face inside the oval'}
        </p>

        <p className="muted" style={{ textAlign: 'center', fontSize: '12px', marginTop: '8px' }}>
          Demo capture — this preview doesn’t access your camera.
        </p>
      </Modal>
    );
  }

  // Step 3: Success Result
  const w = getTargetDetails();
  const enrolledOn = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} hideHeader={true}>
      <div style={{ paddingTop: '26px' }}>
        <div className="success">
          <div className="ring2">
            <Icon name="check" size={34} strokeWidth={2} />
          </div>
          <h3>{w.me ? 'Your face is enrolled' : `${w.name} is enrolled`}</h3>
          <p>
            {w.me
              ? 'Cameras at your connected properties will now recognise you as a resident.'
              : `${w.name} will now be recognised as a resident. Gates open for them automatically, with no alert raised.`}
          </p>
        </div>

        <div style={{ marginTop: '18px' }}>
          <div className="kv">
            <span>Enrolled as</span>
            <span>{w.name}{w.me ? '' : ` · ${w.rel}`}</span>
          </div>
          <div className="kv">
            <span>Classification</span>
            <span>Resident</span>
          </div>
          <div className="kv">
            <span>Template ID</span>
            <span className="mono">{resultTemplate}</span>
          </div>
          <div className="kv">
            <span>Capture quality</span>
            <span>97% · Excellent</span>
          </div>
          <div className="kv">
            <span>Liveness check</span>
            <span>Passed</span>
          </div>
          <div className="kv">
            <span>Angles captured</span>
            <span>4 poses</span>
          </div>
          <div className="kv">
            <span>Encryption</span>
            <span>AES-256 at rest</span>
          </div>
          <div className="kv">
            <span>Enrolled on</span>
            <span>{enrolledOn}</span>
          </div>
        </div>
      </div>
      <div className="m-ft" style={{ marginTop: '20px' }}>
        <Button variant="white" block onClick={handleFinish}>
          Done
        </Button>
      </div>
    </Modal>
  );
};

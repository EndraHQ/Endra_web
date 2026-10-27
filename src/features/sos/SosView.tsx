import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { SosHoldButton } from './SosHoldButton';
import { Modal } from '../../components/feedback/Modal';
import { Button } from '../../components/common/Button';

export const SosView: React.FC = () => {
  const {
    currentPlace,
    sosState,
    activateSos,
    cancelSosWithPin,
    sosDispatching,
    sosError,
    quickAlert,
    go
  } = useApp();

  const [sosClockTime, setSosClockTime] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinVerifying, setPinVerifying] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!sosState) return;
    const interval = setInterval(() => {
      const s = Math.floor((Date.now() - sosState.start) / 1000) + 3;
      setSosClockTime(
        'Responders en route · ' +
          String(Math.floor(s / 60)).padStart(2, '0') +
          ':' +
          String(s % 60).padStart(2, '0')
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [sosState]);

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4 || pinVerifying) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    if (nextPin.length === 4) {
      setPinVerifying(true);
      setPinError(null);
      const res = await cancelSosWithPin(nextPin);
      setPinVerifying(false);
      if (res.success) {
        setShowPinModal(false);
        setPin('');
        if (res.message) {
          setCancellationNotice(res.message);
        }
      } else {
        setPinError(res.message || 'Incorrect PIN. Emergency remains active.');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    if (pinVerifying) return;
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!showPinModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pin, pinVerifying]);

  const pinModalElement = (
    <Modal
      isOpen={showPinModal}
      onClose={() => {
        if (!pinVerifying) {
          setShowPinModal(false);
          setPin('');
          setPinError(null);
        }
      }}
      title="Verify PIN to cancel"
      footer={
        <Button
          variant="ghost"
          block
          disabled={pinVerifying}
          onClick={() => {
            setShowPinModal(false);
            setPin('');
            setPinError(null);
          }}
        >
          Keep emergency active
        </Button>
      }
    >
      <p className="sub" style={{ textAlign: 'center', margin: '0 auto 12px' }}>
        Enter your 4-digit security PIN to confirm cancellation.
      </p>

      {pinError && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: '12.5px',
            textAlign: 'center',
            marginBottom: '12px'
          }}
        >
          {pinError}
        </div>
      )}

      <div
        className="pindots"
        aria-label={`${pin.length} of 4 digits entered`}
        style={{ marginBottom: '16px' }}
      >
        {[0, 1, 2, 3].map(i => (
          <i key={i} className={i < pin.length ? 'f' : ''} />
        ))}
      </div>

      {pinVerifying && (
        <div style={{ textAlign: 'center', color: 'var(--g400)', fontSize: '13px', marginBottom: '12px' }}>
          Verifying PIN with command center…
        </div>
      )}

      <div className="pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            type="button"
            disabled={pinVerifying}
            onClick={() => handleDigit(String(n))}
          >
            {n}
          </button>
        ))}
        <button type="button" className="blank" tabIndex={-1} />
        <button
          type="button"
          disabled={pinVerifying}
          onClick={() => handleDigit('0')}
        >
          0
        </button>
        <button
          type="button"
          disabled={pinVerifying}
          onClick={handleDelete}
          aria-label="Delete"
        >
          ⌫
        </button>
      </div>
    </Modal>
  );

  if (sosState) {
    return (
      <div>
        {pinModalElement}
        <div className="page-hd">
          <div>
            <h1 style={{ color: 'var(--red)' }}>SOS active</h1>
            <p className="sub mono">{sosClockTime || 'Connecting…'}</p>
          </div>
        </div>

        {cancellationNotice && (
        <div
          className="alert alert-info"
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '8px',
            background: 'color-mix(in srgb,var(--blue) 10%,transparent)',
            border: '1px solid var(--blue)',
            color: 'var(--blue)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span>{cancellationNotice}</span>
          <button
            type="button"
            className="btn btn-sm btn-g"
            onClick={() => setCancellationNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {sosError && (
          <div
            className="alert alert-err"
            style={{
              marginBottom: '16px',
              padding: '14px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <span>{sosError}</span>
            <a
              href="tel:112"
              className="btn btn-sm btn-w"
              style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Call 112
            </a>
          </div>
        )}

        <div className="soswrap">
          <div>
            <div className="sosa">
              <div className="st">
                <span className="pulse" /> EMERGENCY IN PROGRESS
              </div>
              <h2>Help is on the way</h2>
              <p className="sub" style={{ margin: 0 }}>
                Stay where you are if it’s safe. Responders have your live location.
              </p>
            </div>

            <div className="card" style={{ marginTop: '20px', padding: '6px 20px' }}>
              <div className="step">
                <div className="ico">📡</div>
                <div>
                  <b>Operators notified</b>
                  <span>ENDRA command center alerted {sosState.dispatchId ? `(Ref: ${sosState.dispatchId})` : ''}</span>
                </div>
              </div>
              <div className="step">
                <div className="ico">📍</div>
                <div>
                  <b>Location shared</b>
                  <span>{currentPlace.name} · {currentPlace.loc || 'Live GPS shared'}</span>
                </div>
              </div>
              <div className="step">
                <div className="ico">👥</div>
                <div>
                  <b>Response unit</b>
                  <span>{sosState.responderUnit ? `${sosState.responderUnit} en route` : 'Emergency contacts notified'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="sec-hd">
                <h2>{sosState.responderUnit || 'Command center'}</h2>
                <span className="pill green">ETA ~{sosState.etaMinutes || 5} min</span>
              </div>
              <div className="row">
                <div className="mav">CC</div>
                <div style={{ flex: 1 }}>
                  <b>{sosState.responderUnit || 'ENDRA Command Center'}</b>
                  <div className="muted" style={{ fontSize: '12.5px' }}>
                    Operators alerted · Dispatch in progress
                  </div>
                </div>
              </div>

              <div className="actions" style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn btn-w"
                  onClick={() => go('messages/0')}
                >
                  <Icon name="chat" size={16} /> Message command center
                </button>
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => {
                    setShowPinModal(true);
                    setPin('');
                    setPinError(null);
                  }}
                >
                  Cancel emergency
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {pinModalElement}
      <div className="page-hd">
        <div>
          <h1>Emergency SOS</h1>
          <p className="sub">
            Press and hold for 1.5 seconds to alert ENDRA operators and your emergency contacts.
          </p>
        </div>
      </div>

      {cancellationNotice && (
        <div
          className="alert alert-info"
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '8px',
            background: 'color-mix(in srgb,var(--blue) 10%,transparent)',
            border: '1px solid var(--blue)',
            color: 'var(--blue)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span>{cancellationNotice}</span>
          <button
            type="button"
            className="btn btn-sm btn-g"
            onClick={() => setCancellationNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {sosError && (
        <div
          className="alert alert-err"
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span>{sosError}</span>
          <a
            href="tel:112"
            className="btn btn-sm btn-w"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Call 112
          </a>
        </div>
      )}

      {sosDispatching && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span className="spinline" />
          <span>Dispatching emergency SOS alert to command center…</span>
        </div>
      )}

      <div className="soswrap">
        <div className="card">
          <div className="soszone">
            <div className="sos-lbl">HOLD TO ACTIVATE</div>
            <SosHoldButton onActivate={activateSos} />
            <p className="muted" style={{ textAlign: 'center' }}>
              Your live location will be shared with responders.
              <br />
              Keyboard: hold Space or Enter.
            </p>
          </div>
          <div className="divider" />
          <div className="locard">
            <div className="ico">
              <Icon name="pin" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <b>{currentPlace.name}</b>
              <div className="muted" style={{ fontSize: '12.5px' }}>
                {currentPlace.loc} · live location shared on activation
              </div>
            </div>
            <i className="sd g" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="sec-hd">
              <h2>Other alerts</h2>
            </div>
            <div className="qgrid">
              <button
                type="button"
                className="alarm silent"
                onClick={() => quickAlert('silent')}
              >
                <span style={{ color: 'var(--g300)' }}>
                  <Icon name="bell" size={24} />
                </span>
                <b>Silent alarm</b>
                <span>Discreet alert, sent immediately</span>
              </button>

              <button
                type="button"
                className="alarm med"
                onClick={() => quickAlert('med')}
              >
                <span style={{ color: 'var(--red)' }}>
                  <Icon name="alert" size={24} />
                </span>
                <b>Medical</b>
                <span>Request an ambulance</span>
              </button>

              <button
                type="button"
                className="alarm fire"
                onClick={() => quickAlert('fire')}
              >
                <span style={{ color: 'var(--orange)' }}>
                  <Icon name="alert" size={24} />
                </span>
                <b>Fire</b>
                <span>Alert the fire service</span>
              </button>

              <button
                type="button"
                className="alarm guard"
                onClick={() => quickAlert('guard')}
              >
                <span style={{ color: 'var(--blue)' }}>
                  <Icon name="user" size={24} />
                </span>
                <b>Guard</b>
                <span>Dispatch on-site security</span>
              </button>
            </div>
          </div>

          <div className="card flush list">
            <a className="li click" href="tel:112">
              <div className="ico">
                <Icon name="phone" size={19} />
              </div>
              <div className="mn">
                <div className="t">Emergency hotline</div>
                <div className="s">Call 112 directly</div>
              </div>
              <Icon name="chevr" size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { SosHoldButton } from './SosHoldButton';

export const SosView: React.FC = () => {
  const {
    currentPlace,
    sosState,
    activateSos,
    cancelSos,
    quickAlert,
    openConfirm,
    go
  } = useApp();

  const [sosClockTime, setSosClockTime] = useState<string>('');

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

  if (sosState) {
    return (
      <div>
        <div className="page-hd">
          <div>
            <h1 style={{ color: 'var(--red)' }}>SOS active</h1>
            <p className="sub mono">{sosClockTime || 'Connecting…'}</p>
          </div>
        </div>

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
                  <span>ENDRA command center alerted</span>
                </div>
              </div>
              <div className="step">
                <div className="ico">📍</div>
                <div>
                  <b>Location shared</b>
                  <span>{currentPlace.name} · {currentPlace.loc}</span>
                </div>
              </div>
              <div className="step">
                <div className="ico">👥</div>
                <div>
                  <b>Contacts alerted</b>
                  <span>3 emergency contacts notified</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="sec-hd">
                <h2>Responder</h2>
                <span className="pill green">ETA 6 min</span>
              </div>
              <div className="row">
                <div className="mav">TB</div>
                <div style={{ flex: 1 }}>
                  <b>Tunde Bakare</b>
                  <div className="muted" style={{ fontSize: '12.5px' }}>
                    Response officer · Unit 4
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
                  onClick={() =>
                    openConfirm(
                      'Cancel emergency?',
                      'Only cancel if you are safe. Operators and your emergency contacts will be told the alert was cancelled.',
                      'Cancel emergency',
                      cancelSos
                    )
                  }
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
      <div className="page-hd">
        <div>
          <h1>Emergency SOS</h1>
          <p className="sub">
            Press and hold for 1.5 seconds to alert ENDRA operators and your emergency contacts.
          </p>
        </div>
      </div>

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

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { Place } from '../types';
import { plural } from '../utils/formatters';

const ADDCAM_WIFI = [
  ['ENDRA_Home_5G', 4, true],
  ['ENDRA_Home', 3, true],
  ['MTN_4G_Router', 2, false]
] as const;

const genSerial = () => `ENC-${Math.floor(100000 + Math.random() * 900000)}`;

export const AddCameraWizard: React.FC = () => {
  const { currentPlace, setPlaces, setCamNames, setCamZones, go } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'addCamera';

  const [method, setMethod] = useState<'code' | 'auto' | 'manual' | null>(null);
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<string>('enter');
  const [serial, setSerial] = useState('');
  const [err, setErr] = useState('');
  const [wifi, setWifi] = useState<number | null>(null);
  const [wifiPass, setWifiPass] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [model, setModel] = useState('');
  const [results, setResults] = useState<{ serial: string; model: string; signal: number }[]>([]);
  const [ownerCode, setOwnerCode] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Outdoor');

  // Manual setup states
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('554');
  const [protocol, setProtocol] = useState('RTSP');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setMethod(null);
    setStep(1);
    setPhase('enter');
    setSerial('');
    setErr('');
    setWifi(null);
    setWifiPass('');
    setConnecting(false);
    setTestOk(false);
    setTesting(false);
    closeModal();
  };

  const handleBack = () => {
    if (step <= 1) {
      setMethod(null);
      setStep(1);
      setPhase('enter');
      setErr('');
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleChooseMethod = (m: 'code' | 'auto' | 'manual') => {
    setMethod(m);
    setStep(1);
    if (m === 'auto') {
      setPhase('searching');
      setTimeout(() => {
        setResults([
          { serial: genSerial(), model: 'ENDRA Cam Pro', signal: 4 },
          { serial: genSerial(), model: 'ENDRA Cam Mini', signal: 3 }
        ]);
        setPhase('results');
      }, 1800);
    } else {
      setPhase('enter');
      setErr('');
    }
  };

  const handleLookup = () => {
    const v = serial.trim().toUpperCase().replace(/^ENC(\d)/, 'ENC-$1');
    if (!/^ENC-\d{6}$/.test(v)) {
      setSerial(v);
      setErr('Enter the code as ENC- followed by 6 digits, for example ENC-482913.');
      return;
    }
    setSerial(v);
    setErr('');
    setPhase('searching');
    setTimeout(() => {
      setPhase('found');
    }, 1200);
  };

  const handlePaired = () => {
    setPhase('verifying');
    setTimeout(() => {
      setPhase('verified');
      setStep(2);
    }, 1600);
  };

  const handleWifiConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setStep(3);
    }, 1500);
  };

  const handleAutoPick = (idx: number) => {
    const r = results[idx];
    setSerial(r.serial);
    setModel(r.model);
    setStep(2);
  };

  const handleOwnerVerify = () => {
    const c = ownerCode.trim();
    if (c.length !== 4) {
      setErr('Enter the 4-digit code from the camera label');
      return;
    }
    if (c !== serial.slice(-4)) {
      setErr('That code doesn’t match this camera — check the label and try again');
      return;
    }
    setErr('');
    setStep(3);
  };

  const handleManualTest = () => {
    if (!ip.trim()) {
      setErr('Enter the camera’s IP address');
      return;
    }
    if (!user.trim()) {
      setErr('Enter the admin username');
      return;
    }
    setErr('');
    setTesting(true);
    setTestOk(false);
    setTimeout(() => {
      setTesting(false);
      setTestOk(true);
    }, 1500);
  };

  const handleFinish = () => {
    const finalName = name.trim() || `Camera ${currentPlace.cams + 1}`;
    setCamNames(prev => [...prev, finalName]);
    setCamZones(prev => [...prev, zone]);

    setPlaces((prev: Place[]) =>
      prev.map(p =>
        p.id === currentPlace.id
          ? {
              ...p,
              cams: p.cams + 1,
              camsOn: p.camsOn + 1,
              devices: p.devices + 1,
              devOn: p.devOn + 1
            }
          : p
      )
    );

    setStep(method === 'manual' ? 3 : 4);
  };

  const secNote = (text: string) => (
    <div className="note sec">
      <Icon name="shield" size={16} />
      <span>{text}</span>
    </div>
  );

  if (!method) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add camera"
        subtitle="Choose how you’d like to set up your new ENDRA camera."
      >
        <button
          type="button"
          className="optc"
          onClick={() => handleChooseMethod('code')}
        >
          <div className="ico"><Icon name="scan" size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="t">Enter camera code</div>
            <div className="s">Fastest — type the code printed on the camera or its box</div>
          </div>
          <Icon name="chevr" size={16} />
        </button>

        <button
          type="button"
          className="optc"
          onClick={() => handleChooseMethod('auto')}
        >
          <div className="ico"><Icon name="device" size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="t">Auto discovery</div>
            <div className="s">Find unclaimed cameras already on your network</div>
          </div>
          <Icon name="chevr" size={16} />
        </button>

        <button
          type="button"
          className="optc"
          onClick={() => handleChooseMethod('manual')}
        >
          <div className="ico"><Icon name="gear" size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="t">Manual setup</div>
            <div className="s">Advanced — connect by IP address and admin login</div>
          </div>
          <Icon name="chevr" size={16} />
        </button>

        {secNote(
          `To protect your account, every method requires proof that you physically own or control the camera before it can be linked to ${currentPlace.name}.`
        )}
      </Modal>
    );
  }

  const isNameStep =
    (method === 'code' && step === 3) ||
    (method === 'auto' && step === 3) ||
    (method === 'manual' && step === 2);

  const isSuccessStep =
    (method === 'code' && step === 4) ||
    (method === 'auto' && step === 4) ||
    (method === 'manual' && step === 3);

  if (isSuccessStep) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} hideHeader={true}>
        <div style={{ paddingTop: '28px', textAlign: 'center' }}>
          <div className="success">
            <div className="ring2">
              <Icon name="check" size={34} strokeWidth={2} />
            </div>
            <h3>Camera added</h3>
            <p>
              {name || 'New Camera'} is now live in {zone} · {currentPlace.name}
            </p>
          </div>
        </div>
        <div className="m-ft" style={{ marginTop: '20px' }}>
          <Button
            variant="white"
            block
            onClick={() => {
              handleClose();
              go('monitor/cameras');
            }}
          >
            View cameras
          </Button>
        </div>
      </Modal>
    );
  }

  if (isNameStep) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onBack={handleBack}
        title="Name your camera"
        subtitle="Give it a name and zone so it’s easy to find later."
        footer={
          <Button variant="white" onClick={handleFinish}>
            Add camera
          </Button>
        }
      >
        <div className="fld">
          <label htmlFor="acN">Camera name</label>
          <input
            className="in"
            id="acN"
            placeholder="e.g. Side Gate"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="fld">
          <label htmlFor="acZ">Zone</label>
          <select
            className="in"
            id="acZ"
            value={zone}
            onChange={e => setZone(e.target.value)}
          >
            <option value="Outdoor">Outdoor</option>
            <option value="Indoor">Indoor</option>
            <option value="Rooftop">Rooftop</option>
          </select>
        </div>
        {secNote(
          'This camera will be linked to your ENDRA account only. You can share access with household members from Shared access.'
        )}
      </Modal>
    );
  }

  if (method === 'code') {
    if (step === 1) {
      if (phase === 'searching') {
        return (
          <Modal isOpen={isOpen} onClose={handleClose} onBack={handleBack} title="Looking up camera" subtitle={`Checking ${serial}…`}>
            <div className="spin" />
          </Modal>
        );
      }
      if (phase === 'verifying') {
        return (
          <Modal isOpen={isOpen} onClose={handleClose} onBack={handleBack} title="Confirming ownership" subtitle={`Waiting for a signal from ${serial}… keep holding the pairing button until the camera beeps twice.`}>
            <div className="spin" />
          </Modal>
        );
      }
      if (phase === 'found') {
        return (
          <Modal
            isOpen={isOpen}
            onClose={handleClose}
            onBack={handleBack}
            title="Camera found"
            subtitle="Confirm it’s the camera in front of you before we link it."
            footer={
              <Button variant="white" onClick={handlePaired}>
                I’ve pressed the pairing button
              </Button>
            }
          >
            <div className="devcard">
              <div className="ico">📷</div>
              <div>
                <b>ENDRA Cam · {serial}</b>
                <div className="muted" style={{ fontSize: '12.5px' }}>
                  Unregistered · factory state
                </div>
              </div>
            </div>
            {secNote(
              'Press and hold the pairing button on the camera for 3 seconds. This proves you physically have the device — knowing the code alone isn’t enough to claim it.'
            )}
          </Modal>
        );
      }
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Enter camera code"
          subtitle="The code is on a sticker on the base of the camera, or printed inside the box."
          footer={
            <Button variant="white" onClick={handleLookup}>
              Find camera
            </Button>
          }
        >
          <div className="fld">
            <label htmlFor="acCode">Camera code</label>
            <input
              className="in mono"
              id="acCode"
              placeholder="ENC-000000"
              maxLength={10}
              style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}
              value={serial}
              onChange={e => setSerial(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleLookup();
              }}
            />
            {err && (
              <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
                {err}
              </span>
            )}
          </div>
        </Modal>
      );
    }
    if (step === 2) {
      if (connecting) {
        return (
          <Modal isOpen={isOpen} onClose={handleClose} onBack={handleBack} title="Connecting" subtitle={`Joining ${ADDCAM_WIFI[wifi ?? 0][0]}…`}>
            <div className="spin" />
          </Modal>
        );
      }
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Connect to Wi-Fi"
          subtitle="Choose the network your camera should join."
          footer={
            wifi !== null ? (
              <Button variant="white" onClick={handleWifiConnect}>
                Connect
              </Button>
            ) : null
          }
        >
          {ADDCAM_WIFI.map((w, i) => (
            <button
              key={w[0]}
              type="button"
              className="opt"
              onClick={() => setWifi(i)}
            >
              <span className="ico"><Icon name="quality" size={17} /></span>
              <span>
                <span className="t">{w[0]}</span>
                <br />
                <span className="s">{w[2] ? 'Secured' : 'Open network'}</span>
              </span>
              {wifi === i && <span className="ck"><Icon name="check" size={18} /></span>}
            </button>
          ))}
          {wifi !== null && (
            <div className="fld" style={{ marginTop: '10px' }}>
              <label htmlFor="acWp">Wi-Fi password</label>
              <input
                className="in"
                type="password"
                id="acWp"
                placeholder="Enter password"
                value={wifiPass}
                onChange={e => setWifiPass(e.target.value)}
              />
            </div>
          )}
        </Modal>
      );
    }
  }

  if (method === 'auto') {
    if (step === 1) {
      if (phase === 'searching') {
        return (
          <Modal isOpen={isOpen} onClose={handleClose} onBack={handleBack} title="Auto discovery" subtitle="Searching your network for unclaimed ENDRA cameras…">
            <div className="spin" />
          </Modal>
        );
      }
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Cameras found"
          subtitle={`${plural(results.length, 'unclaimed camera')} on your network.`}
        >
          {results.map((r, i) => (
            <button
              key={r.serial}
              type="button"
              className="devcard click"
              onClick={() => handleAutoPick(i)}
            >
              <div className="ico">📷</div>
              <div style={{ flex: 1 }}>
                <b>{r.model}</b>
                <div className="muted mono" style={{ fontSize: '12px' }}>
                  {r.serial} · Signal {'▮'.repeat(r.signal)}{'▯'.repeat(4 - r.signal)}
                </div>
              </div>
              <Icon name="chevr" size={16} />
            </button>
          ))}
          <p className="muted" style={{ textAlign: 'center', fontSize: '12.5px', marginTop: '12px' }}>
            Don’t see your camera? Press its pairing button, then{' '}
            <button
              type="button"
              style={{ color: 'var(--blue)' }}
              onClick={() => handleChooseMethod('auto')}
            >
              search again
            </button>
            .
          </p>
        </Modal>
      );
    }
    if (step === 2) {
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Confirm ownership"
          subtitle="Enter the last 4 digits of the serial number printed on the bottom of the camera."
          footer={
            <Button variant="white" onClick={handleOwnerVerify}>
              Verify &amp; continue
            </Button>
          }
        >
          <div className="devcard">
            <div className="ico">📷</div>
            <div>
              <b>{model}</b>
              <div className="muted mono" style={{ fontSize: '12px' }}>
                {serial}
              </div>
            </div>
          </div>
          {secNote(
            'Being on the same network isn’t enough — we need proof you can see the physical label, so a guest on your network can’t claim your camera.'
          )}
          <div className="fld" style={{ marginTop: '14px' }}>
            <label htmlFor="acOw">Last 4 digits of serial number</label>
            <input
              className="in mono"
              id="acOw"
              maxLength={4}
              placeholder="0000"
              style={{ textAlign: 'center', letterSpacing: '0.3em' }}
              value={ownerCode}
              onChange={e => setOwnerCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleOwnerVerify();
              }}
            />
            {err && (
              <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
                {err}
              </span>
            )}
          </div>
        </Modal>
      );
    }
  }

  if (method === 'manual') {
    if (step === 1) {
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Manual setup"
          subtitle="Connect using the camera’s network address and admin login."
          footer={
            testOk ? (
              <Button variant="white" onClick={() => setStep(2)}>
                Continue
              </Button>
            ) : (
              <Button variant="white" onClick={handleManualTest}>
                Test connection
              </Button>
            )
          }
        >
          {secNote(
            'You’ll need this camera’s admin username and password. If you don’t manage it yourself, ask whoever installed it — ENDRA won’t link a camera it can’t authenticate into.'
          )}
          <div className="fld" style={{ marginTop: '14px' }}>
            <label htmlFor="acIp">IP address</label>
            <input
              className="in"
              id="acIp"
              placeholder="192.168.1.45"
              value={ip}
              onChange={e => setIp(e.target.value)}
            />
          </div>
          <div className="frow">
            <div className="fld">
              <label htmlFor="acPt">Port</label>
              <input
                className="in"
                id="acPt"
                placeholder="554"
                value={port}
                onChange={e => setPort(e.target.value)}
              />
            </div>
            <div className="fld">
              <label htmlFor="acPr">Protocol</label>
              <select
                className="in"
                id="acPr"
                value={protocol}
                onChange={e => setProtocol(e.target.value)}
              >
                <option value="RTSP">RTSP</option>
                <option value="ONVIF">ONVIF</option>
                <option value="HTTP">HTTP</option>
              </select>
            </div>
          </div>
          <div className="fld">
            <label htmlFor="acUs">Admin username</label>
            <input
              className="in"
              id="acUs"
              placeholder="admin"
              value={user}
              onChange={e => setUser(e.target.value)}
            />
          </div>
          <div className="fld">
            <label htmlFor="acPw">Admin password</label>
            <input
              className="in"
              type="password"
              id="acPw"
              placeholder="Camera password"
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
          </div>

          {err && (
            <div style={{ color: 'var(--red)', fontSize: '12.5px', marginBottom: '8px' }}>
              {err}
            </div>
          )}

          {testing && <div className="spin" style={{ width: '28px', height: '28px', margin: '4px auto 12px' }} />}
          {testOk && (
            <div className="devcard">
              <div className="ico">✅</div>
              <div>
                <b>Connection verified</b>
                <div className="muted" style={{ fontSize: '12.5px' }}>
                  Live snapshot received from the camera
                </div>
              </div>
            </div>
          )}
        </Modal>
      );
    }
  }

  return null;
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { Place } from '../types';
import { plural } from '../utils/formatters';
import { api, HikvisionDiscoveryResponse, HikvisionQRValidationResponse } from '../services/api';
import { nativeBridge } from '../services/nativeBridge';

interface DiscoveredItem {
  serial: string;
  model: string;
  signal: number;
  ip: string;
  port: number;
  rtspPort: number;
}

export const AddCameraWizard: React.FC = () => {
  const { currentPlace, places, setPlaces, setCamNames, setCamZones, go, refreshDashboardData } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'addCamera';

  const [method, setMethod] = useState<'code' | 'auto' | 'manual' | null>(null);
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<string>('enter');
  const [serial, setSerial] = useState('');
  const [err, setErr] = useState('');
  const [model, setModel] = useState('Hikvision Camera');
  const [results, setResults] = useState<DiscoveredItem[]>([]);
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Outdoor');

  // Staged backend activation state
  const [activationToken, setActivationToken] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<HikvisionQRValidationResponse | null>(null);
  const [associatedWithAccount, setAssociatedWithAccount] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Manual / credentials states
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('554');
  const [protocol, setProtocol] = useState('RTSP');
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);

  if (!isOpen) return null;

  // Resolve numeric property ID from current place or fallback
  const resolvePropId = (): number => {
    if (currentPlace && currentPlace.id) {
      const parsed = parseInt(currentPlace.id.replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (Array.isArray(places)) {
      for (const p of places) {
        const parsed = parseInt(p.id.replace(/\D/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return 1;
  };

  // Redact camera password from UI error messages and logs
  const sanitizeErrorMessage = (rawMsg: string): string => {
    if (!rawMsg) return 'An unexpected error occurred.';
    if (pass && pass.length > 2) {
      const escaped = pass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return rawMsg.replace(new RegExp(escaped, 'g'), '********');
    }
    return rawMsg;
  };

  const handleClose = () => {
    setMethod(null);
    setStep(1);
    setPhase('enter');
    setSerial('');
    setErr('');
    setName('');
    setIp('');
    setPort('554');
    setUser('admin');
    setPass('');
    setTestOk(false);
    setTesting(false);
    setLoading(false);
    setActivationToken(null);
    setValidatedData(null);
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

  const handleChooseMethod = async (m: 'code' | 'auto' | 'manual') => {
    setMethod(m);
    setStep(1);
    setErr('');
    if (m === 'auto') {
      setPhase('searching');
      setLoading(true);
      try {
        if (nativeBridge.isNativeApp()) {
          const nativeCams = await nativeBridge.startCameraScan();
          if (Array.isArray(nativeCams) && nativeCams.length > 0) {
            setResults(
              nativeCams.map(d => ({
                serial: d.serial || d.id || 'CAM',
                model: d.model || 'Hikvision/ONVIF Camera',
                signal: d.signal || 4,
                ip: d.ip || '',
                port: Number(d.port) || 80,
                rtspPort: 554
              }))
            );
          } else {
            setResults([]);
          }
        } else {
          const disc = await api.discoverHikvision();
          if (Array.isArray(disc) && disc.length > 0) {
            setResults(
              disc.map((d: HikvisionDiscoveryResponse) => ({
                serial: d.serial_number || d.mac_address || d.ip_address,
                model: d.model || 'Hikvision Network Camera',
                signal: 4,
                ip: d.ip_address,
                port: d.port || 80,
                rtspPort: d.rtsp_port || 554
              }))
            );
          } else {
            setResults([]);
          }
        }
        setPhase('results');
      } catch (discErr: any) {
        setResults([]);
        setPhase('results');
      } finally {
        setLoading(false);
      }
    } else {
      setPhase('enter');
    }
  };

  // Generate a mock QR token from the backend test utility
  const handleGenerateMockQr = async () => {
    setLoading(true);
    setErr('');
    try {
      const mockRes = await api.generateMockQr();
      const mockCode =
        (mockRes as any)?.raw_qr_payload ||
        (mockRes as any)?.mock_qr_payload ||
        (mockRes as any)?.qr_payload ||
        JSON.stringify(mockRes);
      setSerial(typeof mockCode === 'string' ? mockCode : 'DS-2CD2087G2-AA:BB:CC:11:22:33');
    } catch {
      setSerial('{"ip_address":"192.168.1.200","port":554,"username":"admin","password":"Password123","channel":1,"custom_stream_path":"/live/ch0_main","mac_address":"AA:BB:CC:11:22:33","protocol":"RTSP"}');
    } finally {
      setLoading(false);
    }
  };

  // Real QR / Code lookup against live backend
  const handleLookup = async () => {
    const rawInput = serial.trim();
    if (!rawInput) {
      setErr('Please enter the camera QR string, serial, or hardware token.');
      return;
    }

    setErr('');
    setPhase('searching');
    setLoading(true);

    try {
      // 1. Direct JSON extraction if the QR payload is raw JSON
      let directJson: any = null;
      try {
        if (rawInput.startsWith('{') && rawInput.endsWith('}')) {
          directJson = JSON.parse(rawInput);
        }
      } catch {}

      // 2. Validate token against backend validate-qr / hikvision/validate-qr
      const res = await api.validateQrToken(rawInput);
      setValidatedData(res as any);
      setActivationToken((res as any).activation_token || null);
      setModel((res as any).model || directJson?.model || 'Hikvision Security Camera');

      const extractedIp =
        (res as any).ip_address ||
        (res as any).suggested_ip ||
        directJson?.ip_address ||
        directJson?.ip ||
        '';
      const extractedUser =
        (res as any).username ||
        directJson?.username ||
        directJson?.user ||
        '';
      const extractedPass =
        (res as any).password ||
        directJson?.password ||
        directJson?.pass ||
        '';
      const extractedPort =
        (res as any).port ||
        directJson?.port ||
        554;
      const extractedProtocol =
        (res as any).protocol ||
        directJson?.protocol ||
        'RTSP';

      if (extractedIp) setIp(extractedIp);
      if (extractedUser) setUser(extractedUser);
      if (extractedPass) setPass(extractedPass);
      if (extractedPort) setPort(String(extractedPort));
      if (extractedProtocol) setProtocol(extractedProtocol);

      setPhase('found');
    } catch (apiErr: any) {
      setPhase('enter');
      setErr(
        apiErr?.message ||
          'Invalid or unrecognized QR payload. Ensure this is a valid Hikvision or ENDRA camera QR code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Finalize pairing via QR activation token
  const handlePairQr = async () => {
    if (!ip.trim()) {
      setErr('Please specify the camera IP address.');
      return;
    }
    if (!user.trim() || !pass.trim()) {
      setErr('Camera admin credentials (username and password) are required.');
      return;
    }

    const propId = resolvePropId();
    setLoading(true);
    setErr('');

    try {
      const res = await api.pairCameraQr({
        activation_token: activationToken || undefined,
        ip_address: ip.trim(),
        username: user.trim(),
        password: pass.trim(),
        device_name: name.trim() || model,
        zone_name: zone,
        serial_number:
          (validatedData as any)?.serial_number ||
          (validatedData as any)?.identifier ||
          serial.trim(),
        mac_address:
          (validatedData as any)?.mac_address ||
          (validatedData as any)?.identifier ||
          undefined,
        model,
        port: Number(port) || 554,
        protocol,
        property_id: propId
      });

      const cameraRecord = (res as any)?.camera;
      setAssociatedWithAccount(
        cameraRecord?.owner_id !== null && cameraRecord?.owner_id !== undefined
      );
      handleFinishSuccess();
    } catch (pairErr: any) {
      const msg = pairErr?.message || 'Pairing handshake failed. Please verify camera IP and credentials.';
      setErr(sanitizeErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoPick = (idx: number) => {
    const r = results[idx];
    setSerial(r.serial);
    setModel(r.model);
    setIp(r.ip);
    setPort(String(r.rtspPort || 554));
    setStep(2);
  };

  // Pair an auto-discovered camera with entered credentials
  const handlePairDiscovered = async () => {
    if (!user.trim() || !pass.trim()) {
      setErr('Enter camera admin credentials to complete pairing.');
      return;
    }

    const propId = resolvePropId();
    setLoading(true);
    setErr('');

    try {
      await api.pairDiscoveredCamera({
        ip_address: ip.trim(),
        username: user.trim(),
        password: pass.trim(),
        device_name: name.trim() || model,
        zone_name: zone,
        serial_number: serial,
        property_id: propId
      });

      handleFinishSuccess();
    } catch (discPairErr: any) {
      const msg = discPairErr?.message || 'Failed to authenticate and link discovered camera.';
      setErr(sanitizeErrorMessage(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleManualTest = async () => {
    if (!ip.trim()) {
      setErr('Enter the camera’s IP address');
      return;
    }
    if (!user.trim()) {
      setErr('Enter the admin username');
      return;
    }

    const propId = resolvePropId();
    setErr('');
    setTesting(true);
    setTestOk(false);

    try {
      const res = await api.manualHikvisionSetup({
        device_name: name.trim() || 'Manual CCTV',
        ip_address: ip.trim(),
        port: Number(port) || 554,
        username: user.trim(),
        password: pass.trim(),
        protocol,
        property_id: propId
      });

      if (res.is_valid !== false) {
        setTestOk(true);
        const cameraRecord = (res as any)?.camera;
        if (cameraRecord && cameraRecord.owner_id === null) {
          setAssociatedWithAccount(false);
        } else {
          setAssociatedWithAccount(true);
        }
      } else {
        setErr(res.message || 'Camera connection failed. Verify IP, port, and credentials.');
      }
    } catch (testErr: any) {
      const msg = testErr?.message || 'Connection test failed. Ensure the camera is accessible via ISAPI.';
      setErr(sanitizeErrorMessage(msg));
    } finally {
      setTesting(false);
    }
  };

  const handleFinishSuccess = () => {
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

    refreshDashboardData();
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
        title="Add camera to ENDRA"
        subtitle={`Select how you want to connect hardware to ${currentPlace.name}.`}
      >
        <button
          type="button"
          className="optc"
          onClick={() => handleChooseMethod('code')}
        >
          <div className="ico"><Icon name="qr" size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="t">Camera QR code</div>
            <div className="s">Scan or enter the pairing code from device sticker</div>
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
            <div className="s">Scan subnet for connected Hikvision or ONVIF cameras</div>
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
            <div className="t">Manual ISAPI / RTSP setup</div>
            <div className="s">Connect directly by IP address and camera admin login</div>
          </div>
          <Icon name="chevr" size={16} />
        </button>

        {secNote(
          `Hardware setup connects securely to ${currentPlace.name}. Staging tokens and ISAPI authentication prevent unauthorized device hijacking.`
        )}
      </Modal>
    );
  }

  const isSuccessStep =
    (method === 'code' && step === 4) ||
    (method === 'auto' && step === 4) ||
    (method === 'manual' && step === 3);

  if (isSuccessStep) {
    const isUnassociated = associatedWithAccount === false;

    return (
      <Modal isOpen={isOpen} onClose={handleClose} hideHeader={true}>
        <div style={{ paddingTop: '28px', textAlign: 'center' }}>
          <div className="success">
            <div className="ring2" style={isUnassociated ? { borderColor: 'var(--amber)' } : undefined}>
              <Icon name={isUnassociated ? 'alert' : 'check'} size={34} strokeWidth={2} style={isUnassociated ? { color: 'var(--amber)' } : undefined} />
            </div>
            <h3>{isUnassociated ? 'Camera Registered on Network' : 'Camera linked successfully'}</h3>
            <p style={{ marginTop: '8px', fontSize: '13.5px', color: 'var(--g300)' }}>
              {isUnassociated ? (
                <>
                  <b>{name || model}</b> verified via ISAPI and staged on the server.
                  <span style={{ display: 'block', marginTop: '6px', color: 'var(--amber)', fontSize: '12.5px' }}>
                    Note: Backend created this camera without account ownership (owner_id: null). It will appear in your Monitor once the backend assigns ownership to your account.
                  </span>
                </>
              ) : (
                <>{name || model} is now registered in {zone} · {currentPlace.name}</>
              )}
            </p>
          </div>
        </div>
        <div className="m-ft" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
          <Button
            variant="ghost"
            block
            onClick={handleClose}
          >
            Done
          </Button>
          <Button
            variant="white"
            block
            onClick={() => {
              handleClose();
              refreshDashboardData();
              go('monitor');
            }}
          >
            View live monitor
          </Button>
        </div>
      </Modal>
    );
  }

  // Method 1: QR Code Flow
  if (method === 'code') {
    if (step === 1) {
      if (phase === 'searching') {
        return (
          <Modal isOpen={isOpen} onClose={handleClose} onBack={handleBack} title="Validating hardware QR" subtitle={`Verifying ${serial} with backend staging…`}>
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
            title="Camera validated"
            subtitle="Device recognized. Proceed to configure camera name."
            footer={
              <Button variant="white" onClick={() => setStep(2)}>
                Continue
              </Button>
            }
          >
            <div className="devcard">
              <div className="ico">📷</div>
              <div>
                <b>{model}</b>
                <div className="muted mono" style={{ fontSize: '12px' }}>
                  SN: {(validatedData as any)?.serial_number || (validatedData as any)?.identifier || serial} {ip ? `· IP: ${ip}` : ''}
                </div>
              </div>
            </div>
            <div className="note" style={{ marginTop: '12px', fontSize: '12px', color: 'var(--g400)' }}>
              Staging token issued: <code>{activationToken ? `${activationToken.slice(0, 16)}…` : 'Token generated'}</code>
            </div>
          </Modal>
        );
      }

      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Enter camera code or QR"
          subtitle="Enter the QR string, serial number, or use the mock test generator."
          footer={
            <Button variant="white" onClick={handleLookup} disabled={loading}>
              {loading ? 'Validating…' : 'Validate QR'}
            </Button>
          }
        >
          <div className="fld">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="acCode">Camera code / QR payload</label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '11.5px', cursor: 'pointer', padding: 0 }}
                onClick={handleGenerateMockQr}
              >
                Generate mock QR (Test)
              </button>
            </div>
            <input
              className="in mono"
              id="acCode"
              placeholder="e.g. DS-2CD2087G2-AA:BB:CC:11:22:33"
              style={{ letterSpacing: '0.05em' }}
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
      // Check if the QR payload already provided full connection & auth parameters
      const isQrPreconfigured = Boolean(
        (validatedData as any)?.can_auto_pair ||
        (ip.trim() && user.trim() && pass.trim())
      );

      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title={isQrPreconfigured ? 'Name your camera' : 'Configure camera credentials'}
          subtitle={
            isQrPreconfigured
              ? 'Connection and credentials verified from QR. Choose a name for this camera.'
              : 'Provide camera access credentials to authorize stream ingest.'
          }
          footer={
            <Button variant="white" onClick={handlePairQr} disabled={loading}>
              {loading ? 'Connecting & pairing…' : 'Pair camera'}
            </Button>
          }
        >
          {isQrPreconfigured && (
            <div className="devcard" style={{ marginBottom: '16px' }}>
              <div className="ico"><Icon name="cam" size={20} /></div>
              <div>
                <b>{name.trim() || model}</b>
                <div className="muted mono" style={{ fontSize: '12px' }}>
                  IP: {ip} · Port: {port} · Protocol: {protocol}
                </div>
              </div>
            </div>
          )}

          <div className="fld">
            <label htmlFor="acName">Camera name</label>
            <input
              className="in"
              id="acName"
              placeholder="e.g. Front Gate Camera"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="fld">
            <label htmlFor="acZone">Zone</label>
            <select className="in" id="acZone" value={zone} onChange={e => setZone(e.target.value)}>
              <option value="Outdoor">Outdoor</option>
              <option value="Indoor">Indoor</option>
              <option value="Entrance">Entrance</option>
              <option value="Perimeter">Perimeter</option>
            </select>
          </div>

          {!isQrPreconfigured && (
            <>
              <div className="fld">
                <label htmlFor="acIp">IP address</label>
                <input
                  className="in"
                  id="acIp"
                  placeholder="192.168.1.120"
                  value={ip}
                  onChange={e => setIp(e.target.value)}
                />
              </div>
              <div className="frow">
                <div className="fld">
                  <label htmlFor="acUser">Admin user</label>
                  <input className="in" id="acUser" value={user} onChange={e => setUser(e.target.value)} />
                </div>
                <div className="fld">
                  <label htmlFor="acPass">Admin password</label>
                  <input className="in" id="acPass" type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {err && (
            <div style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
              {err}
            </div>
          )}
        </Modal>
      );
    }
  }

  // Method 2: Auto Discovery Flow
  if (method === 'auto') {
    if (step === 1) {
      if (phase === 'searching') {
        return (
          <Modal isOpen={isOpen} onClose={handleClose} onBack={handleBack} title="Auto discovery" subtitle="Scanning local subnet for connected Hikvision cameras…">
            <div className="spin" />
          </Modal>
        );
      }

      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Discovered cameras"
          subtitle={`${plural(results.length, 'camera')} found on network.`}
        >
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📡</div>
              <h4 style={{ marginBottom: '8px' }}>No cameras found on local network</h4>
              <p className="muted" style={{ marginBottom: '16px', fontSize: '13px', lineHeight: '1.5' }}>
                Local network automatic discovery requires the <b>ENDRA mobile app</b> connected to your local Wi-Fi, or an on-premise gateway agent. Desktop web browsers run in a secure sandbox and cannot scan local subnet devices directly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px', margin: '0 auto' }}>
                <Button variant="white" block onClick={() => handleChooseMethod('code')}>
                  Scan or enter QR code
                </Button>
                <Button variant="ghost" block onClick={() => handleChooseMethod('manual')}>
                  Enter camera IP manually
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="devlist">
                {results.map((r, idx) => (
                  <div key={idx} className="devrow" onClick={() => handleAutoPick(idx)}>
                    <div className="ico"><Icon name="cam" size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="t"><b>{r.model}</b></div>
                      <div className="s">{r.ip} · Port {r.port} · SN: {r.serial}</div>
                    </div>
                    <Icon name="chevr" size={16} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Button variant="ghost" onClick={() => handleChooseMethod('auto')}>
                  Scan again
                </Button>
              </div>
            </>
          )}
        </Modal>
      );
    }

    if (step === 2) {
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Pair discovered camera"
          subtitle={`Configure credentials for ${model} (${ip})`}
          footer={
            <Button variant="white" onClick={handlePairDiscovered} disabled={loading}>
              {loading ? 'Authenticating…' : 'Pair camera'}
            </Button>
          }
        >
          <div className="fld">
            <label htmlFor="acDN">Camera name</label>
            <input className="in" id="acDN" placeholder={model} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="acDZ">Zone</label>
            <select className="in" id="acDZ" value={zone} onChange={e => setZone(e.target.value)}>
              <option value="Outdoor">Outdoor</option>
              <option value="Indoor">Indoor</option>
              <option value="Entrance">Entrance</option>
              <option value="Perimeter">Perimeter</option>
            </select>
          </div>
          <div className="frow">
            <div className="fld">
              <label htmlFor="acDU">Username</label>
              <input className="in" id="acDU" value={user} onChange={e => setUser(e.target.value)} />
            </div>
            <div className="fld">
              <label htmlFor="acDP">Password</label>
              <input className="in" id="acDP" type="password" placeholder="Camera password" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
          </div>
          {err && <div style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>{err}</div>}
        </Modal>
      );
    }
  }

  // Method 3: Manual ISAPI / RTSP Flow
  if (method === 'manual') {
    if (step === 1) {
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Manual ISAPI setup"
          subtitle="Connect using the camera’s network address and admin login."
          footer={
            testOk ? (
              <Button variant="white" onClick={() => setStep(2)}>
                Continue
              </Button>
            ) : (
              <Button variant="white" onClick={handleManualTest} disabled={testing}>
                {testing ? 'Testing…' : 'Test connection'}
              </Button>
            )
          }
        >
          {secNote(
            'Requires camera IP address and administrator credentials. ISAPI handshake verifies connectivity before registration.'
          )}
          <div className="fld" style={{ marginTop: '14px' }}>
            <label htmlFor="acIp">IP address</label>
            <input
              className="in"
              id="acIp"
              placeholder="192.168.1.45"
              value={ip}
              onChange={e => {
                setIp(e.target.value);
                setTestOk(false);
              }}
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
                onChange={e => {
                  setPort(e.target.value);
                  setTestOk(false);
                }}
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
                <option value="ISAPI">ISAPI</option>
                <option value="ONVIF">ONVIF</option>
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
              onChange={e => {
                setUser(e.target.value);
                setTestOk(false);
              }}
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
              onChange={e => {
                setPass(e.target.value);
                setTestOk(false);
              }}
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
                  ISAPI handshake successful on socket {ip}:{port}
                </div>
              </div>
            </div>
          )}
        </Modal>
      );
    }

    if (step === 2) {
      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBack}
          title="Name your camera"
          subtitle="Assign an identifier and zone for live monitoring."
          footer={
            <Button variant="white" onClick={handleFinishSuccess}>
              Complete setup
            </Button>
          }
        >
          <div className="fld">
            <label htmlFor="acMN">Camera name</label>
            <input className="in" id="acMN" placeholder="e.g. Driveway CCTV" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="fld">
            <label htmlFor="acMZ">Zone</label>
            <select className="in" id="acMZ" value={zone} onChange={e => setZone(e.target.value)}>
              <option value="Outdoor">Outdoor</option>
              <option value="Indoor">Indoor</option>
              <option value="Entrance">Entrance</option>
              <option value="Perimeter">Perimeter</option>
            </select>
          </div>
        </Modal>
      );
    }
  }

  return null;
};

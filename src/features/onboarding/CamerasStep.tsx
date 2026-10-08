import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { AddedCamera, MAX_CAMS } from '../../data/onboardingData';
import { OnboardingActions } from './OnboardingActions';
import { plural } from '../../utils/formatters';

export const CamerasStep: React.FC = () => {
  const {
    account,
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();
  const { openModal } = useModals();

  const [activeMethod, setActiveMethod] = useState<'auto' | 'qr' | 'manual' | null>(null);
  const [autoPhase, setAutoPhase] = useState<'scanning' | 'results'>('scanning');
  const [scanProgress, setScanProgress] = useState(35);
  const [foundCams, setFoundCams] = useState<
    { id: string; name: string; serial: string; model: string; signal: number; selected: boolean }[]
  >([
    {
      id: 'cam-1',
      name: 'Main Gate',
      serial: 'ENC-482913',
      model: 'ENDRA Cam Pro',
      signal: 4,
      selected: true
    },
    {
      id: 'cam-2',
      name: 'Reception',
      serial: 'ENC-194820',
      model: 'ENDRA Cam Mini',
      signal: 3,
      selected: true
    }
  ]);

  // QR state
  const [qrCode, setQrCode] = useState('ENC-482913');
  const [qrPhase, setQrPhase] = useState<'enter' | 'found'>('enter');
  const [cameraName, setCameraName] = useState('');
  const [cameraZone, setCameraZone] = useState('Outdoor');

  // Manual state
  const [manualIp, setManualIp] = useState('192.168.1.45');
  const [manualPort, setManualPort] = useState('554');
  const [manualProto, setManualProto] = useState('RTSP');
  const [manualUser, setManualUser] = useState('admin');
  const [manualPass, setManualPass] = useState('••••••••');
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);

  const cameras = onboardingData.cams || [];

  const [installerChecking, setInstallerChecking] = useState<boolean>(() => {
    return Boolean(account?.installer && !onboardingData.instChecked);
  });

  useEffect(() => {
    if (installerChecking) {
      const t = setTimeout(() => {
        setInstallerChecking(false);
        if (account?.installer) {
          const instCams: AddedCamera[] = [
            {
              id: 'ENC-INST-01',
              name: 'Front Gate Camera',
              loc: 'Main gate',
              zone: 'Gate',
              method: 'installer',
              via: 'Installer pairing',
              by: account.installer.name
            },
            {
              id: 'ENC-INST-02',
              name: 'Backyard Camera',
              loc: 'Perimeter',
              zone: 'Perimeter',
              method: 'installer',
              via: 'Installer pairing',
              by: account.installer.name
            }
          ];
          updateOnboardingData({
            cams: [...instCams, ...cameras],
            instChecked: true
          });
        }
      }, 1700);
      return () => clearTimeout(t);
    }
  }, [installerChecking, account, cameras, updateOnboardingData]);

  useEffect(() => {
    if (activeMethod === 'auto') {
      setAutoPhase('scanning');
      setScanProgress(20);
      const i1 = setTimeout(() => setScanProgress(65), 500);
      const i2 = setTimeout(() => setScanProgress(100), 1100);
      const i3 = setTimeout(() => setAutoPhase('results'), 1500);
      return () => {
        clearTimeout(i1);
        clearTimeout(i2);
        clearTimeout(i3);
      };
    }
  }, [activeMethod]);

  const handleRemoveCamera = (idx: number) => {
    const next = cameras.filter((_, i) => i !== idx);
    updateOnboardingData({ cams: next });
  };

  const handleAddAutoCameras = () => {
    const selected = foundCams.filter(c => c.selected);
    const newItems: AddedCamera[] = selected.map(c => ({
      id: c.serial,
      name: c.name,
      loc: 'Outdoor',
      zone: 'Outdoor',
      method: 'auto',
      via: `${c.model} (${c.serial})`
    }));
    updateOnboardingData({ cams: [...cameras, ...newItems] });
    setActiveMethod(null);
  };

  const handleAddQrCamera = () => {
    const newItem: AddedCamera = {
      id: qrCode,
      name: cameraName.trim() || `Camera ${cameras.length + 1}`,
      loc: cameraZone,
      zone: cameraZone,
      method: 'qr',
      via: `QR / ${qrCode}`
    };
    updateOnboardingData({ cams: [...cameras, newItem] });
    setActiveMethod(null);
    setQrPhase('enter');
    setCameraName('');
  };

  const handleTestManual = () => {
    setTesting(true);
    setTestOk(false);
    setTimeout(() => {
      setTesting(false);
      setTestOk(true);
    }, 1000);
  };

  const handleAddManualCamera = () => {
    const newItem: AddedCamera = {
      id: `CAM-${manualIp.split('.').pop() || '01'}`,
      name: cameraName.trim() || `Camera ${cameras.length + 1}`,
      loc: cameraZone,
      zone: cameraZone,
      method: 'manual',
      via: `${manualProto}://${manualIp}:${manualPort}`,
      ip: manualIp,
      port: manualPort,
      user: manualUser
    };
    updateOnboardingData({ cams: [...cameras, newItem] });
    setActiveMethod(null);
    setTestOk(false);
    setCameraName('');
  };

  const handleContinue = () => {
    markStepComplete('cameras', cameras.length ? 'done' : 'skipped');
    setObStep('contacts');
  };

  if (installerChecking) {
    return (
      <>
        <h1 id="gH" tabIndex={-1}>
          Checking for installer cameras
        </h1>
        <p className="sub">
          Seeing whether <b>{account?.installer?.name || 'your installer'}</b> has already connected cameras to your property.
        </p>
        <div className="chk-rad" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>
            <Icon name="cam" size={24} />
          </span>
        </div>
        <p className="g-hint" style={{ textAlign: 'center' }} role="status">
          One moment…
        </p>
        <div className="onb-actions">
          <button type="button" className="btn btn-g btn-lg" onClick={() => setObStep('face')}>
            Back
          </button>
          <span className="sp" />
          <button type="button" className="btn btn-w btn-lg" disabled>
            Continue
          </button>
        </div>
      </>
    );
  }

  const instCams = cameras.filter(c => c.by);
  const userCams = cameras.filter(c => !c.by);

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="cam" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Add your cameras
          </h1>
          <p className="sub">
            {instCams.length
              ? `Your installer has already connected ${plural(instCams.length, 'camera')}. Add any others below, or continue.`
              : 'Connect the cameras ENDRA should watch. You can add more from Monitor at any time.'}
          </p>
        </div>
      </header>

      <div className="onb-fm">
        {/* Installer Connected Cameras List */}
        {instCams.length > 0 && !activeMethod && (
          <div style={{ marginBottom: '16px' }}>
            <h2 className="sech" style={{ marginTop: 0 }}>
              Added by {instCams[0].by} · {instCams.length}
            </h2>
            <div className="card flush" aria-label="Cameras added by your installer">
              {instCams.map((c, i) => (
                <div key={i} className="ccard">
                  <span className="ico">
                    <Icon name="cam" size={19} />
                  </span>
                  <div className="mn">
                    <b>{c.name}</b>
                    <span className="s">
                      {c.loc || c.zone} · {c.zone} · Installer pairing
                    </span>
                  </div>
                  <span className="pill">
                    <Icon name="check" size={12} strokeWidth={2.6} /> Connected
                  </span>
                  <button
                    type="button"
                    className="ibtn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => handleRemoveCamera(cameras.indexOf(c))}
                    aria-label={`Remove ${c.name}`}
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              ))}
            </div>
            <div className="note inst-note" style={{ marginTop: '10px' }}>
              <Icon name="shield" size={17} />
              <span>
                <b>Your installer’s access is limited.</b> {instCams[0].by} added these cameras and could watch each feed for 2 minutes to check the install. They can’t see your live feeds, and they can’t remove or change your cameras. Only you can.
              </span>
            </div>
          </div>
        )}

        {/* User Added Cameras List */}
        {userCams.length > 0 && !activeMethod && (
          <div style={{ marginBottom: '16px' }}>
            <h2 className="sech">Your cameras · {userCams.length}</h2>
            <div className="card flush" aria-label="Connected cameras">
              {userCams.map((c, i) => (
                <div key={i} className="ccard">
                  <span className="ico">
                    <Icon name="cam" size={19} />
                  </span>
                  <div className="mn">
                    <b>{c.name}</b>
                    <span className="s">
                      {c.zone} · {c.method === 'auto' ? 'Auto scan' : c.method === 'qr' ? 'QR code' : 'Manual'}
                    </span>
                  </div>
                  <span className="pill green">
                    <Icon name="check" size={12} strokeWidth={2.6} /> Connected
                  </span>
                  <button
                    type="button"
                    className="ibtn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => handleRemoveCamera(cameras.indexOf(c))}
                    aria-label={`Remove ${c.name}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera Method Selection or Wizard */}
        <div className="card">
          {!activeMethod ? (
            <div>
              <div className="cx-card-hd">
                {cameras.length ? 'Add another camera' : 'Add a camera'}
              </div>
              <div className="cx-methods">
                {/* Method 1: Auto scan */}
                <label
                  className="rc feat"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveMethod('auto')}
                >
                  <span className="rc-in cxm">
                    <span className="cx-n">1</span>
                    <span className="rc-ic">
                      <Icon name="search" size={20} />
                    </span>
                    <span className="mn">
                      <b>Auto Scan Network</b>
                      <span className="cx-tag rec">Recommended</span>
                      <small>Finds cameras on your Wi-Fi automatically.</small>
                    </span>
                    <Icon name="chevr" size={16} />
                  </span>
                </label>

                {/* Method 2: QR */}
                <label
                  className="rc quiet"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveMethod('qr')}
                >
                  <span className="rc-in cxm">
                    <span className="cx-n">2</span>
                    <span className="rc-ic">
                      <Icon name="scan" size={18} />
                    </span>
                    <span className="mn">
                      <b>Scan QR Code</b>
                      <small>Point your camera at the QR code on the box or label.</small>
                    </span>
                    <Icon name="chevr" size={16} />
                  </span>
                </label>

                {/* Method 3: Manual */}
                <label
                  className="rc quiet"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveMethod('manual')}
                >
                  <span className="rc-in cxm">
                    <span className="cx-n">3</span>
                    <span className="rc-ic">
                      <Icon name="link" size={18} />
                    </span>
                    <span className="mn">
                      <b>Add Manually</b>
                      <small>Enter an IP address, RTSP link, or ONVIF port.</small>
                    </span>
                    <Icon name="chevr" size={16} />
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="cx-view">
              <div className="cx-vh">
                <button
                  type="button"
                  className="cx-back"
                  onClick={() => setActiveMethod(null)}
                >
                  <Icon name="chevl" size={14} /> Back to methods
                </button>
                <span className="cx-vt">
                  <span className="rc-ic">
                    <Icon
                      name={
                        activeMethod === 'auto'
                          ? 'search'
                          : activeMethod === 'qr'
                          ? 'scan'
                          : 'link'
                      }
                      size={17}
                    />
                  </span>
                  {activeMethod === 'auto'
                    ? 'Auto Scan Network'
                    : activeMethod === 'qr'
                    ? 'Scan QR Code'
                    : 'Add Manually'}
                </span>
              </div>

              {/* Method 1: Auto Scan */}
              {activeMethod === 'auto' && (
                <div>
                  {autoPhase === 'scanning' ? (
                    <div className="scanbox">
                      <div className="radar">
                        <i className="rg r1" />
                        <i className="rg r2" />
                        <i className="rg r3" />
                        <span className="sweep" />
                        <i className="ping d1" />
                        <i className="ping d2" />
                        <div className="core">
                          <Icon name="search" size={24} />
                        </div>
                      </div>
                      <div className="scan-t">Scanning Wi-Fi network…</div>
                      <div className="scan-s">Looking for cameras on your local network</div>
                      <div className="scan-bar">
                        <i style={{ width: `${scanProgress}%` }} />
                      </div>
                      <div className="scan-n">{scanProgress}%</div>
                    </div>
                  ) : (
                    <div>
                      <p className="scan-t" style={{ marginBottom: '12px' }}>
                        Found {foundCams.length} unclaimed cameras:
                      </p>
                      <div className="foundlist">
                        {foundCams.map((cam, i) => (
                          <label key={cam.id} className="rc">
                            <span className="rc-in fnd">
                              <input
                                type="checkbox"
                                checked={cam.selected}
                                onChange={() => {
                                  setFoundCams(prev =>
                                    prev.map((c, idx) =>
                                      idx === i ? { ...c, selected: !c.selected } : c
                                    )
                                  );
                                }}
                              />
                              <div className="ico" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--g800)', display: 'grid', placeItems: 'center' }}>
                                <Icon name="cam" size={18} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <b>{cam.model}</b>
                                <small className="muted mono">
                                  {cam.serial} · Signal {cam.signal}/4
                                </small>
                              </div>
                              <input
                                className="in"
                                style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
                                value={cam.name}
                                onChange={e => {
                                  const v = e.target.value;
                                  setFoundCams(prev =>
                                    prev.map((c, idx) =>
                                      idx === i ? { ...c, name: v } : c
                                    )
                                  );
                                }}
                                placeholder="Camera name"
                                onClick={e => e.stopPropagation()}
                              />
                            </span>
                          </label>
                        ))}
                      </div>

                      <div style={{ marginTop: '18px' }}>
                        <button
                          type="button"
                          className="btn btn-w btn-block btn-lg"
                          onClick={handleAddAutoCameras}
                        >
                          Add selected cameras
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Method 2: QR Code */}
              {activeMethod === 'qr' && (
                <div>
                  {qrPhase === 'enter' ? (
                    <div>
                      <div className="fld">
                        <label htmlFor="qrCode">Camera Pairing Code</label>
                        <input
                          className="in mono"
                          id="qrCode"
                          value={qrCode}
                          placeholder="ENC-000000"
                          style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
                          onChange={e => setQrCode(e.target.value.toUpperCase())}
                        />
                        <span className="g-hint">
                          The code is printed on the sticker under your camera.
                        </span>
                      </div>

                      <div className="frow">
                        <div className="fld">
                          <label htmlFor="qrN">Camera name</label>
                          <input
                            className="in"
                            id="qrN"
                            placeholder="e.g. Front Gate"
                            value={cameraName}
                            onChange={e => setCameraName(e.target.value)}
                          />
                        </div>
                        <div className="fld">
                          <label htmlFor="qrZ">Location zone</label>
                          <select
                            className="in"
                            id="qrZ"
                            value={cameraZone}
                            onChange={e => setCameraZone(e.target.value)}
                          >
                            <option value="Outdoor">Outdoor</option>
                            <option value="Indoor">Indoor</option>
                            <option value="Perimeter">Perimeter</option>
                            <option value="Gate">Gate</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-w btn-block btn-lg"
                        style={{ marginTop: '12px' }}
                        onClick={() => setQrPhase('found')}
                      >
                        Find camera
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="g-banner" style={{ border: '1px solid var(--g700)', background: 'var(--g850)' }}>
                        <Icon name="check" size={18} />
                        <div>
                          <b>Camera found: ENDRA Cam · {qrCode}</b>
                          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--g300)' }}>
                            Press and hold the pairing button on the camera for 3 seconds to confirm ownership.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-w btn-block btn-lg"
                        onClick={handleAddQrCamera}
                      >
                        I’ve pressed the pairing button & link camera
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Method 3: Manual RTSP */}
              {activeMethod === 'manual' && (
                <div>
                  <div className="fld">
                    <label htmlFor="mIp">IP address</label>
                    <input
                      className="in mono"
                      id="mIp"
                      placeholder="192.168.1.45"
                      value={manualIp}
                      onChange={e => setManualIp(e.target.value)}
                    />
                  </div>

                  <div className="frow">
                    <div className="fld">
                      <label htmlFor="mPt">Port</label>
                      <input
                        className="in mono"
                        id="mPt"
                        placeholder="554"
                        value={manualPort}
                        onChange={e => setManualPort(e.target.value)}
                      />
                    </div>
                    <div className="fld">
                      <label htmlFor="mPr">Protocol</label>
                      <select
                        className="in"
                        id="mPr"
                        value={manualProto}
                        onChange={e => setManualProto(e.target.value)}
                      >
                        <option value="RTSP">RTSP</option>
                        <option value="ONVIF">ONVIF</option>
                        <option value="HTTP">HTTP</option>
                      </select>
                    </div>
                  </div>

                  <div className="frow">
                    <div className="fld">
                      <label htmlFor="mUs">Admin username</label>
                      <input
                        className="in"
                        id="mUs"
                        placeholder="admin"
                        value={manualUser}
                        onChange={e => setManualUser(e.target.value)}
                      />
                    </div>
                    <div className="fld">
                      <label htmlFor="mPw">Admin password</label>
                      <input
                        className="in"
                        id="mPw"
                        type="password"
                        placeholder="Camera password"
                        value={manualPass}
                        onChange={e => setManualPass(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="frow">
                    <div className="fld">
                      <label htmlFor="mNm">Camera name</label>
                      <input
                        className="in"
                        id="mNm"
                        placeholder="e.g. Back Garden"
                        value={cameraName}
                        onChange={e => setCameraName(e.target.value)}
                      />
                    </div>
                    <div className="fld">
                      <label htmlFor="mZn">Zone</label>
                      <select
                        className="in"
                        id="mZn"
                        value={cameraZone}
                        onChange={e => setCameraZone(e.target.value)}
                      >
                        <option value="Outdoor">Outdoor</option>
                        <option value="Indoor">Indoor</option>
                        <option value="Perimeter">Perimeter</option>
                        <option value="Gate">Gate</option>
                      </select>
                    </div>
                  </div>

                  {testing && (
                    <div style={{ textAlign: 'center', padding: '12px' }}>
                      <span className="spinline" /> Testing connection…
                    </div>
                  )}

                  {testOk && (
                    <div className="g-banner" style={{ border: '1px solid var(--g700)', background: 'var(--g850)' }}>
                      <Icon name="check" size={17} />
                      <span>Connection verified · Live video stream handshake received</span>
                    </div>
                  )}

                  <div style={{ marginTop: '16px' }}>
                    {!testOk ? (
                      <button
                        type="button"
                        className="btn btn-w btn-block btn-lg"
                        onClick={handleTestManual}
                      >
                        Test connection
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-w btn-block btn-lg"
                        onClick={handleAddManualCamera}
                      >
                        Add camera to property
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hints */}
        <p className="g-hint" style={{ marginTop: '14px' }}>
          ENDRA Plus supports up to {MAX_CAMS} cameras. Need more?{' '}
          <button
            type="button"
            className="linkb"
            onClick={() => openModal({ type: 'commandCenter' })}
          >
            Consider ENDRA Command Center
          </button>
          .
        </p>

        {/* Action bar */}
        <OnboardingActions
          showBack={true}
          onBack={() => setObStep('face')}
          continueLabel={cameras.length ? 'Continue' : 'Skip for now'}
          isSecondaryContinue={cameras.length === 0}
          onContinue={handleContinue}
          continueType="button"
        />
      </div>
    </>
  );
};

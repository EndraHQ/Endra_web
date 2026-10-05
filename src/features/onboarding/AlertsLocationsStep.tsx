import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../components/icons/Icon';
import { plural } from '../../utils/formatters';
import { OnboardingActions } from './OnboardingActions';

const ALERT_ROWS = [
  { key: 'notifPush', title: 'Push alerts', sub: 'General app notifications' },
  { key: 'notifIncident', title: 'Incident alerts', sub: 'Threats, alarms and SOS activity' },
  { key: 'notifSystem', title: 'System updates', sub: 'Device and connectivity status' },
  { key: 'notifMarketing', title: 'News and offers', sub: 'Product updates and promotions' }
];

const ZONE_BASE: Record<string, string[]> = {
  Residence: ['Main gate', 'Back gate', 'Perimeter', 'Parking', 'Entrance', 'Living area'],
  Workplace: ['Main gate', 'Reception', 'Parking', 'Back door', 'Server / store room'],
  Facility: ['Main gate', 'Loading bay', 'Perimeter', 'Warehouse floor', 'Parking']
};

export const AlertsLocationsStep: React.FC = () => {
  const {
    onboardingData,
    updateOnboardingData,
    markStepComplete,
    setObStep
  } = useAuth();
  const { toast } = useApp();

  const [alerts, setAlerts] = useState({
    notifPush: onboardingData.alerts?.notifPush ?? true,
    notifIncident: onboardingData.alerts?.notifIncident ?? true,
    notifSystem: onboardingData.alerts?.notifSystem ?? true,
    notifMarketing: onboardingData.alerts?.notifMarketing ?? false
  });

  const [customZones, setCustomZones] = useState<string[]>(
    onboardingData.zoneCustom || []
  );

  const [newZoneName, setNewZoneName] = useState('');
  const [zoneError, setZoneError] = useState<string | null>(null);

  const defaultBase = ZONE_BASE[onboardingData.type] || ZONE_BASE.Residence;
  const cams = onboardingData.cams || [];

  // Build full zones list
  const allZoneNames: { name: string; custom: boolean; cams: number }[] = [];
  const addZoneEntry = (name: string, custom = false) => {
    if (!allZoneNames.some(z => z.name.toLowerCase() === name.toLowerCase())) {
      const cameraCount = cams.filter(c => c.loc === name || c.zone === name).length;
      allZoneNames.push({ name, custom, cams: cameraCount });
    }
  };

  defaultBase.forEach(n => addZoneEntry(n, false));
  cams.forEach(c => {
    if (c.loc && !c.loc.startsWith('Other')) addZoneEntry(c.loc, false);
  });
  customZones.forEach(n => addZoneEntry(n, true));

  const [pickedZones, setPickedZones] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allZoneNames.forEach(z => {
      // Default to true if has cameras or is base
      initial[z.name] = true;
    });
    return initial;
  });

  const [notifPerm, setNotifPerm] = useState<string>(
    onboardingData.perms?.notif || ''
  );
  const [geoPerm, setGeoPerm] = useState<string>(
    onboardingData.perms?.geo || ''
  );

  const toggleAlert = (key: keyof typeof alerts) => {
    setAlerts(prev => {
      const next = { ...prev, [key]: !prev[key] };
      updateOnboardingData({ alerts: next });
      return next;
    });
  };

  const handleToggleZone = (name: string, checked: boolean) => {
    setPickedZones(prev => ({ ...prev, [name]: checked }));
  };

  const handleAddZone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newZoneName.trim().replace(/\s+/g, ' ');
    if (clean.length < 2) {
      setZoneError('Enter a zone name, for example “Generator house”.');
      return;
    }
    if (allZoneNames.some(z => z.name.toLowerCase() === clean.toLowerCase())) {
      setZoneError('That zone is already in the list.');
      return;
    }

    const nextCustom = [...customZones, clean];
    setCustomZones(nextCustom);
    setPickedZones(prev => ({ ...prev, [clean]: true }));
    updateOnboardingData({ zoneCustom: nextCustom });
    setNewZoneName('');
    setZoneError(null);
    toast(`${clean} added`);
  };

  const handleDeleteZone = (name: string) => {
    const nextCustom = customZones.filter(n => n !== name);
    setCustomZones(nextCustom);
    setPickedZones(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    updateOnboardingData({ zoneCustom: nextCustom });
  };

  const handleGrantPerm = (key: 'notif' | 'geo') => {
    if (key === 'notif') {
      setNotifPerm('granted');
      updateOnboardingData({ perms: { ...onboardingData.perms, notif: 'granted' } });
      toast('Notification permission allowed');
    } else {
      setGeoPerm('granted');
      updateOnboardingData({ perms: { ...onboardingData.perms, geo: 'granted' } });
      toast('Location permission allowed');
    }
  };

  const handleContinue = () => {
    updateOnboardingData({
      alerts,
      perms: {
        notif: notifPerm,
        geo: geoPerm
      },
      zoneCustom: customZones
    });
    markStepComplete('alerts', 'done');
    setObStep('plans');
  };

  return (
    <>
      <header className="onb-hd">
        <span className="onb-ic" aria-hidden="true">
          <Icon name="bell" size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h1 id="gH" tabIndex={-1}>
            Alerts and locations
          </h1>
          <p className="sub">
            Choose which alerts you get, and confirm the places ENDRA should treat as most important.
          </p>
        </div>
      </header>

      <div className="onb-fm">
        {/* Section 1: Alert Preferences */}
        <h2 className="sech">Alert preferences</h2>
        <div className="card flush list" aria-label="Alert types">
          {ALERT_ROWS.map(r => {
            const isChecked = Boolean(alerts[r.key as keyof typeof alerts]);
            return (
              <div key={r.key} className="li">
                <div className="mn">
                  <div className="t" id={`at-${r.key}`}>
                    {r.title}
                  </div>
                  <div className="s">{r.sub}</div>
                </div>
                <button
                  type="button"
                  className={`tgl ${isChecked ? 'on' : ''}`}
                  role="switch"
                  aria-checked={isChecked}
                  aria-labelledby={`at-${r.key}`}
                  onClick={() => toggleAlert(r.key as keyof typeof alerts)}
                >
                  <i />
                </button>
              </div>
            );
          })}
        </div>

        {/* Section 2: Browser Permissions */}
        <div className="card flush" style={{ marginTop: '14px' }}>
          <div className="cardhd">Browser permissions</div>
          {/* Notifications */}
          <div className="perm">
            <span className="ico">
              <Icon name="bell" size={19} />
            </span>
            <div className="mn">
              <b>Browser notifications</b>
              <span className="s">Get alerts even when ENDRA is in another tab</span>
            </div>
            {notifPerm === 'granted' ? (
              <span className="pill green">Allowed</span>
            ) : (
              <button
                type="button"
                className="btn btn-g btn-sm"
                onClick={() => handleGrantPerm('notif')}
              >
                Allow
              </button>
            )}
          </div>

          {/* Location */}
          <div className="perm">
            <span className="ico">
              <Icon name="pin" size={19} />
            </span>
            <div className="mn">
              <b>Location</b>
              <span className="s">Share your position with responders during an SOS</span>
            </div>
            {geoPerm === 'granted' ? (
              <span className="pill green">Allowed</span>
            ) : (
              <button
                type="button"
                className="btn btn-g btn-sm"
                onClick={() => handleGrantPerm('geo')}
              >
                Allow
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Important Locations */}
        <h2 className="sech">Important locations</h2>
        <p className="g-hint" style={{ marginBottom: '14px' }}>
          Alerts from the zones you tick are marked high priority. Zones with a camera are ticked for you.
        </p>

        <div className="card flush" role="group" aria-label="Important zones">
          {allZoneNames.map((z, i) => (
            <label key={i} className="chk2 zrow">
              <input
                type="checkbox"
                checked={Boolean(pickedZones[z.name])}
                onChange={e => handleToggleZone(z.name, e.target.checked)}
              />
              <span className="mn">
                <b>{z.name}</b>
                <span className="s">
                  {z.cams > 0 ? plural(z.cams, 'camera') : 'No camera yet'}
                  {z.custom ? ' · Added by you' : ''}
                </span>
              </span>
              {z.custom && (
                <button
                  type="button"
                  className="ibtn"
                  style={{ width: '32px', height: '32px' }}
                  onClick={e => {
                    e.preventDefault();
                    handleDeleteZone(z.name);
                  }}
                  aria-label={`Remove ${z.name}`}
                >
                  <Icon name="x" size={15} />
                </button>
              )}
            </label>
          ))}
        </div>

        {/* Add Zone */}
        {zoneError && (
          <div className="g-err" role="alert" style={{ marginTop: '10px' }}>
            <Icon name="alert" size={14} />
            <span>{zoneError}</span>
          </div>
        )}

        <div
          className="row"
          style={{
            gap: '10px',
            marginTop: '14px',
            alignItems: 'flex-start',
            display: 'flex'
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="vh" htmlFor="zNew">
              Add another zone
            </label>
            <input
              className={`in ${zoneError ? 'bad' : ''}`}
              id="zNew"
              placeholder="Add another zone, e.g. Generator house"
              value={newZoneName}
              autoComplete="off"
              onChange={e => {
                setNewZoneName(e.target.value);
                if (zoneError) setZoneError(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddZone();
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-g"
            style={{ height: '46px' }}
            onClick={() => handleAddZone()}
          >
            <Icon name="plus" size={16} /> Add
          </button>
        </div>

        {/* Action bar */}
        <OnboardingActions
          showBack={true}
          onBack={() => setObStep('contacts')}
          continueLabel="Continue"
          onContinue={handleContinue}
          continueType="button"
        />
      </div>
    </>
  );
};

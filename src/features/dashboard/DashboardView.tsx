import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { FeedCanvas } from '../../components/media/FeedCanvas';
import { plural, actTone } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    currentPlace,
    places,
    user,
    armed,
    toggleArm,
    devices,
    events,
    go,
    setMonFilter,
    dashboardSummary,
    dashboardLoading,
    dashboardError,
    cameraInventoryStatus,
    setupInventoryStatus,
    emergencyContactsCount,
    refreshDashboardData
  } = useApp();

  const { account } = useAuth();
  const { openModal } = useModals();

  const hasDevices = currentPlace.devices > 0;
  const camOff = Math.max(0, currentPlace.cams - currentPlace.camsOn);
  const devOff = Math.max(0, currentPlace.devices - currentPlace.devOn);
  const attn = camOff > 0 || devOff > 0;
  const health = hasDevices ? Math.round((currentPlace.devOn / currentPlace.devices) * 100) : 0;

  let heroClass = '';
  let heroStatus = '';
  let heroSub = '';

  if (!armed) {
    heroClass = 'dis';
    heroStatus = 'Disarmed';
    heroSub = 'Monitoring is paused. Arm the system to resume protection.';
  } else if (attn) {
    heroClass = 'attn';
    heroStatus = 'Attention needed';
    heroSub = `${camOff ? plural(camOff, 'camera') : plural(devOff, 'device')} offline at ${currentPlace.name}`;
  } else {
    heroStatus = dashboardSummary?.system_status?.includes('Armed') ? 'Protected' : (dashboardSummary?.system_status || 'Protected');
    const threatsPrev = dashboardSummary?.threats_prevented ?? 0;
    if (currentPlace.cams === 0) {
      heroSub = `${currentPlace.name} · No cameras connected · ${threatsPrev} threat${threatsPrev === 1 ? '' : 's'} prevented`;
    } else {
      heroSub = `${currentPlace.name} · ${currentPlace.camsOn} camera${currentPlace.camsOn === 1 ? '' : 's'} online · ${threatsPrev} threat${threatsPrev === 1 ? '' : 's'} prevented`;
    }
  }

  const cameras = devices.filter(d => d.k === 'camera');
  const liveCameras = cameras
    .map(d => ({
      d,
      motion:
        d.status === 'motion' ||
        Boolean(
          events.find(
            e =>
              e.cam === d.name.replace(' Camera', '') &&
              ['incident', 'ai'].includes(e.type)
          )
        )
    }))
    .sort((a, b) => (b.motion ? 1 : 0) - (a.motion ? 1 : 0))
    .slice(0, 5);

  const recCount = cameras.filter(d => d.status === 'recording').length;
  const todayAlerts = events.filter(e => e.day === 'Today' && e.type !== 'system').length;
  const recentActivities = events.slice(0, 4);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  // ═══════════ SETUP CHECKLIST: only what's still to do ═══════════
  const hasEmergencyContacts = setupInventoryStatus === 'ready' && emergencyContactsCount > 0;

  const hasPlace = setupInventoryStatus === 'ready' && places.some(p => p.id.startsWith('prop-'));

  // Real cameras strictly derived from user's registered hardware, excluding mock/sample placeholders
  const realBackendCamerasCount = cameraInventoryStatus === 'ready' ? cameras.length : 0;

  const hasCameras = realBackendCamerasCount > 0;

  // Notifications preference is tracked via explicit account configuration
  const hasNotifications = Boolean(account?.setup?.notifications);

  interface SetupItem {
    k: 'contacts' | 'place' | 'cameras' | 'notifications';
    t: string;
    s: string;
    ico: string;
    done: boolean;
    act: () => void;
  }

  const allSetupItems: SetupItem[] = [
    {
      k: 'contacts',
      t: 'Add emergency contacts',
      s: 'Who ENDRA alerts when you press SOS',
      ico: 'users',
      done: hasEmergencyContacts,
      act: () => go('settings/contacts')
    },
    {
      k: 'place',
      t: 'Add your place',
      s: 'Name and address of what you’re protecting',
      ico: 'home',
      done: hasPlace,
      act: () => openModal({ type: 'connectProperty' })
    },
    {
      k: 'cameras',
      t: 'Add cameras',
      s: cameraInventoryStatus === 'loading' || cameraInventoryStatus === 'idle'
        ? 'Checking your camera inventory…'
        : cameraInventoryStatus === 'error'
          ? 'Camera inventory unavailable. Retry sync to check again.'
          : 'Optional. ENDRA works without them',
      ico: 'cam',
      done: hasCameras,
      act: () => openModal({ type: 'addCamera' })
    },
    {
      k: 'notifications',
      t: 'Set up notifications',
      s: 'Choose which alerts you get',
      ico: 'bell',
      done: hasNotifications,
      act: () => go('settings/notifications')
    }
  ];

  const setupProgressKnown = cameraInventoryStatus === 'ready' && setupInventoryStatus === 'ready';
  const pendingSetupItems = setupProgressKnown ? allSetupItems.filter(i => !i.done) : [];
  const setupProgressPct = setupProgressKnown
    ? Math.round(((allSetupItems.length - pendingSetupItems.length) / allSetupItems.length) * 100)
    : 0;
  const setupProgressLabel = setupProgressKnown
    ? `${setupProgressPct}%`
    : cameraInventoryStatus === 'error' || setupInventoryStatus === 'error'
      ? 'Unavailable'
      : 'Syncing';

  return (
    <div>
      <div className="page-hd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>{getGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="sub">Here’s what’s happening at {currentPlace.name}.</p>
        </div>
        {dashboardLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--g400)' }}>
            <span className="spinline" /> Syncing live data…
          </div>
        )}
      </div>

      <div className="grid">
        {dashboardError && (
          <div
            className="alert alert-err s12"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              fontSize: '13px'
            }}
          >
            <span>{dashboardError}</span>
            <button
              type="button"
              className="btn btn-sm btn-g"
              onClick={() => refreshDashboardData()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Setup Checklist Card (Complete your ENDRA setup) */}
        {(!setupProgressKnown || pendingSetupItems.length > 0) && (
          <section className="card s12 setupc" aria-label="Complete your ENDRA setup">
            <div className="sec-hd">
              <div>
                <h2>Complete your ENDRA setup</h2>
                <p className="sub" style={{ marginTop: '3px' }}>
                  {setupProgressKnown
                    ? `${pendingSetupItems.length === 1 ? '1 step left' : `${pendingSetupItems.length} steps left`}. Finish them whenever you’re ready.`
                    : cameraInventoryStatus === 'error' || setupInventoryStatus === 'error'
                      ? 'Setup status is unavailable. Retry the sync to check again.'
                      : 'Checking your confirmed setup status…'}
                </p>
              </div>
              <b className="mono" style={{ fontSize: '18px' }}>{setupProgressLabel}</b>
            </div>
            <div className="hbar" style={{ margin: '12px 0 8px' }}>
              <i style={{ width: `${setupProgressKnown ? setupProgressPct : 0}%` }} />
            </div>
            <div className="setuplist">
              {pendingSetupItems.map(item => (
                <button
                  key={item.k}
                  type="button"
                  className="setupi"
                  onClick={item.act}
                >
                  <span className="ico">
                    <Icon name={item.ico} size={19} />
                  </span>
                  <span className="mn">
                    <b>{item.t}</b>
                    <span className="s">{item.s}</span>
                  </span>
                  <Icon name="chevr" size={18} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Protection Status Hero */}
        <section className={`hero s8 ${heroClass}`.trim()} aria-label="Protection status">
          <div className="hero-top">
            <div className="ring">
              <Icon name="shield" size={30} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hero-st">{heroStatus}</div>
              <div className="hero-sub">{heroSub}</div>
            </div>
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={toggleArm}
            >
              {armed ? 'Disarm' : 'Arm system'}
            </button>
          </div>

          <div className="mets">
            <div
              className="met"
              onClick={() => {
                setMonFilter('all');
                go('monitor/cameras');
              }}
            >
              <b>
                {currentPlace.camsOn}
                <small>/{currentPlace.cams}</small>
              </b>
              <span>Cameras online</span>
            </div>
            <div
              className="met"
              onClick={() => {
                setMonFilter('recording');
                go('monitor/cameras');
              }}
            >
              <b>{recCount}</b>
              <span>Recording now</span>
            </div>
            <div className="met" onClick={() => go('activity')}>
              <b>{dashboardSummary ? dashboardSummary.total_incidents : todayAlerts}</b>
              <span>Alerts today</span>
            </div>
          </div>
        </section>

        {/* System Health */}
        <section className="card s4" aria-label="System health">
          <div className="sec-hd">
            <h2>System health</h2>
            <span className="muted mono" style={{ fontSize: '11px' }}>
              {hasDevices ? 'Updated just now' : 'No devices'}
            </span>
          </div>
          {hasDevices ? (
            <div style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {health}%
              <span style={{ fontSize: '14px', color: health >= 80 ? 'var(--green)' : 'var(--orange)', fontWeight: 600 }}>
                {' '}healthy
              </span>
            </div>
          ) : (
            <div style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              —
              <span style={{ fontSize: '14px', color: 'var(--g400)', fontWeight: 600 }}>
                {' '}No devices
              </span>
            </div>
          )}
          <div className="hbar">
            <i style={{ width: `${health}%` }} />
          </div>
          <div className="cells">
            <div className="cell">
              <b>{currentPlace.camsOn}/{currentPlace.cams}</b>
              <span>Cameras</span>
            </div>
            <div className="cell">
              <b>{currentPlace.devOn}/{currentPlace.devices}</b>
              <span>Devices</span>
            </div>
            <div className="cell">
              <b>{currentPlace.assets}</b>
              <span>Tracked assets</span>
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div className="chk">
              <i /> Feed encrypted · AES-256
            </div>
            <div className="chk">
              <i /> Operator identity verified
            </div>
          </div>
        </section>

        {/* Mobile App Promo Card */}
        <section className="app-promo s12" aria-label="Get the mobile app">
          <span className="ap-ic" aria-hidden="true">
            <Icon name="mobile" size={24} />
          </span>
          <div className="mn">
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>Take ENDRA with you</h2>
            <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--g300)' }}>
              Watch live feeds from anywhere, get instant threat alerts, and trigger emergency SOS on your phone.
            </p>
            <ol className="ap-steps" aria-label="How it works">
              <li>
                <b>1</b>Download the app
              </li>
              <li className="ap-sep" aria-hidden="true">
                <Icon name="arrow" size={14} />
              </li>
              <li>
                <b>2</b>Log in with this same account
              </li>
              <li className="ap-sep" aria-hidden="true">
                <Icon name="arrow" size={14} />
              </li>
              <li>
                <b>3</b>Your property and cameras are already there
              </li>
            </ol>
          </div>
          <div className="ap-actions">
            <button
              type="button"
              className="btn btn-w"
              onClick={() => go('settings/app')}
            >
              Get the app
            </button>
          </div>
        </section>

        {/* Live Cameras */}
        <section className="s12" aria-label="Live cameras">
          <div className="sec-hd">
            <h2>Live cameras</h2>
            <button
              type="button"
              className="link"
              onClick={() => go('monitor/live')}
            >
              View all
            </button>
          </div>
          <div className="camrow">
            {liveCameras.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--g400)', width: '100%', fontSize: '13px' }}>
                No cameras connected yet. Add a camera to view live feeds.
              </div>
            ) : (
              liveCameras.map(({ d, motion }) => (
                <div
                  key={d.id}
                  className="dcam"
                  onClick={() => {
                    if (d.status === 'offline') {
                      // Toast offline
                    } else {
                      go(`monitor/cam/${d.ci}`);
                    }
                  }}
                >
                  <FeedCanvas
                    device={d}
                    useEventDetection={true}
                    onExpand={() => go(`monitor/cam/${d.ci}`)}
                  />
                  <div className="meta">
                    <div className="nm">{d.name.replace(' Camera', '')}</div>
                    {d.status !== 'offline' && (
                      <div
                        className="st"
                        style={{
                          color: motion ? 'var(--orange)' : 'var(--g500)'
                        }}
                      >
                        {motion ? 'Motion detected' : 'No threat detected'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="s7" aria-label="Recent activity">
          <div className="sec-hd">
            <h2>Recent activity</h2>
            <button
              type="button"
              className="link"
              onClick={() => go('activity')}
            >
              See all
            </button>
          </div>
          <div className="card flush">
            {recentActivities.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--g400)', fontSize: '13px' }}>
                No recent activity recorded.
              </div>
            ) : (
              recentActivities.map((e, idx) => {
                const t = actTone(e.type);
                return (
                  <div
                    key={idx}
                    className="act-row"
                    onClick={() => go(`activity/${idx}`)}
                  >
                    <div
                      className="act-ic"
                      style={{ background: t[1], color: t[0] }}
                    >
                      <Icon name={t[2]} size={17} />
                    </div>
                    <div className="mn">
                      <div className="t">
                        {e.title || e.t}
                        {e.cam ? ` · ${e.cam}` : ''}
                      </div>
                      <div className="s">{e.s}</div>
                    </div>
                    <time>
                      {e.day === 'Today' ? e.time : `Yest. ${e.time}`}
                    </time>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="s5" aria-label="Quick actions">
          <div className="sec-hd">
            <h2>Quick actions</h2>
          </div>
          <div className="qgrid">
            <button
              type="button"
              className="qa"
              onClick={() => go('sos')}
            >
              <span
                className="qi"
                style={{
                  background: 'color-mix(in srgb,var(--red) 13%,transparent)',
                  color: 'var(--red)'
                }}
              >
                <Icon name="alert" size={22} />
              </span>
              <span>
                <b>Emergency SOS</b>
                <span className="d">Alert operators and contacts</span>
              </span>
            </button>

            <button
              type="button"
              className="qa"
              onClick={() => openModal({ type: 'addCamera' })}
            >
              <span
                className="qi"
                style={{ background: 'var(--g800)', color: 'var(--g200)' }}
              >
                <Icon name="plus" size={22} />
              </span>
              <span>
                <b>Add camera</b>
                <span className="d">Pair a new camera</span>
              </span>
            </button>

            <button
              type="button"
              className="qa"
              onClick={() => {
                setMonFilter('all');
                go('monitor/live');
              }}
            >
              <span
                className="qi"
                style={{
                  background: 'color-mix(in srgb,var(--green) 12%,transparent)',
                  color: 'var(--green)'
                }}
              >
                <Icon name="cam" size={22} />
              </span>
              <span>
                <b>Live view</b>
                <span className="d">Open all live feeds</span>
              </span>
            </button>

            <button
              type="button"
              className="qa"
              onClick={() => go('messages')}
            >
              <span
                className="qi"
                style={{
                  background: 'color-mix(in srgb,var(--blue) 12%,transparent)',
                  color: 'var(--blue)'
                }}
              >
                <Icon name="chat" size={22} />
              </span>
              <span>
                <b>Messages</b>
                <span className="d">Direct line to operators</span>
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

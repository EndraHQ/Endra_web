import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { FeedCanvas } from '../../components/media/FeedCanvas';
import { plural, actTone } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    currentPlace,
    user,
    armed,
    toggleArm,
    devices,
    events,
    go,
    setMonFilter
  } = useApp();

  const { openModal } = useModals();

  const camOff = currentPlace.cams - currentPlace.camsOn;
  const devOff = currentPlace.devices - currentPlace.devOn;
  const attn = camOff > 0 || devOff > 0;
  const health = Math.round((currentPlace.devOn / currentPlace.devices) * 100) || 96;

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
    heroStatus = 'Protected';
    heroSub = `${currentPlace.name} · ${currentPlace.camsOn} cameras live · all systems normal`;
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

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>{getGreeting()}, {user.name.split(' ')[0]}</h1>
          <p className="sub">Here’s what’s happening at {currentPlace.name}.</p>
        </div>
      </div>

      <div className="grid">
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
              <b>{todayAlerts}</b>
              <span>Alerts today</span>
            </div>
          </div>
        </section>

        {/* System Health */}
        <section className="card s4" aria-label="System health">
          <div className="sec-hd">
            <h2>System health</h2>
            <span className="muted mono" style={{ fontSize: '11px' }}>
              Updated just now
            </span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {health}%
            <span style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>
              {' '}healthy
            </span>
          </div>
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
            {liveCameras.map(({ d, motion }) => (
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
            ))}
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
            {recentActivities.map((e, idx) => {
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
            })}
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

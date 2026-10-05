import React from 'react';
import { useApp } from '../../context/AppContext';
import { DeviceItem } from '../../types';
import { statusInfo } from '../../utils/formatters';
import { Icon } from '../../components/icons/Icon';
import { Card, StatusDot, EmptyState } from '../../components/common/Card';
import { FeedCanvas } from '../../components/media/FeedCanvas';

export const GpsMapView: React.FC<{ items: DeviceItem[] }> = ({ items }) => {
  const { go } = useApp();
  const pos: [number, number, string][] = [
    [40, 44, 'g'],
    [66, 60, 'b'],
    [22, 70, 'o'],
    [78, 28, 'b'],
    [54, 22, 'g']
  ];

  return (
    <div className="grid">
      <div className="s7">
        <div className="gmap">
          <div className="gmap-grid" />
          <div className="gmap-road" style={{ left: 0, right: 0, top: '46%', height: '10px' }} />
          <div className="gmap-road" style={{ top: 0, bottom: 0, left: '40%', width: '10px' }} />
          <div className="gmap-road" style={{ left: 0, right: 0, top: '78%', height: '6px' }} />
          {items.map((d, i) => {
            const q = pos[i % pos.length];
            return (
              <React.Fragment key={d.name}>
                <div className={`mdot ${q[2]}`} style={{ left: `${q[0]}%`, top: `${q[1]}%` }} />
                <div className="mlbl" style={{ left: `${q[0]}%`, top: `${q[1]}%` }}>
                  {d.name}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div className="s5">
        <Card flush className="list">
          {items.length > 0 ? (
            items.map(d => {
              const si = statusInfo(d);
              return (
                <div
                  key={d.name}
                  className="li click"
                  onClick={() => go('monitor/gps')}
                >
                  <div className="ico">{d.ico}</div>
                  <div className="mn">
                    <div className="t">{d.name}</div>
                    <div className="s">
                      <i className={`sd ${si.dot}`} /> {si.label}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No GPS devices" description="No tracked mobile assets found." />
          )}
        </Card>
      </div>
    </div>
  );
};

export const AiFeedView: React.FC = () => {
  const { setActFilter, go } = useApp();
  const feed: [string, string, string, string, string, string][] = [
    ['🚶', 'Unknown person detected', 'Main Gate', 'warn', '2 min ago', 'ai'],
    ['🚗', 'Vehicle loitering', 'Parking Lot', 'live', 'LIVE', 'ai'],
    ['🔥', 'Smoke detected', 'Warehouse', 'urg', 'Urgent', 'incident'],
    ['📷', 'Camera offline', 'Perimeter N', 'now', 'Now', 'offline'],
    ['🚧', 'Fence breach', 'North Fence', 'urg', '30 sec ago', 'incident']
  ];

  return (
    <Card flush className="aif">
      {feed.map((f, i) => (
        <div
          key={i}
          className="act-row"
          onClick={() => {
            setActFilter(f[5]);
            go('activity');
          }}
        >
          <div
            className="act-ic"
            style={{
              background:
                f[3] === 'urg'
                  ? 'color-mix(in srgb,var(--red) 13%,transparent)'
                  : f[3] === 'warn'
                  ? 'color-mix(in srgb,var(--orange) 13%,transparent)'
                  : 'var(--g800)',
              fontSize: '18px'
            }}
          >
            {f[0]}
          </div>
          <div className="mn">
            <div className="t">{f[1]}</div>
            <div className="s">{f[2]}</div>
          </div>
          <span className={`tag ${f[3]}`}>{f[4]}</span>
        </div>
      ))}
    </Card>
  );
};

export const PlaybackView: React.FC = () => {
  const { currentPlace, playback, setPlayback, camNames, toast } = useApp();
  const cams = camNames.slice(0, Math.min(currentPlace.cams, 8));
  const dates = ['Today', 'Yesterday', ...[-2, -3, -4].map(i => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  })];
  const times = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

  const camN = cams[playback.cam] || cams[0] || 'Camera 01';
  const label = `${dates[playback.date]} ${playback.time}`;
  const clips: [string, string, string, string][] = [
    ['Motion', 'var(--orange)', '+2:14', '0:18'],
    ['Person', 'var(--blue)', '+9:40', '0:32'],
    ['Vehicle', 'var(--blue)', '+15:22', '0:24']
  ];

  return (
    <div>
      <div className="card pbf">
        <div>
          <span className="lbl">Camera</span>
          <div className="chips">
            {cams.map((c, i) => (
              <button
                key={c}
                type="button"
                className={`chip ${playback.cam === i ? 'on' : ''}`}
                onClick={() => setPlayback(prev => ({ ...prev, cam: i, watched: false }))}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="lbl">Date</span>
          <div className="chips">
            {dates.map((d, i) => (
              <button
                key={d}
                type="button"
                className={`chip ${playback.date === i ? 'on' : ''}`}
                onClick={() => setPlayback(prev => ({ ...prev, date: i, watched: false }))}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="lbl">Time</span>
          <div className="chips">
            {times.map(t => (
              <button
                key={t}
                type="button"
                className={`chip ${playback.time === t ? 'on' : ''}`}
                onClick={() => setPlayback(prev => ({ ...prev, time: t, watched: false }))}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-w"
            onClick={() => setPlayback(prev => ({ ...prev, watched: true }))}
          >
            {playback.watched ? 'Reload recording' : 'Watch recording'}
          </button>
        </div>
      </div>

      {playback.watched && (
        <>
          <div className="grid" style={{ marginTop: '24px' }}>
            <div className="s7">
              <div className="feed">
                <FeedCanvas
                  device={{ ci: playback.cam, id: camN, name: camN, status: 'online' }}
                  replayLabel={label}
                  noDetection={true}
                />
              </div>
            </div>

            <div className="card s5">
              <div className="aiv">
                <div className="aiv-top">
                  <div className="aiv-ic">
                    <Icon name="search" size={18} />
                  </div>
                  <div>
                    <b>AI analysis of footage</b>
                    <div className="muted" style={{ fontSize: '12px' }}>
                      {camN} · {label}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="kv">
                    <span>Motion events</span>
                    <span>5</span>
                  </div>
                  <div className="kv">
                    <span>People detected</span>
                    <span>2</span>
                  </div>
                  <div className="kv">
                    <span>Vehicles detected</span>
                    <span>1</span>
                  </div>
                </div>

                <div className="note">
                  <b>Summary:</b> Two people and one vehicle appeared near {camN} within this window. No watchlist matches.
                </div>
              </div>
            </div>
          </div>

          <div className="sec-hd" style={{ marginTop: '26px' }}>
            <h2>Clips in this window</h2>
          </div>
          <div className="clips">
            {clips.map((c, i) => (
              <div key={i} className="clip">
                <div
                  className="cth"
                  onClick={() => toast(`Playing ${c[0]} clip…`)}
                >
                  <b style={{ color: c[1] }}>{c[0].toUpperCase()}</b>
                  <em>{c[3]}</em>
                </div>
                <div className="cn">{c[0]}</div>
                <div className="ct">{c[2]}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

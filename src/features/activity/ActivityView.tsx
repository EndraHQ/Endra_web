import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon } from '../../components/icons/Icon';
import { FilterChips } from '../../components/common/FilterChips';
import { Timeline } from '../../components/media/Timeline';
import { VideoClipPlayer } from './VideoClipPlayer';
import {
  eventRisk,
  eventDesc,
  eventSteps,
  parseDur,
  RISK_COLORS
} from '../../utils/formatters';

const ACT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'motion', label: 'Motion' },
  { id: 'ai', label: 'AI alerts' },
  { id: 'incident', label: 'Incidents' },
  { id: 'offline', label: 'Offline' },
  { id: 'system', label: 'System' }
];

export const ActivityView: React.FC = () => {
  const {
    route,
    go,
    currentPlace,
    events,
    setEvents,
    actFilter,
    setActFilter,
    clipPlayer,
    setClipPlayer,
    devices,
    toast
  } = useApp();

  const { openModal } = useModals();

  const filteredIndexes = events
    .map((e, i) => i)
    .filter(i => actFilter === 'all' || events[i].type === actFilter);

  const hasParam = route.a !== undefined && events[+route.a] !== undefined;
  const selectedIndex = hasParam ? +route.a! : (filteredIndexes[0] ?? null);

  useEffect(() => {
    if (selectedIndex !== null) {
      const e = events[selectedIndex];
      if (!clipPlayer || clipPlayer.i !== selectedIndex) {
        setClipPlayer({
          i: selectedIndex,
          t: 0,
          dur: parseDur(e.dur),
          playing: false
        });
      }
    }
  }, [selectedIndex, events]);

  const days: string[] = [];
  filteredIndexes.forEach(i => {
    if (!days.includes(events[i].day)) {
      days.push(events[i].day);
    }
  });

  const selectedEvent = selectedIndex !== null ? events[selectedIndex] : null;

  const markSafe = (idx: number) => {
    setEvents(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], safe: true };
      return updated;
    });
    toast('Marked as safe — no further action needed');
  };

  const escalate = (idx: number) => {
    setEvents(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], escalated: true };
      return updated;
    });
    toast('Incident escalated — command center notified');
  };

  const toggleReviewed = (idx: number) => {
    setEvents(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], reviewed: !updated[idx].reviewed };
      return updated;
    });
  };

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Activity</h1>
          <p className="sub">
            Motion, AI alerts, incidents and system events at {currentPlace.name}.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-w"
          onClick={() => openModal({ type: 'reportIncident' })}
        >
          <Icon name="plus" size={17} /> Report incident
        </button>
      </div>

      <div className={`split ${hasParam ? 'has-detail' : ''}`.trim()}>
        {/* Master List Pane */}
        <div className="pane-list">
          <FilterChips
            items={ACT_TABS}
            activeItem={actFilter}
            onChange={(tabId: string) => {
              setActFilter(tabId);
              go('activity');
            }}
            className="chips"
            style={{ marginBottom: '6px' }}
          />

          {filteredIndexes.length > 0 ? (
            days.map(d => (
              <React.Fragment key={d}>
                <div className="day">{d}</div>
                <div className="card flush">
                  {filteredIndexes
                    .filter(i => events[i].day === d)
                    .map(i => {
                      const e = events[i];
                      const isSelected = i === selectedIndex;
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`ev ${isSelected ? 'on' : ''}`}
                          style={{ width: '100%', textAlign: 'left' }}
                          onClick={() => go(`activity/${i}`)}
                        >
                          <i className="ed" style={{ background: e.dot }} />
                          <div className="mn">
                            <div className="t">{e.t}</div>
                            <div className="s">{e.s}</div>
                          </div>
                          <time>{e.time}</time>
                        </button>
                      );
                    })}
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className="card empty" style={{ marginTop: '14px' }}>
              No events in this category.
            </div>
          )}
        </div>

        {/* Detail Pane */}
        <div className="pane-detail">
          {selectedEvent !== null && (
            <div>
              <button
                type="button"
                className="back"
                onClick={() => go('activity')}
              >
                <Icon name="chevl" size={16} /> All activity
              </button>

              <div
                className="row"
                style={{
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <h2 style={{ fontSize: '22px', letterSpacing: '-0.01em' }}>
                    {selectedEvent.title || 'Event'}
                  </h2>
                  <div className="muted" style={{ marginTop: '3px' }}>
                    {selectedEvent.t}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-g btn-sm"
                  onClick={() => go('messages/0')}
                >
                  <Icon name="chat" size={15} /> Message command center
                </button>
              </div>

              {selectedEvent.cam && (
                <VideoClipPlayer
                  event={selectedEvent}
                  eventIndex={selectedIndex!}
                />
              )}

              {/* Threat Badges */}
              {(() => {
                const risk = eventRisk(selectedEvent);
                const ref = `INC-${String(800 + selectedIndex!).padStart(4, '0')}`;
                const threat =
                  Boolean(selectedEvent.cam) &&
                  ['incident', 'ai', 'motion'].includes(selectedEvent.type);

                const r = 22;
                const c = 2 * Math.PI * r;
                const o = c * (1 - (selectedEvent.conf || 0) / 100);

                const liveCam = devices.find(
                  d => d.name.replace(' Camera', '') === selectedEvent.cam
                );

                return (
                  <>
                    <div className="badges">
                      <span className={`risk ${risk.tier}`}>
                        <Icon
                          name={
                            risk.tier === 'high' || risk.tier === 'med'
                              ? 'alert'
                              : risk.tier === 'low'
                              ? 'check'
                              : 'info'
                          }
                          size={14}
                        />
                        {risk.label}
                      </span>
                      <button
                        type="button"
                        className={`rvw ${selectedEvent.reviewed ? 'on' : ''}`}
                        onClick={() => toggleReviewed(selectedIndex!)}
                      >
                        {selectedEvent.reviewed ? 'Reviewed' : 'Unreviewed'}
                      </button>
                      <span className="mono muted" style={{ fontSize: '12px' }}>
                        {ref}
                      </span>
                    </div>

                    <div className="dgr">
                      <div>
                        <small>Camera</small>
                        <b>{selectedEvent.cam || '—'}</b>
                      </div>
                      <div>
                        <small>Time</small>
                        <b>{selectedEvent.time || '—'}</b>
                      </div>
                      <div>
                        <small>Location</small>
                        <b>{currentPlace.loc}</b>
                      </div>
                      <div>
                        <small>Duration</small>
                        <b>{selectedEvent.dur || '—'}</b>
                      </div>
                    </div>

                    {/* Timeline */}
                    {threat && (
                      <div className="card">
                        <div className="sec-hd">
                          <h2>Incident timeline</h2>
                        </div>
                        <Timeline
                          steps={eventSteps(selectedEvent).map(s => ({
                            status: s[0],
                            title: s[1],
                            description: s[2],
                            time: s[3]
                          }))}
                        />
                      </div>
                    )}

                    {/* AI Analytics Card */}
                    {selectedEvent.cam ? (
                      <div className="card" style={{ marginTop: '20px' }}>
                        <div className="aiv">
                          <div className="aiv-top">
                            <div className="aiv-ic">
                              <Icon name="search" size={18} />
                            </div>
                            <div>
                              <b>AI analytics</b>
                              <div className="muted" style={{ fontSize: '12px' }}>
                                {selectedEvent.cam} camera · {selectedEvent.day}{' '}
                                {selectedEvent.time}
                              </div>
                            </div>
                            <div className="cring">
                              <svg width="54" height="54" viewBox="0 0 52 52">
                                <circle
                                  cx="26"
                                  cy="26"
                                  r={r}
                                  fill="none"
                                  stroke="var(--g800)"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="26"
                                  cy="26"
                                  r={r}
                                  fill="none"
                                  stroke={RISK_COLORS[risk.tier]}
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeDasharray={c}
                                  strokeDashoffset={o}
                                  transform="rotate(-90 26 26)"
                                />
                              </svg>
                              <span>
                                {selectedEvent.conf || 0}
                                <small>%</small>
                              </span>
                            </div>
                          </div>

                          <div className="kv" style={{ borderTop: 0 }}>
                            <span>Detected</span>
                            <span>{selectedEvent.obj || '—'}</span>
                          </div>

                          <div className="row" style={{ flexWrap: 'wrap' }}>
                            <span className={`risk ${risk.tier}`}>
                              <Icon name="alert" size={13} />
                              Threat level: {risk.val}
                            </span>
                            <span className="rvw">
                              Confidence: {selectedEvent.conf || 0}%
                            </span>
                          </div>

                          <p className="brief">{eventDesc(selectedEvent)}</p>

                          <div className="rec">
                            <Icon name="shield" size={16} />
                            <div>
                              <b>Recommendation</b>
                              <p>{selectedEvent.rec || 'No action needed.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="note" style={{ marginTop: '20px' }}>
                        {selectedEvent.s}. This event is informational — no footage review is required.
                      </div>
                    )}

                    {/* Actions */}
                    {threat ? (
                      selectedEvent.safe ? (
                        <div className="actions">
                          <button type="button" className="btn btn-g" disabled>
                            <Icon name="check" size={17} /> Marked safe
                          </button>
                        </div>
                      ) : (
                        <div className="actions">
                          <button
                            type="button"
                            className="btn btn-safe"
                            onClick={() => markSafe(selectedIndex!)}
                          >
                            <Icon name="check" size={17} /> Mark safe
                          </button>
                          <button
                            type="button"
                            className="btn btn-esc"
                            onClick={() => escalate(selectedIndex!)}
                          >
                            <Icon name="alert" size={17} />{' '}
                            {selectedEvent.escalated ? 'Escalated' : 'Escalate'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-w"
                            onClick={() =>
                              openModal({
                                type: 'trackResponse',
                                eventIndex: selectedIndex!
                              })
                            }
                          >
                            <Icon name="track" size={17} /> Track response
                          </button>
                          <button
                            type="button"
                            className="btn btn-g"
                            onClick={() =>
                              openModal({
                                type: 'createReportFromEvent',
                                eventIndex: selectedIndex!
                              })
                            }
                          >
                            <Icon name="doc" size={17} /> Create report
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="actions">
                        {selectedEvent.cam && (
                          <>
                            <button
                              type="button"
                              className="btn btn-w"
                              onClick={() =>
                                openModal({
                                  type: 'createReportFromEvent',
                                  eventIndex: selectedIndex!
                                })
                              }
                            >
                              Create report
                            </button>
                            <button
                              type="button"
                              className="btn btn-g"
                              onClick={() => {
                                if (liveCam && liveCam.ci !== undefined) {
                                  go(`monitor/cam/${liveCam.ci}`);
                                } else {
                                  toast(`${selectedEvent.cam} camera is offline`);
                                }
                              }}
                            >
                              View live camera
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

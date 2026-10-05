import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { Icon, PlayIcon } from '../../components/icons/Icon';
import { FeedCanvas } from '../../components/media/FeedCanvas';
import {
  camStatusInfo,
  camAiBrief,
  fmtOff,
  fmtRec,
  pbDates
} from '../../utils/formatters';

export const CameraDetailView: React.FC<{ cameraIndex: number }> = ({ cameraIndex }) => {
  const {
    devices,
    events,
    setEvents,
    go,
    currentPlace,
    toast,
    cameraDetail,
    setCameraDetail,
    recordingState,
    toggleRecording
  } = useApp();

  const { openModal } = useModals();

  const liveCameras = devices.filter(d => d.k === 'camera' && d.status !== 'offline');
  let activeIdx = liveCameras.findIndex(d => d.ci === cameraIndex);
  if (activeIdx < 0) activeIdx = 0;

  const currentCam = liveCameras[activeIdx] || liveCameras[0];

  if (!currentCam) {
    return (
      <div>
        <button type="button" className="backlink" onClick={() => go('monitor')}>
          <Icon name="chevl" size={14} /> Monitor
        </button>
        <div className="card">
          <div className="empty">
            <h3>No camera feeds available</h3>
            <p>All cameras appear to be offline or unconfigured.</p>
          </div>
        </div>
      </div>
    );
  }

  const bareName = currentCam.name.replace(' Camera', '');
  const evIdx = events.findIndex(
    e => e.cam === bareName && e.type !== 'gps' && e.type !== 'system'
  );
  const ev = evIdx >= 0 ? events[evIdx] : null;

  const isRecording = recordingState?.ci === currentCam.ci;
  const status = camStatusInfo(currentCam, ev, isRecording);
  const dates = pbDates();
  const replayLabel = cameraDetail.replay
    ? `${dates[cameraDetail.replay.date]} ${cameraDetail.replay.time}`
    : null;

  const handleStep = (dir: number) => {
    const nextIdx = (activeIdx + dir + liveCameras.length) % liveCameras.length;
    const nextCi = liveCameras[nextIdx].ci;
    go(`monitor/cam/${nextCi}`);
  };

  const handleAction = (act: string) => {
    if (act === 'Audio') {
      setCameraDetail(prev => ({ ...prev, panel: prev.panel === 'audio' ? null : 'audio' }));
    } else if (act === 'PTZ') {
      setCameraDetail(prev => ({ ...prev, panel: prev.panel === 'ptz' ? null : 'ptz' }));
    } else if (act === 'Quality') {
      setCameraDetail(prev => ({ ...prev, panel: prev.panel === 'quality' ? null : 'quality' }));
    } else if (act === 'Playback') {
      setCameraDetail(prev => ({ ...prev, panel: prev.panel === 'playback' ? null : 'playback' }));
    } else if (act === 'Info') {
      setCameraDetail(prev => ({ ...prev, panel: prev.panel === 'info' ? null : 'info' }));
    } else if (act === 'Fullscreen') {
      setCameraDetail(prev => ({ ...prev, fs: true }));
    } else if (act === 'Snapshot') {
      const flashEl = document.querySelector('.feed .flash');
      if (flashEl) {
        flashEl.classList.remove('go');
        void (flashEl as HTMLElement).offsetWidth;
        flashEl.classList.add('go');
      }
      toast('Snapshot saved');
    } else if (act === 'Record') {
      if (currentCam.ci !== undefined) {
        toggleRecording(currentCam.ci);
      }
    }
  };

  const handleCheckIncident = () => {
    if (evIdx >= 0) {
      go(`activity/${evIdx}`);
    } else {
      const newEv = {
        day: 'Today',
        type: 'motion' as const,
        dot: 'var(--orange)',
        t: `Motion detected — ${bareName}`,
        s: 'Flagged from the camera view',
        time: 'Just now',
        dur: '~10 sec',
        cam: bareName,
        obj: 'Motion',
        conf: 65,
        rec: 'Review footage to confirm there is no threat.',
        title: 'Motion detected'
      };
      setEvents(prev => [newEv, ...prev]);
      go('activity/0');
    }
  };

  return (
    <div>
      <button
        type="button"
        className="backlink"
        onClick={() => go('monitor/cameras')}
      >
        <Icon name="chevl" size={14} /> Monitor
      </button>

      <div className="page-hd">
        <div>
          <h1>{currentCam.name}</h1>
          <p className="sub mono" style={{ fontSize: '12.5px' }}>
            {currentCam.id} · {currentCam.zone} · {activeIdx + 1} of {liveCameras.length}
          </p>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() => handleStep(-1)}
            aria-label="Previous camera"
          >
            <Icon name="chevl" size={16} /> Previous
          </button>
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() => handleStep(1)}
            aria-label="Next camera"
          >
            Next <Icon name="chevr" size={16} />
          </button>
        </div>
      </div>

      <div className="camwrap">
        <div>
          {/* Stream Frame */}
          <div className={`feedwrap ${cameraDetail.fs ? 'fs' : ''}`.trim()}>
            <FeedCanvas
              device={currentCam}
              event={ev}
              useEventDetection={true}
              recording={isRecording}
              replayLabel={replayLabel}
            />
            {cameraDetail.fs && (
              <button
                type="button"
                className="fsx"
                onClick={() => setCameraDetail(prev => ({ ...prev, fs: false }))}
                aria-label="Exit fullscreen"
              >
                <Icon name="x" size={20} />
              </button>
            )}
          </div>

          {/* Replay Scrubber */}
          {cameraDetail.replay && (
            <div className="card" style={{ marginTop: '12px', padding: '14px 18px' }}>
              <div className="row">
                <span className="mono muted" style={{ fontSize: '12px' }}>
                  {replayLabel}
                </span>
                <input
                  className="scrub sp"
                  type="range"
                  min={0}
                  max={600}
                  value={cameraDetail.replay.off || 0}
                  onChange={e => {
                    const off = +e.target.value;
                    setCameraDetail(prev => ({
                      ...prev,
                      replay: prev.replay ? { ...prev.replay, off } : null
                    }));
                  }}
                  aria-label="Scrub recording"
                />
                <span className="mono" style={{ fontSize: '12px' }}>
                  {fmtOff(cameraDetail.replay.off || 0)}
                </span>
                <button
                  type="button"
                  className="btn btn-g btn-sm"
                  onClick={() => setCameraDetail(prev => ({ ...prev, replay: null }))}
                >
                  Back to live
                </button>
              </div>
            </div>
          )}

          {/* Camera Action Bar */}
          <div className="cambar">
            <button
              type="button"
              className={`cb ${cameraDetail.panel === 'audio' ? 'on' : ''}`}
              onClick={() => handleAction('Audio')}
            >
              <Icon name="mic" size={20} />
              <span>Audio</span>
            </button>

            <button
              type="button"
              className="cb"
              onClick={() => handleAction('Snapshot')}
            >
              <Icon name="snap" size={20} />
              <span>Snapshot</span>
            </button>

            <button
              type="button"
              className={`cb ${isRecording ? 'rec-on' : ''}`}
              onClick={() => handleAction('Record')}
            >
              <Icon name="rec" size={20} />
              <span>{isRecording && recordingState ? `0:${String(recordingState.remaining).padStart(2, '0')}` : 'Record'}</span>
            </button>

            <button
              type="button"
              className="cb"
              onClick={() => handleAction('Fullscreen')}
            >
              <Icon name="expand" size={20} />
              <span>Fullscreen</span>
            </button>

            <button
              type="button"
              className={`cb ${cameraDetail.panel === 'ptz' ? 'on' : ''}`}
              onClick={() => handleAction('PTZ')}
            >
              <Icon name="ptz" size={20} />
              <span>PTZ</span>
            </button>

            <button
              type="button"
              className={`cb ${cameraDetail.panel === 'quality' ? 'on' : ''}`}
              onClick={() => handleAction('Quality')}
            >
              <Icon name="quality" size={20} />
              <span>Quality</span>
            </button>

            <button
              type="button"
              className={`cb ${cameraDetail.panel === 'playback' || cameraDetail.replay ? 'on' : ''}`}
              onClick={() => handleAction('Playback')}
            >
              <PlayIcon size={20} />
              <span>Playback</span>
            </button>

            <button
              type="button"
              className={`cb ${cameraDetail.panel === 'info' ? 'on' : ''}`}
              onClick={() => handleAction('Info')}
            >
              <Icon name="info" size={20} />
              <span>Info</span>
            </button>
          </div>

          {/* Camera Strip */}
          <div className="strip">
            {liveCameras.map(c => (
              <div
                key={c.id}
                className={`st ${c.ci === currentCam.ci ? 'on' : ''}`}
                onClick={() => go(`monitor/cam/${c.ci}`)}
              >
                <FeedCanvas device={c} noDetection={true} />
                <p>{c.name.replace(' Camera', '')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Dynamic Panels & AI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="stbox">
              <i style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }} />
              <span style={{ color: status.color }}>
                {cameraDetail.replay ? 'Viewing replay' : status.label}
              </span>
            </div>
          </div>

          {/* PTZ Controls */}
          {cameraDetail.panel === 'ptz' && (
            <div className="card">
              <div className="sec-hd">
                <h2>PTZ control</h2>
              </div>
              <div className="ptz">
                <button
                  type="button"
                  className="u"
                  onClick={() => toast('Panning up')}
                  aria-label="Pan up"
                >
                  <Icon name="chevu" size={20} />
                </button>
                <button
                  type="button"
                  className="l"
                  onClick={() => toast('Panning left')}
                  aria-label="Pan left"
                >
                  <Icon name="chevl" size={20} />
                </button>
                <button
                  type="button"
                  className="r"
                  onClick={() => toast('Panning right')}
                  aria-label="Pan right"
                >
                  <Icon name="chevr" size={20} />
                </button>
                <button
                  type="button"
                  className="d"
                  onClick={() => toast('Panning down')}
                  aria-label="Pan down"
                >
                  <Icon name="chev" size={20} />
                </button>
              </div>
              <div className="zoomr">
                <button
                  type="button"
                  onClick={() => toast('Zooming out')}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span>Zoom</span>
                <button
                  type="button"
                  onClick={() => toast('Zooming in')}
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Audio Panel */}
          {cameraDetail.panel === 'audio' && (
            <div className="card">
              <div className="sec-hd">
                <h2>Audio</h2>
              </div>
              <button
                type="button"
                className="opt"
                onClick={() => toast('Listening to live audio…')}
              >
                <span className="ico"><Icon name="mic" size={18} /></span>
                <span>
                  <span className="t">Listen in</span>
                  <br />
                  <span className="s">Hear live audio from this camera</span>
                </span>
              </button>
              <button
                type="button"
                className="opt"
                onClick={() => toast('Two-way talk active')}
              >
                <span className="ico"><Icon name="chat" size={18} /></span>
                <span>
                  <span className="t">Push to talk</span>
                  <br />
                  <span className="s">Speak through the camera speaker</span>
                </span>
              </button>
              <button
                type="button"
                className="opt"
                onClick={() => toast('Microphone muted')}
              >
                <span className="ico"><Icon name="camoff" size={18} /></span>
                <span>
                  <span className="t">Mute microphone</span>
                  <br />
                  <span className="s">Stop sending audio to this camera</span>
                </span>
              </button>
            </div>
          )}

          {/* Stream Quality Panel */}
          {cameraDetail.panel === 'quality' && (
            <div className="card">
              <div className="sec-hd">
                <h2>Stream quality</h2>
              </div>
              {['Auto', '1080p HD', '720p', '480p · Data saver'].map(q => (
                <button
                  key={q}
                  type="button"
                  className="opt"
                  onClick={() => {
                    setCameraDetail(prev => ({ ...prev, quality: q, panel: null }));
                    toast(`Stream quality set to ${q}`);
                  }}
                >
                  <span className="ico"><Icon name="quality" size={18} /></span>
                  <span className="t">{q}</span>
                  {cameraDetail.quality === q && (
                    <span className="ck"><Icon name="check" size={18} /></span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Playback Picker Panel */}
          {cameraDetail.panel === 'playback' && (
            <div className="card">
              <div className="sec-hd">
                <h2>Playback</h2>
              </div>
              <span className="lbl">Date</span>
              <div className="chips" style={{ margin: '8px 0 16px' }}>
                {dates.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    className={`chip ${(cameraDetail.pbDraft?.date ?? 0) === i ? 'on' : ''}`}
                    onClick={() =>
                      setCameraDetail(prev => ({
                        ...prev,
                        pbDraft: { date: i, time: prev.pbDraft?.time || '18:00' }
                      }))
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
              <span className="lbl">Time</span>
              <div className="chips" style={{ margin: '8px 0 16px' }}>
                {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${(cameraDetail.pbDraft?.time || '18:00') === t ? 'on' : ''}`}
                    onClick={() =>
                      setCameraDetail(prev => ({
                        ...prev,
                        pbDraft: { date: prev.pbDraft?.date ?? 0, time: t }
                      }))
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-w btn-block"
                onClick={() => {
                  const d = cameraDetail.pbDraft?.date ?? 0;
                  const t = cameraDetail.pbDraft?.time || '18:00';
                  setCameraDetail(prev => ({
                    ...prev,
                    replay: { date: d, time: t, off: 0 },
                    panel: null
                  }));
                }}
              >
                Watch recording
              </button>
            </div>
          )}

          {/* Info Panel */}
          {cameraDetail.panel === 'info' && (
            <div className="card">
              <div className="sec-hd">
                <h2>Camera info</h2>
              </div>
              <div className="kv">
                <span>Name</span>
                <span>{currentCam.name}</span>
              </div>
              <div className="kv">
                <span>ID</span>
                <span className="mono">{currentCam.id}</span>
              </div>
              <div className="kv">
                <span>Zone</span>
                <span>{currentCam.zone}</span>
              </div>
              <div className="kv">
                <span>Property</span>
                <span>{currentPlace.name}</span>
              </div>
              <div className="kv">
                <span>Stream quality</span>
                <span>{cameraDetail.quality}</span>
              </div>
              <div className="kv">
                <span>Recording</span>
                <span>{isRecording ? 'In progress' : 'Standby'}</span>
              </div>
            </div>
          )}

          {/* AI Analysis Card */}
          <div className="card">
            <div className="aiv">
              <div className="aiv-top">
                <div className="aiv-ic">
                  <Icon name="search" size={18} />
                </div>
                <div>
                  <b>AI analysis</b>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {bareName} camera · {ev ? `${ev.day} ${ev.time}` : 'Just now'}
                  </div>
                </div>
              </div>

              <p className="brief">{camAiBrief(ev, bareName)}</p>

              <div>
                <div className="kv">
                  <span>Detected</span>
                  <span>{ev ? ev.obj || '—' : 'No unusual activity'}</span>
                </div>
                <div className="kv">
                  <span>Status</span>
                  <span style={{ color: status.color }}>{status.label}</span>
                </div>
                <div style={{ paddingTop: '11px', borderTop: '1px solid var(--g800)' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Confidence</span>
                    <b>{ev ? ev.conf : 98}%</b>
                  </div>
                  <div className="conf">
                    <i style={{ width: `${ev ? ev.conf : 98}%` }} />
                  </div>
                </div>
              </div>

              <div className="rec">
                <Icon name="shield" size={16} />
                <div>
                  <b>Recommendation</b>
                  <p>
                    {ev
                      ? ev.rec
                      : 'Feed looks normal — no action needed. ENDRA will alert you the moment anything changes.'}
                  </p>
                </div>
              </div>

              {(Boolean(ev) || currentCam.status === 'motion') && (
                <button
                  type="button"
                  className="btn btn-w"
                  onClick={handleCheckIncident}
                >
                  <Icon name="doc" size={16} /> Check incident
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

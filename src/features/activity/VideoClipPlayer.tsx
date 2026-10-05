import React from 'react';
import { useApp } from '../../context/AppContext';
import { SecurityEvent } from '../../types';
import { Icon, PlayIcon, PauseIcon } from '../../components/icons/Icon';
import { SceneSvg } from '../../components/media/FeedCanvas';
import {
  eventRisk,
  RISK_COLORS,
  fmtOff,
  INITIAL_CAM_NAMES
} from '../../utils/formatters';

export const VideoClipPlayer: React.FC<{ event: SecurityEvent; eventIndex: number }> = ({
  event,
  eventIndex
}) => {
  const {
    clipPlayer,
    setClipPlayer,
    toggleClipPlay,
    seekClip,
    setClipTime,
    devices,
    go,
    toast
  } = useApp();

  const risk = eventRisk(event);
  const dur = clipPlayer?.dur || 30;
  const time = clipPlayer?.t || 0;
  const isPlaying = Boolean(clipPlayer?.playing);

  const seed = Math.max(0, INITIAL_CAM_NAMES.indexOf(event.cam));
  const cd = devices.find(d => d.name.replace(' Camera', '') === event.cam);

  const label =
    event.type === 'incident'
      ? 'Incident detected'
      : event.type === 'ai'
      ? 'Threat detected'
      : event.type === 'motion'
      ? 'Motion detected'
      : 'Replay';

  const hasDetection = ['incident', 'ai', 'motion'].includes(event.type);
  const detColor =
    event.type === 'incident' ? ' red' : event.type === 'ai' ? ' blue' : '';

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    setClipTime(Math.round(clickRatio * dur));
  };

  return (
    <div className={`fp ${risk.tier}`}>
      <SceneSvg seed={seed} />
      <div className="fp-body" onClick={toggleClipPlay}>
        {hasDetection && (
          <div
            className={`det${detColor}`}
            style={{
              left: `${36 + seed * 3}%`,
              top: '30%',
              width: '22%',
              height: '46%'
            }}
          >
            <span>
              {(event.obj || '').split('·')[0].trim()} {event.conf}%
            </span>
          </div>
        )}
        <span className="fp-alert" style={{ color: RISK_COLORS[risk.tier] }}>
          <Icon name="alert" size={13} />
          {label}
        </span>
        <span className="fp-time">
          {event.day} {event.time} · {event.cam}
        </span>
        <span className="fp-play">
          {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
        </span>
      </div>

      <div className="fp-bar">
        <div className="fp-track" onClick={handleTrackClick}>
          <i style={{ width: `${(time / dur) * 100}%` }} />
        </div>
        <div className="fp-ctl">
          <button type="button" onClick={() => seekClip(-30)}>
            « 30s
          </button>
          <button type="button" onClick={() => seekClip(-10)}>
            ‹ 10s
          </button>
          <button type="button" onClick={toggleClipPlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="sp" />
          <span>
            {fmtOff(time)} / {fmtOff(dur)}
          </span>
          <button
            type="button"
            onClick={() => {
              if (cd && cd.ci !== undefined) {
                go(`monitor/cam/${cd.ci}`);
              } else {
                toast('Live feed unavailable for this camera');
              }
            }}
          >
            <Icon name="expand" size={12} /> Zoom
          </button>
        </div>
      </div>
    </div>
  );
};

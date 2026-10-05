import React from 'react';
import { DeviceItem, SecurityEvent } from '../../types';
import { Icon } from '../icons/Icon';
import { clock } from '../../utils/formatters';

export const SceneSvg: React.FC<{ seed: number }> = ({ seed }) => {
  const hz = 36 + ((seed * 7) % 14);
  const vx = 45 + ((seed * 37) % 70);
  const left = seed % 2 === 0;
  const bx = left ? 6 : 104;

  const lines: React.ReactNode[] = [];
  for (let x = -60; x <= 220; x += 28) {
    lines.push(
      <line
        key={`vl-${x}`}
        x1={vx}
        y1={hz}
        x2={x}
        y2={90}
        stroke="rgba(255,255,255,.07)"
        strokeWidth={0.5}
      />
    );
  }

  let y = hz + 8;
  for (let k = 1; y < 90; k++, y += k * 5) {
    lines.push(
      <line
        key={`hl-${k}`}
        x1={0}
        y1={y}
        x2={160}
        y2={y}
        stroke="rgba(255,255,255,.04)"
        strokeWidth={0.4}
      />
    );
  }

  return (
    <svg className="scene" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
      <rect x={0} y={hz} width={160} height={90 - hz} fill="rgba(255,255,255,.03)" />
      <rect x={bx} y={hz - 24} width={50} height={24} fill="rgba(255,255,255,.045)" />
      {[0, 1, 2].map(i => (
        <rect
          key={i}
          x={bx + 5 + i * 15}
          y={hz - 18}
          width={9}
          height={6}
          fill="rgba(255,255,255,.05)"
        />
      ))}
      <line
        x1={left ? 64 : 92}
        y1={hz - 16}
        x2={left ? 64 : 92}
        y2={hz + 2}
        stroke="rgba(255,255,255,.12)"
        strokeWidth={0.8}
      />
      {lines}
    </svg>
  );
};

interface FeedCanvasProps {
  device: Partial<DeviceItem>;
  event?: SecurityEvent | null;
  recording?: boolean;
  replayLabel?: string | null;
  noDetection?: boolean;
  useEventDetection?: boolean;
  onExpand?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FeedCanvas: React.FC<FeedCanvasProps> = ({
  device,
  event,
  recording = false,
  replayLabel,
  noDetection = false,
  useEventDetection = false,
  onExpand,
  className = '',
  style
}) => {
  const [currentClock, setCurrentClock] = React.useState(clock());
  const isOffline = device.status === 'offline';
  const seed = device.ci || 0;

  React.useEffect(() => {
    if (replayLabel) return;
    const interval = setInterval(() => {
      setCurrentClock(clock());
    }, 1000);
    return () => clearInterval(interval);
  }, [replayLabel]);

  const hasMotion =
    !isOffline &&
    (device.status === 'motion' || (useEventDetection && Boolean(event)));

  let detectionLabel = 'Person 62%';
  let detectionColor = '';

  if (event && (useEventDetection || device.status === 'motion')) {
    detectionLabel = `${(event.obj || 'Person').split('·')[0].trim()} ${event.conf}%`;
    if (event.type === 'incident') detectionColor = ' red';
    else if (event.type === 'ai') detectionColor = ' blue';
  }

  const detectionBox =
    hasMotion && !noDetection ? (
      <div
        className={`det${detectionColor}`}
        style={{
          left: `${34 + ((seed * 11) % 28)}%`,
          top: `${34 + ((seed * 5) % 10)}%`,
          width: `${15 + (seed % 3) * 2}%`,
          height: `${40 + (seed % 2) * 6}%`
        }}
      >
        <span>{detectionLabel}</span>
      </div>
    ) : null;

  return (
    <div className={`feed ${isOffline ? 'off' : ''} ${className}`.trim()} style={style}>
      <SceneSvg seed={seed} />
      {detectionBox}
      {!isOffline && (
        <span className={`feed-live ${replayLabel ? 'replay' : ''}`}>
          <i />
          {replayLabel ? 'REPLAY' : 'LIVE'}
        </span>
      )}
      {!isOffline && (
        <div className="feed-bdg">
          {(recording || device.status === 'recording') && <b className="rec">REC</b>}
          {hasMotion && (
            <b className="mot">
              {device.status === 'motion'
                ? 'MOTION'
                : event?.type === 'incident'
                ? 'INCIDENT'
                : event?.type === 'ai'
                ? 'AI ALERT'
                : 'MOTION'}
            </b>
          )}
        </div>
      )}
      {!isOffline && (
        <span className="feed-ts">
          {device.id ? `${device.id} · ` : ''}
          {replayLabel || currentClock}
        </span>
      )}
      {isOffline && (
        <div className="feed-off">
          <Icon name="camoff" size={24} />
          <span>Offline</span>
        </div>
      )}
      {!isOffline && onExpand && (
        <button
          className="feed-exp"
          onClick={e => {
            e.stopPropagation();
            onExpand();
          }}
          aria-label="Fullscreen"
        >
          <Icon name="expand" size={14} />
        </button>
      )}
      <div className="flash" id={`flash-${device.ci ?? 0}`} />
    </div>
  );
};

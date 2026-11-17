import React from 'react';
import { DeviceItem, SecurityEvent } from '../../types';
import { Icon } from '../icons/Icon';
import { clock } from '../../utils/formatters';
import { api } from '../../services/api';

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
  device: Partial<DeviceItem> & { feedUrl?: string | null };
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
  const [feedError, setFeedError] = React.useState(false);
  const [feedLoaded, setFeedLoaded] = React.useState(false);
  const [pipelineState, setPipelineState] = React.useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const [pipelineError, setPipelineError] = React.useState<string | null>(null);

  const isOffline = device.status === 'offline';
  const seed = device.ci || 0;

  // Resolve playback URL:
  // 1. Raw RTSP URLs cannot be played directly by browsers without Go2RTC or backend proxy transcoding
  // 2. Internal container filesystem paths (/workspace/...) cannot be fetched directly by browsers
  const rawUrl = device.feedUrl || (device as any).streamUrl || (device as any).stream_url || null;
  const isRtsp = typeof rawUrl === 'string' && rawUrl.toLowerCase().startsWith('rtsp://');
  const isInternalPath = typeof rawUrl === 'string' && (rawUrl.startsWith('/') || rawUrl.startsWith('./'));

  // If rawUrl is a playable external HTTP video/stream, use it; otherwise fallback to backend Hikvision MJPEG proxy feed
  const liveStreamUrl = (!isRtsp && !isInternalPath && rawUrl)
    ? rawUrl
    : (device.id && !device.id.startsWith('c') && !device.id.startsWith('dev')
      ? api.getHikvisionCameraFeedUrl(device.id)
      : null);

  // Automatically start and stop backend Hikvision video pipeline for authenticated cameras
  React.useEffect(() => {
    const cameraId = device.id;
    if (!cameraId || cameraId.startsWith('c') || cameraId.startsWith('dev') || isOffline) {
      setPipelineState('idle');
      setPipelineError(null);
      return;
    }

    let isMounted = true;
    setPipelineState('starting');
    setPipelineError(null);

    // Trigger pipeline start on backend
    api.startHikvisionCamera(cameraId)
      .then(() => {
        if (!isMounted) return;
        setPipelineState('active');
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setPipelineState('error');
        const detail = err?.details?.detail || err?.message || 'Pipeline startup failed';
        setPipelineError(detail);
      });

    return () => {
      isMounted = false;
      api.stopHikvisionCamera(cameraId).catch(() => {});
    };
  }, [device.id, isOffline]);

  // Detect whether target stream is an HTML5 video (MP4/WebM/HLS/Go2RTC MSE stream) vs MJPEG image feed
  const isVideoFormat = Boolean(
    liveStreamUrl && (
      /\.(mp4|webm|m4v|mov|ogg)(\?.*)?$/i.test(liveStreamUrl) ||
      liveStreamUrl.includes('stream.mp4') ||
      liveStreamUrl.includes('.m3u8') ||
      liveStreamUrl.includes('drive.google.com') ||
      liveStreamUrl.includes('video')
    )
  );

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
      {/* Live backend camera video/MJPEG feed with SVG canvas fallback */}
      {liveStreamUrl && !feedError ? (
        isVideoFormat ? (
          <video
            src={liveStreamUrl}
            autoPlay
            playsInline
            muted
            loop
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: feedLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onLoadedData={() => {
              setFeedLoaded(true);
              setFeedError(false);
            }}
            onError={() => {
              setFeedError(true);
              setFeedLoaded(false);
            }}
          />
        ) : (
          <img
            src={liveStreamUrl}
            alt={device.name || 'Live Camera Stream'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: feedLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
            onLoad={() => {
              setFeedLoaded(true);
              setFeedError(false);
            }}
            onError={() => {
              setFeedError(true);
              setFeedLoaded(false);
            }}
          />
        )
      ) : null}

      {(!liveStreamUrl || feedError || !feedLoaded) && (
        <>
          <SceneSvg seed={seed} />
          {(pipelineError || feedError) && !isOffline && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                padding: '6px 10px',
                background: 'rgba(23, 23, 28, 0.88)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 6,
                fontSize: '11px',
                color: '#f87171',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon name="alert" size={13} style={{ flexShrink: 0, color: 'var(--red)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pipelineError
                  ? `Backend startup: ${pipelineError}`
                  : 'Backend pipeline not active. Awaiting /workspace/media/evidence/clips/livevid_crash0.mp4 on server'}
              </span>
            </div>
          )}
        </>
      )}

      {detectionBox}
      {!isOffline && (
        <span className={`feed-live ${replayLabel ? 'replay' : ''}`}>
          <i />
          {replayLabel
            ? 'REPLAY'
            : feedLoaded
            ? isVideoFormat
              ? 'LIVE FEED'
              : 'LIVE RTSP'
            : pipelineState === 'starting'
            ? 'STARTING PIPELINE...'
            : pipelineState === 'error'
            ? 'PIPELINE ERROR'
            : feedError
            ? 'PIPELINE INACTIVE'
            : 'NO LIVE FEED · STANDBY'}
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
          {device.id ? `${device.id.slice(0, 8)} · ` : ''}
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

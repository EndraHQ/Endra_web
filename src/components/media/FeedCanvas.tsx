import React from 'react';
import { DeviceItem, SecurityEvent } from '../../types';
import { Icon } from '../icons/Icon';
import { clock } from '../../utils/formatters';
import { api } from '../../services/api';

/**
 * Validates whether an identifier conforms to standard RFC 4122 UUID structure.
 * Ensures the frontend NEVER sends user IDs, display names (e.g. 'Camera 03'),
 * or mock IDs to backend streaming endpoints.
 */
export const isCameraUuid = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
};

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

export interface FeedCanvasProps {
  device: Partial<DeviceItem> & { feedUrl?: string | null; streamUrl?: string | null };
  event?: SecurityEvent | null;
  recording?: boolean;
  replayLabel?: string | null;
  noDetection?: boolean;
  useEventDetection?: boolean;
  onExpand?: () => void;
  /**
   * Explicit flag indicating this canvas is a public marketing/product demonstration.
   * When true, this component operates 100% locally and NEVER initiates backend requests
   * or exposes server pipeline errors.
   */
  isDemo?: boolean;
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
  isDemo = false,
  className = '',
  style
}) => {
  const [currentClock, setCurrentClock] = React.useState(clock());
  const [feedError, setFeedError] = React.useState(false);
  const [feedLoaded, setFeedLoaded] = React.useState(false);
  const [pipelineState, setPipelineState] = React.useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  const [pipelineError, setPipelineError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const isOffline = device.status === 'offline';
  const seed = device.ci || 0;

  // Strict separation: determine if this instance is an authenticated live camera with a valid backend UUID
  const isRealCamera = !isDemo && isCameraUuid(device.id);

  // Resolve playback URL:
  // 1. Raw RTSP URLs cannot be played directly by browsers without Go2RTC or backend proxy transcoding
  // 2. Internal container filesystem paths (/workspace/...) cannot be fetched directly by browsers
  const rawUrl = device.feedUrl || (device as any).streamUrl || (device as any).stream_url || null;
  const isRtsp = typeof rawUrl === 'string' && rawUrl.toLowerCase().startsWith('rtsp://');
  const isInternalPath = typeof rawUrl === 'string' && (rawUrl.startsWith('/') || rawUrl.startsWith('./'));

  // Live stream URL resolution:
  // - For public demo previews: null (never call backend)
  // - For playable HTTP videos: use direct URL
  // - For authenticated cameras: use backend streaming proxy with camera UUID
  const liveStreamUrl = isRealCamera
    ? (!isRtsp && !isInternalPath && rawUrl)
      ? rawUrl
      : api.getCameraFeedUrl(device.id!)
    : null;

  // Automatically start and stop backend video pipeline for authenticated cameras using camera UUID
  React.useEffect(() => {
    if (!isRealCamera || isOffline || !device.id) {
      setPipelineState('idle');
      setPipelineError(null);
      setFeedError(false);
      return;
    }

    const cameraUuid = device.id;
    let isMounted = true;
    setPipelineState('starting');
    setPipelineError(null);
    setFeedError(false);

    // Trigger backend pipeline startup using the camera UUID (not userID, not display name)
    const rtspSource = (device as any).streamUrl || (device as any).stream_url || undefined;
    api.startStream(cameraUuid, rtspSource)
      .then(() => {
        if (!isMounted) return;
        setPipelineState('active');
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setPipelineState('error');
        const detail = err?.details?.detail || err?.message || 'Unable to establish camera connection';
        setPipelineError(detail);
      });

    // Cleanup active camera pipeline when component unmounts or camera UUID changes
    return () => {
      isMounted = false;
      api.stopStream(cameraUuid).catch(() => {});
    };
  }, [device.id, isOffline, isRealCamera, retryCount]);

  // Detect whether target stream is an HTML5 video (MP4/WebM/HLS) vs MJPEG image feed
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

  let detectionLabel = isDemo ? 'Person 94% · Tracking' : 'Person 62%';
  let detectionColor = '';

  if (event && (useEventDetection || device.status === 'motion')) {
    detectionLabel = `${(event.obj || 'Person').split('·')[0].trim()} ${event.conf}%`;
    if (event.type === 'incident') detectionColor = ' red';
    else if (event.type === 'ai') detectionColor = ' blue';
  }

  const detectionBox =
    isDemo && !noDetection ? (
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
    ) : event && useEventDetection && !noDetection ? (
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
      {/* Live backend camera video/MJPEG feed for authenticated streams */}
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

      {/* Fallback View - Rendered for demo previews, during loading, or when feed offline */}
      {(!liveStreamUrl || feedError || !feedLoaded) && (
        <>
          {isDemo ? (
            <SceneSvg seed={seed} />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, rgba(30, 32, 40, 0.9) 0%, rgba(12, 13, 16, 0.98) 100%)',
                color: 'var(--g400)',
                gap: 8,
                padding: 16,
                textAlign: 'center'
              }}
            >
              {isOffline ? (
                <>
                  <Icon name="cam" size={24} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: 12, color: 'var(--g400)' }}>Camera offline</span>
                </>
              ) : pipelineState === 'starting' && !pipelineError && !feedError ? (
                <>
                  <span className="spinline" style={{ width: 20, height: 20 }} />
                  <span style={{ fontSize: 12, color: 'var(--g300)' }}>Connecting to camera feed…</span>
                </>
              ) : (
                <>
                  <Icon name="cam" size={24} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: 12, color: 'var(--g400)' }}>Live stream unavailable</span>
                </>
              )}
            </div>
          )}
          {/* ONLY show real pipeline errors for authenticated cameras, NEVER on public demo pages */}
          {isRealCamera && (pipelineError || feedError) && !isOffline && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                padding: '6px 10px',
                background: 'rgba(23, 23, 28, 0.92)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 6,
                fontSize: '11px',
                color: '#f87171',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <Icon name="alert" size={13} style={{ flexShrink: 0, color: 'var(--red)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pipelineError || 'Live camera stream inactive. Check network & RTSP credentials.'}
                </span>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setRetryCount(c => c + 1);
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {detectionBox}

      {/* Live / Status Indicator Badge */}
      {!isOffline && (
        <span className={`feed-live ${replayLabel ? 'replay' : ''}`}>
          <i />
          {replayLabel
            ? 'REPLAY'
            : isDemo
            ? 'LIVE DEMO'
            : feedLoaded
            ? isVideoFormat
              ? 'LIVE FEED'
              : 'LIVE RTSP'
            : pipelineState === 'starting'
            ? 'CONNECTING STREAM...'
            : pipelineState === 'error' || feedError
            ? 'STREAM OFFLINE'
            : 'STANDBY'}
        </span>
      )}

      {/* Status Overlay Badges */}
      {!isOffline && (
        <div className="feed-bdg">
          {(recording || device.status === 'recording') && <b className="rec">REC</b>}
          {(hasMotion || isDemo) && (
            <b className="mot">
              {device.status === 'motion' || isDemo
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
          {isRealCamera && device.id ? `${device.id.slice(0, 8)} · ` : ''}
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

/**
 * Public-facing product demonstration preview component for landing, login, and registration pages.
 * Operates strictly locally without initiating real camera network requests or displaying pipeline errors.
 */
export const DemoFeedCanvas: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  onExpand?: () => void;
}> = ({ className = '', style, label, onExpand }) => {
  const demoDevice: Partial<DeviceItem> = {
    ci: 2,
    id: 'demo-public-preview',
    name: 'Parking A Camera',
    status: 'motion' as const
  };

  const demoEvent: SecurityEvent = {
    day: 'Today',
    type: 'ai',
    dot: 'var(--blue)',
    t: 'AI Detection',
    title: 'Plate on watchlist',
    s: 'Parking A · Security Alert',
    time: 'Now',
    dur: 'Live',
    cam: 'Parking A',
    obj: 'Person · Tracking',
    conf: 94,
    rec: label || 'Plate on watchlist · operator notified'
  };

  return (
    <FeedCanvas
      device={demoDevice}
      event={demoEvent}
      isDemo={true}
      useEventDetection={true}
      onExpand={onExpand}
      className={className}
      style={style}
    />
  );
};

import { SecurityEvent, RiskInfo, DeviceItem } from '../types';

export const esc = (s: any): string =>
  String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));

export const initials = (n: string): string =>
  String(n)
    .trim()
    .split(/\s+/)
    .map(p => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const plural = (n: number, w: string): string =>
  `${n} ${w}${n === 1 ? '' : 's'}`;

export const hhmm = (): string => {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
};

export const clock = (): string => {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
};

export const fmtOff = (s: number | string): string => {
  const num = +s;
  return Math.floor(num / 60) + ':' + String(num % 60).padStart(2, '0');
};

export const roleTone = (r: string): string =>
  ({
    Owner: 'green',
    'Property Owner': 'green',
    Tenant: 'blue',
    Manager: 'orange',
    'Property Manager': 'orange',
    Developer: 'orange',
    Employee: 'blue'
  }[r] || '');

export const actTone = (t: string): [color: string, bg: string, icon: string] =>
  ({
    motion: ['var(--orange)', 'color-mix(in srgb,var(--orange) 14%,transparent)', 'alert'],
    ai: ['var(--blue)', 'color-mix(in srgb,var(--blue) 14%,transparent)', 'search'],
    system: ['var(--green)', 'color-mix(in srgb,var(--green) 14%,transparent)', 'check'],
    gps: ['var(--green)', 'color-mix(in srgb,var(--green) 14%,transparent)', 'pin'],
    incident: ['var(--red)', 'color-mix(in srgb,var(--red) 14%,transparent)', 'alert'],
    offline: ['var(--g400)', 'var(--g800)', 'device']
  }[t] as [string, string, string]) || ['var(--g400)', 'var(--g800)', 'alert'];

export const parseDur = (s: string): number => {
  const m = /(\d+)\s*(sec|min)/.exec(s || '');
  return m ? +m[1] * (m[2] === 'min' ? 60 : 1) : 30;
};

export const eventRisk = (e: SecurityEvent): RiskInfo => {
  if (e.type === 'incident') return { tier: 'high', label: 'High risk', val: 'High' };
  if (e.type === 'ai') return { tier: 'med', label: 'Medium risk', val: 'Medium' };
  if (e.type === 'motion')
    return e.conf >= 60
      ? { tier: 'med', label: 'Medium risk', val: 'Medium' }
      : { tier: 'low', label: 'Low risk', val: 'Low' };
  if (e.type === 'offline') return { tier: 'low', label: 'Low risk', val: 'Low' };
  return { tier: 'info', label: 'Informational', val: '—' };
};

export const RISK_COLORS: Record<string, string> = {
  high: 'var(--red)',
  med: 'var(--orange)',
  low: 'var(--green)',
  info: 'var(--g400)'
};

export const pbDates = (): string[] =>
  [0, 1, 2, 3, 4].map(i => {
    if (i === 0) return 'Today';
    if (i === 1) return 'Yesterday';
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  });

export function statusInfo(d: DeviceItem) {
  switch (d.status) {
    case 'offline':
      return { dot: 'x', label: 'Offline' };
    case 'recording':
      return { dot: 'r', label: 'Recording' };
    case 'motion':
      return { dot: 'o', label: 'Motion detected' };
    case 'moving':
      return { dot: 'g', label: d.extra || 'Moving' };
    case 'alert':
      return { dot: 'o', label: d.extra || 'Alert' };
    case 'idle':
      return { dot: 'b', label: d.extra || 'Idle' };
    default:
      return { dot: 'g', label: d.extra || 'Online' };
  }
}

export function camStatusInfo(d: DeviceItem, ev: SecurityEvent | null, isRecording = false) {
  if (ev) {
    if (ev.type === 'incident') return { color: 'var(--red)', label: 'Incident detected' };
    if (ev.type === 'ai') return { color: 'var(--yellow)', label: 'Threat detected' };
    if (ev.type === 'motion') return { color: 'var(--orange)', label: 'Motion detected' };
    if (ev.type === 'offline') return { color: 'var(--g500)', label: 'Camera offline' };
  }
  if (d.status === 'motion') return { color: 'var(--orange)', label: 'Motion detected' };
  if (d.status === 'recording' || isRecording) return { color: 'var(--red)', label: 'Recording' };
  return { color: 'var(--green)', label: 'No threat detected' };
}

export function camAiBrief(ev: SecurityEvent | null, bare: string): string {
  if (!ev)
    return `${bare} shows no signs of a threat right now — no unusual movement, unfamiliar faces, or flagged objects in the last few minutes.`;
  const conf = ev.conf;
  const who = (ev.obj || 'activity').toLowerCase();
  if (ev.type === 'incident')
    return `ENDRA detected ${who} at ${bare} and flagged it as an active incident with ${conf}% confidence. This is a confirmed threat — an operator has been notified and a responder may be on the way.`;
  if (ev.type === 'ai')
    return `ENDRA’s AI spotted ${who} at ${bare} with ${conf}% confidence. The pattern is unusual enough to flag for review, though it hasn’t been confirmed as a threat yet.`;
  if (ev.type === 'motion')
    return conf >= 60
      ? `Motion was picked up at ${bare} — ${who} moved through frame. Confidence is moderate (${conf}%), so it’s worth a quick look.`
      : `Motion was picked up at ${bare} — most likely just ${who} passing through. Confidence is low (${conf}%), so this is probably nothing to worry about.`;
  if (ev.type === 'offline')
    return `${bare} has lost its video signal, so ENDRA can’t currently analyze this feed. Check the camera’s power and network connection.`;
  return ev.s || '';
}

export function eventDesc(e: SecurityEvent): string {
  if (e.type === 'incident')
    return `${e.t}. ${e.s}. ENDRA flagged this automatically from ${e.cam || 'the site'} and notified the command center immediately.`;
  if (e.type === 'ai')
    return `ENDRA’s AI detected ${(e.obj || 'unusual activity').toLowerCase()} at ${e.cam || 'this location'} with ${e.conf}% confidence. ${e.s}.`;
  if (e.type === 'motion')
    return `Motion was detected at ${e.cam || 'this location'} — ${(e.obj || 'activity').toLowerCase()}. ${e.s}.`;
  if (e.type === 'offline') return `${e.cam || 'A device'} went offline. ${e.s}.`;
  return e.s || 'No further details available for this event.';
}

export function eventSteps(e: SecurityEvent): [status: 'done' | 'act' | 'pend', title: string, desc: string, time: string][] {
  if (e.type === 'incident')
    return [
      ['done', 'Incident detected', (e.cam ? e.cam + ' · ' : '') + 'Flagged automatically by ENDRA', e.time],
      ['done', 'Operator notified', 'ENDRA command center reviewing', '+0:20'],
      ['act', 'Responder dispatched', 'Unit en route to ' + (e.cam || 'Site'), '+1:10'],
      ['pend', 'On site', 'Responder arrives and assesses', ''],
      ['pend', 'Resolved', 'Incident closed with notes', '']
    ];
  if (e.type === 'ai')
    return [
      ['done', 'Flagged by AI', (e.conf || 0) + '% confidence · logged for review', e.time],
      ['done', 'Operator notified', 'ENDRA command center reviewing', '+0:15'],
      ['act', 'Under review', 'An operator is assessing this footage now', ''],
      ['pend', 'Resolved', 'Marked as reviewed or escalated', '']
    ];
  return [
    ['done', 'Motion detected', (e.cam ? e.cam + ' · ' : '') + 'Logged automatically', e.time],
    ['done', 'Reviewed by AI', 'Confidence ' + (e.conf || 0) + '% · low risk', '+0:05'],
    ['pend', 'No action needed', 'Will escalate automatically if activity continues', '']
  ];
}

export const INITIAL_CAM_NAMES = [
  'Gate Entrance',
  'Driveway',
  'Perimeter North',
  'Perimeter South',
  'Rear Garden',
  'Courtyard'
];

export const fmtRec = (s: number | string): string => fmtOff(s);


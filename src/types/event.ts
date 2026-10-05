export type EventType = 'motion' | 'ai' | 'system' | 'offline' | 'incident' | 'gps';

export interface SecurityEvent {
  day: 'Today' | 'Yesterday' | string;
  type: EventType;
  dot: string;
  t: string;
  s: string;
  time: string;
  dur: string;
  cam: string;
  obj: string;
  conf: number;
  rec: string;
  title: string;
  safe?: boolean;
  escalated?: boolean;
  reviewed?: boolean;
}

export type RiskTier = 'high' | 'med' | 'low' | 'info';

export interface RiskInfo {
  tier: RiskTier;
  label: string;
  val: string;
}

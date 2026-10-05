export type DeviceKind = 'camera' | 'gps' | 'lock' | 'motion' | 'smoke' | 'door' | 'panic' | 'water' | 'siren' | 'alarm';

export interface DeviceItem {
  k: DeviceKind;
  ico: string;
  name: string;
  id: string;
  zone: string;
  status: 'online' | 'offline' | 'recording' | 'motion' | 'moving' | 'alert' | 'alarm' | 'idle' | 'locked' | 'normal' | 'closed' | 'armed';
  live: boolean;
  ci?: number;
  ai?: number;
  extra?: string;
}

export interface StatusInfo {
  dot: 'g' | 'r' | 'o' | 'b' | 'x';
  label: string;
}

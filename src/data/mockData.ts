import {
  Place,
  ConnectedPlace,
  HouseholdMember,
  GuestPass,
  UserProfile,
  UserSettings,
  SecurityEvent,
  ChatThread,
  EnrolledFace,
  DeviceItem
} from '../types';

export const inDays = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const INITIAL_PLACES: Place[] = [
  { id: 'home', name: 'My Home', type: 'Residence', loc: 'Lekki Phase 1', role: 'Owner', ig: 'home', cams: 6, camsOn: 6, assets: 2, devices: 9, devOn: 9 },
  { id: 'office', name: 'Office', type: 'Workplace', loc: 'Ikeja GRA', role: 'Owner', ig: 'building', cams: 12, camsOn: 11, assets: 3, devices: 16, devOn: 15 },
  { id: 'warehouse', name: 'Warehouse', type: 'Facility', loc: 'Apapa', role: 'Manager', ig: 'folder', cams: 20, camsOn: 18, assets: 5, devices: 28, devOn: 26 }
];

export const INITIAL_CONNECTED: ConnectedPlace[] = [
  { id: 'green-valley', name: 'Green Valley Estate', loc: 'Lekki Phase 1', role: 'Tenant', property: 'House 21', status: 'active', ig: 'key' },
  { id: 'unity-campus', name: 'Unity Church Campus', loc: 'Victoria Island', role: 'Visitor', property: '', status: 'active', ig: 'walk' },
  { id: 'royal-gardens', name: 'Royal Gardens', loc: 'Ikoyi', role: 'Guest', property: 'Block C · Flat 7', status: 'pending', ig: 'ticket' }
];

export const INITIAL_HOUSEHOLD: HouseholdMember[] = [
  { name: 'Chidi Okonkwo', rel: 'Husband', type: 'adult' },
  { name: 'Zara Okonkwo', rel: 'Daughter', type: 'child', age: 8 },
  { name: 'Emeka Okonkwo', rel: 'Son', type: 'child', age: 5 },
  { name: 'Grace', rel: 'Maid', type: 'staff' }
];

export const INITIAL_GUESTS: GuestPass[] = [
  { name: 'Mary Cole', to: inDays(5) }
];

export const INITIAL_USER: UserProfile = {
  name: 'Adaeze Okonkwo',
  phone: '+234 803 415 9920',
  email: 'a.okonkwo@endra.africa',
  faceEnrolled: true,
  faceQuality: 96,
  faceTemplate: 'ENF-7K2QX9',
  govIdVerified: true,
  govIdType: 'NIN',
  govIdPending: false,
  plan: 'ENDRA Plus'
};

export const INITIAL_SETTINGS: UserSettings = {
  notifPush: true,
  notifIncident: true,
  notifSystem: true,
  notifMarketing: false,
  twoFA: true,
  appearance: 'Light',
  language: 'English'
};

export const INITIAL_CAM_NAMES = [
  'Main Gate', 'Reception', 'Parking A', 'Perimeter N', 'Corridor',
  'Rooftop', 'Loading Bay', 'Back Gate', 'Lobby', 'Stairwell'
];

export const INITIAL_CAM_ZONE = [
  'Outdoor', 'Indoor', 'Outdoor', 'Outdoor', 'Indoor',
  'Rooftop', 'Outdoor', 'Outdoor', 'Indoor', 'Indoor'
];

export const ASSETS: [name: string, icon: string, desc: string, tone: string][] = [
  ['Patrol Car', '🚓', 'Moving · 32 km/h', 'g'],
  ['Backup Generator', '⚡', 'Idle · Compound', 'b'],
  ['Delivery Van', '🚐', 'Moving · Gate', 'g'],
  ['Water Bowser', '🚚', 'Parked', 'b'],
  ['Guard Radio', '📻', 'Left geofence', 'o']
];

export const OTHERS: [kind: any, icon: string, name: string, desc: string, status: any][] = [
  ['lock', '🚪', 'Main Entrance', 'Locked · Battery 94%', 'locked'],
  ['lock', '🚪', 'Server Room', 'Locked · Battery 78%', 'locked'],
  ['motion', '📡', 'Hallway Motion', 'Normal', 'normal'],
  ['smoke', '🔥', 'Warehouse Smoke', 'Normal', 'normal'],
  ['door', '🚪', 'Back Door', 'Closed', 'closed'],
  ['panic', '🆘', 'Reception Panic', 'Armed', 'armed'],
  ['water', '💧', 'Basement Leak', 'Normal', 'normal'],
  ['siren', '📢', 'Rooftop Siren', 'Idle', 'idle'],
  ['alarm', '🚨', 'Alarm Panel', 'Armed', 'armed']
];

export const INITIAL_EVENTS: SecurityEvent[] = [
  { day: 'Today', type: 'motion', dot: 'var(--orange)', t: 'Motion detected — Main Gate', s: 'Unusual movement near entrance', time: '09:39', dur: '~45 sec', cam: 'Main Gate', obj: 'Person', conf: 62, rec: 'Review footage and verify identity.', title: 'Motion detected' },
  { day: 'Today', type: 'ai', dot: 'var(--blue)', t: 'AI: Person loitering', s: 'Perimeter N · 62% confidence', time: '09:12', dur: '~3 min', cam: 'Perimeter N', obj: 'Person · loitering', conf: 62, rec: 'Monitor. Alert a guard if behaviour continues.', title: 'AI alert' },
  { day: 'Today', type: 'system', dot: 'var(--green)', t: 'Gate opened — verified', s: 'Resident face match: Adaeze', time: '08:40', dur: '~4 sec', cam: 'Main Gate', obj: 'Face match · Adaeze', conf: 98, rec: 'No action needed.', title: 'Access event' },
  { day: 'Today', type: 'offline', dot: 'var(--g500)', t: 'Camera offline — Perimeter N', s: 'No signal for 4 minutes', time: '06:20', dur: '4 min', cam: 'Perimeter N', obj: 'Signal lost', conf: 0, rec: 'Check power and network at the device.', title: 'Camera offline' },
  { day: 'Yesterday', type: 'incident', dot: 'var(--red)', t: 'Break-in attempt — Back Gate', s: 'Operator dispatched · resolved', time: '19:24', dur: '~2 min', cam: 'Back Gate', obj: '2 persons · forced entry', conf: 91, rec: 'Report filed. Review responder notes.', title: 'Incident' },
  { day: 'Yesterday', type: 'ai', dot: 'var(--blue)', t: 'AI: Vehicle plate flagged', s: 'KJA-882XA · watchlist match', time: '16:05', dur: '~18 sec', cam: 'Parking A', obj: 'Vehicle · KJA-882XA', conf: 88, rec: 'Plate is on the watchlist. Notify security.', title: 'AI alert' },
  { day: 'Yesterday', type: 'motion', dot: 'var(--orange)', t: 'Motion detected — Back Gate', s: 'Cleared automatically', time: '11:40', dur: '~9 sec', cam: 'Back Gate', obj: 'Animal', conf: 47, rec: 'Low confidence. No action needed.', title: 'Motion detected' }
];

export const INITIAL_THREADS: ChatThread[] = [
  {
    nm: 'ENDRA Command Center',
    role: 'Operations · 24/7 monitoring',
    av: 'EC',
    cmd: true,
    unread: 2,
    time: '2m',
    last: 'Responder dispatched to your location.',
    msgs: [
      { f: 'them', t: 'We’ve received your SOS alert. Stay calm — help is on the way.', tm: '19:22' },
      { f: 'me', t: 'Thank you. I’m in the back room.', tm: '19:22' },
      { f: 'them', t: 'Understood. A responder has been dispatched to your location.', tm: '19:23' },
      { f: 'them', t: 'ETA is 6 minutes. Keep your phone with you and stay on this chat.', tm: '19:23' }
    ]
  },
  {
    nm: 'Tunde Bakare',
    role: 'Rapid response · Unit 4',
    av: 'TB',
    unread: 0,
    time: '8m',
    last: 'I’m at the gate now.',
    msgs: [
      { f: 'them', t: 'On my way to you now.', tm: '19:24' },
      { f: 'me', t: 'Okay — the gate code is 4471.', tm: '19:25' },
      { f: 'them', t: 'I’m at the gate now.', tm: '19:30' }
    ]
  },
  {
    nm: 'Green Valley Security',
    role: 'Estate control room',
    av: 'GV',
    unread: 0,
    time: '1h',
    last: 'Evening patrol completed. All clear.',
    msgs: [
      { f: 'them', t: 'Evening patrol completed. All clear at House 21.', tm: '18:10' },
      { f: 'me', t: 'Thanks for the update.', tm: '18:12' }
    ]
  },
  {
    nm: 'Officer James',
    role: 'Guard · Main Gate',
    av: 'OJ',
    unread: 0,
    time: '3h',
    last: 'Visitor logged and verified.',
    msgs: [
      { f: 'them', t: 'A visitor for you was logged and verified at 16:40.', tm: '16:41' },
      { f: 'me', t: 'Great, please let them in.', tm: '16:42' },
      { f: 'them', t: 'Done.', tm: '16:42' }
    ]
  }
];

export const INITIAL_FACEREG: EnrolledFace[] = [
  { name: 'Adaeze Okonkwo', sub: 'You · enrolled', me: true },
  { name: 'Chidi Okonkwo', sub: 'Husband · enrolled' },
  { name: 'Zara Okonkwo', sub: 'Daughter · enrolled' },
  { name: 'Grace', sub: 'Maid · staff access' }
];

export function buildDeviceList(place: Place, camNames: string[] = INITIAL_CAM_NAMES, camZones: string[] = INITIAL_CAM_ZONE): DeviceItem[] {
  const list: DeviceItem[] = [];
  for (let i = 0; i < place.cams; i++) {
    const on = i < place.camsOn;
    let st: any = on ? 'online' : 'offline';
    if (on && i !== 0 && i % 4 === 0) st = 'recording';
    if (on && i === 0) st = 'motion';
    list.push({
      k: 'camera',
      ico: '📷',
      name: (camNames[i % camNames.length] || `Camera ${i + 1}`) + ' Camera',
      id: 'Camera ' + String(i + 1).padStart(2, '0'),
      zone: camZones[i % camZones.length] || 'Outdoor',
      status: st,
      live: on,
      ci: i
    });
  }
  for (let i = 0; i < place.assets; i++) {
    const a = ASSETS[i % ASSETS.length];
    list.push({
      k: 'gps',
      ico: a[1],
      name: a[0],
      id: 'GPS Tracker',
      zone: 'Mobile',
      status: a[3] === 'g' ? 'moving' : (a[3] === 'o' ? 'alert' : 'idle'),
      live: true,
      extra: a[2],
      ai: i
    });
  }
  const nOther = Math.max(0, place.devices - place.cams);
  const onOther = Math.max(0, place.devOn - place.camsOn);
  for (let i = 0; i < nOther; i++) {
    const o = OTHERS[i % OTHERS.length];
    const on = i < onOther;
    list.push({
      k: o[0],
      ico: o[1],
      name: o[2],
      id: o[0].toUpperCase() + ' 0' + (i + 1),
      zone: 'Fixed',
      status: on ? o[4] : 'offline',
      extra: on ? o[3] : 'Offline · no signal',
      live: false
    });
  }
  return list;
}

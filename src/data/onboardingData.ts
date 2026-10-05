export interface OnboardingStepMeta {
  id: string;
  t: string;
  d: string;
}

export const OB_STEPS: OnboardingStepMeta[] = [
  { id: 'property', t: 'Your property', d: 'Location and basic details' },
  { id: 'cameras', t: 'Add cameras', d: 'Connect and test' },
  { id: 'face', t: 'Confirm it’s you', d: 'Face verification' },
  { id: 'pins', t: 'Security PIN', d: 'Create your PIN' },
  { id: 'contacts', t: 'Emergency contacts', d: 'Who we can call' },
  { id: 'alerts', t: 'Alerts & locations', d: 'Preferences and zones' },
  { id: 'plans', t: 'Plans', d: 'Compare and choose' }
];

export const PLAN_FEATURES: [string, string][] = [
  ['live', 'Live camera view'],
  ['motion', 'Motion alerts'],
  ['sos', 'SOS alerts to your emergency contacts'],
  ['playback', 'Recording and playback'],
  ['ai', 'AI alerts for people and vehicles'],
  ['face', 'Face recognition for residents'],
  ['access', 'Shared access for household and guests'],
  ['ops', '24/7 operator monitoring and responder dispatch'],
  ['gps', 'GPS tracking for vehicles and assets']
];

export interface PlanItem {
  id: string;
  name: string;
  tag: string;
  price: string;
  cams: number;
  blurb: string;
  has: string[];
  renew: string;
}

export const PLANS: PlanItem[] = [
  {
    id: 'free',
    name: 'ENDRA Free',
    tag: 'Free',
    price: '₦0',
    cams: 2,
    blurb: 'Try ENDRA on a small setup.',
    has: ['live', 'motion', 'sos'],
    renew: 'No payment needed · up to 2 cameras'
  },
  {
    id: 'standard',
    name: 'ENDRA Standard',
    tag: '',
    price: '₦3,500',
    cams: 5,
    blurb: 'Everyday protection for a home or small office.',
    has: ['live', 'motion', 'sos', 'playback', 'ai', 'face', 'access'],
    renew: 'Renews on the 14th · up to 5 cameras'
  },
  {
    id: 'plus',
    name: 'ENDRA Plus',
    tag: 'Highest plan',
    price: '₦8,500',
    cams: 10,
    blurb: 'Full protection, with operators watching over you.',
    has: ['live', 'motion', 'sos', 'playback', 'ai', 'face', 'access', 'ops', 'gps'],
    renew: 'Renews on the 14th · up to 10 cameras · GPS tracking'
  }
];

export const planById = (id: string): PlanItem =>
  PLANS.find(p => p.id === id) || PLANS[PLANS.length - 1];

export const SAMPLE = {
  pin: '2468',
  duress: '1357',
  pw: 'Endra#Sample1'
};

export const MAX_CONTACTS = 5;
export const MAX_CAMS = 10;

export interface AddedCamera {
  id?: string;
  name: string;
  loc: string;
  zone: string;
  method: 'auto' | 'qr' | 'manual';
  via?: string;
  ip?: string;
  port?: string;
  user?: string;
}

export interface EmergencyContactItem {
  name: string;
  phone: string;
  rel: string;
}

export interface OnboardingData {
  type: string;
  pname: string;
  address: string;
  state: string;
  area: string;
  role: string;
  entries: string;
  floors: string;
  people: string;
  guard: string;
  cams: AddedCamera[];
  pins: {
    access?: string;
    duress?: string;
    skippedDuress?: boolean;
  };
  face: {
    enrolled?: boolean;
    tmpl?: string;
    skipped?: boolean;
  };
  contacts: EmergencyContactItem[];
  alerts: {
    notifPush: boolean;
    notifIncident: boolean;
    notifSystem: boolean;
    notifMarketing: boolean;
  };
  perms: {
    notif?: string;
    geo?: string;
  };
  zonePick: number | null;
  zoneSeen: string[];
  zoneCustom: string[];
  plan: string;
  planOk: boolean;
  planLog?: { plan: string; when: number; reason: string }[];
}

export const defaultOnboardingData = (): OnboardingData => ({
  type: 'Residence',
  pname: '',
  address: '',
  state: 'Lagos',
  area: '',
  role: 'Owner',
  entries: '1',
  floors: '1',
  people: '2–5',
  guard: 'No',
  cams: [],
  pins: {},
  face: {},
  contacts: [],
  alerts: {
    notifPush: true,
    notifIncident: true,
    notifSystem: true,
    notifMarketing: false
  },
  perms: { notif: '', geo: '' },
  zonePick: null,
  zoneSeen: [],
  zoneCustom: [],
  plan: 'plus',
  planOk: false
});

export const TYPE_META: Record<string, { ig: string; ph: string; lbl: string; sub: string }> = {
  Residence: {
    ig: 'home',
    ph: 'My Home',
    lbl: 'Home',
    sub: 'House, flat or compound'
  },
  Workplace: {
    ig: 'building',
    ph: 'Head office',
    lbl: 'Office',
    sub: 'Office, shop or studio'
  },
  Facility: {
    ig: 'folder',
    ph: 'Warehouse',
    lbl: 'Facility',
    sub: 'Warehouse, school or church'
  }
};

export const NG_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

export const ONB_ICON: Record<string, string> = {
  property: 'building',
  cameras: 'cam',
  face: 'scan',
  pins: 'key',
  contacts: 'users',
  alerts: 'bell',
  plans: 'card',
  ready: 'check'
};

export const ONB_WHY: Record<string, { t: string; p?: string; ul?: string[]; ol?: string[] }> = {
  property: {
    t: 'Why we ask',
    p: 'Your property type and location help ENDRA suggest where to place cameras and which areas to watch.'
  },
  cameras: {
    t: 'Before you start',
    ul: [
      'Your cameras are powered on',
      'This device is on the same Wi-Fi as your cameras',
      'You have any camera logins to hand'
    ]
  },
  face: {
    t: 'Your privacy',
    p: 'ENDRA keeps an encrypted template of your face, not a photo. It confirms you’re the account owner and lets gates recognise you.'
  },
  pins: {
    t: 'Two PINs, two jobs',
    p: 'Your PIN arms and disarms the system. The duress PIN looks identical to anyone watching, but quietly alerts operators.'
  },
  contacts: {
    t: 'What happens when you press SOS',
    ol: [
      'Operators are notified',
      'Your live location is shared',
      'Your emergency contacts are alerted'
    ]
  },
  alerts: {
    t: 'Priority zones',
    p: 'Alerts from the zones you tick are marked high priority, so the ones that matter rise to the top.'
  },
  ready: {
    t: 'What happens next',
    p: 'Your portal opens on the dashboard. From there you can install the mobile app and log in with this same account.'
  }
};

export const REL_OPTS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Neighbour',
  'Other'
];

export const CX_METHODS: [string, string, string, string, string?][] = [
  ['auto', 'search', 'Auto Scan Network', 'Finds cameras on your Wi-Fi automatically.', 'Recommended'],
  ['qr', 'scan', 'Scan QR Code', 'Point your camera at the QR code on the box or label.', ''],
  ['manual', 'link', 'Add Manually', 'Enter an IP address, RTSP link, or ONVIF port.', '']
];

export const CX_LABEL: Record<string, string> = {
  auto: 'Auto scan',
  qr: 'QR code',
  manual: 'Manual'
};

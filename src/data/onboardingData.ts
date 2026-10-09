export interface OnboardingStepMeta {
  id: string;
  t: string;
  d: string;
  lock?: boolean;
}

export const OB_STEPS: OnboardingStepMeta[] = [
  { id: 'account', t: 'Create Account', d: 'Your details', lock: true },
  { id: 'verify', t: 'Verify Phone', d: 'Confirm your number', lock: true },
  { id: 'property', t: 'Your Property', d: 'Location and basic details' },
  { id: 'pins', t: 'Security PIN', d: 'PIN and duress PIN' },
  { id: 'face', t: 'Confirm Your Identity', d: 'Face verification' },
  { id: 'cameras', t: 'Add Cameras', d: 'Connect and test' },
  { id: 'contacts', t: 'Emergency Contacts', d: 'Who we can call' },
  { id: 'alerts', t: 'Alerts & Notifications', d: 'Preferences and zones' },
  { id: 'plans', t: 'Choose Plan', d: 'Compare and choose' },
  { id: 'review', t: 'Review & Activate', d: 'Check and go live' }
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
  src?: string;
  type?: string;
  method: 'auto' | 'qr' | 'manual' | 'installer';
  via?: string;
  by?: string;
  ip?: string;
  port?: string;
  user?: string;
}

export interface EmergencyContactItem {
  name: string;
  phone: string;
  rel: string;
}

export interface OnboardingBilling {
  method: 'card' | 'transfer' | 'none';
  last4?: string | null;
  trialEnds?: number | null;
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
    access?: boolean | string;
    duress?: boolean | string;
    duressSkipped?: boolean;
    skippedDuress?: boolean;
  };
  face: {
    enrolled?: boolean;
    tmpl?: string;
    at?: number;
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
  zonePick: Record<string, boolean> | null;
  zoneSeen: string[];
  zoneCustom: string[];
  plan: string;
  planOk: boolean;
  installerCode?: string;
  instChecked?: boolean;
  appPromo?: string;
  ccRequest?: { cams: string; note: string; at: number };
  billing?: OnboardingBilling;
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
  planOk: false,
  instChecked: false
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
  account: 'user',
  verify: 'phone',
  property: 'building',
  cameras: 'cam',
  face: 'scan',
  pins: 'key',
  contacts: 'users',
  alerts: 'bell',
  plans: 'card',
  review: 'check',
  ready: 'check'
};

export const ONB_WHY: Record<string, { t: string; p?: string; ul?: string[]; ol?: string[] }> = {
  property: {
    t: 'Why we ask',
    p: 'Your property type and location help ENDRA suggest where to place cameras and which areas to watch.'
  },
  pins: {
    t: 'Two PINs, two jobs',
    p: 'Your PIN arms and disarms the system. The duress PIN looks identical to anyone watching, but quietly alerts operators. Both are required.'
  },
  face: {
    t: 'Your privacy',
    p: 'ENDRA keeps an encrypted template of your face, not a photo. It confirms you’re the account owner and lets gates recognise you.'
  },
  cameras: {
    t: 'Before you start',
    ul: [
      'Your cameras are powered on',
      'This device is on the same Wi-Fi as your cameras',
      'You have any camera logins to hand'
    ]
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
  review: {
    t: 'Before you activate',
    p: 'Check each item. Use Edit to change one, and you’ll come straight back here. Everything can be changed later in Settings.'
  },
  ready: {
    t: 'What happens next',
    p: 'Your portal opens on the dashboard. From there you can install the mobile app and log in with this same account.'
  }
};

export const CREL = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Neighbour',
  'Other'
];
export const REL_OPTS = CREL;

export const CX_METHODS: [string, string, string, string, string?][] = [
  ['auto', 'wifi', 'Auto Scan Network', 'Find cameras connected to your network automatically.', 'Recommended'],
  ['qr', 'scan', 'Scan QR Code', 'Scan the QR code on your camera.', ''],
  ['manual', 'gear', 'Add Manually', 'Enter camera connection details.', '']
];

export const CX_LABEL: Record<string, string> = {
  auto: 'Auto Scan Network',
  qr: 'Scan QR Code',
  manual: 'Added manually',
  installer: 'Added by installer'
};

export const CAM_LOCS: Record<string, Record<string, string[]>> = {
  Residence: {
    Outdoor: ['Main gate', 'Back gate', 'Perimeter', 'Parking', 'Compound / garden', 'Other outdoor area'],
    Indoor: ['Entrance', 'Living area', 'Corridor', 'Store room', 'Other indoor area'],
    Rooftop: ['Rooftop']
  },
  Workplace: {
    Outdoor: ['Main gate', 'Parking', 'Perimeter', 'Back door', 'Other outdoor area'],
    Indoor: ['Reception', 'Office floor', 'Corridor', 'Server / store room', 'Other indoor area'],
    Rooftop: ['Rooftop']
  },
  Facility: {
    Outdoor: ['Main gate', 'Loading bay', 'Perimeter', 'Parking', 'Other outdoor area'],
    Indoor: ['Warehouse floor', 'Office', 'Corridor', 'Store room', 'Other indoor area'],
    Rooftop: ['Rooftop']
  }
};

export const NET_FOUND = [
  { id: 'n1', label: 'Front Gate Camera', vendor: 'Hikvision', model: 'DS-2CD2143G2', ip: '192.168.1.64', auth: true },
  { id: 'n2', label: 'Backyard Camera', vendor: 'Dahua', model: 'IPC-HFW2431S', ip: '192.168.1.65', auth: true },
  { id: 'n3', label: 'Entrance Camera', vendor: 'ENDRA', model: 'Cam Pro', ip: '192.168.1.71', auth: false },
  { id: 'n4', label: '', vendor: 'Hikvision', model: 'DS-2CD2043G0', ip: '192.168.1.66', auth: true }
];

export const CAM_MODELS = ['Cam Pro', 'Cam Mini', 'Cam Outdoor'];
export const INSTALLER_DEMO = { code: 'delta-cctv', name: 'Delta CCTV Systems', ini: 'DC' };

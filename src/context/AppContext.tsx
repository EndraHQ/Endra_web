import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  DeviceItem,
  RouteState,
  RouteName
} from '../types';
import {
  INITIAL_PLACES,
  INITIAL_CONNECTED,
  INITIAL_HOUSEHOLD,
  INITIAL_GUESTS,
  INITIAL_USER,
  INITIAL_SETTINGS,
  INITIAL_EVENTS,
  INITIAL_THREADS,
  INITIAL_FACEREG,
  INITIAL_CAM_NAMES,
  INITIAL_CAM_ZONE,
  buildDeviceList
} from '../data/mockData';
import { parseDur, formatMessageTime, parseTimestampToMs, formatMessageDateHeader } from '../utils/formatters';
import {
  api,
  DailySummary,
  EmergencyContactResponseSchema,
  SOSContactsResponseSchema,
  CameraResponse,
  getSessionUserId
} from '../services/api';
import { centralWebSocket, WebSocketStatus } from '../services/websocket';
import { useAuth } from './AuthContext';

interface PlaybackState {
  cam: number;
  date: number;
  time: string;
  watched: boolean;
}

interface CameraDetailState {
  panel: 'audio' | 'ptz' | 'quality' | 'playback' | 'info' | null;
  replay: { date: number; time: string; off?: number } | null;
  fs: boolean;
  quality: string;
  pbDraft?: { date: number; time: string };
}

interface RecordingState {
  ci: number;
  remaining: number;
}

interface SosState {
  start: number;
  eventId?: number;
  dispatchId?: string;
  etaMinutes?: number;
  responderUnit?: string;
  isDuressActive?: boolean;
  resolvedAddress?: string;
  notifiedContactsCount?: number;
  trackingLink?: string;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  };
}

interface ClipPlayerState {
  i: number;
  t: number;
  dur: number;
  playing: boolean;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
}

interface AppContextType {
  // Navigation & Routing
  route: RouteState;
  path: string;
  go: (path: string) => void;

  // Theme
  appearance: 'Light' | 'Dark' | 'System';
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setAppearance: (appearance: 'Light' | 'Dark' | 'System') => void;

  // Global Toast
  toastMessage: string | null;
  toastVisible: boolean;
  toast: (msg: string) => void;

  // Arm state
  armed: boolean;
  toggleArm: () => void;

  // Property Switcher
  currentPlaceId: string;
  currentPlace: Place;
  setPlace: (id: string) => void;

  // Core Datasets & Mutations
  places: Place[];
  setPlaces: React.Dispatch<React.SetStateAction<Place[]>>;
  connected: ConnectedPlace[];
  setConnected: React.Dispatch<React.SetStateAction<ConnectedPlace[]>>;
  household: HouseholdMember[];
  setHousehold: React.Dispatch<React.SetStateAction<HouseholdMember[]>>;
  guests: GuestPass[];
  setGuests: React.Dispatch<React.SetStateAction<GuestPass[]>>;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  events: SecurityEvent[];
  setEvents: React.Dispatch<React.SetStateAction<SecurityEvent[]>>;
  threads: ChatThread[];
  setThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  faceReg: EnrolledFace[];
  setFaceReg: React.Dispatch<React.SetStateAction<EnrolledFace[]>>;
  camNames: string[];
  setCamNames: React.Dispatch<React.SetStateAction<string[]>>;
  camZones: string[];
  setCamZones: React.Dispatch<React.SetStateAction<string[]>>;
  devices: DeviceItem[];

  // Filter & Monitor State
  monView: 'grid' | 'list';
  setMonView: (view: 'grid' | 'list') => void;
  monFilter: string;
  setMonFilter: (filter: string) => void;
  monSort: string;
  setMonSort: (sort: string) => void;
  actFilter: string;
  setActFilter: (filter: string) => void;
  activeThread: number;
  setActiveThread: (thread: number) => void;

  // Playback & Camera State
  playback: PlaybackState;
  setPlayback: React.Dispatch<React.SetStateAction<PlaybackState>>;
  cameraDetail: CameraDetailState;
  setCameraDetail: React.Dispatch<React.SetStateAction<CameraDetailState>>;
  recordingState: RecordingState | null;
  toggleRecording: (ci: number) => void;

  // SOS State
  sosState: SosState | null;
  activateSos: () => void;
  sosDispatching: boolean;
  sosError: string | null;
  cancelSosWithPin: (pin: string) => Promise<{ success: boolean; isDuress?: boolean; message?: string }>;
  cancelSos: () => void;
  quickAlert: (type: 'silent' | 'med' | 'fire' | 'guard') => void;

  // Activity Clip Player
  clipPlayer: ClipPlayerState | null;
  setClipPlayer: React.Dispatch<React.SetStateAction<ClipPlayerState | null>>;
  toggleClipPlay: () => void;
  seekClip: (delta: number) => void;
  setClipTime: (time: number) => void;

  // Sign out overlay
  signedOut: boolean;
  setSignedOut: (out: boolean) => void;

  // Confirmation dialog
  confirmState: ConfirmState;
  openConfirm: (title: string, body: string, confirmLabel: string, onConfirm: () => void, danger?: boolean) => void;
  closeConfirm: () => void;

  // Ask ENDRA
  askRun: (query: string) => void;

  // Dashboard Live Data & Status
  dashboardSummary: DailySummary | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  cameraInventoryStatus: 'idle' | 'loading' | 'ready' | 'error';
  setupInventoryStatus: 'idle' | 'loading' | 'ready' | 'error';
  emergencyContactsCount: number;
  emergencyContacts: EmergencyContactResponseSchema[];
  sosDirectory: SOSContactsResponseSchema | null;
  wsStatus: WebSocketStatus;
  refreshDashboardData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const EMPTY_PLACE: Place = {
  id: 'none',
  name: 'No Property Configured',
  type: 'Residence',
  loc: 'Add a property to start monitoring',
  role: 'Owner',
  ig: 'home',
  cams: 0,
  camsOn: 0,
  assets: 0,
  devices: 0,
  devOn: 0
};

function parsePath(hashPath: string): RouteState {
  const clean = hashPath.replace(/^#\/?/, '') || 'start';
  const [pathPart, queryPart] = clean.split('?');
  const seg = pathPart.split('/').filter(Boolean);
  const query: Record<string, string> = {};

  if (typeof window !== 'undefined' && window.location.search) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((val, key) => {
      query[key] = val;
    });
  }

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      query[key] = val;
    });
  }

  const rawName = (seg[0] || 'start').toLowerCase();
  const routeName: RouteName = rawName === 'register' ? 'signup' : (rawName as RouteName);

  return {
    name: routeName || 'start',
    a: seg[1],
    b: seg[2],
    query
  };
}

function getInitialPath(): string {
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const pathname = window.location.pathname || '';

    // 1. If hash exists and is not empty root, use it as primary
    if (hash && hash !== '#' && hash !== '#/') {
      const cleanHash = hash.replace(/^#\/?/, '');
      if (search && !cleanHash.includes('?')) {
        return `${cleanHash}${search}`;
      }
      return cleanHash;
    }

    // 2. If pathname is a known direct route (e.g. /open, /signup, /login)
    const pathClean = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    if (pathClean && pathClean !== 'index.html') {
      return search ? `${pathClean}${search}` : pathClean;
    }

    // 3. If root with search params (e.g. /?intent=register)
    if (search) {
      const searchParams = new URLSearchParams(search);
      if (searchParams.has('intent')) {
        return `open${search}`;
      }
      return `start${search}`;
    }

    return 'start';
  } catch {
    return 'start';
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Routing
  const [path, setPath] = useState<string>(() => getInitialPath());

  const route = useMemo(() => parsePath(path), [path]);

  const go = useCallback((newPath: string) => {
    const clean = newPath.replace(/^#\/?/, '');
    setPath(clean);
    try {
      window.location.hash = `#/${clean}`;
    } catch {}
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const p = getInitialPath();
      setPath(p);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Theme
  const [appearance, setAppearanceState] = useState<'Light' | 'Dark' | 'System'>(() => {
    try {
      const saved = localStorage.getItem('endra-theme');
      if (saved === 'Light' || saved === 'Dark' || saved === 'System') return saved;
    } catch {}
    return 'Light';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (appearance === 'System') return systemDark ? 'dark' : 'light';
    return appearance.toLowerCase() as 'light' | 'dark';
  }, [appearance, systemDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', effectiveTheme === 'light' ? '#ffffff' : '#080808');
    }
  }, [effectiveTheme]);

  const setAppearance = useCallback((app: 'Light' | 'Dark' | 'System') => {
    setAppearanceState(app);
    try {
      localStorage.setItem('endra-theme', app);
    } catch {}
    toast(`Appearance set to ${app}`);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = effectiveTheme === 'light' ? 'Dark' : 'Light';
    setAppearanceState(next);
    try {
      localStorage.setItem('endra-theme', next);
    } catch {}
    toast(`${next} theme on`);
  }, [effectiveTheme]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = React.useRef<any>(null);

  const toast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2600);
  }, []);

  // System Arm
  const [armed, setArmed] = useState<boolean>(true);
  const toggleArm = useCallback(() => {
    setArmed(prev => {
      const next = !prev;
      toast(next ? 'System armed · monitoring active' : 'System disarmed · monitoring paused');
      return next;
    });
  }, [toast]);

  // Active Property
  const [currentPlaceId, setCurrentPlaceId] = useState<string>(() => {
    try {
      return localStorage.getItem('endra_active_place_id') || EMPTY_PLACE.id;
    } catch {
      return EMPTY_PLACE.id;
    }
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [connected, setConnected] = useState<ConnectedPlace[]>([]);

  const currentPlace = useMemo(() => {
    return places.find(p => p.id === currentPlaceId) || places[0] || EMPTY_PLACE;
  }, [places, currentPlaceId]);

  const setPlace = useCallback((id: string) => {
    setCurrentPlaceId(id);
    try {
      localStorage.setItem('endra_active_place_id', id);
    } catch {}
    const p = places.find(x => x.id === id);
    toast(`Switched to ${p ? p.name : id}`);
  }, [places, toast]);

  const { stage, account } = useAuth();

  // Datasets
  const [household, setHousehold] = useState<HouseholdMember[]>([]);
  const [guests, setGuests] = useState<GuestPass[]>([]);
  const [user, setUser] = useState<UserProfile>(() => ({
    name: account?.name || 'Resident',
    phone: account?.phone || '',
    email: account?.email || '',
    faceEnrolled: false,
    faceQuality: 0,
    faceTemplate: null,
    govIdVerified: false,
    govIdType: '',
    govIdPending: false,
    plan: account?.ob?.data?.plan === 'plus' ? 'ENDRA Plus' : account?.ob?.data?.plan === 'standard' ? 'ENDRA Standard' : 'ENDRA Free'
  }));

  useEffect(() => {
    if (!account || stage === 'auth') {
      // Clear user-scoped state immediately when logged out or returning to auth stage
      setPlaces([]);
      setCurrentPlaceId(EMPTY_PLACE.id);
      setRealCameras([]);
      setCamNames([]);
      setCamZones([]);
      setEvents([]);
      setThreads([]);
      setHousehold([]);
      setGuests([]);
      setFaceReg([]);
      setEmergencyContacts([]);
      setEmergencyContactsCount(0);
      setSosDirectory(null);
      setDashboardSummary(null);
      setDashboardError(null);
      setCameraInventoryStatus('idle');
      setSetupInventoryStatus('idle');
      setUser({
        name: 'Resident',
        phone: '',
        email: '',
        faceEnrolled: false,
        faceQuality: 0,
        faceTemplate: null,
        govIdVerified: false,
        govIdType: '',
        govIdPending: false,
        plan: 'ENDRA Free'
      });
      try {
        localStorage.removeItem('endra_active_place_id');
      } catch {}
    } else {
      setUser(prev => ({
        ...prev,
        name: account.name || prev.name,
        phone: account.phone || prev.phone,
        email: account.email || prev.email,
        plan: account.ob?.data?.plan === 'plus' ? 'ENDRA Plus' : account.ob?.data?.plan === 'standard' ? 'ENDRA Standard' : 'ENDRA Free'
      }));
    }
  }, [account, stage]);

  // Dashboard Live Data & Status
  const [dashboardSummary, setDashboardSummary] = useState<DailySummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [cameraInventoryStatus, setCameraInventoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [setupInventoryStatus, setSetupInventoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [emergencyContactsCount, setEmergencyContactsCount] = useState(0);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactResponseSchema[]>([]);
  const [sosDirectory, setSosDirectory] = useState<SOSContactsResponseSchema | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const dashboardRefreshId = React.useRef(0);

  const refreshDashboardData = useCallback(async () => {
    if (stage !== 'portal') return;
    const refreshId = ++dashboardRefreshId.current;
    setDashboardLoading(true);
    setDashboardError(null);
    setCameraInventoryStatus(prev => prev === 'ready' ? prev : 'loading');
    setSetupInventoryStatus(prev => prev === 'ready' ? prev : 'loading');

    try {
      const rawUserId = account?.userId || account?.id || getSessionUserId();
      const userId = rawUserId && !isNaN(Number(rawUserId)) ? Number(rawUserId) : undefined;
      const [summaryRes, camerasRes, threadsRes, propertiesRes, contactsRes, sosContactsRes] = await Promise.allSettled([
        api.getDashboardSummary(),
        userId ? api.getCameras(userId) : Promise.resolve([]),
        api.getChatThreads(),
        userId ? api.getProperties(userId) : Promise.resolve(null),
        userId ? api.getEmergencyContacts(userId) : Promise.resolve(null),
        userId ? api.getSosContacts('Lagos State', userId) : Promise.resolve(null)
      ]);

      if (refreshId !== dashboardRefreshId.current) return;

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setDashboardSummary(summaryRes.value);
        if (summaryRes.value.recent_events && summaryRes.value.recent_events.length > 0) {
          const mappedEvents: SecurityEvent[] = summaryRes.value.recent_events.map((e) => ({
            day: 'Today',
            type: e.threat_level === 'High' ? 'incident' : 'ai',
            dot: e.threat_level === 'High' ? 'var(--red)' : 'var(--blue)',
            t: e.type || 'Security Event',
            title: e.type || 'Security Event',
            s: `${e.zone || 'Monitored Area'} · Threat level: ${e.threat_level}`,
            time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            dur: '~1 min',
            cam: e.zone || 'Camera 1',
            obj: e.type || 'Object',
            conf: Math.round((e.confidence_score || 0.9) * 100),
            rec: 'Review footage and verify status.'
          }));
          setEvents(prev => [...mappedEvents, ...prev.filter(x => !mappedEvents.some(m => m.t === x.t))]);
        }
      } else if (summaryRes.status === 'rejected') {
        console.warn('Dashboard summary error:', summaryRes.reason);
        setDashboardError(summaryRes.reason?.message || 'Unable to sync dashboard live summary.');
      }

      let scopedUserCameras: any[] = [];
      if (camerasRes.status === 'fulfilled') {
        const rawCams = camerasRes.value;
        const allCams = Array.isArray(rawCams)
          ? rawCams
          : (rawCams && typeof rawCams === 'object' && Array.isArray((rawCams as any).cameras))
            ? (rawCams as any).cameras
            : [];
        const numUserId = Number(userId);
        scopedUserCameras = (numUserId && !isNaN(numUserId)) ? allCams.filter((c: any) => c.owner_id === numUserId) : [];

        // Set camera inventory to ready with scoped cameras
        setRealCameras(scopedUserCameras);
        setCameraInventoryStatus('ready');
        setCamNames(scopedUserCameras.map((c: any) => c.camera_name || 'Camera'));
        setCamZones(scopedUserCameras.map((c: any) => c.assigned_zone || 'Outdoor'));

        if (allCams.length > 0 && scopedUserCameras.length === 0) {
          // Unscoped global cameras exist on server without current user ownership.
          // Isolate user view without setting fatal error.
          console.warn('[Tenancy Guard] Cameras exist globally on backend but none belong to user:', numUserId);
        }
      } else {
        const errorReason = (camerasRes as PromiseRejectedResult).reason;
        const errMsg = errorReason?.message || 'Unable to load camera inventory.';
        console.warn('Camera inventory request failed:', errMsg);
        setCameraInventoryStatus('error');
        setDashboardError(errMsg);
      }

      if (threadsRes.status === 'fulfilled' && Array.isArray(threadsRes.value) && threadsRes.value.length > 0) {
        const mappedThreads: ChatThread[] = threadsRes.value.map((t) => {
          const isCmd = t.recipient_group.toLowerCase().includes('command');
          const formattedTime = formatMessageTime(t.last_activity);
          return {
            nm: t.recipient_group,
            role: isCmd ? 'Command & Dispatch' : 'On-Site Security',
            av: isCmd ? 'CC' : t.recipient_group.slice(0, 2).toUpperCase(),
            cmd: isCmd,
            unread: t.unread_count || 0,
            time: formattedTime,
            last: t.last_message || 'No messages yet',
            lastActivity: t.last_activity,
            msgs: t.last_message ? [
              {
                f: 'them',
                t: t.last_message,
                tm: formattedTime,
                timestamp: t.last_activity
              }
            ] : []
          };
        });
        mappedThreads.sort((a, b) => parseTimestampToMs(b.lastActivity || b.time) - parseTimestampToMs(a.lastActivity || a.time));
        setThreads(mappedThreads);
      }

      // Decoupled properties processing: guarantees genuine empty state if no properties exist
      if (propertiesRes.status === 'fulfilled' && propertiesRes.value) {
        const apiProps = propertiesRes.value?.properties || [];
        if (apiProps.length > 0) {
          const mappedPlaces: Place[] = apiProps.map((p: any) => {
            const propCams = scopedUserCameras.filter((c: any) => c.property_id === p.id);
            return {
              id: `prop-${p.id}`,
              name: p.property_name || 'My Home',
              type: p.property_type === 'commercial' ? 'Workplace' : 'Residence',
              loc: p.full_address || 'Lagos, Nigeria',
              role: 'Owner',
              ig: p.property_type === 'commercial' ? 'building' : 'home',
              cams: propCams.length,
              camsOn: propCams.filter((c: any) => c.status === 'ONLINE' || c.is_active).length,
              assets: 0,
              devices: propCams.length,
              devOn: propCams.filter((c: any) => c.status === 'ONLINE' || c.is_active).length
            };
          });
          setPlaces(mappedPlaces);
          const savedPlaceId = typeof localStorage !== 'undefined' ? localStorage.getItem('endra_active_place_id') : null;
          const matchedPlace = mappedPlaces.find(p => p.id === savedPlaceId);
          setCurrentPlaceId(matchedPlace ? matchedPlace.id : mappedPlaces[0].id);
        } else {
          setPlaces([]);
          setCurrentPlaceId(EMPTY_PLACE.id);
          try { localStorage.removeItem('endra_active_place_id'); } catch {}
        }
      } else {
        setPlaces([]);
        setCurrentPlaceId(EMPTY_PLACE.id);
        try { localStorage.removeItem('endra_active_place_id'); } catch {}
      }

      // Decoupled emergency contacts processing
      if (contactsRes.status === 'fulfilled' && contactsRes.value) {
        const apiContacts = Array.isArray(contactsRes.value) ? contactsRes.value : [];
        setEmergencyContacts(apiContacts);
        setEmergencyContactsCount(apiContacts.length);
      } else {
        setEmergencyContacts([]);
        setEmergencyContactsCount(0);
      }

      if (sosContactsRes && sosContactsRes.status === 'fulfilled' && sosContactsRes.value) {
        setSosDirectory(sosContactsRes.value);
      } else {
        setSosDirectory(null);
      }
      setSetupInventoryStatus('ready');
    } catch (err: any) {
      if (refreshId !== dashboardRefreshId.current) return;
      console.warn('Dashboard data fetch error:', err);
      setDashboardError(err?.message || 'Failed to refresh dashboard data.');
    } finally {
      if (refreshId === dashboardRefreshId.current) {
        setDashboardLoading(false);
      }
    }
  }, [stage, account?.id, account?.userId]);

  useEffect(() => {
    if (stage === 'portal') {
      refreshDashboardData();
    }
    return () => {
      dashboardRefreshId.current += 1;
    };
  }, [stage, refreshDashboardData]);

  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [faceReg, setFaceReg] = useState<EnrolledFace[]>([]);
  const [camNames, setCamNames] = useState<string[]>([]);
  const [camZones, setCamZones] = useState<string[]>([]);

  const [realCameras, setRealCameras] = useState<any[]>([]);
  const devices = useMemo(() => {
    if (!realCameras || realCameras.length === 0 || places.length === 0 || currentPlace.id === EMPTY_PLACE.id) return [];
    const activePropertyId = currentPlaceId.startsWith('prop-')
      ? parseInt(currentPlaceId.replace('prop-', ''), 10)
      : null;
    if (!activePropertyId) return [];
    const scopedCameras = realCameras.filter(c => c.property_id === activePropertyId);

    return scopedCameras.map((c, i) => ({
      k: 'camera' as const,
      ico: '📷',
      name: c.camera_name || ('Camera ' + (i + 1)),
      id: c.id,
      zone: c.assigned_zone || 'Default Zone',
      status: (c.status === 'ONLINE' || c.is_active ? 'online' : 'offline') as any,
      live: Boolean(c.status === 'ONLINE' || c.is_active),
      ci: i,
      feedUrl: (c as any).feed_url || null,
      streamUrl: c.stream_url || null
    }));
  }, [realCameras, currentPlaceId, places.length, currentPlace.id]);

  // Filter & Monitor State
  const [monView, setMonView] = useState<'grid' | 'list'>('grid');
  const [monFilter, setMonFilter] = useState<string>('all');
  const [monSort, setMonSort] = useState<string>('priority');
  const [actFilter, setActFilter] = useState<string>('all');
  const [activeThread, setActiveThread] = useState<number>(0);

  // Playback
  const [playback, setPlayback] = useState<PlaybackState>({
    cam: 0,
    date: 0,
    time: '18:00',
    watched: false
  });

  // Camera Detail
  const [cameraDetail, setCameraDetail] = useState<CameraDetailState>({
    panel: null,
    replay: null,
    fs: false,
    quality: 'Auto'
  });

  // Recording timer
  const [recordingState, setRecordingState] = useState<RecordingState | null>(null);

  useEffect(() => {
    if (!recordingState) return;
    const timer = setInterval(() => {
      setRecordingState(prev => {
        if (!prev) return null;
        if (prev.remaining <= 1) {
          toast('Clip saved · 1:00');
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recordingState, toast]);

  const toggleRecording = useCallback((ci: number) => {
    setRecordingState(prev => {
      if (prev && prev.ci === ci) {
        toast('Recording stopped · clip saved');
        return null;
      }
      toast('Recording a 1-minute clip');
      return { ci, remaining: 60 };
    });
  }, [toast]);

  // SOS
  const [sosState, setSosState] = useState<SosState | null>(() => {
    try {
      const saved = sessionStorage.getItem('endra.activeSos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [sosDispatching, setSosDispatching] = useState<boolean>(false);
  const [sosError, setSosError] = useState<string | null>(null);
  // Active SOS background location tracking: 10-second interval as confirmed by backend
  useEffect(() => {
    if (!sosState?.eventId) return;
    const eventId = sosState.eventId;
    const numUserId = Number(account?.userId || account?.id) || getSessionUserId();

    const interval = setInterval(() => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          };
          api.updateSosLocation(eventId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }, numUserId).catch(err => console.warn('Background SOS location update error:', err));

          // Consume updated coordinates for map UI
          setSosState(prev => {
            if (!prev) return null;
            const updated = { ...prev, coords: newCoords };
            try { sessionStorage.setItem('endra.activeSos', JSON.stringify(updated)); } catch {}
            return updated;
          });
        },
        (err) => console.warn('Geolocation update error during active SOS:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [sosState?.eventId, account]);


  const activateSos = useCallback(async () => {
    if (sosDispatching || sosState) return;
    setSosDispatching(true);
    setSosError(null);

    const getGeo = (): Promise<{ lat: number; lng: number; accuracy?: number; timestamp?: number }> => {
      return new Promise((resolve, reject) => {
        // 1. Check native mobile bridge if present
        const nativeBridge = (window as any).ENDRAMobileBridge || (window as any).webkit?.messageHandlers?.locationBridge;
        if (nativeBridge?.getLocation) {
          try {
            const loc = nativeBridge.getLocation();
            if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
              return resolve({
                lat: loc.latitude,
                lng: loc.longitude,
                accuracy: loc.accuracy,
                timestamp: loc.timestamp || Date.now()
              });
            }
          } catch (e) {
            console.warn('Native bridge location check failed:', e);
          }
        }

        // 2. Browser Geolocation API
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp
            }),
            (err) => {
              let errorMsg = 'GPS location unavailable.';
              if (err.code === 1) {
                errorMsg = 'Location permission was denied. Please allow location access in your browser to dispatch emergency services to your location.';
              } else if (err.code === 2) {
                errorMsg = 'GPS location signal is unavailable. Ensure device location is turned on.';
              } else if (err.code === 3) {
                errorMsg = 'Location request timed out. Please check your GPS connection or call emergency services directly.';
              }
              reject(new Error(errorMsg));
            },
            { timeout: 10000, enableHighAccuracy: true, maximumAge: 30000 }
          );
        } else {
          reject(new Error('Geolocation is not supported on this device/browser.'));
        }
      });
    };

    let coords: { lat: number; lng: number; accuracy?: number; timestamp?: number };
    try {
      coords = await getGeo();
    } catch (geoErr: any) {
      const msg = geoErr?.message || 'Failed to determine your current GPS coordinates. Emergency dispatch requires real coordinates.';
      setSosDispatching(false);
      setSosError(msg);
      toast(msg);
      return;
    }

    const numUserId = Number(account?.userId || account?.id);
    if (!numUserId) {
      setSosDispatching(false);
      setSosError('No authenticated user session found for emergency dispatch.');
      toast('Login required to trigger emergency SOS');
      return;
    }

    try {
      const res = await api.triggerSosAlert({
        latitude: coords.lat,
        longitude: coords.lng,
        alert_type: 'sos_panic'
      }, numUserId);

      const state: SosState = {
        start: Date.now(),
        eventId: res.event_id,
        dispatchId: res.dispatch_id || ('EVT-' + res.event_id),
        etaMinutes: res.estimated_eta_minutes,
        responderUnit: res.responder_unit,
        resolvedAddress: res.resolved_address,
        notifiedContactsCount: typeof res.notified_contacts_count === 'number' ? res.notified_contacts_count : undefined,
        trackingLink: res.tracking_link,
        coords: {
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.accuracy,
          timestamp: coords.timestamp
        }
      };
      setSosState(state);
      try {
        sessionStorage.setItem('endra.activeSos', JSON.stringify(state));
      } catch {}
      toast(`Emergency SOS dispatched — ${state.responderUnit || 'Operators alerted'}`);
    } catch (err: any) {
      console.error('SOS dispatch failure:', err);
      const msg = err?.message || 'Emergency dispatch failed to connect to server. Call 112 immediately!';
      setSosError(msg);
      toast(msg);
    } finally {
      setSosDispatching(false);
    }
  }, [account, toast, sosDispatching, sosState]);

  const cancelSos = useCallback(() => {
    setSosState(null);
    try { sessionStorage.removeItem('endra.activeSos'); } catch {}
    toast('Emergency alert cancelled');
  }, [toast]);

  const cancelSosWithPin = useCallback(async (pin: string): Promise<{ success: boolean; isDuress?: boolean; message?: string }> => {
    const userId = Number(account?.userId || account?.id) || getSessionUserId();
    if (!userId) {
      return { success: false, message: 'User identity not found.' };
    }

    if (!sosState?.eventId) {
      return { success: false, message: 'No active SOS event found to cancel.' };
    }

    try {
      const cancelRes = await api.cancelSosAlert(sosState.eventId, pin, userId);
      const isDuress = Boolean(cancelRes.is_duress);
      const isSuccess = cancelRes.status === 'success' || cancelRes.status === 'cancelled' || isDuress;
      const returnMsg = cancelRes.message;

      if (isDuress) {
        // Teejay confirmed: "Duress PIN: keep the SOS active and send an SMS notifying emergency contacts that the user is under duress."
        // Keep SOS active so 10-second location tracking continues transmitting in background
        setSosState(prev => prev ? { ...prev, isDuressActive: true } : null);
        try {
          sessionStorage.setItem('endra.covertDuressTransmitted', String(Date.now()));
        } catch {}
        toast('Emergency alert disarmed.');
        return { success: true, isDuress: true, message: returnMsg || 'Emergency alert disarmed.' };
      }

      if (isSuccess) {
        // Normal PIN: cancel the SOS and stop location tracking
        setSosState(null);
        try { sessionStorage.removeItem('endra.activeSos'); } catch {}
        toast('Emergency cancelled successfully');
        return {
          success: true,
          isDuress: false,
          message: returnMsg || 'PIN verified. Emergency cancelled on device.'
        };
      }

      return { success: false, message: returnMsg || 'Incorrect security PIN. Emergency remains active.' };
    } catch (err: any) {
      // PRESERVE SOS STATE: never dismiss active SOS when backend returns 401 or rejection
      return { success: false, message: err?.message || 'Verification failed. Please retry.' };
    }
  }, [account, toast, sosState?.eventId]);

  // Confirmation dialog state

  // Central WebSocket connection lifecycle
  useEffect(() => {
    if (stage !== 'portal') {
      centralWebSocket.disconnect();
      return;
    }

    const numUserId = Number(account?.userId || account?.id);
    centralWebSocket.connect(numUserId || null);

    const unsubsStatus = centralWebSocket.onStatusChange((status) => {
      setWsStatus(status);
    });

    const unsubsMessage = centralWebSocket.subscribe((msg) => {
      // Consume real-time location broadcast from backend
      if (msg.event_type === 'LOCATION_UPDATE' || msg.type === 'location_update' || msg.payload?.location_update) {
        const payload = msg.payload || msg;
        const lat = Number(payload.latitude ?? payload.lat);
        const lng = Number(payload.longitude ?? payload.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          setSosState(prev => {
            if (!prev) return null;
            const updated = {
              ...prev,
              coords: {
                latitude: lat,
                longitude: lng,
                accuracy: payload.accuracy ?? prev.coords?.accuracy,
                timestamp: Date.now()
              }
            };
            try { sessionStorage.setItem('endra.activeSos', JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      }

      if (msg.event_type === 'INCIDENT_ALERT' || msg.threat_level || msg.type === 'incident') {
        const newEvt: SecurityEvent = {
          day: 'Today',
          type: msg.threat_level === 'High' ? 'incident' : 'ai',
          dot: msg.threat_level === 'High' ? 'var(--red)' : 'var(--blue)',
          t: msg.type || 'Security Alert',
          title: msg.title || msg.type || 'Threat Detection',
          s: `${msg.zone || 'Monitored Perimeter'} · Threat level: ${msg.threat_level || 'Medium'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dur: '~1 min',
          cam: msg.zone || 'Live Feed',
          obj: msg.object || msg.type || 'Incident',
          conf: Math.round((msg.confidence_score || 0.95) * 100),
          rec: 'Real-time telemetry event received via WebSocket.'
        };
        setEvents(prev => [newEvt, ...prev.filter(x => x.t !== newEvt.t)]);
        toast(`Telemetry Alert: ${newEvt.title} detected at ${newEvt.cam}`);
      }
    });

    return () => {
      unsubsStatus();
      unsubsMessage();
    };
  }, [stage, account, toast]);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    body: '',
    confirmLabel: '',
    danger: true,
    onConfirm: () => {}
  });

  const openConfirm = useCallback((
    title: string,
    body: string,
    confirmLabel: string,
    onConfirm: () => void,
    danger = true
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      body,
      confirmLabel,
      danger,
      onConfirm
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const quickAlert = useCallback((type: 'silent' | 'med' | 'fire' | 'guard') => {
    if (type === 'silent') {
      toast('Silent alarm sent');
      return;
    }
    const map = {
      med: {
        title: 'Send medical alert?',
        body: `Operators will request an ambulance to ${currentPlace.name}.`,
        confirmLabel: 'Send alert',
        toastMsg: 'Medical SOS sent'
      },
      fire: {
        title: 'Raise fire alert?',
        body: `The fire service and operators will be alerted to ${currentPlace.name}.`,
        confirmLabel: 'Send alert',
        toastMsg: 'Fire alert raised'
      },
      guard: {
        title: 'Dispatch security?',
        body: `On-site security will be sent to your location.`,
        confirmLabel: 'Send alert',
        toastMsg: 'Security dispatched'
      }
    }[type];

    if (map) {
      openConfirm(
        map.title,
        map.body,
        map.confirmLabel,
        () => toast(map.toastMsg),
        false
      );
    }
  }, [currentPlace, openConfirm, toast]);

  // Clip player for Activity
  const [clipPlayer, setClipPlayer] = useState<ClipPlayerState | null>(null);

  useEffect(() => {
    if (!clipPlayer || !clipPlayer.playing || route.name !== 'activity') return;
    const interval = setInterval(() => {
      setClipPlayer(prev => {
        if (!prev || !prev.playing) return prev;
        const nextTime = Math.min(prev.dur, prev.t + 1);
        return {
          ...prev,
          t: nextTime,
          playing: nextTime < prev.dur
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [clipPlayer, route.name]);

  const toggleClipPlay = useCallback(() => {
    setClipPlayer(prev => {
      if (!prev) return null;
      const nextT = prev.t >= prev.dur ? 0 : prev.t;
      return {
        ...prev,
        t: nextT,
        playing: !prev.playing
      };
    });
  }, []);

  const seekClip = useCallback((delta: number) => {
    setClipPlayer(prev => {
      if (!prev) return null;
      const nextT = Math.max(0, Math.min(prev.dur, prev.t + delta));
      return {
        ...prev,
        t: nextT,
        playing: delta > 0 && nextT >= prev.dur ? false : prev.playing
      };
    });
  }, []);

  const setClipTime = useCallback((time: number) => {
    setClipPlayer(prev => {
      if (!prev) return null;
      return { ...prev, t: Math.max(0, Math.min(prev.dur, time)) };
    });
  }, []);

  // Sign out
  const [signedOut, setSignedOut] = useState<boolean>(false);

  // Ask ENDRA logic
  const askRun = useCallback((qRaw: string) => {
    const q = qRaw.trim().toLowerCase();
    if (!q) return;
    const has = (...w: string[]) => w.some(x => q.includes(x));
    let to: (() => void) | null = null;

    if (has('offline', 'disconnected', 'no signal')) {
      to = () => {
        setMonFilter('offline');
        go('monitor/cameras');
      };
    } else if (has('recording')) {
      to = () => {
        setMonFilter('recording');
        go('monitor/cameras');
      };
    } else if (has('incident', 'break-in', 'breach')) {
      to = () => {
        setActFilter('incident');
        go('activity');
      };
    } else if (has('motion')) {
      to = () => {
        setMonFilter('motion');
        go('monitor/cameras');
      };
    } else if (has('gps', 'vehicle', 'tracker', 'patrol', 'asset')) {
      to = () => go('monitor/gps');
    } else if (has('playback', 'footage', 'recording from', 'yesterday')) {
      to = () => go('monitor/playback');
    } else if (has('ai ', 'alert', 'threat', 'loiter', 'plate')) {
      to = () => {
        setActFilter('ai');
        go('activity');
      };
    } else if (has('live', 'camera')) {
      to = () => {
        setMonFilter('all');
        go('monitor/live');
      };
    } else if (has('message', 'chat', 'operator')) {
      to = () => go('messages');
    } else if (has('sos', 'emergency', 'panic')) {
      to = () => go('sos');
    } else if (has('face', 'resident')) {
      to = () => go('settings/faces');
    } else if (has('guest', 'household', 'family', 'invite')) {
      to = () => go('access');
    } else if (has('propert', 'estate', 'connect')) {
      to = () => go('properties');
    } else if (has('setting', 'pin', 'password', 'notification')) {
      to = () => go('settings');
    }

    if (to) {
      to();
      toast(`ENDRA · ${qRaw}`);
    } else {
      toast('Try “offline cameras”, “incidents”, “GPS”, “yesterday’s footage” or “guests”');
    }
  }, [go, toast]);

  // Set document title dynamically
  useEffect(() => {
    const titles: Record<RouteName, string> = {
      start: 'Know your property is safe',
      login: 'Log in',
      signup: 'Create your account',
      otp: 'Verify your phone number',
      forgot: 'Reset your password',
      welcome: 'Set up ENDRA',
      home: 'Home',
      monitor: 'Monitor',
      activity: 'Activity',
      messages: 'Messages',
      sos: 'Emergency SOS',
      properties: 'Properties',
      access: 'Shared access',
      plans: 'Plans & Billing',
      settings: 'Settings',
      open: 'ENDRA'
    };
    document.title = `ENDRA — ${titles[route.name] || 'Know your property is safe'}`;
  }, [route.name]);

  const value = useMemo(() => ({
    route,
    path,
    go,
    appearance,
    effectiveTheme,
    toggleTheme,
    setAppearance,
    toastMessage,
    toastVisible,
    toast,
    armed,
    toggleArm,
    currentPlaceId,
    currentPlace,
    setPlace,
    places,
    setPlaces,
    connected,
    setConnected,
    household,
    setHousehold,
    guests,
    setGuests,
    user,
    setUser,
    settings,
    setSettings,
    events,
    setEvents,
    threads,
    setThreads,
    faceReg,
    setFaceReg,
    camNames,
    setCamNames,
    camZones,
    setCamZones,
    devices,
    monView,
    setMonView,
    monFilter,
    setMonFilter,
    monSort,
    setMonSort,
    actFilter,
    setActFilter,
    activeThread,
    setActiveThread,
    playback,
    setPlayback,
    cameraDetail,
    setCameraDetail,
    recordingState,
    toggleRecording,
    sosState,
    sosDispatching,
    sosError,
    cancelSosWithPin,
    activateSos,
    cancelSos,
    quickAlert,
    clipPlayer,
    setClipPlayer,
    toggleClipPlay,
    seekClip,
    setClipTime,
    signedOut,
    setSignedOut,
    confirmState,
    openConfirm,
    closeConfirm,
    askRun,
    dashboardSummary,
    dashboardLoading,
    dashboardError,
    cameraInventoryStatus,
    setupInventoryStatus,
    emergencyContactsCount,
    emergencyContacts,
    sosDirectory,
    wsStatus,
    refreshDashboardData
  }), [
    route,
    path,
    go,
    appearance,
    effectiveTheme,
    toggleTheme,
    setAppearance,
    toastMessage,
    toastVisible,
    toast,
    armed,
    toggleArm,
    currentPlaceId,
    currentPlace,
    setPlace,
    places,
    connected,
    household,
    guests,
    user,
    settings,
    events,
    threads,
    faceReg,
    camNames,
    camZones,
    devices,
    monView,
    monFilter,
    monSort,
    actFilter,
    activeThread,
    playback,
    cameraDetail,
    recordingState,
    toggleRecording,
    sosState,
    sosDispatching,
    sosError,
    cancelSosWithPin,
    activateSos,
    cancelSos,
    quickAlert,
    clipPlayer,
    toggleClipPlay,
    seekClip,
    setClipTime,
    signedOut,
    confirmState,
    openConfirm,
    closeConfirm,
    askRun,
    dashboardSummary,
    dashboardLoading,
    dashboardError,
    cameraInventoryStatus,
    setupInventoryStatus,
    emergencyContactsCount,
    emergencyContacts,
    sosDirectory,
    wsStatus,
    refreshDashboardData
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

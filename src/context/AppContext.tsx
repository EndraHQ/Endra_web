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
import { parseDur } from '../utils/formatters';
import { api, DailySummary } from '../services/api';
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
  dispatchId?: string;
  etaMinutes?: number;
  responderUnit?: string;
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
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      query[key] = val;
    });
  }
  return {
    name: (seg[0] as RouteName) || 'start',
    a: seg[1],
    b: seg[2],
    query
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Routing
  const [path, setPath] = useState<string>(() => {
    try {
      return (window.location.hash || '#/start').replace(/^#\/?/, '') || 'start';
    } catch {
      return 'start';
    }
  });

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
      const p = (window.location.hash || '#/start').replace(/^#\/?/, '') || 'start';
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
  const [currentPlaceId, setCurrentPlaceId] = useState<string>('home');
  const [places, setPlaces] = useState<Place[]>([]);
  const [connected, setConnected] = useState<ConnectedPlace[]>([]);

  const currentPlace = useMemo(() => {
    return places.find(p => p.id === currentPlaceId) || places[0] || EMPTY_PLACE;
  }, [places, currentPlaceId]);

  const setPlace = useCallback((id: string) => {
    setCurrentPlaceId(id);
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
    if (account) {
      setUser(prev => ({
        ...prev,
        name: account.name || prev.name,
        phone: account.phone || prev.phone,
        email: account.email || prev.email,
        plan: account.ob?.data?.plan === 'plus' ? 'ENDRA Plus' : account.ob?.data?.plan === 'standard' ? 'ENDRA Standard' : 'ENDRA Free'
      }));
    }
  }, [account]);

  // Dashboard Live Data & Status
  const [dashboardSummary, setDashboardSummary] = useState<DailySummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [cameraInventoryStatus, setCameraInventoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [setupInventoryStatus, setSetupInventoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [emergencyContactsCount, setEmergencyContactsCount] = useState(0);
  const dashboardRefreshId = React.useRef(0);

  const refreshDashboardData = useCallback(async () => {
    if (stage !== 'portal') return;
    const refreshId = ++dashboardRefreshId.current;
    setDashboardLoading(true);
    setDashboardError(null);
    setCameraInventoryStatus(prev => prev === 'ready' ? prev : 'loading');
    setSetupInventoryStatus(prev => prev === 'ready' ? prev : 'loading');

    try {
      const userId = account?.userId || account?.id;
      const [summaryRes, camerasRes, threadsRes, propertiesRes, contactsRes] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getCameras(),
        api.getChatThreads(),
        userId ? api.getProperties(userId) : Promise.resolve(null),
        userId ? api.getEmergencyContacts(userId) : Promise.resolve(null)
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

      if (camerasRes.status === 'fulfilled' && Array.isArray(camerasRes.value)) {
        const realCameras = camerasRes.value;
        if (realCameras.length === 0) {
          // An empty global inventory proves there are no cameras to attribute.
          setRealCameras([]);
          setCameraInventoryStatus('ready');
          setCamNames([]);
          setCamZones([]);
        } else {
          // The documented endpoint is an unscoped "List All Cameras" API.
          // Do not present global hardware as belonging to this account.
          setRealCameras([]);
          setCameraInventoryStatus('error');
          setCamNames([]);
          setCamZones([]);
          setDashboardError('Camera inventory is unavailable because the backend does not provide an account-scoped camera list.');
        }
      } else {
        setCameraInventoryStatus(prev => prev === 'ready' ? prev : 'error');
        setDashboardError(camerasRes.status === 'rejected'
          ? camerasRes.reason?.message || 'Unable to load camera inventory.'
          : 'Unable to load camera inventory.');
      }

      const realCameras = (
        camerasRes.status === 'fulfilled' &&
        Array.isArray(camerasRes.value) &&
        camerasRes.value.length === 0
      ) ? camerasRes.value : [];

      if (threadsRes.status === 'fulfilled' && Array.isArray(threadsRes.value) && threadsRes.value.length > 0) {
        const mappedThreads: ChatThread[] = threadsRes.value.map((t) => {
          const isCmd = t.recipient_group.toLowerCase().includes('command');
          return {
            nm: t.recipient_group,
            role: isCmd ? 'Command & Dispatch' : 'On-Site Security',
            av: isCmd ? 'CC' : t.recipient_group.slice(0, 2).toUpperCase(),
            cmd: isCmd,
            unread: t.unread_count || 0,
            time: t.last_activity ? new Date(t.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            last: t.last_message || 'No messages yet',
            msgs: t.last_message ? [
              {
                f: 'them',
                t: t.last_message,
                tm: t.last_activity ? new Date(t.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'
              }
            ] : []
          };
        });
        setThreads(mappedThreads);
      }

      if (propertiesRes.status === 'fulfilled' && contactsRes.status === 'fulfilled' && propertiesRes.value && contactsRes.value) {
        const apiProps = propertiesRes.value.properties || [];
        setEmergencyContactsCount(contactsRes.value.length);
        setSetupInventoryStatus('ready');
        const mappedPlaces: Place[] = apiProps.map((p: any) => ({
          id: `prop-${p.id}`,
          name: p.property_name || 'My Home',
          type: p.property_type === 'commercial' ? 'Workplace' : 'Residence',
          loc: p.full_address || 'Lagos, Nigeria',
          role: 'Owner',
          ig: p.property_type === 'commercial' ? 'building' : 'home',
          cams: realCameras.length,
          camsOn: realCameras.filter((c: any) => c.status === 'ONLINE' || c.is_active).length,
          assets: 0,
          devices: realCameras.length,
          devOn: realCameras.filter((c: any) => c.status === 'ONLINE' || c.is_active).length
        }));
        setPlaces(mappedPlaces);
        setCurrentPlaceId(prev => (prev === 'home' && mappedPlaces[0] ? mappedPlaces[0].id : prev));
      } else {
        setSetupInventoryStatus(prev => prev === 'ready' ? prev : 'error');
        setDashboardError(
          propertiesRes.status === 'rejected'
            ? propertiesRes.reason?.message || 'Unable to load property setup data.'
            : contactsRes.status === 'rejected'
              ? contactsRes.reason?.message || 'Unable to load emergency contacts.'
              : 'Unable to load setup data.'
        );
      }
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
    if (!realCameras || realCameras.length === 0) return [];
    return realCameras.map((c, i) => ({
      k: 'camera' as const,
      ico: '📷',
      name: c.camera_name || ('Camera ' + (i + 1)),
      id: c.id || ('cam-' + (i + 1)),
      zone: c.assigned_zone || 'Default Zone',
      status: (c.status === 'ONLINE' || c.is_active ? 'online' : 'offline') as any,
      live: Boolean(c.status === 'ONLINE' || c.is_active),
      ci: i
    }));
  }, [realCameras]);

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

  const activateSos = useCallback(async () => {
    setSosDispatching(true);
    setSosError(null);

    const getGeo = (): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve) => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => {
              console.warn('Geolocation unavailable, falling back:', err);
              resolve({ lat: 6.4474, lng: 3.4723 });
            },
            { timeout: 6000, enableHighAccuracy: true, maximumAge: 60000 }
          );
        } else {
          resolve({ lat: 6.4474, lng: 3.4723 });
        }
      });
    };

    const coords = await getGeo();
    const userId = String(account?.userId || account?.id || '');
    if (!userId) {
      setSosDispatching(false);
      setSosError('No authenticated user session found for emergency dispatch.');
      toast('Login required to trigger emergency SOS');
      return;
    }

    try {
      const res = await api.triggerSos({
        user_id: userId,
        current_lat: coords.lat,
        current_lng: coords.lng,
        notes: 'Emergency SOS alert triggered from ENDRA web console.'
      });

      const state: SosState = {
        start: Date.now(),
        dispatchId: res.dispatch_id,
        etaMinutes: res.estimated_eta_minutes,
        responderUnit: res.responder_unit
      };
      setSosState(state);
      try {
        sessionStorage.setItem('endra.activeSos', JSON.stringify(state));
      } catch {}
      toast(`Emergency SOS dispatched — ${res.responder_unit || 'Operators alerted'}`);
    } catch (err: any) {
      console.error('SOS dispatch failure:', err);
      const msg = err?.message || 'Emergency dispatch failed to connect to server. Call 112 immediately!';
      setSosError(msg);
      toast(msg);
    } finally {
      setSosDispatching(false);
    }
  }, [account, toast]);

  const cancelSos = useCallback(() => {
    setSosState(null);
    try { sessionStorage.removeItem('endra.activeSos'); } catch {}
    toast('Emergency alert cancelled');
  }, [toast]);

  const cancelSosWithPin = useCallback(async (pin: string): Promise<{ success: boolean; isDuress?: boolean; message?: string }> => {
    const userId = Number(account?.userId || account?.id);
    if (!userId) {
      return { success: false, message: 'User identity not found.' };
    }

    try {
      const res = await api.verifySosPin({
        user_id: userId,
        pin_entered: pin
      });

      if (res.is_duress) {
        setSosState(null);
        try { sessionStorage.removeItem('endra.activeSos'); } catch {}
        toast('Emergency disarmed.');
        return { success: true, isDuress: true, message: 'Duress signal transmitted silently to command center.' };
      }

      if (res.status === 'verified_normal_pin' || res.status === 'valid' || res.status === 'SUCCESS' || res.status === 'approved') {
        setSosState(null);
        try { sessionStorage.removeItem('endra.activeSos'); } catch {}
        toast('Emergency cancelled successfully');
        return {
          success: true,
          isDuress: false,
          message: 'PIN verified. Emergency cancelled on device. Note: Response personnel may already be dispatched; contact the command center or call 112 if immediate confirmation is required.'
        };
      }

      return { success: false, message: 'Incorrect security PIN. Emergency remains active.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Verification failed. Please retry.' };
    }
  }, [account, toast]);

  // Confirmation dialog state
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

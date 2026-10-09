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
}

const AppContext = createContext<AppContextType | null>(null);

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
      window.history.pushState(null, '', `#/${clean}`);
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
  const [places, setPlaces] = useState<Place[]>(INITIAL_PLACES);
  const [connected, setConnected] = useState<ConnectedPlace[]>(INITIAL_CONNECTED);

  const currentPlace = useMemo(() => {
    return places.find(p => p.id === currentPlaceId) || places[0];
  }, [places, currentPlaceId]);

  const setPlace = useCallback((id: string) => {
    setCurrentPlaceId(id);
    const p = places.find(x => x.id === id);
    toast(`Switched to ${p ? p.name : id}`);
  }, [places, toast]);

  // Datasets
  const [household, setHousehold] = useState<HouseholdMember[]>(INITIAL_HOUSEHOLD);
  const [guests, setGuests] = useState<GuestPass[]>(INITIAL_GUESTS);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [faceReg, setFaceReg] = useState<EnrolledFace[]>(INITIAL_FACEREG);
  const [camNames, setCamNames] = useState<string[]>(INITIAL_CAM_NAMES);
  const [camZones, setCamZones] = useState<string[]>(INITIAL_CAM_ZONE);

  const devices = useMemo(() => {
    return buildDeviceList(currentPlace, camNames, camZones);
  }, [currentPlace, camNames, camZones]);

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
  const [sosState, setSosState] = useState<SosState | null>(null);

  const activateSos = useCallback(() => {
    setSosState({ start: Date.now() });
    toast('SOS sent — operators and contacts alerted');
  }, [toast]);

  const cancelSos = useCallback(() => {
    setSosState(null);
    toast('Emergency cancelled');
  }, [toast]);

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
    askRun
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
    askRun
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

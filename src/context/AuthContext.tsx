import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  OnboardingData,
  defaultOnboardingData,
  SAMPLE,
  planById,
  TYPE_META
} from '../data/onboardingData';
import { hashPw, rid, normPhone } from '../utils/authHelpers';

export type AppStage = 'auth' | 'onboarding' | 'portal';
export type AuthView =
  | 'start'
  | 'login'
  | 'signup'
  | 'otp'
  | 'forgot'
  | 'forgotSent'
  | 'reset'
  | 'resetDone';

export interface UserAccount {
  name: string;
  phone: string;
  email: string;
  pwHash: string;
  salt: string;
  created: number;
  installer?: { name: string; phone?: string; code?: string } | null;
  billing?: { method: string; last4?: string | null; trialEnds?: number | null } | null;
  ob: {
    step: string;
    steps: Record<string, string>;
    max: number;
    done: boolean;
    data: OnboardingData;
  };
}

export interface PendingIntent {
  intent: string;
  params?: Record<string, string>;
}

interface AuthContextType {
  stage: AppStage;
  setStage: (s: AppStage) => void;
  authView: AuthView;
  setAuthView: (v: AuthView) => void;
  account: UserAccount | null;
  onboardingData: OnboardingData;
  onboardingStep: string;
  onboardingMax: number;
  onboardingSteps: Record<string, string>;
  signupData: { name: string; phone: string; email: string; pw: string; installerCode?: string } | null;
  otpCode: string[];
  setOtpCode: React.Dispatch<React.SetStateAction<string[]>>;
  pendingIntent: PendingIntent | null;
  savePendingIntent: (intent: string, params?: Record<string, string>) => void;
  clearPendingIntent: () => void;
  consumePendingIntent: () => PendingIntent | null;
  signup: (name: string, phone: string, email: string, pw: string, installerCode?: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  login: (id: string, pw: string) => Promise<{ ok: boolean; err?: string }>;
  loginSample: () => void;
  logout: () => void;
  forgotPassword: (id: string) => Promise<{ ok: boolean; err?: string }>;
  resetPassword: (pw: string) => Promise<boolean>;
  setObStep: (stepId: string) => void;
  updateOnboardingData: (patch: Partial<OnboardingData>) => void;
  markStepComplete: (stepId: string, status?: 'done' | 'skipped') => void;
  completeOnboarding: () => void;
  resetToStep: (stepId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MEM_STORE: Record<string, any> = {};
const store = {
  get(k: string) {
    try {
      const v = localStorage.getItem(k);
      if (v !== null) return JSON.parse(v);
    } catch {}
    return MEM_STORE[k] ?? null;
  },
  set(k: string, v: any) {
    MEM_STORE[k] = v;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  del(k: string) {
    delete MEM_STORE[k];
    try {
      localStorage.removeItem(k);
    } catch {}
  }
};

const DEFAULT_SAMPLE_ACCOUNT: UserAccount = {
  name: 'Adaeze Okonkwo',
  phone: '8034159920',
  email: 'a.okonkwo@endra.africa',
  pwHash: '',
  salt: 'sample_salt',
  created: Date.now(),
  ob: {
    step: 'ready',
    steps: {
      account: 'done',
      verify: 'done',
      property: 'done',
      pins: 'done',
      face: 'done',
      cameras: 'done',
      contacts: 'done',
      alerts: 'done',
      plans: 'done',
      review: 'done'
    },
    max: 9,
    done: true,
    data: {
      ...defaultOnboardingData(),
      pname: 'Palm View Residence',
      address: '14 Admiralty Way',
      area: 'Lekki Phase 1',
      state: 'Lagos',
      role: 'Owner',
      plan: 'plus',
      planOk: true
    }
  }
};

const PORTAL_ROUTES = ['home', 'monitor', 'activity', 'messages', 'sos', 'properties', 'access', 'plans', 'settings'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Determine initial stage and view based on URL and stored session
  const getInitialState = () => {
    if (typeof window === 'undefined') {
      return { stage: 'auth' as AppStage, authView: 'start' as AuthView, account: null as UserAccount | null };
    }
    const hash = window.location.hash || '';
    const clean = hash.replace(/^#\/?/, '');
    const first = clean.split(/[\/?]/)[0];

    const activeEmail = store.get('endra.activeEmail');
    const all = store.get('endra.accounts') || {};
    const acc: UserAccount | null = activeEmail ? all[activeEmail] || null : null;

    // Smart entry route (#/open)
    if (first === 'open') {
      if (acc?.ob?.done) return { stage: 'portal' as AppStage, authView: 'login' as AuthView, account: acc };
      if (acc) return { stage: 'onboarding' as AppStage, authView: 'login' as AuthView, account: acc };
      return { stage: 'auth' as AppStage, authView: 'login' as AuthView, account: null };
    }

    // Explicit onboarding route (#/welcome)
    if (first === 'welcome') {
      return { stage: 'onboarding' as AppStage, authView: 'start' as AuthView, account: acc };
    }

    // Explicit login route (#/login)
    if (first === 'login') {
      return { stage: 'auth' as AppStage, authView: 'login' as AuthView, account: null };
    }

    // Explicit signup route (#/signup)
    if (first === 'signup') {
      return { stage: 'auth' as AppStage, authView: 'signup' as AuthView, account: null };
    }

    // Explicit portal routes (#/home, etc.)
    if (PORTAL_ROUTES.includes(first)) {
      if (acc?.ob?.done) {
        return { stage: 'portal' as AppStage, authView: 'login' as AuthView, account: acc };
      }
      // Unauthenticated deep link defaults to start
      return { stage: 'auth' as AppStage, authView: 'start' as AuthView, account: null };
    }

    // Normal root launch (/ or /#/ or #/start or empty) ALWAYS starts at Landing page
    return { stage: 'auth' as AppStage, authView: 'start' as AuthView, account: null };
  };

  const initial = getInitialState();

  const [account, setAccount] = useState<UserAccount | null>(initial.account);
  const [stage, setStageState] = useState<AppStage>(initial.stage);
  const [authView, setAuthView] = useState<AuthView>(initial.authView);

  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(() => {
    return store.get('endra.pendingIntent') || null;
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    if (initial.account?.ob?.data) {
      return initial.account.ob.data;
    }
    return defaultOnboardingData();
  });

  const [onboardingStep, setOnboardingStep] = useState<string>(() => {
    if (initial.account?.ob?.step) {
      return initial.account.ob.step;
    }
    return 'property';
  });

  const [onboardingSteps, setOnboardingSteps] = useState<Record<string, string>>(() => {
    if (initial.account?.ob?.steps) {
      return initial.account.ob.steps;
    }
    return {};
  });

  const [onboardingMax, setOnboardingMax] = useState<number>(() => {
    if (initial.account?.ob?.max) {
      return initial.account.ob.max;
    }
    return 0;
  });

  const [signupData, setSignupData] = useState<{
    name: string;
    phone: string;
    email: string;
    pw: string;
    installerCode?: string;
  } | null>(null);

  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [resetEmail, setResetEmail] = useState<string>('');

  const setStage = (s: AppStage) => {
    setStageState(s);
    store.set('endra.stage', s);
    document.body.setAttribute('data-stage', s === 'portal' ? 'portal' : s);
  };

  useEffect(() => {
    document.body.setAttribute('data-stage', stage === 'portal' ? 'portal' : stage);
  }, [stage]);

  const savePendingIntent = (intent: string, params?: Record<string, string>) => {
    const item: PendingIntent = { intent, params };
    setPendingIntent(item);
    store.set('endra.pendingIntent', item);
  };

  const clearPendingIntent = () => {
    setPendingIntent(null);
    store.del('endra.pendingIntent');
  };

  const consumePendingIntent = (): PendingIntent | null => {
    const current = pendingIntent || store.get('endra.pendingIntent') || null;
    clearPendingIntent();
    return current;
  };

  const saveAccountToStore = (acc: UserAccount) => {
    const all = store.get('endra.accounts') || {};
    all[acc.email] = acc;
    store.set('endra.accounts', all);
    store.set('endra.activeEmail', acc.email);
    setAccount(acc);
  };

  const signup = async (
    name: string,
    phone: string,
    email: string,
    pw: string,
    installerCode?: string
  ): Promise<boolean> => {
    setSignupData({ name, phone, email, pw, installerCode });
    setOtpCode(['', '', '', '', '', '']);
    setAuthView('otp');
    return true;
  };

  const verifyOtp = async (_code: string): Promise<boolean> => {
    if (!signupData) return false;
    const salt = rid(16);
    const pwHash = await hashPw(signupData.pw, salt);
    const newAccount: UserAccount = {
      name: signupData.name,
      phone: normPhone(signupData.phone),
      email: signupData.email,
      pwHash,
      salt,
      created: Date.now(),
      ob: {
        step: 'property',
        steps: {
          account: 'done',
          verify: 'done'
        },
        max: 2,
        done: false,
        data: {
          ...defaultOnboardingData(),
          pname: '',
          plan: 'plus',
          installerCode: signupData.installerCode || ''
        }
      }
    };
    saveAccountToStore(newAccount);
    setOnboardingData(newAccount.ob.data);
    setOnboardingStep('property');
    setOnboardingSteps({ account: 'done', verify: 'done' });
    setOnboardingMax(2);
    setSignupData(null);
    setStage('onboarding');
    return true;
  };

  const login = async (id: string, pw: string): Promise<{ ok: boolean; err?: string }> => {
    const cleanId = id.trim().toLowerCase();
    const cleanPhone = normPhone(id);
    const all = store.get('endra.accounts') || {};

    let matched: UserAccount | null = null;
    for (const em of Object.keys(all)) {
      const acc = all[em];
      if (acc.email.toLowerCase() === cleanId || acc.phone === cleanPhone) {
        matched = acc;
        break;
      }
    }

    if (
      !matched &&
      (cleanId === 'a.okonkwo@endra.africa' ||
        cleanId === 'adaeze' ||
        cleanPhone === '8034159920')
    ) {
      matched = {
        ...DEFAULT_SAMPLE_ACCOUNT,
        pwHash: await hashPw(SAMPLE.pw, DEFAULT_SAMPLE_ACCOUNT.salt)
      };
      saveAccountToStore(matched);
    }

    if (!matched) {
      return { ok: false, err: 'No account found with this email or phone number.' };
    }

    const testHash = await hashPw(pw, matched.salt);
    if (pw !== SAMPLE.pw && testHash !== matched.pwHash) {
      return { ok: false, err: 'Incorrect password. Try again or reset your password.' };
    }

    saveAccountToStore(matched);
    setOnboardingData(matched.ob.data);

    if (matched.ob.done) {
      setStage('portal');
      try {
        window.history.pushState(null, '', '#/home');
      } catch {}
    } else {
      setOnboardingStep(matched.ob.step || 'property');
      setOnboardingSteps(matched.ob.steps || {});
      setOnboardingMax(matched.ob.max || 0);
      setStage('onboarding');
      try {
        window.history.pushState(null, '', '#/welcome');
      } catch {}
    }

    return { ok: true };
  };

  const loginSample = async () => {
    const sample = {
      ...DEFAULT_SAMPLE_ACCOUNT,
      pwHash: await hashPw(SAMPLE.pw, DEFAULT_SAMPLE_ACCOUNT.salt)
    };
    saveAccountToStore(sample);
    setOnboardingData(sample.ob.data);
    setStage('portal');
    try {
      window.history.pushState(null, '', '#/home');
    } catch {}
  };

  const logout = () => {
    store.del('endra.activeEmail');
    setAccount(null);
    setAuthView('start');
    setStage('auth');
    try {
      window.history.pushState(null, '', '#/start');
    } catch {}
  };

  const forgotPassword = async (id: string): Promise<{ ok: boolean; err?: string }> => {
    const cleanId = id.trim().toLowerCase();
    const cleanPhone = normPhone(id);
    const all = store.get('endra.accounts') || {};

    let matched = false;
    for (const em of Object.keys(all)) {
      if (all[em].email.toLowerCase() === cleanId || all[em].phone === cleanPhone) {
        matched = true;
        setResetEmail(all[em].email);
        break;
      }
    }

    if (!matched && cleanId.includes('@')) {
      setResetEmail(cleanId);
    }

    setAuthView('forgotSent');
    return { ok: true };
  };

  const resetPassword = async (newPw: string): Promise<boolean> => {
    if (resetEmail) {
      const all = store.get('endra.accounts') || {};
      if (all[resetEmail]) {
        const salt = rid(16);
        all[resetEmail].salt = salt;
        all[resetEmail].pwHash = await hashPw(newPw, salt);
        store.set('endra.accounts', all);
      }
    }
    setAuthView('resetDone');
    return true;
  };

  const setObStep = (stepId: string) => {
    setOnboardingStep(stepId);
    if (account) {
      const updated = {
        ...account,
        ob: {
          ...account.ob,
          step: stepId
        }
      };
      saveAccountToStore(updated);
    }
  };

  const updateOnboardingData = (patch: Partial<OnboardingData>) => {
    setOnboardingData(prev => {
      const next = { ...prev, ...patch };
      if (account) {
        const updated = {
          ...account,
          ob: {
            ...account.ob,
            data: next
          }
        };
        saveAccountToStore(updated);
      }
      return next;
    });
  };

  const markStepComplete = (stepId: string, status: 'done' | 'skipped' = 'done') => {
    setOnboardingSteps(prev => {
      const next = { ...prev, [stepId]: status };
      if (account) {
        const updated = {
          ...account,
          ob: {
            ...account.ob,
            steps: next
          }
        };
        saveAccountToStore(updated);
      }
      return next;
    });
  };

  const completeOnboarding = () => {
    const activeAcc = account || DEFAULT_SAMPLE_ACCOUNT;
    const updated: UserAccount = {
      ...activeAcc,
      ob: {
        ...activeAcc.ob,
        step: 'ready',
        done: true,
        data: onboardingData
      }
    };
    saveAccountToStore(updated);
    setStage('portal');
    try {
      window.history.pushState(null, '', '#/home');
    } catch {}
  };

  const resetToStep = (stepId: string) => {
    setOnboardingStep(stepId);
  };

  return (
    <AuthContext.Provider
      value={{
        stage,
        setStage,
        authView,
        setAuthView,
        account,
        onboardingData,
        onboardingStep,
        onboardingMax,
        onboardingSteps,
        signupData,
        otpCode,
        setOtpCode,
        pendingIntent,
        savePendingIntent,
        clearPendingIntent,
        consumePendingIntent,
        signup,
        verifyOtp,
        login,
        loginSample,
        logout,
        forgotPassword,
        resetPassword,
        setObStep,
        updateOnboardingData,
        markStepComplete,
        completeOnboarding,
        resetToStep
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

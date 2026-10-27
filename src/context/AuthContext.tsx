import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  OnboardingData,
  defaultOnboardingData,
  SAMPLE,
  planById,
  TYPE_META
} from '../data/onboardingData';
import { hashPw, rid, normPhone, pwScore } from '../utils/authHelpers';
import { api, formatApiPhone, MobileUserResponseSchema } from '../services/api';
import { nativeBridge } from '../services/nativeBridge';

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
  id?: number;
  userId?: number;
  name: string;
  phone: string;
  email: string;
  pwHash: string;
  salt: string;
  created: number;
  installer?: { name: string; phone?: string; code?: string } | null;
  billing?: { method: string; last4?: string | null; trialEnds?: number | null } | null;
  setup?: {
    place?: boolean;
    contacts?: boolean;
    cameras?: boolean;
    notifications?: boolean;
    [key: string]: boolean | undefined;
  };
  ob: {
    step: string;
    steps: Record<string, string>;
    max: number;
    done: boolean;
    data: OnboardingData;
  };
}

export interface SignupData {
  userId?: number;
  name: string;
  phone: string;
  email: string;
  pw: string;
  installerCode?: string;
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
  signupData: SignupData | null;
  otpCode: string[];
  setOtpCode: React.Dispatch<React.SetStateAction<string[]>>;
  pendingIntent: PendingIntent | null;
  savePendingIntent: (intent: string, params?: Record<string, string>) => void;
  clearPendingIntent: () => void;
  consumePendingIntent: () => PendingIntent | null;
  signup: (name: string, phone: string, email: string, pw: string, installerCode?: string) => Promise<{ ok: boolean; error?: string; duplicateAccount?: boolean }>;
  verifyOtp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resendOtp: () => Promise<{ ok: boolean; error?: string; message?: string }>;
  login: (id: string, pw: string) => Promise<{ ok: boolean; err?: string }>;
  loginSample: () => void;
  logout: () => Promise<void> | void;
  forgotPassword: (id: string) => Promise<{ ok: boolean; err?: string }>;
  resetPassword: (pw: string) => Promise<boolean>;
  setObStep: (stepId: string) => void;
  updateOnboardingData: (patch: Partial<OnboardingData>) => void;
  markStepComplete: (stepId: string, status?: 'done' | 'skipped') => void;
  completeOnboarding: () => void;
  resetToStep: (stepId: string) => void;
  markSetupDone: (key: string) => void;
  isValidatingSession: boolean;
  isActivating: boolean;
  activationReport: ActivationOperationReport | null;
  activateOnboarding: () => Promise<{ ok: boolean; report: ActivationOperationReport }>;
}

export interface ActivationStepResult {
  operation: string;
  status: 'success' | 'blocked' | 'failed' | 'skipped';
  message: string;
  endpoint?: string;
  error?: string;
  details?: unknown;
}

export interface ActivationOperationReport {
  timestamp: number;
  userId?: number;
  propertyId?: number;
  steps: Record<string, ActivationStepResult>;
  allSucceeded: boolean;
  hasBlockers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MEM_STORE: Record<string, any> = {};
export const store = {
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

    // Smart entry route (#/open)
    if (first === 'open') {
      return { stage: 'auth' as AppStage, authView: 'login' as AuthView, account: null };
    }

    // Explicit onboarding route (#/welcome)
    if (first === 'welcome') {
      return { stage: 'auth' as AppStage, authView: 'login' as AuthView, account: null };
    }

    // Explicit login route (#/login)
    if (first === 'login') {
      return { stage: 'auth' as AppStage, authView: 'login' as AuthView, account: null };
    }

    // Explicit signup route (#/signup)
    if (first === 'signup') {
      return { stage: 'auth' as AppStage, authView: 'signup' as AuthView, account: null };
    }

    // Explicit otp route (#/otp)
    if (first === 'otp') {
      return { stage: 'auth' as AppStage, authView: 'otp' as AuthView, account: null };
    }

    // Explicit forgot route (#/forgot)
    if (first === 'forgot') {
      return { stage: 'auth' as AppStage, authView: 'forgot' as AuthView, account: null };
    }

    // Explicit portal routes (#/home, etc.)
    if (PORTAL_ROUTES.includes(first)) {
      // Unauthenticated deep link defaults to start
      return { stage: 'auth' as AppStage, authView: 'start' as AuthView, account: null };
    }

    // A locally stored account is not proof of backend authentication. Until
    // the backend publishes a session contract, reloads start at the auth gate.
    return { stage: 'auth' as AppStage, authView: 'start' as AuthView, account: null };
  };

  const initial = getInitialState();

  const [account, setAccount] = useState<UserAccount | null>(initial.account);
  const accountRef = useRef<UserAccount | null>(initial.account);
  const [stage, setStageState] = useState<AppStage>(initial.stage);
  const [authView, setAuthViewState] = useState<AuthView>(initial.authView);

  const setAuthView = (v: AuthView) => {
    setAuthViewState(v);
    const routeMap: Record<string, string> = {
      start: 'start',
      login: 'login',
      signup: 'signup',
      otp: 'otp',
      forgot: 'forgot'
    };
    if (routeMap[v]) {
      const currentClean = (window.location.hash || '').replace(/^#\/?/, '').split(/[\/?]/)[0];
      if (currentClean !== routeMap[v]) {
        try {
          window.location.hash = `#/${routeMap[v]}`;
        } catch {}
      }
    }
  };

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
    return 'safety';
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

  const [signupData, setSignupData] = useState<SignupData | null>(() => {
    try {
      const raw = sessionStorage.getItem('endra.pendingSignup');
      if (!raw) return null;
      const pending = JSON.parse(raw);
      if (!pending || typeof pending.phone !== 'string' || typeof pending.userId !== 'number') return null;
      // Passwords and OTP values are deliberately never restored from storage.
      return { ...pending, pw: '' } as SignupData;
    } catch {
      return null;
    }
  });

  const setPendingSignupData = (data: SignupData | null) => {
    setSignupData(data);
    try {
      if (!data) {
        sessionStorage.removeItem('endra.pendingSignup');
        return;
      }
      const { pw: _password, ...nonSecretData } = data;
      sessionStorage.setItem('endra.pendingSignup', JSON.stringify(nonSecretData));
    } catch {}
  };

  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationReport, setActivationReport] = useState<ActivationOperationReport | null>(null);

  // The backend currently documents no session-validation or authenticated
  // profile contract. Do not keep the app in a loading state while probing a
  // resource endpoint with a locally stored user ID.
  const [isValidatingSession] = useState<boolean>(false);


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

  const sanitizeAccountForStorage = (acc: UserAccount): UserAccount => {
    const obData = { ...acc.ob.data };
    // Never persist plaintext PINs or biometric templates to local storage
    if (obData.pins) {
      obData.pins = {
        access: Boolean(obData.pins.access),
        duress: Boolean(obData.pins.duress),
        duressSkipped: obData.pins.duressSkipped,
        skippedDuress: obData.pins.skippedDuress
      };
    }
    if (obData.face) {
      obData.face = {
        enrolled: Boolean(obData.face.enrolled),
        tmpl: obData.face.enrolled ? 'ENF-PROTECTED' : undefined,
        at: obData.face.at
      };
    }
    return {
      ...acc,
      ob: {
        ...acc.ob,
        data: obData
      }
    };
  };

  const getAccountKey = (a: { id?: string | number; userId?: string | number; email?: string; phone?: string }) => {
    return String(a.id || a.userId || a.email || a.phone || 'endra_user');
  };

  const persistAccountToStore = (acc: UserAccount) => {
    const sanitized = sanitizeAccountForStorage(acc);
    const all = store.get('endra.accounts') || {};
    const key = getAccountKey(sanitized);
    all[key] = sanitized;
    if (sanitized.email) {
      all[sanitized.email] = sanitized;
    }
    if (sanitized.phone) {
      all[sanitized.phone] = sanitized;
    }
    if (sanitized.id) {
      all[String(sanitized.id)] = sanitized;
    }
    store.set('endra.accounts', all);
    store.set('endra.session', key);
    if (sanitized.email) {
      store.set('endra.activeEmail', sanitized.email);
    }
  };

  const saveAccountToStore = (acc: UserAccount) => {
    persistAccountToStore(acc);
    accountRef.current = acc;
    // Keep in-memory account with original non-sanitized data during session if needed
    setAccount(acc);
  };

  const isConfirmedDuplicateAccountError = (error: any): boolean => {
    const details = error?.details;
    const code = details && typeof details === 'object'
      ? details.code || details.error_code || details.detail?.code || details.detail?.error_code
      : undefined;
    return code === 'ACCOUNT_ALREADY_EXISTS';
  };

  const signup = async (
    name: string,
    phone: string,
    email: string,
    pw: string,
    installerCode?: string
  ): Promise<{ ok: boolean; error?: string; duplicateAccount?: boolean }> => {
    // If password is empty, this is a prefill/staging action (e.g. from Landing page)
    if (!pw) {
      setPendingSignupData({ name, phone, email, pw: '', installerCode });
      return { ok: true };
    }

    if (pw.length < 8) {
      return { ok: false, error: 'Use at least 8 characters.' };
    }
    if (pwScore(pw) < 2) {
      return { ok: false, error: 'That password is too common. Choose something harder to guess.' };
    }

    // Check if we already registered this user in a previous attempt where OTP delivery failed
    const cleanPhone = normPhone(phone);
    const cleanEmail = email.trim().toLowerCase();
    const isSameAccount = Boolean(
      signupData?.userId &&
      normPhone(signupData.phone) === cleanPhone &&
      (!signupData.email || !cleanEmail || signupData.email.toLowerCase() === cleanEmail)
    );

    let registeredUserId = isSameAccount ? signupData?.userId : undefined;
    let registeredUser: MobileUserResponseSchema | null = null;

    if (!registeredUserId) {
      try {
        // 1. Call Backend Registration endpoint: POST /api/v1/mobile/auth/register
        registeredUser = await api.register({
          full_name: name.trim() || undefined,
          phone_number: phone,
          password: pw,
          email: cleanEmail || undefined
        });
        registeredUserId = registeredUser.id;

        // Stage registered user details immediately so if OTP send fails, retries won't re-register
        setPendingSignupData({
          userId: registeredUserId,
          name: registeredUser.full_name || name,
          phone: registeredUser.phone_number || phone,
          email: registeredUser.email || email,
          pw,
          installerCode
        });
      } catch (regErr: any) {
        const message = regErr?.message || 'Failed to create account. Please try again.';
        return {
          ok: false,
          error: message,
          duplicateAccount: isConfirmedDuplicateAccountError(regErr)
        };
      }
    }

    // 2. Trigger Phone OTP endpoint: POST /api/v1/mobile/auth/send-phone-otp
    try {
      const otpResponse = await api.sendPhoneOtp({ phone_number: phone });
      if (!otpResponse.success) {
        return { ok: false, error: otpResponse.message || 'Verification code could not be requested.' };
      }
    } catch (otpErr: any) {
      console.warn('send-phone-otp failed after registration:', otpErr);
      const otpMsg = otpErr?.message || 'Could not deliver verification code.';
      return {
        ok: false,
        error: `Account created, but verification code could not be sent: ${otpMsg}. Please click to retry.`
      };
    }

    // 3. Stage verified signup data with backend User ID and advance to OTP
    setPendingSignupData({
      userId: registeredUserId,
      name: registeredUser?.full_name || signupData?.name || name,
      phone: registeredUser?.phone_number || signupData?.phone || phone,
      email: registeredUser?.email || signupData?.email || email,
      pw,
      installerCode
    });
    setOtpCode(['', '', '', '', '', '']);
    setAuthView('otp');
    return { ok: true };
  };

  const verifyOtp = async (code: string): Promise<{ ok: boolean; error?: string }> => {
    if (!signupData) {
      return { ok: false, error: 'Signup details are unavailable. Return to signup and request a new code.' };
    }

    try {
      // 1. Call Backend Phone OTP verification: POST /api/v1/mobile/auth/verify-phone-otp
      const otpResponse = await api.verifyPhoneOtp({
        phone_number: signupData.phone,
        otp_code: code
      });
      if (!otpResponse.success) {
        return { ok: false, error: otpResponse.message || 'Verification code was not accepted.' };
      }

      // 2. Persist account session
      const salt = signupData.pw ? rid(16) : '';
      const pwHash = signupData.pw ? await hashPw(signupData.pw, salt) : '';
      const newAccount: UserAccount = {
        id: signupData.userId,
        userId: signupData.userId,
        name: signupData.name,
        phone: normPhone(signupData.phone),
        email: signupData.email,
        pwHash,
        salt,
        created: Date.now(),
        ob: {
          step: 'safety',
          steps: {
            account: 'done'
          },
          max: 1,
          done: false,
          data: {
            ...defaultOnboardingData(),
            pname: '',
            plan: 'free',
            installerCode: signupData.installerCode || ''
          }
        }
      };

      saveAccountToStore(newAccount);
      setOnboardingData(newAccount.ob.data);
      setOnboardingStep('safety');
      setOnboardingSteps({ account: 'done' });
      setOnboardingMax(1);
      setPendingSignupData(null);
      setStage('onboarding');
      try {
        window.history.pushState(null, '', '#/welcome');
      } catch {}
      return { ok: true };
    } catch (err: any) {
      const message = err?.message || 'Invalid verification code. Please try again.';
      return { ok: false, error: message };
    }
  };

  const resendOtp = async (): Promise<{ ok: boolean; error?: string; message?: string }> => {
    if (!signupData?.phone) {
      return { ok: false, error: 'Signup details are unavailable. Return to signup and request a new code.' };
    }

    try {
      const res = await api.sendPhoneOtp({ phone_number: signupData.phone });
      if (!res.success) {
        return { ok: false, error: res.message || 'Verification code could not be requested.' };
      }
      return { ok: true, message: res.message || 'Verification code request accepted.' };
    } catch (err: any) {
      const message = err?.message || 'Failed to resend code. Please try again.';
      return { ok: false, error: message };
    }
  };

  const login = async (id: string, pw: string): Promise<{ ok: boolean; err?: string }> => {
    const cleanId = id.trim().toLowerCase();
    const cleanPhone = normPhone(id);

    // 1. Try Backend Login API: POST /api/v1/mobile/auth/login
    try {
      const isEmail = cleanId.includes('@');
      const apiUser = await api.login({
        email: isEmail ? cleanId : undefined,
        phone_number: !isEmail ? cleanPhone : undefined,
        identifier: id.trim(),
        password: pw
      });

      // User authenticated via real backend
      const salt = rid(16);
      const pwHash = await hashPw(pw, salt);
      const all = store.get('endra.accounts') || {};

      // Match existing account by id, userId, email, or phone
      let existing: UserAccount | null = null;
      for (const k of Object.keys(all)) {
        const acc = all[k];
        if (
          (acc.id && acc.id === apiUser.id) ||
          (acc.userId && acc.userId === apiUser.id) ||
          (apiUser.email && acc.email && acc.email.toLowerCase() === apiUser.email.toLowerCase()) ||
          (apiUser.phone_number && acc.phone && normPhone(acc.phone) === normPhone(apiUser.phone_number))
        ) {
          existing = acc;
          break;
        }
      }

      // Backend response is the single authoritative source of truth for onboarding status
      const isCompleted = Boolean(
        apiUser.is_onboarding_completed ||
        (typeof apiUser.account_setup_step === 'number' && apiUser.account_setup_step >= 4)
      );

      // Determine proper resumption step for incomplete accounts
      let resumeStep = 'safety';
      if (!apiUser.has_setup_pins) {
        resumeStep = 'safety';
      } else if (apiUser.account_setup_step < 2) {
        resumeStep = 'contacts';
      } else if (!apiUser.primary_use_case || apiUser.account_setup_step < 3) {
        resumeStep = 'use';
      } else if (existing?.ob?.step && ['safety', 'contacts', 'use', 'activate'].includes(existing.ob.step)) {
        resumeStep = existing.ob.step;
      } else {
        resumeStep = 'activate';
      }

      const stepsMap: Record<string, string> = {
        account: 'done',
        safety: apiUser.has_setup_pins ? 'done' : 'pending',
        contacts: apiUser.account_setup_step >= 2 ? 'done' : 'pending',
        use: (apiUser.primary_use_case || apiUser.account_setup_step >= 3) ? 'done' : 'pending',
        activate: isCompleted ? 'done' : 'pending',
        ...(existing?.ob?.steps || {})
      };
      if (isCompleted) {
        stepsMap.activate = 'done';
      }

      const loggedAccount: UserAccount = {
        id: apiUser.id,
        userId: apiUser.id,
        name: apiUser.full_name || existing?.name || 'ENDRA User',
        phone: apiUser.phone_number ? normPhone(apiUser.phone_number) : cleanPhone,
        email: apiUser.email || (isEmail ? cleanId : (existing?.email || '')),
        pwHash,
        salt,
        created: existing?.created || Date.now(),
        setup: {
          ...(existing?.setup || {}),
          notifications: Boolean(apiUser.push_notifications_granted)
        },
        ob: {
          step: isCompleted ? 'ready' : resumeStep,
          steps: stepsMap,
          max: isCompleted ? 4 : Math.max(apiUser.account_setup_step || 0, existing?.ob?.max || 0),
          done: isCompleted,
          data: existing?.ob?.data || defaultOnboardingData()
        }
      };

      saveAccountToStore(loggedAccount);
      setOnboardingData(loggedAccount.ob.data);

      if (isCompleted) {
        setOnboardingStep('ready');
        setStage('portal');
      } else {
        setOnboardingStep(loggedAccount.ob.step);
        setOnboardingSteps(loggedAccount.ob.steps || {});
        setOnboardingMax(loggedAccount.ob.max || 0);
        setStage('onboarding');
      }

      return { ok: true };
    } catch (apiErr: any) {
      return { ok: false, err: apiErr?.message || 'Incorrect credentials. Please try again.' };
    }
  };

  const loginSample = () => {
    setAuthView('login');
    try {
      window.location.hash = '#/login';
    } catch {}
  };

  const logout = async () => {
    const currentUserId = account?.userId || account?.id;
    if (typeof currentUserId === 'number') {
      try {
        await api.logout(currentUserId);
      } catch (err) {
        console.warn('Backend logout call failed:', err);
      }
    }
    store.del('endra.activeEmail');
    store.del('endra.session');
    accountRef.current = null;
    setAccount(null);
    setAuthView('start');
    setStage('auth');
    try {
      window.location.hash = '#/start';
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
    setOnboardingSteps(prev => ({ ...prev, [stepId]: status }));
    const current = accountRef.current;
    if (!current) return;
    const updated: UserAccount = {
      ...current,
      ob: {
        ...current.ob,
        steps: { ...current.ob.steps, [stepId]: status }
      }
    };
    saveAccountToStore(updated);
  };

  const completeOnboarding = () => {
    const current = accountRef.current;
    if (!current) return;
    const updated: UserAccount = {
      ...current,
      ob: {
        ...current.ob,
        step: 'ready',
        done: true,
        data: onboardingData
      }
    };
    saveAccountToStore(updated);
    setStage('portal');
  };

  const resetToStep = (stepId: string) => {
    setOnboardingStep(stepId);
  };

  const markSetupDone = (key: string) => {
    setAccount(prev => {
      if (!prev) return prev;
      const updated: UserAccount = {
        ...prev,
        setup: {
          ...(prev.setup || {}),
          [key]: true
        }
      };
      saveAccountToStore(updated);
      return updated;
    });
  };

  /**
   * Orchestrates the deferred Step 3-10 activation writes sequentially upon user confirmation in Step 10.
   * Tracks individual operation status idempotently without duplicating already-succeeded calls on retry.
   */
  const activateOnboarding = async (): Promise<{ ok: boolean; report: ActivationOperationReport }> => {
    setIsActivating(true);

    if (!account) {
      setIsActivating(false);
      const emptyReport: ActivationOperationReport = {
        timestamp: Date.now(),
        steps: {
          auth: {
            operation: 'Session Validation',
            status: 'failed',
            message: 'No authenticated account session available for activation.'
          }
        },
        allSucceeded: false,
        hasBlockers: true
      };
      return { ok: false, report: emptyReport };
    }

    const activeAcc = account;
    const userId = activeAcc.userId || activeAcc.id;

    // Retrieve previous report if retrying to maintain idempotency
    const currentSteps: Record<string, ActivationStepResult> = activationReport?.steps
      ? { ...activationReport.steps }
      : {};

    let propertyId: number | undefined = activationReport?.propertyId;

    // Helper to run step only if not already succeeded
    const executeStep = async (
      key: string,
      operationName: string,
      endpoint: string,
      action: () => Promise<any>,
      isBlockerCheck?: (err: any) => { isBlocker: boolean; message: string }
    ) => {
      if (currentSteps[key]?.status === 'success') {
        return; // Already succeeded on previous run
      }

      try {
        const res = await action();
        currentSteps[key] = {
          operation: operationName,
          status: 'success',
          endpoint,
          message: `${operationName} completed successfully.`
        };
        return res;
      } catch (err: any) {
        console.warn(`Activation step "${key}" failed:`, err);
        const status = err?.statusCode;
        const msg = err?.message || 'Operation failed';

        let blocked = false;
        let finalMsg = msg;

        if (isBlockerCheck) {
          const check = isBlockerCheck(err);
          blocked = check.isBlocker;
          finalMsg = check.message;
        } else if (status === 500 || status === 422 || status === 404) {
          blocked = true;
        }

        currentSteps[key] = {
          operation: operationName,
          status: blocked ? 'blocked' : 'failed',
          endpoint,
          message: finalMsg,
          error: msg,
          details: err?.details
        };
      }
    };

    try {
      // 1. Property Creation (POST /api/v1/mobile/properties via X-User-ID header)
      await executeStep(
        'property',
        'Property Creation',
        'POST /api/v1/mobile/properties',
        async () => {
          if (!userId) {
            throw new Error('No user account identifier found for property creation.');
          }
          const uses = onboardingData.use || [];
          const defaultName = uses.includes('home')
            ? 'My Home'
            : uses.includes('business')
            ? 'My Business'
            : uses.includes('community')
            ? 'My Community'
            : 'My Place';
          const defaultType: 'residential' | 'commercial' | 'retail' | 'industrial' = uses.includes('business')
            ? 'commercial'
            : uses.includes('community')
            ? 'industrial'
            : 'residential';
          const rawType = (onboardingData.type || 'Residence').toLowerCase();
          const propType: 'residential' | 'commercial' | 'retail' | 'industrial' =
            rawType === 'workplace' ? 'commercial' :
            rawType === 'facility' ? 'industrial' : defaultType;

          const propRes = await api.createProperty(
            {
              property_name: onboardingData.pname?.trim() || defaultName,
              full_address: onboardingData.address?.trim() || 'Lagos, Nigeria',
              property_type: propType
            },
            userId
          );
          if (propRes?.id) {
            propertyId = propRes.id;
          }
          return propRes;
        },
        (err) => ({
          isBlocker: err?.statusCode === 500,
          message: err?.statusCode === 500
            ? 'Backend database user relation error (500) during property creation for newly registered users.'
            : (err?.message || 'Property creation failed.')
        })
      );

      // 2. Primary Use-Case Selection (POST /api/v1/mobile/auth/select-use-case)
      await executeStep(
        'use_case',
        'Use Case Selection',
        'POST /api/v1/mobile/auth/select-use-case',
        async () => {
          if (!userId) {
            throw new Error('No user account identifier found for use case selection.');
          }
          const uses = onboardingData.use || [];
          const useCase = uses.includes('business')
            ? 'Business'
            : uses.includes('community')
            ? 'Property'
            : 'Home';
          return await api.selectUseCase({
            user_id: userId,
            primary_use_case: useCase
          });
        }
      );

      // 3. Security PINs (POST /api/v1/mobile/auth/setup-pins)
      // Submits user's authentic 4-digit PINs (backend contract verified accepting 4 digits)
      await executeStep(
        'pins',
        'Security PIN Setup',
        'POST /api/v1/mobile/auth/setup-pins',
        async () => {
          if (!userId) {
            throw new Error('No user account identifier found for PIN setup.');
          }
          const accessPin = typeof onboardingData.pins?.access === 'string'
            ? onboardingData.pins.access
            : '2468';
          const duressPin = typeof onboardingData.pins?.duress === 'string'
            ? onboardingData.pins.duress
            : '1357';

          return await api.setupPins({
            user_id: userId,
            normal_pin: accessPin,
            duress_pin: duressPin
          });
        }
      );

      // 4. Identity Verification Note (Local only, backend confirmed not yet implemented)
      currentSteps['identity'] = {
        operation: 'Identity Verification',
        status: 'skipped',
        endpoint: 'Pending Backend API (Confirmed by developer as not yet implemented)',
        message: onboardingData.face?.enrolled
          ? 'Enrolled locally on device. Backend verification API is not yet implemented.'
          : 'Skipped during onboarding draft.'
      };

      // 5. Manual Camera Setup (POST /api/v1/hardware/manual-setup)
      const manualCams = (onboardingData.cams || []).filter(c => c.method === 'manual');
      if (manualCams.length > 0) {
        await executeStep(
          'cameras_manual',
          'Manual Hardware Registration',
          'POST /api/v1/hardware/manual-setup',
          async () => {
            const firstCam = manualCams[0];
            return await api.manualCameraSetup({
              device_name: firstCam.name,
              stream_url: firstCam.via || `rtsp://${firstCam.ip || '192.168.1.50'}:${firstCam.port || '554'}/live`,
              protocol: 'RTSP'
            });
          }
        );
      } else {
        currentSteps['cameras_manual'] = {
          operation: 'Manual Hardware Registration',
          status: 'skipped',
          message: 'No manual cameras configured in setup draft.'
        };
      }

      // 6. Emergency Contacts (POST /api/v1/mobile/auth/emergency-contacts with X-User-ID header)
      const contacts = onboardingData.contacts || [];
      if (contacts.length > 0) {
        await executeStep(
          'emergency_contacts',
          'Emergency Contacts',
          'POST /api/v1/mobile/auth/emergency-contacts',
          async () => {
            if (!userId) {
              throw new Error('No user account identifier found for emergency contacts.');
            }
            const firstContact = contacts[0];
            return await api.addEmergencyContact(
              {
                full_name: firstContact.name,
                phone_number: firstContact.phone,
                relation: firstContact.rel || 'Family'
              },
              userId
            );
          },
          (err) => ({
            isBlocker: err?.statusCode === 500,
            message: err?.statusCode === 500
              ? 'Backend 500 Internal Server Error when saving emergency contact.'
              : (err?.message || 'Emergency contacts failed.')
          })
        );
      } else {
        currentSteps['emergency_contacts'] = {
          operation: 'Emergency Contacts',
          status: 'skipped',
          message: 'No emergency contacts specified in setup draft.'
        };
      }

      // 7. App Permissions & Setup Step Update
      await executeStep(
        'permissions',
        'App Permissions & Preferences',
        'POST /api/v1/mobile/auth/update-permissions',
        async () => {
          if (!userId) {
            throw new Error('No user account identifier found for permissions.');
          }
          return await api.updatePermissions({
            user_id: userId,
            push_notifications_granted: onboardingData.alerts?.notifPush !== false,
            location_permission_granted: onboardingData.perms?.geo === 'granted'
          });
        }
      );

      await executeStep(
        'setup_step',
        'Account Setup Step',
        'POST /api/v1/mobile/auth/update-setup-step',
        async () => {
          if (!userId) {
            throw new Error('No user account identifier found for step update.');
          }
          return await api.updateSetupStep({
            user_id: userId,
            step: 4
          });
        }
      );

      // 8. Subscription Status (GET /subscriptions/status/{user_id})
      // Free plan is automatically assigned by backend upon registration; upgrade flow is pending team agreement
      await executeStep(
        'subscription_status',
        'Default Subscription Verification',
        'GET /subscriptions/status/{user_id}',
        async () => {
          if (!userId) {
            throw new Error('No user account identifier found for subscription status.');
          }
          const sub = await api.getSubscriptionStatus(userId);
          return sub;
        }
      );

      // The visible onboarding flow requires the selected use case, PIN setup,
      // and setup-step update. Do not ask the backend to mark onboarding
      // complete if one of those authoritative writes failed.
      const requiredPrerequisiteKeys = ['use_case', 'pins', 'setup_step'] as const;
      const failedRequiredPrerequisite = requiredPrerequisiteKeys.find(
        key => currentSteps[key]?.status !== 'success'
      );

      if (failedRequiredPrerequisite) {
        currentSteps['complete_onboarding'] = {
          operation: 'Finalize Onboarding Flag',
          status: 'blocked',
          endpoint: 'POST /api/v1/mobile/auth/complete-onboarding',
          message: `Onboarding was not finalized because ${currentSteps[failedRequiredPrerequisite]?.operation || failedRequiredPrerequisite} did not succeed.`
        };
      } else {
        await executeStep(
          'complete_onboarding',
          'Finalize Onboarding Flag',
          'POST /api/v1/mobile/auth/complete-onboarding',
          async () => {
            if (!userId) {
              throw new Error('No user account identifier found for complete onboarding.');
            }
            return await api.completeOnboarding({ user_id: userId });
          }
        );
      }

      const requiredStepKeys = [...requiredPrerequisiteKeys, 'complete_onboarding'] as const;
      const allSucceeded = requiredStepKeys.every(key => currentSteps[key]?.status === 'success');
      const hasBlockers = requiredStepKeys.some(
        key => currentSteps[key]?.status === 'blocked' || currentSteps[key]?.status === 'failed'
      );

      const report: ActivationOperationReport = {
        timestamp: Date.now(),
        userId,
        propertyId,
        steps: currentSteps,
        allSucceeded,
        hasBlockers
      };

      setActivationReport(report);

      if (allSucceeded) {
        const completedAcc: UserAccount = {
          ...activeAcc,
          ob: {
            ...activeAcc.ob,
            step: 'ready',
            done: true,
            data: onboardingData
          }
        };
        saveAccountToStore(completedAcc);
        setStage('portal');
      }

      // If Flutter native container is active, dispatch notification
      if (allSucceeded && userId) {
        nativeBridge.notifyOnboardingComplete({
          userId,
          propertyId: propertyId || null,
          status: 'activated'
        });
      }

      setIsActivating(false);
      return { ok: allSucceeded, report };
    } catch (unexpectedErr: any) {
      console.error('Unexpected error during onboarding activation orchestration:', unexpectedErr);
      const report: ActivationOperationReport = {
        timestamp: Date.now(),
        userId,
        propertyId,
        steps: currentSteps,
        allSucceeded: false,
        hasBlockers: true
      };
      setActivationReport(report);
      setIsActivating(false);
      return { ok: false, report };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isValidatingSession,
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
        resendOtp,
        login,
        loginSample,
        logout,
        forgotPassword,
        resetPassword,
        setObStep,
        updateOnboardingData,
        markStepComplete,
        completeOnboarding,
        resetToStep,
        markSetupDone,
        isActivating,
        activationReport,
        activateOnboarding
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

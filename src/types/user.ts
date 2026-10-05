export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  faceEnrolled: boolean;
  faceQuality: number;
  faceTemplate: string | null;
  govIdVerified: boolean;
  govIdType: string;
  govIdPending: boolean;
  plan: string;
}

export interface UserSettings {
  notifPush: boolean;
  notifIncident: boolean;
  notifSystem: boolean;
  notifMarketing: boolean;
  twoFA: boolean;
  appearance: 'Light' | 'Dark' | 'System';
  language: string;
}

export interface HouseholdMember {
  name: string;
  rel: string;
  type: 'adult' | 'child' | 'staff';
  age?: number | string;
}

export interface GuestPass {
  name: string;
  to: string;
}

export interface EnrolledFace {
  name: string;
  sub: string;
  me?: boolean;
}

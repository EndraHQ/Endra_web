export * from './property';
export * from './device';
export * from './event';
export * from './message';
export * from './user';

export type RouteName =
  | 'start'
  | 'login'
  | 'signup'
  | 'welcome'
  | 'home'
  | 'monitor'
  | 'activity'
  | 'messages'
  | 'sos'
  | 'properties'
  | 'access'
  | 'plans'
  | 'settings'
  | 'open';

export interface RouteState {
  name: RouteName;
  a?: string;
  b?: string;
  query?: Record<string, string>;
}

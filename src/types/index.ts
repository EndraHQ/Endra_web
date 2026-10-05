export * from './property';
export * from './device';
export * from './event';
export * from './message';
export * from './user';

export type RouteName = 'home' | 'monitor' | 'activity' | 'messages' | 'sos' | 'properties' | 'access' | 'settings';

export interface RouteState {
  name: RouteName;
  a?: string;
  b?: string;
}

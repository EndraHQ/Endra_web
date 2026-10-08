/**
 * Dynamic Mobile -> Web Handoff & Intent Resolution
 *
 * This module provides a centralized intent-resolution mechanism for ENDRA.
 * The mobile application communicates an intent to the web application
 * (e.g. `#/open?intent=add-camera`, `#/open?intent=account`, `#/open?intent=alerts`, `#/open?intent=playback`).
 * The web application determines the concrete destination based on frontend state.
 */

export interface ResolvedDestination {
  path: string;
  openModal?: 'addCamera' | 'commandCenter' | 'connectProperty' | 'plans';
  query?: Record<string, string>;
}

/**
 * Registry of supported intents and their route mapping.
 * Easy to extend with new intents without changing internal web routes.
 */
export const INTENT_MAP: Record<string, (params?: Record<string, string>) => ResolvedDestination> = {
  // Mobile intends to open user account settings (specifically mapped to settings/account per specification)
  'account': () => ({
    path: 'settings/account'
  }),

  // Mobile intends to open subscriptions & plans view
  'plans': () => ({
    path: 'plans'
  }),

  // Mobile intends to add / pair a new camera
  'add-camera': () => ({
    path: 'monitor/cameras',
    openModal: 'addCamera'
  }),

  // Mobile intends to review alerts & activity feed
  'alerts': () => ({
    path: 'activity'
  }),

  // Mobile intends to check recorded footage & playback
  'playback': () => ({
    path: 'monitor/playback'
  }),

  // Mobile intends to view live cameras
  'live': () => ({
    path: 'monitor/live'
  }),

  // Mobile intends to view all cameras / monitor
  'monitor': () => ({
    path: 'monitor/cameras'
  }),

  // Mobile intends to open emergency SOS
  'sos': () => ({
    path: 'sos'
  }),

  // Mobile intends to manage emergency contacts
  'contacts': () => ({
    path: 'settings/contacts'
  }),

  // Mobile intends to view or manage enrolled faces
  'faces': () => ({
    path: 'settings/faces'
  }),

  // Mobile intends to manage properties
  'properties': () => ({
    path: 'properties'
  }),

  // Mobile intends to manage shared access (household & guests)
  'access': () => ({
    path: 'access'
  }),

  // Mobile intends to open general settings
  'settings': () => ({
    path: 'settings'
  })
};

/**
 * Safely resolves an intent string and optional parameters to a web application destination.
 * If the intent is unrecognized, safely falls back to 'home'.
 */
export function resolveIntent(
  intent: string | null | undefined,
  params?: Record<string, string>
): ResolvedDestination {
  if (!intent) {
    return { path: 'home' };
  }

  const normalizedIntent = intent.trim().toLowerCase();
  const mapper = INTENT_MAP[normalizedIntent];

  if (typeof mapper === 'function') {
    return mapper(params);
  }

  // Fallback safely to Home for unknown intents without crashing
  return { path: 'home' };
}

/**
 * ENDRA Web - Unified API Service Facade
 * Aggregates all modular services into a single unified client object
 * while re-exporting all types to guarantee 100% backwards compatibility.
 */

import { request, formatApiPhone, ApiError, API_BASE_URL, DEFAULT_API_BASE_URL, DEFAULT_TIMEOUT_MS, RequestOptions } from './client';
import { authService } from './modules/auth';
import { pinService } from './modules/pin';
import { propertyService } from './modules/properties';
import { sosService } from './modules/sos';
import { messagingService } from './modules/messaging';
import { contactsService } from './modules/contacts';
import { subscriptionService } from './modules/subscriptions';
import { hardwareService } from './modules/hardware';

// Re-export core client primitives
export { request, formatApiPhone, ApiError, API_BASE_URL, DEFAULT_API_BASE_URL, DEFAULT_TIMEOUT_MS };
export type { RequestOptions };

// Re-export all schemas and types from domain modules
export * from './modules/auth';
export * from './modules/pin';
export * from './modules/properties';
export * from './modules/sos';
export * from './modules/messaging';
export * from './modules/contacts';
export * from './modules/subscriptions';
export * from './modules/hardware';

// Unified API facade object
export const api = {
  ...authService,
  ...pinService,
  ...propertyService,
  ...sosService,
  ...messagingService,
  ...contactsService,
  ...subscriptionService,
  ...hardwareService
};

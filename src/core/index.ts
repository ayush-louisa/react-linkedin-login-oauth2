/**
 * Core utilities exports
 * @module core
 */

// Utils
export { generateRandomString, getPopupPositionProperties } from './utils';

// URL utilities
export { parseUrlParams, buildLinkedInAuthUrl } from './url';

// Storage utilities
export {
  LINKEDIN_OAUTH2_STATE_KEY,
  LINKEDIN_OAUTH2_MOBILE_RESULT_KEY,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getLinkedInState,
  setLinkedInState,
  clearLinkedInState,
  getLinkedInMobileResult,
  setLinkedInMobileResult,
  clearLinkedInMobileResult,
} from './storage';

export type { LinkedInMobileResult } from './storage';

// Debug utilities
export {
  setDebugMode,
  isDebugModeEnabled,
  createDebugLogger,
  debug,
} from './debug';

export type { DebugLogger } from './debug';

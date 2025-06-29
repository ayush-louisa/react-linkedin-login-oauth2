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
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getLinkedInState,
  setLinkedInState,
  clearLinkedInState,
} from './storage';

// Debug utilities
export {
  setDebugMode,
  isDebugModeEnabled,
  createDebugLogger,
  debug,
} from './debug';

export type { DebugLogger } from './debug';

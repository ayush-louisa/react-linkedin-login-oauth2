/**
 * React LinkedIn Login OAuth2 - Modular Library
 * @module react-linkedin-login-oauth2
 */

// Components - Tree-shakable imports
export { LinkedIn } from './components/LinkedIn';
export { LinkedInCallback } from './components/LinkedInCallback';

// Hooks - Tree-shakable imports
export { useLinkedIn } from './hooks/useLinkedIn';

// Types - Tree-shakable imports
export type * from './types';

// Core utilities - Tree-shakable imports (optional)
export {
  // Debug utilities
  setDebugMode,
  isDebugModeEnabled,
  createDebugLogger,
  debug,

  // URL utilities
  parseUrlParams,
  buildLinkedInAuthUrl,

  // Storage utilities
  getLinkedInState,
  setLinkedInState,
  clearLinkedInState,

  // General utilities
  generateRandomString,
  getPopupPositionProperties,
} from './core';

// Legacy compatibility - Deprecated, use named imports instead
export { useLinkedIn as default } from './hooks/useLinkedIn';

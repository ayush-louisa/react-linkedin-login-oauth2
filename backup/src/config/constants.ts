/**
 * Configuration constants - organized by feature for tree-shaking
 */

// Core constants (always included)
export const CORE_CONFIG = {
  DEFAULT_SCOPE: 'r_emailaddress',
  LINKEDIN_OAUTH_URL: 'https://www.linkedin.com/oauth/v2/authorization',
  STATE_LENGTH: 20,
} as const;

// Default/Popup specific constants
export const POPUP_CONFIG = {
  WIDTH: 600,
  HEIGHT: 600,
  CHECK_INTERVAL: 1000,
} as const;

// Polling specific constants
export const POLLING_CONFIG = {
  DEFAULT_INTERVAL: 2000,
  DEFAULT_TIMEOUT: 300000, // 5 minutes
} as const;

// Mobile specific constants
export const MOBILE_CONFIG = {
  POLLING_INTERVAL: 3000,
  SESSION_ID_LENGTH: 32,
} as const;

// Error messages (organized by feature)
export const CORE_ERRORS = {
  STATE_MISMATCH: 'Security validation failed',
  NO_CODE: 'No authorization code received',
  OAUTH_ERROR: 'OAuth authentication failed',
} as const;

export const POPUP_ERRORS = {
  POPUP_BLOCKED: 'Popup was blocked by browser',
  USER_CLOSED_POPUP: 'User closed the popup',
} as const;

export const POLLING_ERRORS = {
  TIMEOUT: 'Authentication timed out',
  ENDPOINT_ERROR: 'Polling endpoint error',
} as const;

export const MOBILE_ERRORS = {
  URL_PARSE_ERROR: 'Failed to parse callback URL',
  WEBVIEW_ERROR: 'WebView authentication failed',
} as const;

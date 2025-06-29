/**
 * Debug logging utility for React LinkedIn OAuth2 library
 */

let isDebugEnabled = false;

export const setDebugMode = (enabled: boolean) => {
  isDebugEnabled = enabled;
};

export const debug = {
  log: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.log(`[LinkedIn OAuth2] ${message}`, data ? data : '');
    }
  },

  warn: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.warn(`[LinkedIn OAuth2] WARNING: ${message}`, data ? data : '');
    }
  },

  error: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.error(`[LinkedIn OAuth2] ERROR: ${message}`, data ? data : '');
    }
  },

  info: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.info(`[LinkedIn OAuth2] INFO: ${message}`, data ? data : '');
    }
  },
};

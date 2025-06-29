/**
 * Debug logging utilities - completely tree-shakable
 * @module core/debug
 */

let isDebugEnabled = false;

/**
 * Sets the global debug mode state
 * @param enabled - Whether to enable debug logging
 */
export const setDebugMode = (enabled: boolean): void => {
  isDebugEnabled = enabled;
};

/**
 * Gets the current debug mode state
 * @returns Current debug state
 */
export const isDebugModeEnabled = (): boolean => {
  return isDebugEnabled;
};

/**
 * Debug logger interface
 */
export interface DebugLogger {
  log: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
}

/**
 * Creates a debug logger instance
 * @param prefix - Prefix for log messages
 * @returns Debug logger instance
 */
export const createDebugLogger = (prefix = 'LinkedIn OAuth2'): DebugLogger => ({
  log: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.log(`[${prefix}] ${message}`, data ?? '');
    }
  },

  warn: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.warn(`[${prefix}] WARNING: ${message}`, data ?? '');
    }
  },

  error: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.error(`[${prefix}] ERROR: ${message}`, data ?? '');
    }
  },

  info: (message: string, data?: unknown) => {
    if (isDebugEnabled) {
      console.info(`[${prefix}] INFO: ${message}`, data ?? '');
    }
  },
});

/**
 * Default debug logger instance
 */
export const debug = createDebugLogger();

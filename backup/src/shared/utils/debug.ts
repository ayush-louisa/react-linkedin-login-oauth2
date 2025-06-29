/**
 * Debug logging utilities
 */

export interface DebugLogger {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export const createDebugLogger = (
  prefix: string,
  enabled: boolean = false,
): DebugLogger => {
  const createLogFunction =
    (logMethod: typeof console.log) =>
    (message: string, ...args: unknown[]) => {
      if (enabled) {
        logMethod(`[${prefix}] ${message}`, ...args);
      }
    };

  return {
    log: createLogFunction(console.log),
    warn: createLogFunction(console.warn),
    error: createLogFunction(console.error),
  };
};

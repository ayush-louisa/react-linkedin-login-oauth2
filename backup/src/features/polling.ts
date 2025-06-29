/**
 * Polling-specific utilities
 * Only imported when using polling authentication
 */

import { POLLING_CONFIG, POLLING_ERRORS } from '../config/constants';

export interface PollingConfig {
  endpoint: string;
  interval?: number;
  timeout?: number;
}

export interface PollingResult {
  status: 'pending' | 'completed' | 'error';
  code?: string;
  error?: string;
  errorMessage?: string;
}

export interface PollingManager {
  start: (sessionId: string) => void;
  stop: () => void;
  isActive: () => boolean;
}

export const createPollingManager = (
  config: PollingConfig,
  onSuccess: (code: string) => void,
  onError: (error: { error: string; errorMessage: string }) => void,
  debug: boolean = false,
): PollingManager => {
  let intervalId: number | null = null;
  let startTime: number | null = null;

  const timeout = config.timeout || POLLING_CONFIG.DEFAULT_TIMEOUT;
  const interval = config.interval || POLLING_CONFIG.DEFAULT_INTERVAL;

  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.log(`[LinkedIn Polling] ${message}`, ...args);
    }
  };

  const checkCompletion = async (sessionId: string) => {
    try {
      if (startTime && Date.now() - startTime > timeout) {
        stop();
        onError({
          error: 'timeout',
          errorMessage: POLLING_ERRORS.TIMEOUT,
        });
        return;
      }

      const response = await fetch(`${config.endpoint}?session=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: PollingResult = await response.json();
      log('Polling response:', result);

      if (result.status === 'completed') {
        stop();
        if (result.code) {
          onSuccess(result.code);
        } else {
          onError({
            error: 'no_code',
            errorMessage: 'No authorization code received',
          });
        }
      } else if (result.status === 'error') {
        stop();
        onError({
          error: result.error || 'oauth_error',
          errorMessage: result.errorMessage || 'OAuth authentication failed',
        });
      }
    } catch (error) {
      log('Polling error:', error);
      // Continue polling on network errors
    }
  };

  return {
    start: (sessionId: string) => {
      if (intervalId) {
        stop();
      }

      startTime = Date.now();
      log(`Starting polling for session: ${sessionId}`);

      intervalId = window.setInterval(() => {
        checkCompletion(sessionId);
      }, interval);
    },

    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      startTime = null;
      log('Polling stopped');
    },

    isActive: () => intervalId !== null,
  };
};

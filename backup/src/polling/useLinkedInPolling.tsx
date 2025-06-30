import { useCallback, useEffect, useRef, useState } from 'react';
import type { useLinkedInType } from '../types';
import { LINKEDIN_OAUTH2_STATE } from '../utils';

const getPopupPositionProperties = ({ width = 600, height = 600 }) => {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `left=${left},top=${top},width=${width},height=${height}`;
};

const generateRandomString = (length = 20) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

interface PollingConfig {
  /** Base URL for your backend that handles OAuth completion */
  pollingEndpoint: string;
  /** How often to poll for completion (ms) */
  pollingInterval?: number;
  /** Maximum time to poll before timing out (ms) */
  pollingTimeout?: number;
}

interface ExtendedLinkedInType extends useLinkedInType {
  polling?: PollingConfig;
}

export function useLinkedInPolling({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
  debug = false,
  polling,
}: ExtendedLinkedInType) {
  const popupRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const popupCheckIntervalRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [isLoading, setIsLoading] = useState(false);

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const debugLog = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn OAuth Polling] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugError = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn OAuth Polling] ${message}`, ...args);
      }
    },
    [debug],
  );

  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
      popupCheckIntervalRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setIsLoading(false);
  }, []);

  const pollForCompletion = useCallback(
    async (sessionId: string) => {
      if (!polling?.pollingEndpoint) {
        debugError('Polling endpoint not configured');
        return;
      }

      const startTime = Date.now();
      const timeout = polling.pollingTimeout || 300000; // 5 minutes default
      const interval = polling.pollingInterval || 2000; // 2 seconds default

      debugLog(`Starting polling for session: ${sessionId}`);

      pollingIntervalRef.current = window.setInterval(async () => {
        try {
          if (Date.now() - startTime > timeout) {
            cleanup();
            onErrorRef.current?.({
              error: 'timeout',
              errorMessage: 'Authentication timed out',
            });
            return;
          }

          const response = await fetch(
            `${polling.pollingEndpoint}?session=${sessionId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          debugLog('Polling response:', result);

          if (result.status === 'completed') {
            cleanup();
            if (result.code) {
              onSuccessRef.current?.(result.code);
            } else {
              onErrorRef.current?.({
                error: 'no_code',
                errorMessage: 'No authorization code received',
              });
            }
          } else if (result.status === 'error') {
            cleanup();
            onErrorRef.current?.({
              error: result.error || 'oauth_error',
              errorMessage:
                result.errorMessage || 'OAuth authentication failed',
            });
          }
          // If status is 'pending', continue polling
        } catch (error) {
          debugError('Polling error:', error);
          // Continue polling on network errors - user might have slow connection
        }
      }, interval);
    },
    [polling, cleanup, debugLog, debugError],
  );

  const linkedInLogin = useCallback(() => {
    if (isLoading) {
      debugLog('Login already in progress');
      return;
    }

    debugLog('Starting LinkedIn login flow');
    setIsLoading(true);

    // Clean up any existing popup/polling
    cleanup();

    const generatedState = state || generateRandomString();
    const sessionId = generateRandomString(32); // Unique session ID for polling

    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    localStorage.setItem('linkedin_session_id', sessionId);

    const scopeParam = `&scope=${encodeURI(scope)}`;
    // Add session parameter to state for server-side tracking
    const stateWithSession = `${generatedState}.${sessionId}`;
    const linkedInAuthLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${stateWithSession}`;

    popupRef.current = window.open(
      linkedInAuthLink,
      '_blank',
      getPopupPositionProperties({ width: 600, height: 600 }),
    );

    if (!popupRef.current) {
      setIsLoading(false);
      onErrorRef.current?.({
        error: 'popup_blocked',
        errorMessage: 'Popup was blocked by browser',
      });
      return;
    }

    debugLog('Popup opened, starting polling and popup monitoring');

    // Start polling if configured
    if (polling?.pollingEndpoint) {
      pollForCompletion(sessionId);
    }

    // Monitor popup closure
    popupCheckIntervalRef.current = window.setInterval(() => {
      if (popupRef.current?.closed) {
        debugLog('Popup closed by user');
        cleanup();
        onErrorRef.current?.({
          error: 'user_closed_popup',
          errorMessage: closePopupMessage,
        });
      }
    }, 1000);
  }, [
    isLoading,
    state,
    scope,
    clientId,
    redirectUri,
    polling,
    pollForCompletion,
    cleanup,
    closePopupMessage,
    debugLog,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    linkedInLogin,
    isLoading,
  };
}

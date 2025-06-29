/**
 * Tree-shakable polling LinkedIn OAuth implementation
 * Only imports polling-specific utilities
 */

import { useCallback, useRef, useState } from 'react';
import type { useLinkedInPollingType } from '../types';
import { LINKEDIN_OAUTH2_STATE } from '../utils';
import { generateRandomString, buildLinkedInAuthUrl } from '../core/auth';
import { createPopupManager } from '../features/popup';
import { createPollingManager } from '../features/polling';
import { CORE_CONFIG, POPUP_CONFIG, POPUP_ERRORS } from '../config/constants';

export function useLinkedInPolling({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = CORE_CONFIG.DEFAULT_SCOPE,
  state = '',
  closePopupMessage = POPUP_ERRORS.USER_CLOSED_POPUP,
  debug = false,
  polling,
}: useLinkedInPollingType) {
  const popupManager = useRef(createPopupManager());
  const pollingManagerRef = useRef<ReturnType<
    typeof createPollingManager
  > | null>(null);
  const popupCheckIntervalRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [isLoading, setIsLoading] = useState(false);

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Debug logging (only when needed)
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn Polling] ${message}`, ...args);
      }
    },
    [debug],
  );

  const cleanup = useCallback(() => {
    pollingManagerRef.current?.stop();
    pollingManagerRef.current = null;

    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
      popupCheckIntervalRef.current = null;
    }

    popupManager.current.close();
    setIsLoading(false);
  }, []);

  const linkedInLogin = useCallback(() => {
    if (isLoading) {
      log('Login already in progress');
      return;
    }

    log('Starting LinkedIn login flow');
    setIsLoading(true);
    cleanup();

    // Generate state and session ID
    const generatedState =
      state || generateRandomString(CORE_CONFIG.STATE_LENGTH);
    const sessionId = generateRandomString(32);

    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    localStorage.setItem('linkedin_session_id', sessionId);

    // Add session parameter to state for server-side tracking
    const stateWithSession = `${generatedState}.${sessionId}`;

    const authUrl = buildLinkedInAuthUrl({
      clientId,
      redirectUri,
      scope,
      state: stateWithSession,
    });

    const popup = popupManager.current.open(authUrl);

    if (!popup) {
      setIsLoading(false);
      onErrorRef.current?.({
        error: 'popup_blocked',
        errorMessage: POPUP_ERRORS.POPUP_BLOCKED,
      });
      return;
    }

    log('Popup opened, starting polling and popup monitoring');

    // Start polling if configured
    if (polling?.pollingEndpoint) {
      pollingManagerRef.current = createPollingManager(
        {
          endpoint: polling.pollingEndpoint,
          interval: polling.pollingInterval,
          timeout: polling.pollingTimeout,
        },
        (code: string) => {
          cleanup();
          onSuccessRef.current?.(code);
        },
        (error: { error: string; errorMessage: string }) => {
          cleanup();
          onErrorRef.current?.(error);
        },
        debug,
      );

      pollingManagerRef.current.start(sessionId);
    }

    // Monitor popup closure
    popupCheckIntervalRef.current = window.setInterval(() => {
      if (popupManager.current.isClosed()) {
        log('Popup closed by user');
        cleanup();
        onErrorRef.current?.({
          error: 'user_closed_popup',
          errorMessage: closePopupMessage,
        });
      }
    }, POPUP_CONFIG.CHECK_INTERVAL);
  }, [
    isLoading,
    state,
    scope,
    clientId,
    redirectUri,
    polling,
    cleanup,
    closePopupMessage,
    debug,
    log,
  ]);

  return {
    linkedInLogin,
    isLoading,
  };
}

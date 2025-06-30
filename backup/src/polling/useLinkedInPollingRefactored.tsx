import { useCallback, useRef, useState } from 'react';
import type { useLinkedInPollingType } from '../types';
import {
  createPopupManager,
  createDebugLogger,
  createPollingManager,
  useOAuthState,
  useCleanupManager,
} from '../shared';

export function useLinkedInPollingRefactored({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
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
  const logger = createDebugLogger('LinkedIn OAuth Polling', debug);
  const cleanupManager = useCleanupManager();

  const { createAuthState } = useOAuthState({
    clientId,
    redirectUri,
    scope,
    state,
    debug,
    generateSessionId: true,
  });

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

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

  // Register cleanup
  cleanupManager.addCleanupFunction(cleanup);

  const linkedInLogin = useCallback(() => {
    if (isLoading) {
      logger.log('Login already in progress');
      return;
    }

    logger.log('Starting LinkedIn login flow');
    setIsLoading(true);
    cleanup();

    const authState = createAuthState();
    const popup = popupManager.current.open(authState.authUrl);

    if (!popup) {
      setIsLoading(false);
      onErrorRef.current?.({
        error: 'popup_blocked',
        errorMessage: 'Popup was blocked by browser',
      });
      return;
    }

    logger.log('Popup opened, starting polling and popup monitoring');

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

      pollingManagerRef.current.start(authState.sessionId);
    }

    // Monitor popup closure
    popupCheckIntervalRef.current = window.setInterval(() => {
      if (popupManager.current.isClosed()) {
        logger.log('Popup closed by user');
        cleanup();
        onErrorRef.current?.({
          error: 'user_closed_popup',
          errorMessage: closePopupMessage,
        });
      }
    }, 1000);
  }, [
    isLoading,
    createAuthState,
    polling,
    cleanup,
    closePopupMessage,
    debug,
    logger,
  ]);

  return {
    linkedInLogin,
    isLoading,
  };
}

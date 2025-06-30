import { useCallback, useEffect, useRef } from 'react';
import type { useLinkedInType } from '../types';
import {
  createPopupManager,
  createDebugLogger,
  useOAuthState,
  useCleanupManager,
} from '../shared';

export function useLinkedIn({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
  debug = false,
}: useLinkedInType) {
  const popupManager = useRef(createPopupManager());
  const popUpIntervalRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const setupCountRef = useRef(0);
  const logger = createDebugLogger('LinkedIn OAuth', debug);
  const cleanupManager = useCleanupManager();

  const { createAuthState, validateAuthState } = useOAuthState({
    clientId,
    redirectUri,
    scope,
    state,
    debug,
  });

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    setupCountRef.current += 1;
    logger.log('Setting up message listener', {
      setupCount: setupCountRef.current,
    });

    const receiveMessage = (event: MessageEvent) => {
      logger.log('Message received:', event.data);

      if (event.origin !== window.location.origin) {
        return;
      }

      if (!event.data.from || event.data.from !== 'Linked In') {
        return;
      }

      // Validate state to prevent CSRF attacks
      if (!validateAuthState(event.data.state)) {
        popupManager.current.close();
        return;
      }

      // Clear the interval before calling callbacks
      if (popUpIntervalRef.current !== null) {
        window.clearInterval(popUpIntervalRef.current);
        popUpIntervalRef.current = null;
      }

      if (event.data.code) {
        logger.log('Authentication successful');
        onSuccessRef.current?.(event.data.code);
      } else if (event.data.errorMessage) {
        logger.log('Authentication error:', event.data);
        onErrorRef.current?.(event.data);
      }

      popupManager.current.close();
    };

    window.addEventListener('message', receiveMessage, false);

    // Register cleanup functions
    cleanupManager.addCleanupFunction(() => {
      window.removeEventListener('message', receiveMessage, false);
    });

    cleanupManager.addCleanupFunction(() => {
      popupManager.current.close();
    });

    cleanupManager.addCleanupFunction(() => {
      if (popUpIntervalRef.current !== null) {
        window.clearInterval(popUpIntervalRef.current);
        popUpIntervalRef.current = null;
      }
    });

    return () => {
      logger.log('Cleaning up message listener', {
        setupCount: setupCountRef.current,
      });
    };
  }, [debug, logger, validateAuthState, cleanupManager]);

  const linkedInLogin = useCallback(() => {
    logger.log('Starting LinkedIn login flow');

    // Clean up any existing popup
    popupManager.current.close();

    const authState = createAuthState();
    const popup = popupManager.current.open(authState.authUrl);

    if (!popup) {
      onErrorRef.current?.({
        error: 'popup_blocked',
        errorMessage: 'Popup was blocked by browser',
      });
      return;
    }

    logger.log('Popup opened');

    // Clear any existing interval
    if (popUpIntervalRef.current !== null) {
      window.clearInterval(popUpIntervalRef.current);
      popUpIntervalRef.current = null;
    }

    // Monitor popup closure
    popUpIntervalRef.current = window.setInterval(() => {
      try {
        if (popupManager.current.isClosed()) {
          logger.log('Popup was closed by user');
          if (popUpIntervalRef.current !== null) {
            window.clearInterval(popUpIntervalRef.current);
            popUpIntervalRef.current = null;
          }
          onErrorRef.current?.({
            error: 'user_closed_popup',
            errorMessage: closePopupMessage,
          });
        }
      } catch (error) {
        logger.error('Error in popup interval check:', error);
        if (popUpIntervalRef.current !== null) {
          window.clearInterval(popUpIntervalRef.current);
          popUpIntervalRef.current = null;
        }
      }
    }, 1000);
  }, [createAuthState, closePopupMessage, logger]);

  return {
    linkedInLogin,
  };
}

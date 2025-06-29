/**
 * Tree-shakable default LinkedIn OAuth implementation
 * Only imports what it needs for popup-based authentication
 */

import { useCallback, useEffect, useRef } from 'react';
import type { useLinkedInType } from '../types';
import { LINKEDIN_OAUTH2_STATE } from '../utils';
import {
  generateRandomString,
  buildLinkedInAuthUrl,
  validateState,
} from '../core/auth';
import { createPopupManager } from '../features/popup';
import { CORE_CONFIG, POPUP_CONFIG, POPUP_ERRORS } from '../config/constants';

export function useLinkedIn({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = CORE_CONFIG.DEFAULT_SCOPE,
  state = '',
  closePopupMessage = POPUP_ERRORS.USER_CLOSED_POPUP,
  debug = false,
}: useLinkedInType) {
  const popupManager = useRef(createPopupManager());
  const popupCheckIntervalRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const setupCountRef = useRef(0);

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Debug logging (only when needed)
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  const logError = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  useEffect(() => {
    setupCountRef.current += 1;
    log('Setting up message listener', { setupCount: setupCountRef.current });

    const currentPopupManager = popupManager.current;

    const receiveMessage = (event: MessageEvent) => {
      log('Message received:', event.data);

      if (event.origin !== window.location.origin) {
        return;
      }

      if (!event.data.from || event.data.from !== 'Linked In') {
        return;
      }

      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);

      // Validate state to prevent CSRF attacks
      if (!validateState(event.data.state, savedState)) {
        logError('State mismatch in callback');
        currentPopupManager.close();
        return;
      }

      // Clear the interval before calling callbacks
      if (popupCheckIntervalRef.current !== null) {
        window.clearInterval(popupCheckIntervalRef.current);
        popupCheckIntervalRef.current = null;
      }

      if (event.data.code) {
        log('Authentication successful');
        onSuccessRef.current?.(event.data.code);
      } else if (event.data.errorMessage) {
        log('Authentication error:', event.data);
        onErrorRef.current?.(event.data);
      }

      currentPopupManager.close();
    };

    window.addEventListener('message', receiveMessage, false);

    return () => {
      log('Cleaning up message listener', {
        setupCount: setupCountRef.current,
      });
      window.removeEventListener('message', receiveMessage, false);

      currentPopupManager.close();

      if (popupCheckIntervalRef.current !== null) {
        window.clearInterval(popupCheckIntervalRef.current);
        popupCheckIntervalRef.current = null;
      }
    };
  }, [debug, log, logError]);

  const linkedInLogin = useCallback(() => {
    log('Starting LinkedIn login flow');

    // Clean up any existing popup
    popupManager.current.close();

    // Generate state and build auth URL
    const generatedState =
      state || generateRandomString(CORE_CONFIG.STATE_LENGTH);
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);

    const authUrl = buildLinkedInAuthUrl({
      clientId,
      redirectUri,
      scope,
      state: generatedState,
    });

    const popup = popupManager.current.open(authUrl);

    if (!popup) {
      onErrorRef.current?.({
        error: 'popup_blocked',
        errorMessage: POPUP_ERRORS.POPUP_BLOCKED,
      });
      return;
    }

    log('Popup opened');

    // Clear any existing interval
    if (popupCheckIntervalRef.current !== null) {
      window.clearInterval(popupCheckIntervalRef.current);
      popupCheckIntervalRef.current = null;
    }

    // Monitor popup closure
    popupCheckIntervalRef.current = window.setInterval(() => {
      try {
        if (popupManager.current.isClosed()) {
          log('Popup was closed by user');
          if (popupCheckIntervalRef.current !== null) {
            window.clearInterval(popupCheckIntervalRef.current);
            popupCheckIntervalRef.current = null;
          }
          onErrorRef.current?.({
            error: 'user_closed_popup',
            errorMessage: closePopupMessage,
          });
        }
      } catch (error) {
        logError('Error in popup interval check:', error);
        if (popupCheckIntervalRef.current !== null) {
          window.clearInterval(popupCheckIntervalRef.current);
          popupCheckIntervalRef.current = null;
        }
      }
    }, POPUP_CONFIG.CHECK_INTERVAL);
  }, [clientId, redirectUri, scope, state, closePopupMessage, log, logError]);

  return {
    linkedInLogin,
  };
}

/**
 * useLinkedIn hook - modular implementation
 * @module hooks/useLinkedIn
 */

import { useCallback, useEffect, useRef } from 'react';
import type { UseLinkedInConfig } from '../types/components';
import type { LinkedInCallbackData } from '../types/base';
import {
  generateRandomString,
  getPopupPositionProperties,
} from '../core/utils';
import { buildLinkedInAuthUrl } from '../core/url';
import { getLinkedInState, setLinkedInState } from '../core/storage';
import { createDebugLogger, setDebugMode } from '../core/debug';

/**
 * React hook for LinkedIn OAuth2 authentication
 * @param config - LinkedIn OAuth2 configuration
 * @returns Object with linkedInLogin function
 */
export function useLinkedIn({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
  debug: debugMode = false,
}: UseLinkedInConfig) {
  const popupRef = useRef<Window | null>(null);
  const popUpIntervalRef = useRef<number | null>(null);
  const debugLogger = useRef(createDebugLogger('LinkedIn OAuth2')).current;

  // Initialize debug mode
  useEffect(() => {
    setDebugMode(debugMode);
    debugLogger.log('useLinkedIn initialized', {
      redirectUri,
      clientId,
      scope,
      state: state || 'auto-generated',
      debugMode,
    });
  }, [debugMode, redirectUri, clientId, scope, state, debugLogger]);

  const receiveMessage = useCallback(
    (event: MessageEvent<LinkedInCallbackData>) => {
      debugLogger.log('Received message event', {
        origin: event.origin,
        windowOrigin: window.location.origin,
        data: event.data,
      });

      const savedState = getLinkedInState();
      debugLogger.log('Retrieved saved state for validation', { savedState });

      if (event.origin === window.location.origin) {
        if (event.data.errorMessage && event.data.from === 'Linked In') {
          debugLogger.log('Processing error message from LinkedIn callback');

          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            debugLogger.error('State validation failed in error handler', {
              receivedState: event.data.state,
              savedState,
              match: event.data.state === savedState,
            });
            if (popupRef.current) {
              popupRef.current.close();
            }
            return;
          }

          debugLogger.log('Calling onError callback', event.data);
          if (onError) {
            onError({
              error: event.data.error || 'unknown_error',
              errorMessage: event.data.errorMessage,
            });
          }
          if (popupRef.current) {
            debugLogger.log('Closing popup after error');
            popupRef.current.close();
          }
        } else if (event.data.code && event.data.from === 'Linked In') {
          debugLogger.log('Processing success message with authorization code');

          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            debugLogger.error('State validation failed in success handler', {
              receivedState: event.data.state,
              savedState,
              match: event.data.state === savedState,
            });
            console.error('State does not match');
            if (popupRef.current) {
              popupRef.current.close();
            }
            return;
          }

          debugLogger.log('Calling onSuccess callback', {
            code: event.data.code,
          });
          if (onSuccess) {
            onSuccess(event.data.code);
          }
          if (popupRef.current) {
            debugLogger.log('Closing popup after success');
            popupRef.current.close();
          }
        }
      } else {
        debugLogger.warn('Message received from unauthorized origin', {
          received: event.origin,
          expected: window.location.origin,
        });
      }
    },
    [onError, onSuccess, debugLogger],
  );

  useEffect(() => {
    debugLogger.log('Setting up cleanup function');
    return () => {
      debugLogger.log('Cleaning up useLinkedIn hook');
      window.removeEventListener('message', receiveMessage, false);

      if (popupRef.current) {
        debugLogger.log('Closing popup in cleanup');
        popupRef.current.close();
        popupRef.current = null;
      }
      if (popUpIntervalRef.current) {
        debugLogger.log('Clearing popup interval in cleanup');
        window.clearInterval(popUpIntervalRef.current);
        popUpIntervalRef.current = null;
      }
    };
  }, [receiveMessage, debugLogger]);

  useEffect(() => {
    debugLogger.log('Adding message event listener');
    window.addEventListener('message', receiveMessage, false);
    return () => {
      debugLogger.log('Removing message event listener');
      window.removeEventListener('message', receiveMessage, false);
    };
  }, [receiveMessage, debugLogger]);

  const linkedInLogin = useCallback(() => {
    debugLogger.log('Starting LinkedIn login process');

    popupRef.current?.close();

    const generatedState = state || generateRandomString();
    debugLogger.log('Generated OAuth state', {
      state: generatedState,
      wasProvided: !!state,
    });

    const success = setLinkedInState(generatedState);
    if (!success) {
      debugLogger.error('Failed to save state to localStorage');
      if (onError) {
        onError({
          error: 'storage_error',
          errorMessage: 'Failed to save OAuth state',
        });
      }
      return;
    }
    debugLogger.log('Saved state to localStorage');

    const authUrl = buildLinkedInAuthUrl({
      clientId,
      redirectUri,
      scope,
      state: generatedState,
    });
    debugLogger.log('Generated LinkedIn OAuth URL', { url: authUrl });

    const popupProperties = getPopupPositionProperties({
      width: 600,
      height: 600,
    });
    debugLogger.log('Opening popup window', {
      url: authUrl,
      properties: popupProperties,
    });

    popupRef.current = window.open(authUrl, '_blank', popupProperties);

    if (popUpIntervalRef.current) {
      debugLogger.log('Clearing existing popup interval');
      window.clearInterval(popUpIntervalRef.current);
      popUpIntervalRef.current = null;
    }

    debugLogger.log('Setting up popup monitoring interval');
    popUpIntervalRef.current = window.setInterval(() => {
      try {
        if (popupRef.current && popupRef.current.closed) {
          debugLogger.log('Popup was closed by user');

          if (popUpIntervalRef.current !== null) {
            window.clearInterval(popUpIntervalRef.current);
          }
          popUpIntervalRef.current = null;

          if (onError) {
            debugLogger.log('Calling onError for popup closure', {
              error: 'user_closed_popup',
              errorMessage: closePopupMessage,
            });
            onError({
              error: 'user_closed_popup',
              errorMessage: closePopupMessage,
            });
          }
        }
      } catch (error) {
        debugLogger.error('Error in popup monitoring interval', error);
        console.error(error);
        if (popUpIntervalRef.current !== null) {
          window.clearInterval(popUpIntervalRef.current);
        }
        popUpIntervalRef.current = null;
      }
    }, 1000);
  }, [
    clientId,
    redirectUri,
    scope,
    state,
    closePopupMessage,
    onError,
    debugLogger,
  ]);

  return {
    linkedInLogin,
  };
}

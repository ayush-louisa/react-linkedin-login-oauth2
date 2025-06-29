/**
 * useLinkedInMobile hook - mobile-optimized LinkedIn OAuth2 for Flutter webviews
 * @module hooks/useLinkedInMobile
 *
 * This hook provides a mobile-optimized authentication flow that works when the React app
 * is running in a Flutter webview, specifically designed for InAppBrowser environments.
 *
 * Key differences from standard implementation:
 * - Uses URL-based communication instead of window.opener.postMessage
 * - Polls for state changes in localStorage instead of relying on postMessage events
 * - Handles mobile webview redirect patterns specific to Flutter apps
 * - Works with InAppBrowser where window.opener may not be available
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseLinkedInMobileConfig } from '../types/components';
import {
  generateRandomString,
  getPopupPositionProperties,
} from '../core/utils';
import { buildLinkedInAuthUrl } from '../core/url';
import {
  setLinkedInState,
  getLinkedInMobileResult,
  clearLinkedInMobileResult,
} from '../core/storage';
import { createDebugLogger, setDebugMode } from '../core/debug';

/**
 * Mobile-optimized React hook for LinkedIn OAuth2 authentication in Flutter webviews
 *
 * @param config - LinkedIn OAuth2 configuration for mobile
 * @returns Object with linkedInLogin function and loading state
 */
export function useLinkedInMobile({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
  debug: debugMode = false,
  pollInterval = 1000,
  maxPollAttempts = 300, // 5 minutes with 1 second intervals
}: UseLinkedInMobileConfig) {
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const debugLogger = useRef(
    createDebugLogger('LinkedIn OAuth2 Mobile'),
  ).current;

  // Initialize debug mode
  useEffect(() => {
    setDebugMode(debugMode);
    debugLogger.log('useLinkedInMobile initialized', {
      redirectUri,
      clientId,
      scope,
      state: state || 'auto-generated',
      debugMode,
      pollInterval,
      maxPollAttempts,
    });
  }, [
    debugMode,
    redirectUri,
    clientId,
    scope,
    state,
    debugLogger,
    pollInterval,
    maxPollAttempts,
  ]);

  // Cleanup function
  const cleanup = useCallback(() => {
    debugLogger.log('Cleaning up mobile LinkedIn authentication');

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }

    pollAttemptsRef.current = 0;
    setIsLoading(false);
  }, [debugLogger]);

  // Poll for authentication results
  const pollForResult = useCallback(
    (expectedState: string) => {
      debugLogger.log('Starting polling for authentication result', {
        expectedState,
        pollInterval,
        maxPollAttempts,
      });

      pollAttemptsRef.current = 0;

      pollIntervalRef.current = window.setInterval(() => {
        pollAttemptsRef.current++;

        debugLogger.log('Polling attempt', {
          attempt: pollAttemptsRef.current,
          maxAttempts: maxPollAttempts,
        });

        // Check if popup is closed
        if (popupRef.current && popupRef.current.closed) {
          debugLogger.log('Popup window was closed by user');
          cleanup();

          if (onError) {
            onError({
              error: 'user_closed_popup',
              errorMessage: closePopupMessage,
            });
          }
          return;
        }

        // Check for result in localStorage
        const result = getLinkedInMobileResult();
        if (result) {
          debugLogger.log('Authentication result found in storage', {
            hasCode: !!result.code,
            hasError: !!result.error,
            state: result.state,
          });

          // Validate state to prevent CSRF attacks
          if (result.state !== expectedState) {
            debugLogger.error('State validation failed', {
              receivedState: result.state,
              expectedState,
              match: result.state === expectedState,
            });

            cleanup();
            clearLinkedInMobileResult();

            if (onError) {
              onError({
                error: 'invalid_state',
                errorMessage: 'Authentication state validation failed',
              });
            }
            return;
          }

          // Clear the result from storage
          clearLinkedInMobileResult();
          cleanup();

          if (result.error) {
            debugLogger.log('Error result received', {
              error: result.error,
              errorMessage: result.errorMessage,
            });

            if (onError) {
              onError({
                error: result.error,
                errorMessage: result.errorMessage || 'Authentication failed',
              });
            }
          } else if (result.code) {
            debugLogger.log('Success result received', {
              code: result.code,
            });

            if (onSuccess) {
              onSuccess(result.code);
            }
          }
          return;
        }

        // Check if we've exceeded max attempts
        if (pollAttemptsRef.current >= maxPollAttempts) {
          debugLogger.warn('Polling timeout reached', {
            attempts: pollAttemptsRef.current,
            maxAttempts: maxPollAttempts,
          });

          cleanup();

          if (onError) {
            onError({
              error: 'polling_timeout',
              errorMessage: 'Authentication polling timed out',
            });
          }
        }
      }, pollInterval);
    },
    [
      debugLogger,
      pollInterval,
      maxPollAttempts,
      closePopupMessage,
      onError,
      onSuccess,
      cleanup,
    ],
  );

  // Main login function
  const linkedInLogin = useCallback(() => {
    debugLogger.log('Starting mobile LinkedIn login process');

    if (isLoading) {
      debugLogger.warn('Login already in progress, ignoring new request');
      return;
    }

    setIsLoading(true);

    // Close any existing popup
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    // Generate state
    const generatedState = state || generateRandomString();
    debugLogger.log('Generated OAuth state', {
      state: generatedState,
      wasProvided: !!state,
    });

    // Save state to localStorage
    const success = setLinkedInState(generatedState);
    if (!success) {
      debugLogger.error('Failed to save state to localStorage');
      setIsLoading(false);

      if (onError) {
        onError({
          error: 'storage_error',
          errorMessage: 'Failed to save OAuth state',
        });
      }
      return;
    }

    // Clear any previous mobile result
    clearLinkedInMobileResult();
    debugLogger.log('Cleared previous mobile authentication result');

    // Build authorization URL
    const authUrl = buildLinkedInAuthUrl({
      clientId,
      redirectUri,
      scope,
      state: generatedState,
    });
    debugLogger.log('Generated LinkedIn OAuth URL', { url: authUrl });

    // Open authentication popup
    const popupProperties = getPopupPositionProperties({
      width: 500,
      height: 600,
    });
    debugLogger.log('Opening authentication popup', {
      url: authUrl,
      properties: popupProperties,
    });

    try {
      popupRef.current = window.open(authUrl, '_blank', popupProperties);

      if (!popupRef.current) {
        debugLogger.error('Failed to open popup window');
        setIsLoading(false);

        if (onError) {
          onError({
            error: 'popup_blocked',
            errorMessage: 'Popup was blocked by the browser',
          });
        }
        return;
      }

      // Start polling for results
      pollForResult(generatedState);
    } catch (error) {
      debugLogger.error('Error opening popup window', error);
      setIsLoading(false);

      if (onError) {
        onError({
          error: 'popup_error',
          errorMessage: 'Failed to open authentication popup',
        });
      }
    }
  }, [
    debugLogger,
    isLoading,
    state,
    clientId,
    redirectUri,
    scope,
    onError,
    pollForResult,
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

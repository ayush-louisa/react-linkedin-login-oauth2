/**
 * useLinkedInMobile hook - mobile-optimized LinkedIn OAuth2 for Flutter webviews
 * @module hooks/useLinkedInMobile
 *
 * This hook provides a mobile-optimized authentication flow that works when the React app
 * is running in a Flutter webview, specifically designed for InAppBrowser environments.
 *
 * Key differences from standard implementation:
 * - Uses localStorage storage events instead of polling for real-time updates
 * - Falls back to periodic checks only as a safety mechanism
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
  LINKEDIN_OAUTH2_MOBILE_RESULT_KEY,
} from '../core/storage';
import type { LinkedInMobileResult } from '../core/storage';
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
  fallbackCheckInterval = 2000, // Fallback check every 2 seconds
  maxWaitTime = 300000, // 5 minutes max wait time
}: UseLinkedInMobileConfig) {
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const expectedStateRef = useRef<string>('');
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
      fallbackCheckInterval,
      maxWaitTime,
    });
  }, [
    debugMode,
    redirectUri,
    clientId,
    scope,
    state,
    debugLogger,
    fallbackCheckInterval,
    maxWaitTime,
  ]);

  // Handle authentication result
  const handleAuthResult = useCallback(
    (result: LinkedInMobileResult, source: string) => {
      if (!result || !expectedStateRef.current) {
        return;
      }

      debugLogger.log(`Authentication result received from ${source}`, {
        hasCode: !!result.code,
        hasError: !!result.error,
        state: result.state,
        expectedState: expectedStateRef.current,
      });

      // Validate state to prevent CSRF attacks
      if (result.state !== expectedStateRef.current) {
        debugLogger.error('State validation failed', {
          receivedState: result.state,
          expectedState: expectedStateRef.current,
        });

        // Clear result and cleanup
        clearLinkedInMobileResult();
        expectedStateRef.current = '';
        setIsLoading(false);

        if (onError) {
          onError({
            error: 'invalid_state',
            errorMessage: 'Authentication state validation failed',
          });
        }
        return;
      }

      // Clear the result from storage and cleanup
      clearLinkedInMobileResult();
      expectedStateRef.current = '';
      setIsLoading(false);

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
    },
    [debugLogger, onError, onSuccess],
  );

  // Storage event listener for real-time updates
  const handleStorageEvent = useCallback(
    (event: StorageEvent) => {
      if (event.key === LINKEDIN_OAUTH2_MOBILE_RESULT_KEY && event.newValue) {
        debugLogger.log('Storage event detected for mobile result');

        try {
          const result = JSON.parse(event.newValue);
          handleAuthResult(result, 'storage event');
        } catch (error) {
          debugLogger.error('Failed to parse storage event data', error);
        }
      }
    },
    [debugLogger, handleAuthResult],
  );

  // Fallback check function (less frequent than polling)
  const checkForResult = useCallback(() => {
    if (!expectedStateRef.current) {
      return;
    }

    // Check if popup is closed
    if (popupRef.current && popupRef.current.closed) {
      debugLogger.log('Popup window was closed by user');

      // Cleanup state
      expectedStateRef.current = '';
      setIsLoading(false);

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
      handleAuthResult(result, 'fallback check');
    }
  }, [debugLogger, closePopupMessage, onError, handleAuthResult]);

  // Cleanup function
  const cleanup = useCallback(() => {
    debugLogger.log('Cleaning up mobile LinkedIn authentication');

    // Remove storage event listener
    window.removeEventListener('storage', handleStorageEvent);

    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }

    expectedStateRef.current = '';
    setIsLoading(false);
  }, [debugLogger, handleStorageEvent]);

  // Main login function
  const linkedInLogin = useCallback(() => {
    debugLogger.log('Starting mobile LinkedIn login process');

    // Validate required configuration
    if (!clientId || !redirectUri) {
      debugLogger.error('Missing required configuration', {
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
      });

      if (onError) {
        onError({
          error: 'configuration_error',
          errorMessage: 'Missing required LinkedIn OAuth configuration',
        });
      }
      return;
    }

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
    expectedStateRef.current = generatedState;

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

    try {
      // Open authentication popup
      const popupProperties = getPopupPositionProperties({
        width: 500,
        height: 600,
      });
      debugLogger.log('Opening authentication popup', {
        url: authUrl,
        properties: popupProperties,
      });

      popupRef.current = window.open(authUrl, '_blank', popupProperties);

      if (!popupRef.current) {
        debugLogger.error('Failed to open popup window');
        expectedStateRef.current = '';
        setIsLoading(false);

        if (onError) {
          onError({
            error: 'popup_blocked',
            errorMessage: 'Popup was blocked by the browser',
          });
        }
        return;
      }

      // Set up storage listener for real-time updates
      debugLogger.log('Setting up storage event listener');
      window.addEventListener('storage', handleStorageEvent);

      // Set up fallback interval check (less frequent)
      debugLogger.log('Setting up fallback check interval');
      fallbackIntervalRef.current = window.setInterval(
        checkForResult,
        fallbackCheckInterval,
      );

      // Set up timeout
      debugLogger.log('Setting up authentication timeout');
      timeoutRef.current = window.setTimeout(() => {
        debugLogger.warn('Authentication timeout reached');
        cleanup();

        if (onError) {
          onError({
            error: 'authentication_timeout',
            errorMessage: 'Authentication timed out',
          });
        }
      }, maxWaitTime);
    } catch (error) {
      debugLogger.error('Error opening popup window', error);
      expectedStateRef.current = '';
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
    handleStorageEvent,
    checkForResult,
    fallbackCheckInterval,
    maxWaitTime,
    cleanup,
  ]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      debugLogger.log(
        'Component unmounting - cleaning up mobile LinkedIn authentication',
      );

      // Clean up intervals and timeouts
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Close popup
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
        popupRef.current = null;
      }

      // Clear state
      expectedStateRef.current = '';
      setIsLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies to prevent re-running - only cleanup on unmount

  return {
    linkedInLogin,
    isLoading,
  };
}

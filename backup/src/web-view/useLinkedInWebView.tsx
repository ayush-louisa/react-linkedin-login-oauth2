import { useCallback, useEffect, useRef } from 'react';
import type { useLinkedInType } from '../types';
import { LINKEDIN_OAUTH2_STATE } from '../utils';

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

// Detect if we're running in a mobile webview environment
const isInMobileWebView = () => {
  const userAgent =
    navigator.userAgent ||
    navigator.vendor ||
    (window as unknown as { opera?: string }).opera ||
    '';

  // Common mobile webview indicators
  return (
    // Flutter WebView
    userAgent.includes('FlutterWebView') ||
    // React Native WebView
    userAgent.includes('ReactNative') ||
    // Cordova/PhoneGap
    userAgent.includes('Cordova') ||
    userAgent.includes('PhoneGap') ||
    // Ionic
    userAgent.includes('Ionic') ||
    // General mobile app webview patterns
    (userAgent.includes('Mobile') && userAgent.includes('WebView')) ||
    // Check for wv in Android WebView
    (userAgent.includes('Android') && userAgent.includes('wv'))
  );
};

/**
 * LinkedIn OAuth hook optimized for mobile WebView environments (Flutter WebView + InAppBrowser).
 * This version handles the scenario where the React SPA runs in a WebView and OAuth opens in an InAppBrowser.
 * It supports both popup-style authentication and direct navigation fallback.
 */
export function useLinkedInWebView({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
  debug = false,
}: useLinkedInType) {
  const popupRef = useRef<Window | null>(null);
  const popUpIntervalRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const setupCountRef = useRef(0);
  const isInWebView = isInMobileWebView();

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Shared debug logging utilities
  const debugLog = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn OAuth WebView] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugWarn = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.warn(`[LinkedIn OAuth WebView] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugError = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn OAuth WebView] ${message}`, ...args);
      }
    },
    [debug],
  );

  useEffect(() => {
    setupCountRef.current += 1;
    debugLog('Setting up WebView message listener', {
      setupCount: setupCountRef.current,
      isInWebView,
    });

    const receiveMessage = (event: MessageEvent) => {
      debugLog('WebView message received:', event.data);
      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);

      // In WebView environments, we're more permissive with origin checking
      // since the InAppBrowser might have a different origin
      const isValidOrigin =
        event.origin === window.location.origin ||
        event.origin === 'null' || // InAppBrowser might send null origin
        event.origin.includes(window.location.hostname);

      if (isValidOrigin || isInWebView) {
        if (event.data.errorMessage && event.data.from === 'Linked In') {
          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            debugError('State mismatch in error handler');
            if (popupRef.current) {
              popupRef.current.close();
            }
            return;
          }
          // Clear the interval before calling onError to prevent race condition
          if (popUpIntervalRef.current !== null) {
            window.clearInterval(popUpIntervalRef.current);
            popUpIntervalRef.current = null;
          }
          debugLog('Calling onError callback');
          if (onErrorRef.current) {
            onErrorRef.current(event.data);
          }
          if (popupRef.current) {
            popupRef.current.close();
          }
        } else if (event.data.code && event.data.from === 'Linked In') {
          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            debugError('State mismatch in success handler');
            if (popupRef.current) {
              popupRef.current.close();
            }
            return;
          }
          // Clear the interval before calling onSuccess to prevent race condition
          if (popUpIntervalRef.current !== null) {
            window.clearInterval(popUpIntervalRef.current);
            popUpIntervalRef.current = null;
          }
          debugLog(
            'About to call onSuccess with code:',
            event.data.code.substring(0, 20) + '...',
          );
          if (onSuccessRef.current) {
            debugLog('onSuccessRef exists, calling callback');
            onSuccessRef.current(event.data.code);
            debugLog('onSuccess callback completed');
          } else {
            debugWarn('onSuccessRef is null');
          }
          if (popupRef.current) {
            popupRef.current.close();
          }
        }
      } else {
        debugWarn('Message received from untrusted origin:', event.origin);
      }
    };

    window.addEventListener('message', receiveMessage, false);

    return () => {
      debugLog('Cleaning up WebView message listener', {
        setupCount: setupCountRef.current,
      });
      window.removeEventListener('message', receiveMessage, false);

      if (popupRef.current) {
        popupRef.current.close();
        popupRef.current = null;
      }
      if (popUpIntervalRef.current) {
        if (popUpIntervalRef.current !== null) {
          window.clearInterval(popUpIntervalRef.current);
        }
        popUpIntervalRef.current = null;
      }
    };
  }, [debug, debugLog, debugWarn, debugError, isInWebView]);

  const getUrl = () => {
    const scopeParam = `&scope=${encodeURI(scope)}`;
    const generatedState = state || generateRandomString();
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    const linkedInAuthLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${generatedState}`;
    return linkedInAuthLink;
  };

  const linkedInLogin = () => {
    debugLog('Starting LinkedIn login flow for WebView', { isInWebView });
    popupRef.current?.close();

    const authUrl = getUrl();

    if (isInWebView) {
      // In WebView environments, try to open in InAppBrowser first
      // If that fails, fallback to direct navigation
      try {
        debugLog('Attempting to open in InAppBrowser/popup for WebView');
        popupRef.current = window.open(
          authUrl,
          '_blank',
          'location=yes,toolbar=yes',
        );

        // Check if popup was successfully opened
        if (!popupRef.current || popupRef.current.closed) {
          debugWarn('Popup failed to open, falling back to direct navigation');
          window.location.href = authUrl;
          return;
        }
      } catch (error) {
        debugError(
          'Error opening popup, falling back to direct navigation:',
          error,
        );
        window.location.href = authUrl;
        return;
      }
    } else {
      // Standard popup for non-WebView environments
      popupRef.current = window.open(
        authUrl,
        '_blank',
        'width=600,height=600,scrollbars=yes,resizable=yes',
      );
    }

    debugLog('Authentication window opened');

    // Set up popup monitoring
    if (popUpIntervalRef.current) {
      if (popUpIntervalRef.current !== null) {
        window.clearInterval(popUpIntervalRef.current);
      }
      popUpIntervalRef.current = null;
    }

    popUpIntervalRef.current = window.setInterval(() => {
      try {
        if (popupRef.current && popupRef.current.closed) {
          debugWarn('Authentication window was closed by user');
          if (popUpIntervalRef.current !== null) {
            window.clearInterval(popUpIntervalRef.current);
          }
          popUpIntervalRef.current = null;
          if (onErrorRef.current) {
            onErrorRef.current({
              error: 'user_closed_popup',
              errorMessage: closePopupMessage,
            });
          }
        }
      } catch (error) {
        debugError('Error in popup interval check:', error);
        if (popUpIntervalRef.current !== null) {
          window.clearInterval(popUpIntervalRef.current);
        }
        popUpIntervalRef.current = null;
      }
    }, 1000);
  };

  return {
    linkedInLogin,
    isInWebView, // Expose this for debugging/conditional UI
  };
}

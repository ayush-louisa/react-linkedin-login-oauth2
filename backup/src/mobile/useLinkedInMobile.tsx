import { useCallback, useEffect, useRef, useState } from 'react';
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

interface MobileConfig {
  /** Whether to open LinkedIn in same window (true) or try new window (false) */
  useSameWindow?: boolean;
  /** Custom URL scheme for deep linking back to app (e.g., 'myapp://') */
  customScheme?: string;
  /** Whether to use polling for completion check */
  usePolling?: boolean;
  /** Polling configuration if usePolling is true */
  pollingConfig?: {
    endpoint: string;
    interval?: number;
    timeout?: number;
  };
}

interface useLinkedInMobileType extends useLinkedInType {
  mobile?: MobileConfig;
}

export function useLinkedInMobile({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'r_emailaddress',
  state = '',
  closePopupMessage = 'User closed the popup',
  debug = false,
  mobile = {},
}: useLinkedInMobileType) {
  const [isLoading, setIsLoading] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const pollingIntervalRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>('');
  const originalUrlRef = useRef<string>('');

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const {
    useSameWindow = true,
    customScheme,
    usePolling = false,
    pollingConfig,
  } = mobile;

  const debugLog = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn Mobile OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugError = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn Mobile OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  const isInWebView = useCallback(() => {
    const userAgent = navigator.userAgent;

    // Android WebView detection
    const isAndroidWebView = /wv/.test(userAgent) && /Android/.test(userAgent);

    // iOS WebView detection
    const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(
      userAgent,
    );

    // Additional checks for common webview containers
    const isWebView =
      !!(window as unknown as { ReactNativeWebView?: unknown })
        .ReactNativeWebView ||
      !!(window as unknown as { webkit?: { messageHandlers?: unknown } }).webkit
        ?.messageHandlers ||
      /WebView/.test(userAgent) ||
      /; ?wv\)/.test(userAgent);

    return isAndroidWebView || isIOSWebView || isWebView;
  }, []);

  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const pollForCompletion = useCallback(
    async (sessionId: string) => {
      if (!pollingConfig?.endpoint) {
        debugError('Polling endpoint not configured');
        return;
      }

      const startTime = Date.now();
      const timeout = pollingConfig.timeout || 300000; // 5 minutes default
      const interval = pollingConfig.interval || 3000; // 3 seconds for mobile

      debugLog(`Starting mobile polling for session: ${sessionId}`);

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
            `${pollingConfig.endpoint}?session=${sessionId}`,
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
          debugLog('Mobile polling response:', result);

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
        } catch (error) {
          debugError('Mobile polling error:', error);
          // Continue polling on network errors
        }
      }, interval);
    },
    [pollingConfig, cleanup, debugLog, debugError],
  );

  // Handle URL changes for same-window approach
  useEffect(() => {
    if (!useSameWindow) return;

    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);

      debugLog('URL change detected:', currentUrl);

      // Check if this is a LinkedIn callback
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const receivedState = urlParams.get('state');
      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);

      if (code || error) {
        debugLog('LinkedIn callback detected');

        // Verify state
        if (receivedState !== savedState) {
          debugError('State mismatch in mobile callback');
          onErrorRef.current?.({
            error: 'state_mismatch',
            errorMessage: 'Security validation failed',
          });
          return;
        }

        setIsLoading(false);

        if (code) {
          debugLog('Mobile authentication successful');
          onSuccessRef.current?.(code);
        } else if (error) {
          const errorDescription =
            urlParams.get('error_description') || 'Authentication failed';
          debugLog('Mobile authentication error:', error);
          onErrorRef.current?.({
            error: error,
            errorMessage: errorDescription,
          });
        }

        // Restore original URL if available
        if (originalUrlRef.current && originalUrlRef.current !== currentUrl) {
          debugLog('Restoring original URL:', originalUrlRef.current);
          window.history.replaceState({}, '', originalUrlRef.current);
        }
      }
    };

    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);

    // Also check on mount in case we're already on the callback URL
    handleUrlChange();

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [useSameWindow, debugLog, debugError]);

  const getAuthUrl = useCallback(() => {
    const scopeParam = `&scope=${encodeURI(scope)}`;
    const generatedState = state || generateRandomString();
    const sessionId = generateRandomString(32);

    sessionIdRef.current = sessionId;
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    localStorage.setItem('linkedin_session_id', sessionId);

    // For polling approach, append session to state
    const finalState = usePolling
      ? `${generatedState}.${sessionId}`
      : generatedState;

    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${finalState}`;
  }, [scope, state, clientId, redirectUri, usePolling]);

  const linkedInLogin = useCallback(() => {
    if (isLoading) {
      debugLog('Login already in progress');
      return;
    }

    debugLog('Starting mobile LinkedIn login flow');
    debugLog('Is in WebView:', isInWebView());
    debugLog('Use same window:', useSameWindow);

    setIsLoading(true);
    cleanup();

    const authUrl = getAuthUrl();
    debugLog('Auth URL:', authUrl);

    if (useSameWindow) {
      // Store current URL for restoration
      originalUrlRef.current = window.location.href;

      // Start polling if configured
      if (usePolling && pollingConfig?.endpoint) {
        pollForCompletion(sessionIdRef.current);
      }

      // Navigate to LinkedIn in same window
      debugLog('Navigating to LinkedIn in same window');
      window.location.href = authUrl;
    } else {
      // Try to open in new window (may be blocked in webview)
      debugLog('Attempting to open LinkedIn in new window');

      const newWindow = window.open(authUrl, '_blank');

      if (!newWindow) {
        debugLog('New window blocked, falling back to same window');
        // Fallback to same window if popup is blocked
        originalUrlRef.current = window.location.href;

        if (usePolling && pollingConfig?.endpoint) {
          pollForCompletion(sessionIdRef.current);
        }

        window.location.href = authUrl;
      } else {
        // Monitor the new window
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
            onErrorRef.current?.({
              error: 'user_closed_popup',
              errorMessage: closePopupMessage,
            });
          }
        }, 1000);

        // Start polling if configured
        if (usePolling && pollingConfig?.endpoint) {
          pollForCompletion(sessionIdRef.current);
        }
      }
    }
  }, [
    isLoading,
    isInWebView,
    useSameWindow,
    usePolling,
    pollingConfig,
    getAuthUrl,
    pollForCompletion,
    cleanup,
    closePopupMessage,
    debugLog,
  ]);

  // Handle custom scheme URLs (for deep linking)
  useEffect(() => {
    if (!customScheme) return;

    interface CustomSchemeEvent {
      url?: string;
      detail?: { url?: string };
    }

    const handleCustomScheme = (event: CustomSchemeEvent) => {
      const url = event.url || event.detail?.url;
      if (url && url.startsWith(customScheme)) {
        debugLog('Custom scheme URL received:', url);

        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          const error = urlObj.searchParams.get('error');
          const receivedState = urlObj.searchParams.get('state');
          const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);

          if (receivedState !== savedState) {
            debugError('State mismatch in custom scheme callback');
            onErrorRef.current?.({
              error: 'state_mismatch',
              errorMessage: 'Security validation failed',
            });
            return;
          }

          cleanup();

          if (code) {
            onSuccessRef.current?.(code);
          } else if (error) {
            const errorDescription =
              urlObj.searchParams.get('error_description') ||
              'Authentication failed';
            onErrorRef.current?.({
              error: error,
              errorMessage: errorDescription,
            });
          }
        } catch (error) {
          debugError('Error parsing custom scheme URL:', error);
          onErrorRef.current?.({
            error: 'url_parse_error',
            errorMessage: 'Failed to parse callback URL',
          });
        }
      }
    };

    // Listen for custom scheme events (varies by platform)
    document.addEventListener(
      'customScheme',
      handleCustomScheme as EventListener,
    );
    window.addEventListener(
      'customScheme',
      handleCustomScheme as EventListener,
    );

    // For React Native WebView
    if (
      (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView
    ) {
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'customScheme') {
            handleCustomScheme({ url: data.url });
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      (
        window as unknown as {
          addEventListener: typeof window.addEventListener;
        }
      ).addEventListener('message', messageHandler);
    }

    return () => {
      document.removeEventListener(
        'customScheme',
        handleCustomScheme as EventListener,
      );
      window.removeEventListener(
        'customScheme',
        handleCustomScheme as EventListener,
      );
    };
  }, [customScheme, cleanup, debugLog, debugError]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    linkedInLogin,
    isLoading,
    isInWebView: isInWebView(),
  };
}

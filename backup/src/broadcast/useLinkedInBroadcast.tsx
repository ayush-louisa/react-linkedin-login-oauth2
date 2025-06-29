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

export function useLinkedInBroadcast({
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
  const popupCheckIntervalRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>('');

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const debugLog = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn OAuth Broadcast] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugError = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn OAuth Broadcast] ${message}`, ...args);
      }
    },
    [debug],
  );

  const cleanup = useCallback(() => {
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
      popupCheckIntervalRef.current = null;
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
      broadcastChannelRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setIsLoading(false);
  }, []);

  // Set up broadcast channel communication
  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      debugError('BroadcastChannel not supported in this browser');
      return;
    }

    const channelName = 'linkedin-oauth-channel';
    broadcastChannelRef.current = new BroadcastChannel(channelName);

    broadcastChannelRef.current.onmessage = (event) => {
      debugLog('BroadcastChannel message received:', event.data);

      const { type, sessionId, ...data } = event.data;

      // Verify this message is for our session
      if (sessionId !== sessionIdRef.current) {
        debugLog('Message session ID mismatch, ignoring');
        return;
      }

      if (type === 'LINKEDIN_SUCCESS') {
        const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
        if (data.state !== savedState) {
          debugError('State mismatch in success handler');
          cleanup();
          return;
        }

        cleanup();
        debugLog('LinkedIn authentication successful');
        onSuccessRef.current?.(data.code);
      } else if (type === 'LINKEDIN_ERROR') {
        const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
        if (data.state !== savedState) {
          debugError('State mismatch in error handler');
          cleanup();
          return;
        }

        cleanup();
        debugLog('LinkedIn authentication error:', data);
        onErrorRef.current?.({
          error: data.error || 'oauth_error',
          errorMessage: data.errorMessage || 'OAuth authentication failed',
        });
      }
    };

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [cleanup, debugLog, debugError]);

  const linkedInLogin = useCallback(() => {
    if (isLoading) {
      debugLog('Login already in progress');
      return;
    }

    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      onErrorRef.current?.({
        error: 'not_supported',
        errorMessage: 'BroadcastChannel not supported in this browser',
      });
      return;
    }

    debugLog('Starting LinkedIn login flow');
    setIsLoading(true);

    // Clean up any existing popup
    cleanup();

    const generatedState = state || generateRandomString();
    const sessionId = generateRandomString(32);
    sessionIdRef.current = sessionId;

    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    localStorage.setItem('linkedin_session_id', sessionId);

    const scopeParam = `&scope=${encodeURI(scope)}`;
    const linkedInAuthLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${generatedState}`;

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

    debugLog('Popup opened, monitoring for closure');

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

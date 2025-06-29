import { useCallback, useEffect, useRef } from 'react';
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
  const popupRef = useRef<Window | null>(null);
  const popUpIntervalRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const setupCountRef = useRef(0);

  // Test if debug parameter is being passed - temporary
  if (debug) {
    console.log('🔥 DEBUG MODE ENABLED IN useLinkedIn');
  }

  // Keep refs up to date
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Shared debug logging utilities
  const debugLog = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugWarn = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.warn(`[LinkedIn OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  const debugError = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn OAuth] ${message}`, ...args);
      }
    },
    [debug],
  );

  useEffect(() => {
    setupCountRef.current += 1;
    debugLog('Setting up message listener', {
      setupCount: setupCountRef.current,
    });

    const receiveMessage = (event: MessageEvent) => {
      debugLog('Message received:', event.data);
      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
      if (event.origin === window.location.origin) {
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
      }
    };

    window.addEventListener('message', receiveMessage, false);

    return () => {
      debugLog('Cleaning up message listener', {
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
  }, [debug, debugLog, debugWarn, debugError]); // Include debug functions as dependencies

  const getUrl = () => {
    const scopeParam = `&scope=${encodeURI(scope)}`;
    const generatedState = state || generateRandomString();
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    const linkedInAuthLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${generatedState}`;
    return linkedInAuthLink;
  };

  const linkedInLogin = () => {
    debugLog('Starting LinkedIn login flow');
    popupRef.current?.close();
    popupRef.current = window.open(
      getUrl(),
      '_blank',
      getPopupPositionProperties({ width: 600, height: 600 }),
    );
    debugLog('Popup opened');

    if (popUpIntervalRef.current) {
      if (popUpIntervalRef.current !== null) {
        window.clearInterval(popUpIntervalRef.current);
      }
      popUpIntervalRef.current = null;
    }
    popUpIntervalRef.current = window.setInterval(() => {
      try {
        if (popupRef.current && popupRef.current.closed) {
          debugWarn('Popup was closed by user');
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
  };
}

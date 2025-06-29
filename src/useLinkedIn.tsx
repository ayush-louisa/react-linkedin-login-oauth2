import { useCallback, useEffect, useRef } from 'react';
import type { useLinkedInType } from './types';
import { LINKEDIN_OAUTH2_STATE } from './utils';
import { debug, setDebugMode } from './debug';

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
  debug: debugMode = false,
}: useLinkedInType) {
  const popupRef = useRef<Window | null>(null);
  const popUpIntervalRef = useRef<number | null>(null);

  // Initialize debug mode
  useEffect(() => {
    setDebugMode(debugMode);
    debug.log('useLinkedIn initialized', {
      redirectUri,
      clientId,
      scope,
      state: state || 'auto-generated',
      debugMode,
    });
  }, [debugMode, redirectUri, clientId, scope, state]);

  const receiveMessage = useCallback(
    (event: MessageEvent) => {
      debug.log('Received message event', {
        origin: event.origin,
        windowOrigin: window.location.origin,
        data: event.data,
      });

      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
      debug.log('Retrieved saved state for validation', { savedState });

      if (event.origin === window.location.origin) {
        if (event.data.errorMessage && event.data.from === 'Linked In') {
          debug.log('Processing error message from LinkedIn callback');

          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            debug.error('State validation failed in error handler', {
              receivedState: event.data.state,
              savedState,
              match: event.data.state === savedState,
            });
            if (popupRef.current) {
              popupRef.current.close();
            }
            return;
          }

          debug.log('Calling onError callback', event.data);
          if (onError) {
            onError(event.data);
          }
          if (popupRef.current) {
            debug.log('Closing popup after error');
            popupRef.current.close();
          }
        } else if (event.data.code && event.data.from === 'Linked In') {
          debug.log('Processing success message with authorization code');

          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            debug.error('State validation failed in success handler', {
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

          debug.log('Calling onSuccess callback', { code: event.data.code });
          if (onSuccess) {
            onSuccess(event.data.code);
          }
          if (popupRef.current) {
            debug.log('Closing popup after success');
            popupRef.current.close();
          }
        }
      } else {
        debug.warn('Message received from unauthorized origin', {
          received: event.origin,
          expected: window.location.origin,
        });
      }
    },
    [onError, onSuccess],
  );

  useEffect(() => {
    debug.log('Setting up cleanup function');
    return () => {
      debug.log('Cleaning up useLinkedIn hook');
      window.removeEventListener('message', receiveMessage, false);

      if (popupRef.current) {
        debug.log('Closing popup in cleanup');
        popupRef.current.close();
        popupRef.current = null;
      }
      if (popUpIntervalRef.current) {
        if (popUpIntervalRef.current !== null) {
          debug.log('Clearing popup interval in cleanup');
          window.clearInterval(popUpIntervalRef.current);
        }
        popUpIntervalRef.current = null;
      }
    };
  }, [receiveMessage]);

  useEffect(() => {
    debug.log('Adding message event listener');
    window.addEventListener('message', receiveMessage, false);
    return () => {
      debug.log('Removing message event listener');
      window.removeEventListener('message', receiveMessage, false);
    };
  }, [receiveMessage]);

  const getUrl = () => {
    const scopeParam = `&scope=${encodeURI(scope)}`;
    const generatedState = state || generateRandomString();
    debug.log('Generated OAuth state', {
      state: generatedState,
      wasProvided: !!state,
    });

    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    debug.log('Saved state to localStorage');

    const linkedInAuthLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${generatedState}`;
    debug.log('Generated LinkedIn OAuth URL', { url: linkedInAuthLink });

    return linkedInAuthLink;
  };

  const linkedInLogin = () => {
    debug.log('Starting LinkedIn login process');

    popupRef.current?.close();
    const authUrl = getUrl();
    const popupProperties = getPopupPositionProperties({
      width: 600,
      height: 600,
    });

    debug.log('Opening popup window', {
      url: authUrl,
      properties: popupProperties,
    });

    popupRef.current = window.open(authUrl, '_blank', popupProperties);

    if (popUpIntervalRef.current) {
      if (popUpIntervalRef.current !== null) {
        debug.log('Clearing existing popup interval');
        window.clearInterval(popUpIntervalRef.current);
      }
      popUpIntervalRef.current = null;
    }

    debug.log('Setting up popup monitoring interval');
    popUpIntervalRef.current = window.setInterval(() => {
      try {
        if (popupRef.current && popupRef.current.closed) {
          debug.log('Popup was closed by user');

          if (popUpIntervalRef.current !== null) {
            window.clearInterval(popUpIntervalRef.current);
          }
          popUpIntervalRef.current = null;

          if (onError) {
            debug.log('Calling onError for popup closure', {
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
        debug.error('Error in popup monitoring interval', error);
        console.error(error);
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

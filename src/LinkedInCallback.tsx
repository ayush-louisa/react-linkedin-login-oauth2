import { useEffect, useState } from 'react';
import { LINKEDIN_OAUTH2_STATE, parse } from './utils';
import { debug, setDebugMode } from './debug';

type ParamsType = {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
};

interface LinkedInCallbackProps {
  debug?: boolean;
}

export function LinkedInCallback({
  debug: debugMode = false,
}: LinkedInCallbackProps = {}) {
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setDebugMode(debugMode);
    debug.log('LinkedInCallback initialized', { debugMode });

    const params = parse(window.location.search) as ParamsType;
    debug.log('Parsed URL parameters', params);

    const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
    debug.log('Retrieved saved state from localStorage', { savedState });

    if (params.state !== savedState) {
      const error = 'State does not match';
      debug.error('State validation failed', {
        receivedState: params.state,
        savedState,
        match: params.state === savedState,
      });
      setErrorMessage(error);
    } else if (params.error) {
      const errorMessage =
        params.error_description || 'Login failed. Please try again.';
      debug.error('OAuth error received', {
        error: params.error,
        errorDescription: params.error_description,
        finalErrorMessage: errorMessage,
      });

      if (window.opener) {
        debug.log('Posting error message to parent window', {
          error: params.error,
          state: params.state,
          errorMessage,
          from: 'Linked In',
        });
        window.opener.postMessage(
          {
            error: params.error,
            state: params.state,
            errorMessage,
            from: 'Linked In',
          },
          window.location.origin,
        );
      } else {
        debug.warn('No window.opener available to post error message');
      }

      // Close tab if user cancelled login
      if (params.error === 'user_cancelled_login') {
        debug.log('User cancelled login, closing popup window');
        window.close();
      }
    }

    if (params.code) {
      debug.log('Authorization code received', {
        code: params.code,
        state: params.state,
      });

      if (window.opener) {
        debug.log('Posting success message to parent window', {
          code: params.code,
          state: params.state,
          from: 'Linked In',
        });
        window.opener.postMessage(
          { code: params.code, state: params.state, from: 'Linked In' },
          window.location.origin,
        );
      } else {
        debug.warn('No window.opener available to post success message');
      }
    }
  }, [debugMode]);

  return <div>{errorMessage}</div>;
}

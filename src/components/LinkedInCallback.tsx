/**
 * LinkedInCallback component - modular implementation
 * @module components/LinkedInCallback
 */

import { useEffect, useState } from 'react';
import type { LinkedInCallbackConfig } from '../types/components';
import type { LinkedInCallbackParams } from '../types/base';
import { parseUrlParams } from '../core/url';
import { getLinkedInState, clearLinkedInState } from '../core/storage';
import { createDebugLogger, setDebugMode } from '../core/debug';

/**
 * LinkedIn OAuth2 callback component
 * Handles the OAuth2 callback and posts results to parent window
 * @param props - Callback component configuration
 * @returns JSX element
 */
export function LinkedInCallback({
  debug: debugMode = false,
}: LinkedInCallbackConfig = {}): JSX.Element {
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const logger = createDebugLogger('LinkedIn OAuth2');
    setDebugMode(debugMode);
    logger.log('LinkedInCallback initialized', { debugMode });

    const params = parseUrlParams(
      window.location.search,
    ) as unknown as LinkedInCallbackParams;
    logger.log('Parsed URL parameters', params);

    const savedState = getLinkedInState();
    logger.log('Retrieved saved state from localStorage', { savedState });

    if (params.state !== savedState) {
      const error = 'State does not match';
      logger.error('State validation failed', {
        receivedState: params.state,
        savedState,
        match: params.state === savedState,
      });
      setErrorMessage(error);
      // Clean up state even on validation failure
      clearLinkedInState();
    } else if (params.error) {
      const errorMessage =
        params.error_description || 'Login failed. Please try again.';
      logger.error('OAuth error received', {
        error: params.error,
        errorDescription: params.error_description,
        finalErrorMessage: errorMessage,
      });

      // Clean up state after processing error
      clearLinkedInState();

      if (window.opener) {
        logger.log('Posting error message to parent window', {
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
        logger.warn('No window.opener available to post error message');
      }

      // Close tab if user cancelled login or authorization
      if (
        params.error === 'user_cancelled_login' ||
        params.error === 'user_cancelled_authorize'
      ) {
        logger.log('User cancelled login/authorization, closing popup window', {
          error: params.error,
        });
        window.close();
      }
    }

    if (params.code) {
      logger.log('Authorization code received', {
        code: params.code,
        state: params.state,
      });

      if (window.opener) {
        logger.log('Posting success message to parent window', {
          code: params.code,
          state: params.state,
          from: 'Linked In',
        });
        window.opener.postMessage(
          { code: params.code, state: params.state, from: 'Linked In' },
          window.location.origin,
        );
      } else {
        logger.warn('No window.opener available to post success message');
      }
    }
  }, [debugMode]);

  return <div>{errorMessage}</div>;
}

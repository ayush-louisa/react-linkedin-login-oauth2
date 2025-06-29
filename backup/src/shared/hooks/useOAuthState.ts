/**
 * Common OAuth state management hook
 */

import { useCallback, useRef } from 'react';
import { LINKEDIN_OAUTH2_STATE } from '../../utils';
import {
  generateRandomString,
  buildLinkedInAuthUrl,
  validateState,
} from '../utils/auth';
import { createDebugLogger } from '../utils/debug';
import type { useLinkedInType } from '../../types';

export interface OAuthState {
  generatedState: string;
  sessionId: string;
  authUrl: string;
}

export interface UseOAuthStateOptions
  extends Omit<useLinkedInType, 'onSuccess' | 'onError'> {
  generateSessionId?: boolean;
}

export const useOAuthState = ({
  clientId,
  redirectUri,
  scope = 'r_emailaddress',
  state = '',
  debug = false,
  generateSessionId = false,
}: UseOAuthStateOptions) => {
  const logger = createDebugLogger('OAuth State', debug);
  const stateRef = useRef<OAuthState | null>(null);

  const createAuthState = useCallback(() => {
    const generatedState = state || generateRandomString();
    const sessionId = generateSessionId ? generateRandomString(32) : '';

    // For polling, append session to state
    const finalState = sessionId
      ? `${generatedState}.${sessionId}`
      : generatedState;

    const authUrl = buildLinkedInAuthUrl({
      clientId,
      redirectUri,
      scope,
      state: finalState,
    });

    const oauthState: OAuthState = {
      generatedState,
      sessionId,
      authUrl,
    };

    // Store state in localStorage for validation
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    if (sessionId) {
      localStorage.setItem('linkedin_session_id', sessionId);
    }

    stateRef.current = oauthState;
    logger.log('OAuth state created:', {
      generatedState,
      sessionId: sessionId.substring(0, 8) + '...',
    });

    return oauthState;
  }, [clientId, redirectUri, scope, state, generateSessionId, logger]);

  const validateAuthState = useCallback(
    (receivedState: string): boolean => {
      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
      const isValid = validateState(receivedState, savedState);

      if (!isValid) {
        logger.error('State validation failed', {
          received: receivedState,
          saved: savedState,
        });
      }

      return isValid;
    },
    [logger],
  );

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(LINKEDIN_OAUTH2_STATE);
    localStorage.removeItem('linkedin_session_id');
    stateRef.current = null;
    logger.log('OAuth state cleared');
  }, [logger]);

  return {
    createAuthState,
    validateAuthState,
    clearAuthState,
    getCurrentState: () => stateRef.current,
  };
};

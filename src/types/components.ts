/**
 * Component-specific types
 * @module types/components
 */

import type { LinkedInOAuthError } from './base';

/**
 * Base configuration for LinkedIn OAuth2
 */
export interface LinkedInOAuthConfig {
  /** LinkedIn application client ID */
  clientId: string;
  /** OAuth2 redirect URI */
  redirectUri: string;
  /** OAuth2 scope (space-separated for multiple scopes) */
  scope?: string;
  /** OAuth2 state parameter (auto-generated if not provided) */
  state?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Callback functions for OAuth2 flow
 */
export interface LinkedInOAuthCallbacks {
  /** Called when authorization code is received */
  onSuccess: (code: string) => void;
  /** Called when an error occurs */
  onError?: (error: LinkedInOAuthError) => void;
}

/**
 * Additional options for the OAuth2 flow
 */
export interface LinkedInOAuthOptions {
  /** Message shown when user closes popup */
  closePopupMessage?: string;
}

/**
 * Complete configuration for useLinkedIn hook
 */
export interface UseLinkedInConfig
  extends LinkedInOAuthConfig,
    LinkedInOAuthCallbacks,
    LinkedInOAuthOptions {}

/**
 * Configuration for LinkedIn component (render props)
 */
export interface LinkedInComponentConfig extends UseLinkedInConfig {
  /** Render prop function */
  children: (props: { linkedInLogin: () => void }) => JSX.Element;
}

/**
 * Configuration for LinkedInCallback component
 */
export interface LinkedInCallbackConfig {
  /** Enable debug logging */
  debug?: boolean;
}

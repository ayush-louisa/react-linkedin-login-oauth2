/**
 * Base types for LinkedIn OAuth2 library
 * @module types/base
 */

/**
 * OAuth2 error object structure
 */
export interface LinkedInOAuthError {
  error: string;
  errorMessage: string;
}

/**
 * OAuth2 callback data structure
 */
export interface LinkedInCallbackData {
  code?: string;
  error?: string;
  state: string;
  errorMessage?: string;
  from: string;
}

/**
 * OAuth2 URL parameters from LinkedIn callback
 */
export interface LinkedInCallbackParams {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
}

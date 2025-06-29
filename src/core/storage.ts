/**
 * Storage utilities for LinkedIn OAuth2 state management
 * @module core/storage
 */

export const LINKEDIN_OAUTH2_STATE_KEY = 'linkedin_oauth2_state';
export const LINKEDIN_OAUTH2_MOBILE_RESULT_KEY =
  'linkedin_oauth2_mobile_result';

/**
 * Mobile authentication result structure
 */
export interface LinkedInMobileResult {
  code?: string;
  error?: string;
  errorMessage?: string;
  state: string;
  timestamp: number;
}

/**
 * Safely gets value from localStorage
 * @param key - Storage key
 * @returns Value or null if not found/error
 */
export const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Safely sets value in localStorage
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success boolean
 */
export const setStorageItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely removes value from localStorage
 * @param key - Storage key
 * @returns Success boolean
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets LinkedIn OAuth2 state from storage
 * @returns State string or null
 */
export const getLinkedInState = (): string | null => {
  return getStorageItem(LINKEDIN_OAUTH2_STATE_KEY);
};

/**
 * Sets LinkedIn OAuth2 state in storage
 * @param state - State to store
 * @returns Success boolean
 */
export const setLinkedInState = (state: string): boolean => {
  return setStorageItem(LINKEDIN_OAUTH2_STATE_KEY, state);
};

/**
 * Removes LinkedIn OAuth2 state from storage
 * @returns Success boolean
 */
export const clearLinkedInState = (): boolean => {
  return removeStorageItem(LINKEDIN_OAUTH2_STATE_KEY);
};

/**
 * Sets LinkedIn OAuth2 mobile result in storage
 * @param result - Mobile authentication result
 * @returns Success boolean
 */
export const setLinkedInMobileResult = (
  result: LinkedInMobileResult,
): boolean => {
  return setStorageItem(
    LINKEDIN_OAUTH2_MOBILE_RESULT_KEY,
    JSON.stringify(result),
  );
};

/**
 * Gets LinkedIn OAuth2 mobile result from storage
 * @returns Mobile result object or null
 */
export const getLinkedInMobileResult = (): LinkedInMobileResult | null => {
  const stored = getStorageItem(LINKEDIN_OAUTH2_MOBILE_RESULT_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as LinkedInMobileResult;
  } catch {
    return null;
  }
};

/**
 * Removes LinkedIn OAuth2 mobile result from storage
 * @returns Success boolean
 */
export const clearLinkedInMobileResult = (): boolean => {
  return removeStorageItem(LINKEDIN_OAUTH2_MOBILE_RESULT_KEY);
};

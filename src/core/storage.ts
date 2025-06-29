/**
 * Storage utilities for LinkedIn OAuth2 state management
 * @module core/storage
 */

export const LINKEDIN_OAUTH2_STATE_KEY = 'linkedin_oauth2_state';

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

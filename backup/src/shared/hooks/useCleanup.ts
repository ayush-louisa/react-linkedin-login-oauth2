/**
 * Common cleanup functionality for OAuth flows
 */

import { useCallback, useRef, useEffect } from 'react';

export interface CleanupManager {
  addCleanupFunction: (fn: () => void) => void;
  cleanup: () => void;
  isCleanedUp: boolean;
}

export const useCleanupManager = (): CleanupManager => {
  const cleanupFunctions = useRef<(() => void)[]>([]);
  const isCleanedUpRef = useRef(false);

  const addCleanupFunction = useCallback((fn: () => void) => {
    if (!isCleanedUpRef.current) {
      cleanupFunctions.current.push(fn);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (isCleanedUpRef.current) return;

    cleanupFunctions.current.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });

    cleanupFunctions.current = [];
    isCleanedUpRef.current = true;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addCleanupFunction,
    cleanup,
    get isCleanedUp() {
      return isCleanedUpRef.current;
    },
  };
};

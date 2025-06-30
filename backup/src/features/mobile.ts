/**
 * Mobile/WebView-specific utilities
 * Only imported when using mobile authentication
 */

import { MOBILE_CONFIG } from '../config/constants';

export const detectWebView = (): boolean => {
  const userAgent = navigator.userAgent;

  // Android WebView detection
  const isAndroidWebView = /wv/.test(userAgent) && /Android/.test(userAgent);

  // iOS WebView detection
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(
    userAgent,
  );

  // Additional checks for common webview containers
  const isWebView =
    !!(window as unknown as { ReactNativeWebView?: unknown })
      .ReactNativeWebView ||
    !!(window as unknown as { webkit?: { messageHandlers?: unknown } }).webkit
      ?.messageHandlers ||
    /WebView/.test(userAgent) ||
    /; ?wv\)/.test(userAgent);

  return isAndroidWebView || isIOSWebView || isWebView;
};

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export const generateSessionId = (): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < MOBILE_CONFIG.SESSION_ID_LENGTH; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

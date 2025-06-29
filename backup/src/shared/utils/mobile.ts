/**
 * Mobile/WebView detection utilities
 */

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

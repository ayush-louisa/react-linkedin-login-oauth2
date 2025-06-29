import { useEffect } from 'react';
import { LINKEDIN_OAUTH2_STATE } from '../utils';

interface LinkedInCallbackWebViewProps {
  debug?: boolean;
}

/**
 * LinkedIn OAuth callback component optimized for mobile WebView environments.
 * This component handles the OAuth callback when the authentication flow returns to the SPA
 * from an InAppBrowser or similar mobile authentication window.
 *
 * It's designed to work seamlessly with the Flutter WebView + InAppBrowser setup
 * without requiring Flutter-to-React message passing.
 */
export function LinkedInCallbackWebView({
  debug = false,
}: LinkedInCallbackWebViewProps) {
  useEffect(() => {
    const debugLog = (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[LinkedIn Callback WebView] ${message}`, ...args);
      }
    };

    const debugError = (message: string, ...args: unknown[]) => {
      if (debug) {
        console.error(`[LinkedIn Callback WebView] ${message}`, ...args);
      }
    };

    debugLog('LinkedIn WebView callback component mounted');

    // Check if we're in a popup/InAppBrowser context
    const isInPopup = window.opener !== null && window.opener !== undefined;
    const isInWebView = window.self !== window.top || isInPopup;

    debugLog('Context detection:', { isInPopup, isInWebView });

    // Parse URL parameters
    const url = new URL(window.location.href);
    const urlParams = new URLSearchParams(url.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    debugLog('URL parameters:', {
      code: code?.substring(0, 20) + '...',
      state,
      error,
      errorDescription,
    });

    const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
    debugLog('Saved state from localStorage:', savedState);

    // Validate state to prevent CSRF attacks
    if (state !== savedState) {
      debugError('State mismatch - possible CSRF attack');
      const errorData = {
        error: 'invalid_state',
        errorMessage: 'State parameter mismatch',
        from: 'Linked In',
        state: savedState,
      };

      if (isInPopup && window.opener) {
        // Send error to parent window
        window.opener.postMessage(errorData, '*');
        window.close();
      } else {
        // Handle error in current window (fallback)
        console.error('LinkedIn OAuth error:', errorData);
        // You might want to redirect to an error page or handle this differently
        window.location.href = '/'; // Redirect to home or error page
      }
      return;
    }

    if (error) {
      debugError('OAuth error received:', error, errorDescription);
      const errorData = {
        error,
        errorMessage: errorDescription || 'Authentication failed',
        from: 'Linked In',
        state: savedState,
      };

      if (isInPopup && window.opener) {
        // Send error to parent window
        window.opener.postMessage(errorData, '*');
        window.close();
      } else {
        // Handle error in current window (fallback)
        console.error('LinkedIn OAuth error:', errorData);
        // You might want to redirect to an error page or handle this differently
        window.location.href = '/'; // Redirect to home or error page
      }
      return;
    }

    if (code) {
      debugLog('Authorization code received, sending to parent');
      const successData = {
        code,
        from: 'Linked In',
        state: savedState,
      };

      if (isInPopup && window.opener) {
        // Send success data to parent window
        window.opener.postMessage(successData, '*');
        window.close();
      } else {
        // Handle success in current window (fallback)
        debugLog('No popup context, handling success in current window');
        // In a WebView scenario without popup, you might want to:
        // 1. Store the code in localStorage and redirect
        // 2. Call a global callback function
        // 3. Use a different communication method

        // For now, we'll store in localStorage and redirect
        localStorage.setItem('linkedin_oauth_code', code);
        localStorage.setItem('linkedin_oauth_success', 'true');
        window.location.href = '/'; // Redirect back to main app
      }
    } else {
      debugError('No authorization code or error received');
      const errorData = {
        error: 'no_code',
        errorMessage: 'No authorization code received',
        from: 'Linked In',
        state: savedState,
      };

      if (isInPopup && window.opener) {
        window.opener.postMessage(errorData, '*');
        window.close();
      } else {
        console.error('LinkedIn OAuth error:', errorData);
        window.location.href = '/'; // Redirect to home or error page
      }
    }
  }, [debug]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <h2
          style={{
            color: '#0077b5',
            marginBottom: '16px',
          }}
        >
          Processing LinkedIn Authentication...
        </h2>
        <p
          style={{
            color: '#666',
            marginBottom: '20px',
          }}
        >
          Please wait while we complete your LinkedIn authentication.
        </p>
        <div
          style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #0077b5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}

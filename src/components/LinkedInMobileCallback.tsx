/**
 * LinkedInMobileCallback component - mobile-optimized callback handler for Flutter webviews
 * @module components/LinkedInMobileCallback
 *
 * This component handles the OAuth2 callback for mobile LinkedIn authentication in Flutter webviews.
 * Instead of using window.opener.postMessage (which may not be available in mobile webviews),
 * it stores the authentication result in localStorage and provides a URL-based communication approach.
 *
 * Key differences from standard LinkedInCallback:
 * - Stores results in localStorage instead of posting to parent window
 * - Works when window.opener is not available (common in mobile webviews)
 * - Provides visual feedback during the callback process
 * - Handles mobile-specific redirect patterns
 *
 * Usage: Deploy this component at your OAuth2 redirect URI for mobile authentication flows.
 */

import { useEffect, useState } from 'react';
import type { LinkedInMobileCallbackConfig } from '../types/components';
import type { LinkedInCallbackParams } from '../types/base';
import { parseUrlParams } from '../core/url';
import { getLinkedInState, setLinkedInMobileResult } from '../core/storage';
import { createDebugLogger, setDebugMode } from '../core/debug';
import type { LinkedInMobileResult } from '../core/storage';

// CSS keyframes for spinner animation
const spinnerStyles = `
  @keyframes linkedin-mobile-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Insert styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = spinnerStyles;
  document.head.appendChild(styleElement);
}

/**
 * Mobile-optimized LinkedIn OAuth2 callback component
 *
 * This component should be rendered at your OAuth2 redirect URI when using mobile authentication.
 * It handles the callback parameters and stores the result in localStorage for the main application
 * to retrieve via polling.
 *
 * @param props - Callback component configuration
 * @returns JSX element with callback status and styling
 *
 * @example
 * ```tsx
 * // In your redirect URI page (e.g., /linkedin-callback)
 * import { LinkedInMobileCallback } from 'react-linkedin-login-oauth2';
 *
 * function LinkedInCallbackPage() {
 *   return (
 *     <div style={{
 *       display: 'flex',
 *       justifyContent: 'center',
 *       alignItems: 'center',
 *       height: '100vh',
 *       fontFamily: 'Arial, sans-serif'
 *     }}>
 *       <LinkedInMobileCallback debug={true} />
 *     </div>
 *   );
 * }
 * ```
 */
export function LinkedInMobileCallback({
  debug: debugMode = false,
}: LinkedInMobileCallbackConfig = {}): JSX.Element {
  const [status, setStatus] = useState<
    'processing' | 'success' | 'error' | 'invalid_state'
  >('processing');
  const [message, setMessage] = useState<string>(
    'Processing LinkedIn authentication...',
  );

  useEffect(() => {
    const debugLogger = createDebugLogger('LinkedIn OAuth2 Mobile Callback');
    setDebugMode(debugMode);
    debugLogger.log('LinkedInMobileCallback initialized', { debugMode });

    try {
      // Parse URL parameters
      const params = parseUrlParams(
        window.location.search,
      ) as unknown as LinkedInCallbackParams;
      debugLogger.log('Parsed URL parameters', params);

      // Get saved state for validation
      const savedState = getLinkedInState();
      debugLogger.log('Retrieved saved state from localStorage', {
        savedState,
      });

      // Validate state to prevent CSRF attacks
      if (params.state !== savedState) {
        const errorMsg = 'Authentication state validation failed';
        debugLogger.error('State validation failed', {
          receivedState: params.state,
          savedState,
          match: params.state === savedState,
        });

        setStatus('invalid_state');
        setMessage(errorMsg);

        // Store error result
        const errorResult: LinkedInMobileResult = {
          error: 'invalid_state',
          errorMessage: errorMsg,
          state: params.state || '',
          timestamp: Date.now(),
        };

        const stored = setLinkedInMobileResult(errorResult);
        debugLogger.log('Stored error result in localStorage', {
          stored,
          errorResult,
        });
        return;
      }

      // Handle OAuth error response
      if (params.error) {
        const errorMessage =
          params.error_description || 'Login failed. Please try again.';
        debugLogger.error('OAuth error received', {
          error: params.error,
          errorDescription: params.error_description,
          finalErrorMessage: errorMessage,
        });

        setStatus('error');
        setMessage(errorMessage);

        // Store error result
        const errorResult: LinkedInMobileResult = {
          error: params.error,
          errorMessage,
          state: params.state,
          timestamp: Date.now(),
        };

        const stored = setLinkedInMobileResult(errorResult);
        debugLogger.log('Stored error result in localStorage', {
          stored,
          errorResult,
        });

        // Auto-close on user cancellation
        if (params.error === 'user_cancelled_login') {
          debugLogger.log('User cancelled login, closing window in 2 seconds');
          setTimeout(() => {
            window.close();
          }, 2000);
        }
        return;
      }

      // Handle successful authorization
      if (params.code) {
        debugLogger.log('Authorization code received', {
          code: params.code,
          state: params.state,
        });

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Store success result
        const successResult: LinkedInMobileResult = {
          code: params.code,
          state: params.state,
          timestamp: Date.now(),
        };

        const stored = setLinkedInMobileResult(successResult);
        debugLogger.log('Stored success result in localStorage', {
          stored,
          successResult,
        });

        // Close window after short delay to show success message
        setTimeout(() => {
          debugLogger.log('Closing callback window');
          window.close();
        }, 1500);
        return;
      }

      // No code or error - unexpected state
      const unexpectedMsg = 'Unexpected callback response';
      debugLogger.warn('No code or error in callback', params);

      setStatus('error');
      setMessage(unexpectedMsg);

      const errorResult: LinkedInMobileResult = {
        error: 'unexpected_response',
        errorMessage: unexpectedMsg,
        state: params.state || '',
        timestamp: Date.now(),
      };

      setLinkedInMobileResult(errorResult);
    } catch (error) {
      const errorMsg = 'Failed to process LinkedIn callback';
      debugLogger.error('Exception in callback processing', error);

      setStatus('error');
      setMessage(errorMsg);

      const errorResult: LinkedInMobileResult = {
        error: 'callback_processing_error',
        errorMessage: errorMsg,
        state: '',
        timestamp: Date.now(),
      };

      setLinkedInMobileResult(errorResult);
    }
  }, [debugMode]);

  // Render callback status UI
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return '#0077B5';
      case 'success':
        return '#28a745';
      case 'error':
      case 'invalid_state':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
      case 'invalid_state':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        minHeight: '200px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        margin: '20px',
        maxWidth: '400px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: '20px',
        }}
      >
        {getStatusIcon()}
      </div>

      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: getStatusColor(),
          marginBottom: '10px',
        }}
      >
        LinkedIn Authentication
      </div>

      <div
        style={{
          fontSize: '14px',
          color: '#6c757d',
          lineHeight: '1.5',
        }}
      >
        {message}
      </div>

      {status === 'processing' && (
        <div
          style={{
            marginTop: '20px',
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #0077B5',
            borderRadius: '50%',
            animation: 'linkedin-mobile-spin 1s linear infinite',
          }}
        />
      )}
    </div>
  );
}

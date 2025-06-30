import { useEffect, useState } from 'react';
import { LINKEDIN_OAUTH2_STATE, parse } from '../utils';

// Type definitions for React Native WebView
interface ReactNativeWebView {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
  }
}

interface MobileCallbackProps {
  /** Custom URL scheme for deep linking (e.g., 'myapp://') */
  customScheme?: string;
  /** Whether to show a loading state while processing */
  showProcessing?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback when processing is complete */
  onComplete?: () => void;
}

type ParamsType = {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
};

export function LinkedInMobileCallback({
  customScheme,
  showProcessing = true,
  successMessage = 'Authentication successful!',
  errorMessage = 'Authentication failed',
  onComplete,
}: MobileCallbackProps = {}) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing',
  );
  const [message, setMessage] = useState<string>(
    'Processing authentication...',
  );

  useEffect(() => {
    const processCallback = () => {
      const params = parse(window.location.search) as ParamsType;
      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);

      // State validation
      if (params.state !== savedState) {
        setStatus('error');
        setMessage('Security validation failed');
        onComplete?.();
        return;
      }

      if (params.error) {
        const errorMsg = params.error_description || errorMessage;
        setStatus('error');
        setMessage(errorMsg);

        // Try to communicate back to the app
        if (customScheme) {
          const callbackUrl = `${customScheme}linkedin-callback?error=${encodeURIComponent(params.error)}&error_description=${encodeURIComponent(errorMsg)}&state=${params.state}`;

          // For mobile apps, try multiple methods to trigger the deep link
          window.location.href = callbackUrl;

          // Also try postMessage for React Native WebView
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'linkedinCallback',
                success: false,
                error: params.error,
                errorMessage: errorMsg,
                state: params.state,
              }),
            );
          }
        }

        onComplete?.();
      } else if (params.code) {
        setStatus('success');
        setMessage(successMessage);

        // Try to communicate back to the app
        if (customScheme) {
          const callbackUrl = `${customScheme}linkedin-callback?code=${params.code}&state=${params.state}`;

          // For mobile apps, try multiple methods to trigger the deep link
          window.location.href = callbackUrl;

          // Also try postMessage for React Native WebView
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'linkedinCallback',
                success: true,
                code: params.code,
                state: params.state,
              }),
            );
          }
        }

        onComplete?.();
      } else {
        setStatus('error');
        setMessage('No authorization code received');
        onComplete?.();
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(processCallback, 100);
    return () => clearTimeout(timer);
  }, [customScheme, successMessage, errorMessage, onComplete]);

  if (!showProcessing && status === 'processing') {
    return null;
  }

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px 30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <div
          style={{
            marginBottom: '20px',
          }}
        >
          {status === 'processing' && (
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e3e3e3',
                borderTop: '3px solid #0077b5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            />
          )}

          {status === 'success' && (
            <div
              style={{
                color: '#28a745',
                fontSize: '48px',
                marginBottom: '20px',
              }}
            >
              ✓
            </div>
          )}

          {status === 'error' && (
            <div
              style={{
                color: '#dc3545',
                fontSize: '48px',
                marginBottom: '20px',
              }}
            >
              ✗
            </div>
          )}
        </div>

        <h2
          style={{
            color: status === 'error' ? '#dc3545' : '#0077b5',
            marginBottom: '20px',
            fontSize: '24px',
            fontWeight: 600,
          }}
        >
          LinkedIn Authentication
        </h2>

        <p
          style={{
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0',
          }}
        >
          {message}
        </p>

        {status !== 'processing' && (
          <p
            style={{
              color: '#999',
              fontSize: '14px',
              marginTop: '20px',
              margin: '20px 0 0',
            }}
          >
            {customScheme
              ? 'Redirecting back to app...'
              : 'You can close this window now.'}
          </p>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `,
        }}
      />
    </div>
  );
}

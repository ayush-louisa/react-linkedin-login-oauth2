import { useEffect, useState } from 'react';
import { LINKEDIN_OAUTH2_STATE, parse } from '../utils';

type ParamsType = {
  state: string;
  code?: string;
  error?: string;
  error_description?: string;
};

export function LinkedInCallbackBroadcast() {
  const [message, setMessage] = useState<string>('Processing...');

  useEffect(() => {
    const params = parse(window.location.search) as ParamsType;
    const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
    const sessionId = localStorage.getItem('linkedin_session_id');

    if (!sessionId) {
      setMessage('Session not found');
      return;
    }

    if (params.state !== savedState) {
      setMessage('State mismatch - possible security issue');
      return;
    }

    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      setMessage('BroadcastChannel not supported');
      return;
    }

    const channel = new BroadcastChannel('linkedin-oauth-channel');

    if (params.error) {
      const errorMessage =
        params.error_description || 'Login failed. Please try again.';
      setMessage(`Error: ${errorMessage}`);

      channel.postMessage({
        type: 'LINKEDIN_ERROR',
        sessionId: sessionId,
        error: params.error,
        errorMessage: errorMessage,
        state: params.state,
      });

      // Close after a brief delay to show the error message
      setTimeout(() => {
        channel.close();
        window.close();
      }, 2000);
    } else if (params.code) {
      setMessage('Authentication successful! Closing...');

      channel.postMessage({
        type: 'LINKEDIN_SUCCESS',
        sessionId: sessionId,
        code: params.code,
        state: params.state,
      });

      // Close immediately on success
      setTimeout(() => {
        channel.close();
        window.close();
      }, 500);
    } else {
      setMessage('No authorization code received');
    }

    // Cleanup function
    return () => {
      channel.close();
    };
  }, []);

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px',
        }}
      >
        <h2 style={{ color: '#0077b5', marginBottom: '20px' }}>
          LinkedIn Authentication
        </h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
// Using main imports since this is a local example - consumers would use modular imports
import {
  useLinkedIn,
  useLinkedInMobile,
  setDebugMode,
} from '@ayush-louisa/react-linkedin-login-oauth2';
import type { LinkedInOAuthError } from '@ayush-louisa/react-linkedin-login-oauth2';
import './App.css';

// Enable debug mode globally
setDebugMode(true);

function App() {
  const [count, setCount] = useState(0);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [mobileCode, setMobileCode] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [currentView, setCurrentView] = useState<'desktop' | 'mobile'>(
    'desktop',
  );

  // Desktop LinkedIn login
  const { linkedInLogin } = useLinkedIn({
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '86vhj2q7ukf83q',
    redirectUri: `${
      typeof window === 'object' && window.location.origin
    }/linkedin`,
    onSuccess: (code) => {
      console.log('Desktop LinkedIn success:', code);
      setCode(code);
    },
    scope: 'email',
    onError: (error: LinkedInOAuthError) => {
      console.log('Desktop LinkedIn error:', error);
      setErrorMessage(error.errorMessage);
    },
    debug: true,
  });

  // Mobile LinkedIn login
  const { linkedInLogin: mobileLinkedInLogin, isLoading: isMobileLoading } =
    useLinkedInMobile({
      clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '86vhj2q7ukf83q',
      redirectUri: `${
        typeof window === 'object' && window.location.origin
      }/linkedin`,
      onSuccess: (code) => {
        console.log('Mobile LinkedIn success:', code);
        setMobileCode(code);
        setMobileError('');
      },
      scope: 'email',
      onError: (error: LinkedInOAuthError) => {
        console.log('Mobile LinkedIn error:', error);
        setMobileError(error.errorMessage);
        setMobileCode('');
      },
      debug: true,
      pollInterval: 1000,
      maxPollAttempts: 300,
    });

  const isUserAgentMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>React LinkedIn OAuth2 Demo</h1>

      {/* View Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setCurrentView('desktop')}
          style={{
            background: currentView === 'desktop' ? '#0077B5' : '#f0f0f0',
            color: currentView === 'desktop' ? 'white' : 'black',
            border: '1px solid #ccc',
            padding: '8px 16px',
            cursor: 'pointer',
            borderRadius: '4px 0 0 4px',
          }}
        >
          Desktop Mode
        </button>
        <button
          onClick={() => setCurrentView('mobile')}
          style={{
            background: currentView === 'mobile' ? '#0077B5' : '#f0f0f0',
            color: currentView === 'mobile' ? 'white' : 'black',
            border: '1px solid #ccc',
            borderLeft: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            borderRadius: '0 4px 4px 0',
          }}
        >
          Mobile Mode (Flutter Webview)
        </button>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        {currentView === 'desktop' ? (
          // Desktop LinkedIn Login
          <div style={{ marginTop: '20px' }}>
            <h3>Desktop LinkedIn Authentication</h3>
            <p
              style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}
            >
              Uses window.opener.postMessage for communication
            </p>
            <button
              onClick={linkedInLogin}
              style={{
                background: '#0077B5',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            >
              Login with LinkedIn (Desktop)
            </button>
            <div style={{ marginTop: '10px' }}>
              {!code && !errorMessage && <span>No authentication yet</span>}
              {code && (
                <div style={{ color: 'green' }}>
                  <strong>Success!</strong> Code: {code}
                </div>
              )}
              {errorMessage && (
                <div style={{ color: 'red' }}>
                  <strong>Error:</strong> {errorMessage}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Mobile LinkedIn Login
          <div style={{ marginTop: '20px' }}>
            <h3>Mobile LinkedIn Authentication</h3>
            <p
              style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}
            >
              Uses localStorage polling for Flutter webview compatibility
            </p>
            <div
              style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                textAlign: 'left',
              }}
            >
              <strong>How it works:</strong>
              <br />• Opens LinkedIn OAuth in popup/new tab
              <br />• Callback stores result in localStorage
              <br />• Main app polls localStorage for result
              <br />• Works when window.opener is unavailable
              <br />• Perfect for Flutter webviews
            </div>
            <button
              onClick={mobileLinkedInLogin}
              disabled={isMobileLoading}
              style={{
                background: isMobileLoading ? '#6c757d' : '#0077B5',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                cursor: isMobileLoading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '16px',
                opacity: isMobileLoading ? 0.7 : 1,
              }}
            >
              {isMobileLoading
                ? 'Connecting...'
                : 'Login with LinkedIn (Mobile)'}
            </button>
            <div style={{ marginTop: '10px' }}>
              {!mobileCode && !mobileError && !isMobileLoading && (
                <span>No authentication yet</span>
              )}
              {isMobileLoading && (
                <div style={{ color: '#0077B5' }}>
                  <strong>Loading...</strong> Authenticating with LinkedIn...
                </div>
              )}
              {mobileCode && (
                <div style={{ color: 'green' }}>
                  <strong>Success!</strong> Code: {mobileCode}
                </div>
              )}
              {mobileError && (
                <div style={{ color: 'red' }}>
                  <strong>Error:</strong> {mobileError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Agent Detection */}
        <div
          style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
          }}
        >
          <h4>Device Detection & Testing</h4>
          <p style={{ fontSize: '14px', margin: '5px 0' }}>
            <strong>Detected as:</strong>{' '}
            {isUserAgentMobile() ? 'Mobile Device' : 'Desktop Device'}
          </p>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Current User Agent: {navigator.userAgent.substring(0, 100)}...
          </p>

          {/* Reset buttons */}
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => {
                setCode('');
                setErrorMessage('');
                setMobileCode('');
                setMobileError('');
              }}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              Reset Results
            </button>
            <span style={{ fontSize: '12px', color: '#666' }}>
              Clear all authentication results for testing
            </span>
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;

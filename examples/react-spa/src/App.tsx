import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
// Using main imports since this is a local example - consumers would use modular imports
import {
  useLinkedIn,
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

  const { linkedInLogin } = useLinkedIn({
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '86vhj2q7ukf83q',
    redirectUri: `${
      typeof window === 'object' && window.location.origin
    }/linkedin`,
    onSuccess: (code) => {
      console.log(code);
      setCode(code);
    },
    scope: 'email',
    onError: (error: LinkedInOAuthError) => {
      console.log(error);
      setErrorMessage(error.errorMessage);
    },
    debug: true, // Enable debug mode - consumers can use modular imports for better tree-shaking
  });

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
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button
          onClick={linkedInLogin}
          style={{
            background: '#0077B5',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '4px',
            marginLeft: '10px',
          }}
        >
          Login with LinkedIn
        </button>
        <p>
          {!code && <span>No code</span>}
          {code && <span>Code: {code}</span>}
          {errorMessage && <span>{errorMessage}</span>}
        </p>
        <p>
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

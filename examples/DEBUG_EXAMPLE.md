# Debug Example

This example demonstrates how to use the debug logging feature in the React LinkedIn OAuth2 library.

## Setup

1. Enable debug mode by setting `debug: true` in your component props
2. Open browser developer console to see debug logs
3. Initiate LinkedIn login to see the complete OAuth flow logs

## What you'll see in the console:

- **Initialization**: Hook setup with all parameters
- **State Management**: OAuth state generation and localStorage operations
- **URL Construction**: LinkedIn authorization URL with all parameters
- **Popup Management**: Window opening, positioning, and monitoring
- **Message Handling**: PostMessage events between windows
- **Security Validation**: CSRF state validation
- **Success/Error Flow**: Authorization code handling or error processing
- **Cleanup**: Resource cleanup and event listener removal

## Example Logs:

```
[LinkedIn OAuth2] useLinkedIn initialized {redirectUri: 'http://localhost:3000/linkedin', clientId: 'your-client-id', scope: 'email', state: 'auto-generated', debugMode: true}
[LinkedIn OAuth2] Generated OAuth state {state: 'abc123xyz', wasProvided: false}
[LinkedIn OAuth2] Opening popup window {url: 'https://www.linkedin.com/oauth/v2/authorization?...', properties: 'left=383,top=84,width=600,height=600'}
[LinkedIn OAuth2] Received message event {origin: 'http://localhost:3000', windowOrigin: 'http://localhost:3000', data: {...}}
[LinkedIn OAuth2] Processing success message with authorization code
[LinkedIn OAuth2] Calling onSuccess callback {code: 'authorization-code-here'}
```

## Usage in Code:

```jsx
import { useLinkedIn } from 'react-linkedin-login-oauth2';

function MyComponent() {
  const { linkedInLogin } = useLinkedIn({
    clientId: 'your-client-id',
    redirectUri: 'http://localhost:3000/linkedin',
    onSuccess: (code) => {
      console.log('Got authorization code:', code);
    },
    onError: (error) => {
      console.error('LinkedIn OAuth error:', error);
    },
    debug: true, // Enable debug logging
  });

  return <button onClick={linkedInLogin}>Login with LinkedIn</button>;
}

// In your callback component
import { LinkedInCallback } from 'react-linkedin-login-oauth2';

function CallbackPage() {
  return <LinkedInCallback debug={true} />;
}
```

## Advanced Debug Control:

You can also control debug mode programmatically:

```jsx
import { setDebugMode, debug } from 'react-linkedin-login-oauth2';

// Enable debug mode globally
setDebugMode(true);

// Use debug utilities in your own code
debug.log('Custom debug message', { userData: 'example' });
debug.warn('Warning message');
debug.error('Error occurred', errorObject);

// Disable debug mode
setDebugMode(false);
```

This is particularly useful for:

- Troubleshooting OAuth flow issues
- Understanding the security validation process
- Debugging popup window problems
- Monitoring state management
- Validating parameter passing between components

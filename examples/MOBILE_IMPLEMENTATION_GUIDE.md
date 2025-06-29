# Mobile LinkedIn OAuth2 Implementation Guide

This guide demonstrates how to implement LinkedIn OAuth2 authentication in Flutter applications using the mobile-optimized components.

## Overview

The mobile implementation provides:

- **URL-based communication** instead of `window.opener.postMessage`
- **localStorage polling** for authentication results
- **InAppBrowser compatibility** for Flutter webviews
- **Loading states** and error handling
- **Same security measures** as the standard implementation

## Key Components

### 1. `useLinkedInMobile` Hook

A mobile-optimized hook that uses localStorage polling instead of postMessage events.

### 2. `LinkedInMobile` Component

A render-prop component that provides the mobile authentication functionality.

### 3. `LinkedInMobileCallback` Component

A callback handler that stores authentication results in localStorage.

## Implementation Steps

### Step 1: Main Application Setup

```tsx
import React from 'react';
import { LinkedInMobile } from 'react-linkedin-login-oauth2';

function App() {
  const handleSuccess = (code: string) => {
    console.log('LinkedIn authorization code:', code);
    // Exchange code for access token on your backend
    // POST to your server: { code, redirectUri, clientId }
  };

  const handleError = (error: { error: string; errorMessage: string }) => {
    console.error('LinkedIn authentication error:', error);
    // Handle error (show user-friendly message, retry option, etc.)
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>LinkedIn Mobile Authentication</h1>

      <LinkedInMobile
        clientId="your-linkedin-client-id"
        redirectUri="https://yourapp.com/linkedin-callback"
        onSuccess={handleSuccess}
        onError={handleError}
        scope="r_emailaddress r_liteprofile"
        debug={true}
        pollInterval={1000}
        maxPollAttempts={300}
        closePopupMessage="Authentication was cancelled"
      >
        {({ linkedInLogin, isLoading }) => (
          <button
            onClick={linkedInLogin}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isLoading ? '#ccc' : '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isLoading && (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            )}
            {isLoading ? 'Authenticating...' : 'Login with LinkedIn'}
          </button>
        )}
      </LinkedInMobile>
    </div>
  );
}

export default App;
```

### Step 2: Callback Page Setup

Create a separate page/route for handling the OAuth callback:

```tsx
// LinkedInCallbackPage.tsx
import React from 'react';
import { LinkedInMobileCallback } from 'react-linkedin-login-oauth2';

function LinkedInCallbackPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <LinkedInMobileCallback debug={true} />
    </div>
  );
}

export default LinkedInCallbackPage;
```

### Step 3: Routing Configuration

```tsx
// App.tsx with routing
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './MainPage';
import LinkedInCallbackPage from './LinkedInCallbackPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/linkedin-callback" element={<LinkedInCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Configuration Options

### useLinkedInMobile / LinkedInMobile Props

| Property            | Type     | Default                 | Description                                          |
| ------------------- | -------- | ----------------------- | ---------------------------------------------------- |
| `clientId`          | string   | required                | LinkedIn application client ID                       |
| `redirectUri`       | string   | required                | OAuth2 redirect URI (must match LinkedIn app config) |
| `onSuccess`         | function | required                | Called with authorization code on success            |
| `onError`           | function | optional                | Called with error details on failure                 |
| `scope`             | string   | 'r_emailaddress'        | OAuth2 scope (space-separated for multiple)          |
| `state`             | string   | auto-generated          | OAuth2 state parameter (CSRF protection)             |
| `debug`             | boolean  | false                   | Enable debug logging                                 |
| `pollInterval`      | number   | 1000                    | Polling interval in milliseconds                     |
| `maxPollAttempts`   | number   | 300                     | Maximum polling attempts before timeout              |
| `closePopupMessage` | string   | 'User closed the popup' | Error message when user closes popup                 |

## Flutter Integration

### Flutter WebView Setup

```dart
// Flutter code for WebView integration
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class LinkedInAuthScreen extends StatefulWidget {
  @override
  _LinkedInAuthScreenState createState() => _LinkedInAuthScreenState();
}

class _LinkedInAuthScreenState extends State<LinkedInAuthScreen> {
  InAppWebViewController? webViewController;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('LinkedIn Login'),
      ),
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url: Uri.parse('https://yourapp.com'), // Your React app URL
        ),
        onWebViewCreated: (controller) {
          webViewController = controller;
        },
        onLoadStart: (controller, url) {
          print('Started loading: $url');
        },
        onLoadStop: (controller, url) {
          print('Finished loading: $url');
        },
      ),
    );
  }
}
```

## Security Considerations

1. **State Validation**: Always validate the `state` parameter to prevent CSRF attacks
2. **HTTPS Only**: Use HTTPS for all URLs in production
3. **Redirect URI**: Ensure redirect URI matches exactly with LinkedIn app configuration
4. **Token Exchange**: Exchange authorization codes for access tokens on your secure backend
5. **Storage Cleanup**: The library automatically cleans up localStorage after use

## Troubleshooting

### Common Issues

1. **Popup Blocked**: Ensure popup blockers are disabled or handle the `popup_blocked` error
2. **State Mismatch**: Check that your redirect URI matches LinkedIn app configuration
3. **Polling Timeout**: Increase `maxPollAttempts` if users have slow connections
4. **CORS Issues**: Ensure your backend properly handles CORS for token exchange

### Debug Mode

Enable debug mode to see detailed logs:

```tsx
<LinkedInMobile
  // ... other props
  debug={true}
/>
```

Debug logs will appear in the browser console with the prefix `[LinkedIn OAuth2 Mobile]`.

## Differences from Standard Implementation

| Feature          | Standard                    | Mobile               |
| ---------------- | --------------------------- | -------------------- |
| Communication    | `window.opener.postMessage` | localStorage polling |
| Popup Handling   | Event-driven                | Polling-based        |
| Loading State    | Not provided                | Built-in             |
| Timeout Handling | Manual                      | Automatic            |
| Mobile Optimized | No                          | Yes                  |

## Migration from Standard Implementation

If you're migrating from the standard implementation:

1. Replace `useLinkedIn` with `useLinkedInMobile`
2. Replace `LinkedIn` with `LinkedInMobile`
3. Replace `LinkedInCallback` with `LinkedInMobileCallback`
4. Add polling configuration options
5. Handle the `isLoading` state in your UI

The API is largely compatible, with additional mobile-specific options.

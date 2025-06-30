# Mobile LinkedIn OAuth2 Implementation

This directory contains the mobile-optimized LinkedIn OAuth2 implementation designed specifically for Flutter webview environments.

## Overview

The mobile implementation addresses key challenges when using LinkedIn OAuth2 in mobile webviews:

- **No window.opener**: Mobile webviews often don't support `window.opener.postMessage`
- **InAppBrowser environment**: Authentication happens in a separate browser context
- **State management**: Need reliable communication between main app and auth popup

## Files Created

### Core Implementation

1. **`src/hooks/useLinkedInMobile.ts`**
   - Mobile-optimized React hook
   - Uses localStorage polling instead of postMessage
   - Provides loading states and error handling
   - Configurable polling intervals and timeouts

2. **`src/components/LinkedInMobile.tsx`**
   - Render prop component for mobile authentication
   - Wraps `useLinkedInMobile` hook functionality
   - Provides loading states to child components

3. **`src/components/LinkedInMobileCallback.tsx`**
   - Handles OAuth2 callback in mobile environment
   - Stores authentication results in localStorage
   - Provides visual feedback during callback processing
   - Auto-closes popup after successful authentication

### Storage Extensions

4. **`src/core/storage.ts`** (extended)
   - Added mobile-specific storage functions
   - `LinkedInMobileResult` interface for structured data
   - Timestamp tracking for result expiration

### Type Definitions

5. **`src/types/components.ts`** (extended)
   - `UseLinkedInMobileConfig` interface
   - `LinkedInMobileComponentConfig` interface
   - `LinkedInMobileCallbackConfig` interface
   - Mobile-specific polling configuration options

## How It Works

### Authentication Flow

1. **Initiation**: User clicks login button in main app
2. **Event Setup**: Main app sets up localStorage storage event listener
3. **Popup Creation**: Mobile hook opens LinkedIn OAuth URL in popup/new tab
4. **OAuth Process**: User authenticates with LinkedIn in popup
5. **Callback Handling**: LinkedIn redirects to callback URL with auth code
6. **Result Storage**: Callback component stores result in localStorage
7. **Instant Detection**: Storage event triggers immediately in main app
8. **Fallback Safety**: Periodic checks ensure no missed events
9. **Cleanup**: Popup closes and listeners are removed

### Key Differences from Desktop

| Aspect           | Desktop                     | Mobile                                 |
| ---------------- | --------------------------- | -------------------------------------- |
| Communication    | `window.opener.postMessage` | localStorage + storage events          |
| State Management | Event listeners             | Storage events + fallback checks       |
| Popup Handling   | Direct window reference     | Storage-based detection                |
| Error Handling   | Immediate via events        | Event-based discovery                  |
| Efficiency       | High (direct messaging)     | High (event-driven + minimal fallback) |

### Why This Approach is Better

**Previous Approach (Polling)**:

- ❌ Continuous resource usage
- ❌ Battery drain on mobile devices
- ❌ Network overhead
- ❌ Unnecessary load on main thread

**New Approach (Storage Events + Fallback)**:

- ✅ Instant response via storage events
- ✅ Minimal resource usage
- ✅ Battery-friendly
- ✅ Fallback safety net
- ✅ Cross-tab communication support

## Usage Examples

### Basic Hook Usage

```tsx
import { useLinkedInMobile } from 'react-linkedin-login-oauth2';

function MyComponent() {
  const { linkedInLogin, isLoading } = useLinkedInMobile({
    clientId: 'your-client-id',
    redirectUri: 'your-mobile-callback-uri',
    onSuccess: (code) => {
      console.log('Auth code:', code);
      // Exchange code for access token
    },
    onError: (error) => {
      console.error('Auth error:', error);
    },
    fallbackCheckInterval: 2000, // Fallback check every 2 seconds
    maxWaitTime: 300000, // Timeout after 5 minutes
    debug: true,
  });

  return (
    <button onClick={linkedInLogin} disabled={isLoading}>
      {isLoading ? 'Authenticating...' : 'Login with LinkedIn'}
    </button>
  );
}
```

### Render Prop Component

```tsx
import { LinkedInMobile } from 'react-linkedin-login-oauth2';

function MyComponent() {
  return (
    <LinkedInMobile
      clientId="your-client-id"
      redirectUri="your-mobile-callback-uri"
      onSuccess={(code) => console.log(code)}
      onError={(error) => console.error(error)}
      fallbackCheckInterval={2000}
      maxWaitTime={300000}
    >
      {({ linkedInLogin, isLoading }) => (
        <button
          onClick={linkedInLogin}
          disabled={isLoading}
          style={{
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Connecting...' : 'Login with LinkedIn'}
        </button>
      )}
    </LinkedInMobile>
  );
}
```

### Mobile Callback Page

```tsx
import { LinkedInMobileCallback } from 'react-linkedin-login-oauth2';

// Deploy this at your mobile callback URI
function LinkedInCallbackPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <LinkedInMobileCallback debug={true} />
    </div>
  );
}
```

## Configuration Options

### Mobile-Specific Options

- **`fallbackCheckInterval`**: Milliseconds between fallback checks (default: 2000)
- **`maxWaitTime`**: Maximum wait time in milliseconds before timeout (default: 300000 = 5 minutes)
- **`debug`**: Enable detailed logging (default: false)

### Standard OAuth Options

All standard LinkedIn OAuth2 options are supported:

- `clientId`: LinkedIn application client ID
- `redirectUri`: OAuth2 redirect URI (should point to mobile callback)
- `scope`: LinkedIn API permissions (default: 'r_emailaddress')
- `state`: CSRF protection state (auto-generated if not provided)
- `onSuccess`: Success callback with authorization code
- `onError`: Error callback with error details

## Flutter Integration

### WebView Setup

When using with Flutter's `webview_flutter`, ensure:

1. **JavaScript enabled**: `javascriptMode: JavascriptMode.unrestricted`
2. **Navigation delegate**: Handle OAuth redirects properly
3. **User agent**: Consider setting mobile user agent if needed

```dart
WebView(
  initialUrl: 'https://your-app.com',
  javascriptMode: JavascriptMode.unrestricted,
  navigationDelegate: (NavigationRequest request) {
    // Handle LinkedIn OAuth redirects
    if (request.url.startsWith('https://your-app.com/linkedin-mobile')) {
      return NavigationDecision.navigate;
    }
    return NavigationDecision.prevent;
  },
)
```

### InAppBrowser Setup

For `flutter_inappwebview`:

```dart
InAppWebView(
  initialUrlRequest: URLRequest(
    url: Uri.parse('https://your-app.com')
  ),
  initialOptions: InAppWebViewGroupOptions(
    crossPlatform: InAppWebViewOptions(
      javaScriptEnabled: true,
      supportZoom: false,
    ),
  ),
)
```

## Security Considerations

1. **State Validation**: Always validate OAuth state parameter to prevent CSRF attacks
2. **HTTPS Only**: Use HTTPS for all OAuth2 URLs in production
3. **Secure Storage**: Consider encrypting sensitive data in localStorage
4. **Timeout Handling**: Implement reasonable polling timeouts to prevent infinite loops
5. **Origin Validation**: Validate callback origins in production environments

## Debugging

Enable debug mode to see detailed logging:

```tsx
const { linkedInLogin } = useLinkedInMobile({
  // ... other options
  debug: true, // Enables console logging
});
```

Debug logs include:

- Authentication flow steps
- localStorage operations
- Polling attempts and results
- Error conditions and state validation
- Popup window lifecycle events

## Browser Compatibility

Tested with:

- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS)
- ✅ Flutter WebView (Android/iOS)
- ✅ Flutter InAppBrowser
- ✅ Ionic Capacitor WebView
- ⚠️ Some embedded browsers may have localStorage restrictions

## Limitations

1. **Popup Blockers**: Some mobile browsers may block popups
2. **Storage Persistence**: localStorage may be cleared by system or user
3. **Background Processing**: Apps may pause JavaScript when backgrounded
4. **Network Reliability**: Mobile networks may be unreliable during OAuth flow
5. **Browser Variations**: Different mobile browsers handle popups differently

## Migration from Desktop

To migrate from desktop implementation:

1. Replace `useLinkedIn` with `useLinkedInMobile`
2. Update callback route to use `LinkedInMobileCallback`
3. Add mobile-specific configuration options
4. Test thoroughly in target mobile environment
5. Consider graceful fallback for desktop users

## Troubleshooting

### Common Issues

**Authentication never completes**

- Check if popup blocker is active
- Verify callback URL is correct
- Ensure localStorage is available
- Check network connectivity during OAuth flow

**State validation fails**

- Verify HTTPS is used for all OAuth URLs
- Check for localStorage clearing between requests
- Ensure callback handles state parameter correctly

**Popup doesn't close automatically**

- Check if `window.close()` is blocked by browser
- Verify callback component is rendering correctly
- Consider manual close button as fallback

**Polling timeout**

- Increase `maxPollAttempts` for slow networks
- Adjust `pollInterval` for better performance
- Check if callback page is accessible

# LinkedIn OAuth Integration: React + Flutter

This example shows how to use the same LinkedIn OAuth flow across both React web applications and Flutter mobile applications.

## Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   React Web App     │    │   Flutter Mobile    │    │   Backend Server    │
│                     │    │                     │    │                     │
│ useLinkedInMobile() │    │ LinkedInAuthScreen  │    │ /auth/linkedin/     │
│ ├─ Same window      │    │ ├─ WebView          │    │ ├─ /callback        │
│ ├─ URL monitoring   │    │ ├─ Navigation       │    │ ├─ /exchange        │
│ └─ State mgmt       │    │ └─ Deep linking     │    │ └─ /profile         │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Shared Configuration

Both platforms use the same LinkedIn app configuration:

```javascript
// config.js (shared)
export const LINKEDIN_CONFIG = {
  clientId: 'your-linkedin-client-id',
  clientSecret: 'your-linkedin-client-secret', // Server-side only
  redirectUri: 'https://yourapp.com/auth/linkedin/callback',
  scopes: ['r_emailaddress', 'r_liteprofile'],
};
```

## React Web Implementation

```tsx
// React component using your library
import { useLinkedInMobile } from 'react-linkedin-login-oauth2';
import { LINKEDIN_CONFIG } from './config';

function WebLoginPage() {
  const { linkedInLogin, isLoading } = useLinkedInMobile({
    clientId: LINKEDIN_CONFIG.clientId,
    redirectUri: LINKEDIN_CONFIG.redirectUri,
    scope: LINKEDIN_CONFIG.scopes.join(' '),
    mobile: {
      useSameWindow: true, // Better for mobile webviews
    },
    onSuccess: async (code) => {
      // Exchange code for user data
      const response = await fetch('/api/linkedin/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const userData = await response.json();
      console.log('User data:', userData);
    },
    onError: (error) => {
      console.error('LinkedIn error:', error);
    },
    debug: true,
  });

  return (
    <button onClick={linkedInLogin} disabled={isLoading}>
      {isLoading ? 'Connecting...' : 'Login with LinkedIn'}
    </button>
  );
}
```

## Flutter Mobile Implementation

```dart
// Flutter implementation
import 'package:http/http.dart' as http;
import 'dart:convert';

class LinkedInConfig {
  static const String clientId = 'your-linkedin-client-id';
  static const String redirectUri = 'https://yourapp.com/auth/linkedin/callback';
  static const List<String> scopes = ['r_emailaddress', 'r_liteprofile'];
}

class FlutterLoginPage extends StatelessWidget {
  Future<void> _loginWithLinkedIn(BuildContext context) async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => LinkedInAuthScreen(
          clientId: LinkedInConfig.clientId,
          redirectUri: LinkedInConfig.redirectUri,
          scopes: LinkedInConfig.scopes,
          debug: true,
          onSuccess: (code) async {
            // Exchange code for user data (same API as React)
            await _exchangeCodeForUserData(code);
          },
          onError: (error) {
            print('LinkedIn error: $error');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Login failed: $error')),
            );
          },
        ),
      ),
    );
  }

  Future<void> _exchangeCodeForUserData(String code) async {
    try {
      final response = await http.post(
        Uri.parse('https://yourapp.com/api/linkedin/exchange'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'code': code}),
      );

      if (response.statusCode == 200) {
        final userData = json.decode(response.body);
        print('User data: $userData');
        // Handle success
      } else {
        throw Exception('Failed to exchange code');
      }
    } catch (error) {
      print('Exchange error: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          onPressed: () => _loginWithLinkedIn(context),
          child: const Text('Login with LinkedIn'),
        ),
      ),
    );
  }
}
```

## Shared Backend API

```javascript
// Express.js backend (shared by both platforms)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// LinkedIn OAuth callback (handles redirect from LinkedIn)
app.get('/auth/linkedin/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res
      .status(400)
      .json({ error, message: req.query.error_description });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user profile
    const profile = await getUserProfile(tokenResponse.access_token);

    // Store user data or create session
    const userData = {
      id: profile.id,
      name: `${profile.firstName.localized[Object.keys(profile.firstName.localized)[0]]} ${profile.lastName.localized[Object.keys(profile.lastName.localized)[0]]}`,
      email: await getUserEmail(tokenResponse.access_token),
    };

    // For mobile webviews, return a page that communicates back
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>LinkedIn Success</title></head>
        <body>
          <h1>Authentication Successful!</h1>
          <p>You can close this window now.</p>
          <script>
            // Try to communicate back to the parent
            if (window.opener) {
              window.opener.postMessage({
                type: 'linkedin-success',
                userData: ${JSON.stringify(userData)}
              }, '*');
            }
            // Auto-close after 2 seconds
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to process LinkedIn authentication' });
  }
});

// API endpoint for exchanging code (used by both React and Flutter)
app.post('/api/linkedin/exchange', async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user profile and email
    const profile = await getUserProfile(tokenResponse.access_token);
    const email = await getUserEmail(tokenResponse.access_token);

    const userData = {
      id: profile.id,
      name: `${profile.firstName.localized[Object.keys(profile.firstName.localized)[0]]} ${profile.lastName.localized[Object.keys(profile.lastName.localized)[0]]}`,
      email: email,
      accessToken: tokenResponse.access_token, // Be careful with this in production
    };

    res.json(userData);
  } catch (error) {
    console.error('LinkedIn exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange LinkedIn code' });
  }
});

async function exchangeCodeForToken(code) {
  const response = await fetch(
    'https://www.linkedin.com/oauth/v2/accessToken',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: 'your-linkedin-client-id',
        client_secret: 'your-linkedin-client-secret',
        redirect_uri: 'https://yourapp.com/auth/linkedin/callback',
      }),
    },
  );

  return await response.json();
}

async function getUserProfile(accessToken) {
  const response = await fetch(
    'https://api.linkedin.com/v2/people/~:(id,firstName,lastName)',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return await response.json();
}

async function getUserEmail(accessToken) {
  const response = await fetch(
    'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const data = await response.json();
  return data.elements[0]['handle~'].emailAddress;
}

app.listen(3000, () => {
  console.log('LinkedIn OAuth server running on port 3000');
});
```

## Benefits of This Approach

1. **Shared API** - Same backend endpoints for both platforms
2. **Consistent UX** - Similar authentication flow across web and mobile
3. **Code Reuse** - Shared configuration and utility functions
4. **Security** - Client secrets handled securely on backend
5. **Scalability** - Easy to add more platforms (React Native, etc.)

## Platform-Specific Optimizations

### React Web

- Uses `useSameWindow: true` for better mobile webview compatibility
- URL monitoring for callback detection
- Graceful fallback for popup-blocked scenarios

### Flutter Mobile

- Native WebView with full navigation control
- Built-in loading states and error handling
- Deep linking support for returning to app
- Proper Android/iOS lifecycle management

## Security Considerations

1. **State Validation** - Both platforms validate the state parameter
2. **HTTPS Only** - All redirect URIs use HTTPS
3. **Server-Side Secrets** - Client secrets never exposed to mobile apps
4. **Token Handling** - Access tokens processed securely on backend
5. **CORS Configuration** - Proper CORS setup for cross-origin requests

This approach gives you the best of both worlds: a robust web implementation and a native mobile experience, all using the same LinkedIn OAuth configuration and backend infrastructure.

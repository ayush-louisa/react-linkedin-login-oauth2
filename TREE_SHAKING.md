# Tree-Shaking and Modular Usage Guide

This library is built with maximum tree-shaking support and modular architecture. You can import only what you need to minimize bundle size.

## Installation

```bash
npm install react-linkedin-login-oauth2
```

## Modular Imports (Recommended)

### Components Only

```typescript
// Import only the components you need
import { useLinkedIn } from 'react-linkedin-login-oauth2/hooks';
import {
  LinkedIn,
  LinkedInCallback,
} from 'react-linkedin-login-oauth2/components';

// Or import from main entry with tree-shaking
import {
  useLinkedIn,
  LinkedIn,
  LinkedInCallback,
} from 'react-linkedin-login-oauth2';
```

### Core Utilities Only

```typescript
// Import only specific utilities
import { setDebugMode, debug } from 'react-linkedin-login-oauth2/core';
import { generateRandomString } from 'react-linkedin-login-oauth2/core';

// Or specific utilities
import {
  setDebugMode,
  buildLinkedInAuthUrl,
  parseUrlParams,
} from 'react-linkedin-login-oauth2/core';
```

### Types Only

```typescript
// Import only the types you need
import type {
  UseLinkedInConfig,
  LinkedInOAuthError,
  LinkedInCallbackConfig,
} from 'react-linkedin-login-oauth2/types';
```

## Bundle Size Optimization

### Minimal Hook Usage (~2KB gzipped)

```typescript
import { useLinkedIn } from 'react-linkedin-login-oauth2/hooks';

function LoginButton() {
  const { linkedInLogin } = useLinkedIn({
    clientId: 'your-client-id',
    redirectUri: 'your-redirect-uri',
    onSuccess: (code) => console.log(code),
  });

  return <button onClick={linkedInLogin}>Login</button>;
}
```

### With Debug Utilities (~2.5KB gzipped)

```typescript
import { useLinkedIn } from 'react-linkedin-login-oauth2/hooks';
import { setDebugMode } from 'react-linkedin-login-oauth2/core';

// Enable debug mode globally
setDebugMode(true);

function LoginButton() {
  const { linkedInLogin } = useLinkedIn({
    clientId: 'your-client-id',
    redirectUri: 'your-redirect-uri',
    onSuccess: (code) => console.log(code),
    debug: true, // Or control per component
  });

  return <button onClick={linkedInLogin}>Login</button>;
}
```

### Complete Setup with Callback (~3KB gzipped)

```typescript
// Main component
import { useLinkedIn } from 'react-linkedin-login-oauth2/hooks';

// Callback page
import { LinkedInCallback } from 'react-linkedin-login-oauth2/components';

// Types (0 runtime cost)
import type { UseLinkedInConfig } from 'react-linkedin-login-oauth2/types';
```

## Advanced Tree-Shaking

### Custom Debug Logger

```typescript
import { createDebugLogger } from 'react-linkedin-login-oauth2/core';

// Create your own debug instance
const myLogger = createDebugLogger('MyApp LinkedIn');
myLogger.log('Custom logging message');
```

### Direct Utility Usage

```typescript
import {
  generateRandomString,
  buildLinkedInAuthUrl,
  parseUrlParams,
} from 'react-linkedin-login-oauth2/core';

// Use utilities directly without components
const state = generateRandomString(32);
const authUrl = buildLinkedInAuthUrl({
  clientId: 'your-client-id',
  redirectUri: 'your-redirect-uri',
  state,
  scope: 'r_emailaddress r_liteprofile',
});
```

## Bundle Analysis

To verify tree-shaking is working, you can analyze your bundle:

### With webpack-bundle-analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js
```

### With Rollup Plugin Visualizer

```bash
npm install --save-dev rollup-plugin-visualizer
```

You should see that only the imported modules are included in your final bundle.

## Legacy Compatibility

For backwards compatibility, you can still use the old import style:

```typescript
// This still works but includes more code
import {
  useLinkedIn,
  LinkedIn,
  LinkedInCallback,
} from 'react-linkedin-login-oauth2';
```

But for optimal bundle size, prefer the modular imports shown above.

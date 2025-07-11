# React Linked In Login Using OAuth 2.0

## `react-linkedin-login-oauth2` VERSION `2` IS OUT. [THIS IS MIGRATION GUIDE](./MIGRATION-from-1-to-2.md) FROM `1` TO `2`.

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-11-orange.svg?style=flat-square)](#contributors-)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

[![npm package][npm-badge]][npm]
[![npm](https://img.shields.io/npm/dt/react-linkedin-login-oauth2)](https://www.npmjs.com/package/react-linkedin-login-oauth2)

[npm-badge]: https://img.shields.io/npm/v/react-linkedin-login-oauth2.png
[npm]: https://www.npmjs.org/package/react-linkedin-login-oauth2

Demo: https://stupefied-goldberg-b44ee5.netlify.app/

This package is used to get authorization code for Linked In Log in feature using OAuth2 in a easy way. After have the authorization code, you can exchange to an access token by sending it to the server to continue to get information needed. For more details, please see at [Authorization Code Flow (3-legged OAuth)](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)  
See [Usage](#usage) and [Demo](#demo) for instruction.

## Table of contents

- [Changelog](#changelog)
- [Installation](#installation)
- [Overview](#overview)
- [Usage](#usage)
- [Debug Logging](#debug-logging)
- [Support IE](#support-ie)
- [Demo](#demo)
- [Props](#props)
- [Issues](#issues)

## Changelog

See [CHANGELOG.md](https://github.com/nvh95/react-linkedin-login-oauth2/blob/master/CHANGELOG.md)

## Installation

```
npm install --save react-linkedin-login-oauth2@latest
```

## Overview

We will trigger `linkedInLogin` by using `useLinkedIn` (recommended) or `LinkedIn` (using render props technique) after click on Sign in with LinkedIn button, a popup window will show up and ask for the permission. After we accepted, the pop up window will redirect to `redirectUri` (should be `LinkedInCallback` component) then notice its opener about the authorization code Linked In provides us. You can use [react-router-dom](https://reactrouter.com/web) or [Next.js's file system routing](https://nextjs.org/docs/routing/introduction)

## Mobile Support (Flutter Webviews)

**NEW!** Version 2.1+ includes mobile-optimized components for Flutter webview environments:

- **`useLinkedInMobile`** hook - Uses localStorage polling instead of `window.opener.postMessage`
- **`LinkedInMobile`** component - Render prop pattern with loading states
- **`LinkedInMobileCallback`** component - Handles OAuth callback in mobile environments

Perfect for Flutter apps using `webview_flutter`, `flutter_inappwebview`, or other mobile webview solutions where `window.opener` is not available.

See [MOBILE_README.md](./MOBILE_README.md) for detailed mobile implementation guide.

```js
import { useLinkedInMobile } from 'react-linkedin-login-oauth2';

function MobileLinkedInLogin() {
  const { linkedInLogin, isLoading } = useLinkedInMobile({
    clientId: 'your-client-id',
    redirectUri: `${window.location.origin}/linkedin-mobile`,
    onSuccess: (code) => console.log('Mobile auth success:', code),
    onError: (error) => console.error('Mobile auth error:', error),
    pollInterval: 1000, // Check every second
    maxPollAttempts: 300, // 5 minute timeout
    debug: true,
  });

  return (
    <button onClick={linkedInLogin} disabled={isLoading}>
      {isLoading ? 'Connecting...' : 'Login with LinkedIn (Mobile)'}
    </button>
  );
}
```

## Usage

First, we create a button and provide required props:

```js
import React, { useState } from 'react';

import { useLinkedIn } from 'react-linkedin-login-oauth2';
// You can use provided image shipped by this package or using your own
import linkedin from 'react-linkedin-login-oauth2/assets/linkedin.png';

function LinkedInPage() {
  const { linkedInLogin } = useLinkedIn({
    clientId: '86vhj2q7ukf83q',
    redirectUri: `${window.location.origin}/linkedin`, // for Next.js, you can use `${typeof window === 'object' && window.location.origin}/linkedin`
    onSuccess: (code) => {
      console.log(code);
    },
    onError: (error) => {
      console.log(error);
    },
    debug: true, // Enable debug logging (optional, default: false)
  });

  return (
    <img
      onClick={linkedInLogin}
      src={linkedin}
      alt="Sign in with Linked In"
      style={{ maxWidth: '180px', cursor: 'pointer' }}
    />
  );
}
```

If you don't want to use hooks. This library offer render props option:

```js
import React, { useState } from 'react';

import { LinkedIn } from 'react-linkedin-login-oauth2';
// You can use provided image shipped by this package or using your own
import linkedin from 'react-linkedin-login-oauth2/assets/linkedin.png';

function LinkedInPage() {
  return (
    <LinkedIn
      clientId="86vhj2q7ukf83q"
      redirectUri={`${window.location.origin}/linkedin`}
      onSuccess={(code) => {
        console.log(code);
      }}
      onError={(error) => {
        console.log(error);
      }}
      debug={true} // Enable debug logging (optional, default: false)
    >
      {({ linkedInLogin }) => (
        <img
          onClick={linkedInLogin}
          src={linkedin}
          alt="Sign in with Linked In"
          style={{ maxWidth: '180px', cursor: 'pointer' }}
        />
      )}
    </LinkedIn>
  );
}
```

Then we point `redirect_url` to `LinkedInCallback`. You can use [react-router-dom](https://reactrouter.com/web) or [Next.js's file system routing](https://nextjs.org/docs/routing/introduction)

- `react-router-dom`:

```js
import React from 'react';
import { LinkedInCallback } from 'react-linkedin-login-oauth2';

import { BrowserRouter, Route } from 'react-router-dom';

function Demo() {
  return (
    <BrowserRouter>
      <Route exact path="/linkedin" component={LinkedInCallback} />
    </BrowserRouter>
  );
}
```

- Next.js's file system routing:

```js
// pages/linkedin.js
import { LinkedInCallback } from 'react-linkedin-login-oauth2';
export default function LinkedInPage() {
  return <LinkedInCallback debug={true} />; // Enable debug logging (optional, default: false)
}
```

## Debug Logging

This library includes built-in debug logging to help you troubleshoot OAuth flow issues. Debug logging can be enabled by setting the `debug` prop to `true` on any of the components (`useLinkedIn`, `LinkedIn`, or `LinkedInCallback`).

When debug mode is enabled, you'll see detailed console logs for:

- OAuth URL generation and parameters
- Popup window management
- Message passing between windows
- State validation (CSRF protection)
- Error conditions and success flows
- Parameter parsing and validation

### Example with debug enabled:

```js
// Using the hook
const { linkedInLogin } = useLinkedIn({
  clientId: 'your-client-id',
  redirectUri: 'your-redirect-uri',
  onSuccess: (code) => console.log(code),
  debug: true // This enables debug logging
});

// Or using the component
<LinkedIn debug={true} /* other props */>
  {({ linkedInLogin }) => (
    <button onClick={linkedInLogin}>Login with LinkedIn</button>
  )}
</LinkedIn>

// And in your callback page
<LinkedInCallback debug={true} />
```

Debug logs are prefixed with `[LinkedIn OAuth2]` to make them easily identifiable in your browser's developer console.

### Manual Debug Control

You can also manually control debug logging using the exported utilities:

```js
import { setDebugMode, debug } from 'react-linkedin-login-oauth2';

// Enable debug mode programmatically
setDebugMode(true);

// Use debug utilities in your own code
debug.log('Custom message', { data: 'example' });
debug.warn('Warning message');
debug.error('Error message');
```

# Support IE

- Support for IE is dropped from version `2`

## Demo

- Source code: https://github.com/nvh95/react-linkedin-login-oauth2-demo/blob/master/src/App.js
- In action: [https://stupefied-goldberg-b44ee5.netlify.app/](https://stupefied-goldberg-b44ee5.netlify.app/)

## Props

- `LinkedIn` component:

| Parameter         | value    | is required |                                                                                                default                                                                                                |
| ----------------- | -------- | :---------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| clientId          | string   |     yes     |                                                                                                                                                                                                       |
| redirectUri       | string   |     yes     |                                                                                                                                                                                                       |
| onSuccess         | function |     yes     |                                                                                                                                                                                                       |
| onError           | function |     no      |                                                                                                                                                                                                       |
| state             | string   |     no      |                                                                      randomly generated string (recommend to keep default value)                                                                      |
| scope             | string   |     no      |                                                                                           'r_emailaddress'                                                                                            |
|                   |          |             | See your app scope [here](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication?context=linkedin/context#permission-types). If there are more than one, delimited by a space |
| debug             | boolean  |     no      |                                                                                                 false                                                                                                 |
| closePopupMessage | string   |     no      |                                                                                        'User closed the popup'                                                                                        |
| children          | function |     no      |                                                                         Require if using `LinkedIn` component (render props)                                                                          |

Reference: [https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin/context#step-2-request-an-authorization-code](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin/context#step-2-request-an-authorization-code)

- `LinkedInCallback` component:

| Parameter | value   | is required | default |
| --------- | ------- | :---------: | :-----: |
| debug     | boolean |     no      |  false  |

## Issues

Please create an issue at [https://github.com/nvh95/react-linkedin-login-oauth2/issues](https://github.com/nvh95/react-linkedin-login-oauth2/issues). I will spend time to help you.

#### Failed to minify the code from this file: ./node_modules/react-linkedin-login-oauth2/node_modules/query-string/index.js:8

Please upgrade `react-linkedin-login-oauth2` to latest version following

```shell
npm install --save react-linkedin-login-oauth2
```

## Known issue

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://hung.dev"><img src="https://avatars.githubusercontent.com/u/8603085?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hung Viet Nguyen</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/commits?author=nvh95" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Songuku95"><img src="https://avatars.githubusercontent.com/u/9360548?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nguyễn Duy Khánh</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/commits?author=Songuku95" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/YBeck"><img src="https://avatars.githubusercontent.com/u/28867948?v=4?s=100" width="100px;" alt=""/><br /><sub><b>YBeck</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/commits?author=YBeck" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mehdirazajaffri"><img src="https://avatars.githubusercontent.com/u/10342757?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mehdi Raza</b></sub></a><br /><a href="#ideas-mehdirazajaffri" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/phillipdenness/"><img src="https://avatars.githubusercontent.com/u/7850970?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Phillip Denness</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/issues?q=author%3AphillipDenness" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/deepdil-sp"><img src="https://avatars.githubusercontent.com/u/39123166?v=4?s=100" width="100px;" alt=""/><br /><sub><b>dsp.iam</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/issues?q=author%3Adeepdil-sp" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/vitalii-bulyzhyn"><img src="https://avatars.githubusercontent.com/u/46309116?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vitalii Bulyzhyn</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/commits?author=vitalii-bulyzhyn" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/pradeeptinku"><img src="https://avatars.githubusercontent.com/u/8938131?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Pradeep Reddy Guduru</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/issues?q=author%3Apradeeptinku" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://linkedin.com/in/uric-bonatti-cardoso-820275132/"><img src="https://avatars.githubusercontent.com/u/43557914?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Uric Bonatti Cardoso</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/issues?q=author%3Auricbonatti" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/faisalur-rehman"><img src="https://avatars.githubusercontent.com/u/66237466?v=4?s=100" width="100px;" alt=""/><br /><sub><b>faisalur-rehman</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/commits?author=faisalur-rehman" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/asanovr"><img src="https://avatars.githubusercontent.com/u/6459461?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ruslan</b></sub></a><br /><a href="https://github.com/nvh95/react-linkedin-login-oauth2/commits?author=asanovr" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

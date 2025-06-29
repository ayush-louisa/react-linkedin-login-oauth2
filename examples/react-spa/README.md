# React SPA Example - LinkedIn OAuth2 Demo

This example demonstrates both desktop and mobile LinkedIn OAuth2 implementations in a single React SPA using the `react-linkedin-login-oauth2` library.

## Features Demonstrated

### Desktop Authentication

- Uses `useLinkedIn` hook
- Standard `window.opener.postMessage` communication
- Traditional popup-based OAuth flow
- Callback handled by `LinkedInCallback` component

### Mobile Authentication

- Uses `useLinkedInMobile` hook
- localStorage polling communication method
- Optimized for Flutter webviews and mobile browsers
- Callback handled by `LinkedInMobileCallback` component
- Loading states and proper error handling

## Routes

- `/` - Main demo page with both authentication modes
- `/linkedin` - Desktop OAuth callback (LinkedInCallback)
- `/linkedin-mobile` - Mobile OAuth callback (LinkedInMobileCallback)

## How to Test

### Desktop Mode

1. Click "Desktop Mode" tab
2. Click "Login with LinkedIn (Desktop)" button
3. Complete OAuth flow in popup
4. Results returned via postMessage

### Mobile Mode

1. Click "Mobile Mode (Flutter Webview)" tab
2. Click "Login with LinkedIn (Mobile)" button
3. Complete OAuth flow in popup/new tab
4. Results stored in localStorage and polled by main app
5. Popup closes automatically on success

## Configuration

The example uses environment variables for LinkedIn client configuration:

```bash
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

If not provided, it falls back to a demo client ID for testing.

## Key Differences

| Feature            | Desktop            | Mobile                       |
| ------------------ | ------------------ | ---------------------------- |
| Communication      | postMessage        | localStorage polling         |
| Hook               | `useLinkedIn`      | `useLinkedInMobile`          |
| Callback Component | `LinkedInCallback` | `LinkedInMobileCallback`     |
| Loading States     | Basic              | Enhanced with polling status |
| Popup Handling     | Event-based        | Storage-based detection      |
| Error Handling     | Immediate          | Polling-based discovery      |

## Mobile Implementation Details

The mobile implementation addresses common issues in webview environments:

- **No window.opener**: Uses localStorage instead of postMessage
- **InAppBrowser compatibility**: Works when popup is in separate browser context
- **State management**: Reliable communication via storage polling
- **Loading feedback**: Shows connection status during authentication
- **Error recovery**: Handles various mobile-specific error conditions

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_LINKEDIN_CLIENT_ID=your_actual_client_id
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

/**
 * LinkedInMobile component - mobile-optimized LinkedIn OAuth2 for Flutter webviews
 * @module components/LinkedInMobile
 *
 * This component provides a render prop pattern for mobile-optimized LinkedIn authentication
 * specifically designed for Flutter webview environments. It uses URL-based communication
 * instead of window.opener.postMessage to handle authentication results.
 *
 * Key features:
 * - Works in InAppBrowser environments where window.opener may not be available
 * - Uses localStorage polling instead of postMessage events
 * - Provides loading state for better UX
 * - Handles mobile webview redirect patterns
 */

import type { LinkedInMobileComponentConfig } from '../types/components';
import { useLinkedInMobile } from '../hooks/useLinkedInMobile';

/**
 * Mobile-optimized LinkedIn OAuth2 component using render props pattern
 *
 * @param props - Component configuration including OAuth2 settings and render function
 * @returns JSX element rendered by the children function
 *
 * @example
 * ```tsx
 * import { LinkedInMobile } from 'react-linkedin-login-oauth2';
 *
 * function MyComponent() {
 *   return (
 *     <LinkedInMobile
 *       clientId="your-client-id"
 *       redirectUri="your-redirect-uri"
 *       onSuccess={(code) => console.log('Success:', code)}
 *       onError={(error) => console.error('Error:', error)}
 *       debug={true}
 *       pollInterval={2000}
 *       maxPollAttempts={150}
 *     >
 *       {({ linkedInLogin, isLoading }) => (
 *         <button
 *           onClick={linkedInLogin}
 *           disabled={isLoading}
 *           style={{
 *             padding: '12px 24px',
 *             fontSize: '16px',
 *             backgroundColor: '#0077B5',
 *             color: 'white',
 *             border: 'none',
 *             borderRadius: '4px',
 *             cursor: isLoading ? 'not-allowed' : 'pointer',
 *             opacity: isLoading ? 0.6 : 1,
 *           }}
 *         >
 *           {isLoading ? 'Connecting...' : 'Login with LinkedIn'}
 *         </button>
 *       )}
 *     </LinkedInMobile>
 *   );
 * }
 * ```
 */
export function LinkedInMobile({
  children,
  ...config
}: LinkedInMobileComponentConfig): JSX.Element {
  const { linkedInLogin, isLoading } = useLinkedInMobile(config);

  return children({ linkedInLogin, isLoading });
}

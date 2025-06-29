/**
 * LinkedIn component - modular implementation
 * @module components/LinkedIn
 */

import type { LinkedInComponentConfig } from '../types/components';
import { useLinkedIn } from '../hooks/useLinkedIn';

/**
 * LinkedIn OAuth2 component using render props pattern
 * @param props - LinkedIn component configuration
 * @returns JSX element
 */
export function LinkedIn({
  children,
  ...config
}: LinkedInComponentConfig): JSX.Element {
  const { linkedInLogin } = useLinkedIn(config);
  return children({ linkedInLogin });
}

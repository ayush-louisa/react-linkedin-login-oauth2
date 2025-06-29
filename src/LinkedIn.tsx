import type { LinkedInType } from './types';
import { useLinkedIn } from './useLinkedIn';

export function LinkedIn({
  children,
  redirectUri,
  clientId,
  onSuccess,
  onError,
  state,
  scope,
  closePopupMessage,
  debug,
}: LinkedInType) {
  const { linkedInLogin } = useLinkedIn({
    redirectUri,
    clientId,
    onSuccess,
    onError,
    state,
    scope,
    closePopupMessage,
    debug,
  });
  return children({ linkedInLogin });
}

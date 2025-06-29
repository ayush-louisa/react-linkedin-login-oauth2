import type { LinkedInType } from './types';
import { LinkedInMethod } from './types';
import { useLinkedIn } from './default/useLinkedIn';
import { useLinkedInBroadcast } from './broadcast/useLinkedInBroadcast';
import { useLinkedInMobile } from './mobile/useLinkedInMobile';
import { useLinkedInWebView } from './web-view/useLinkedInWebView';
import { useLinkedInPolling } from './polling/useLinkedInPolling';

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
  method = LinkedInMethod.DEFAULT,
}: LinkedInType) {
  // Test if debug parameter is being passed - temporary
  if (debug) {
    console.log('🔥 DEBUG MODE ENABLED IN LinkedIn component');
    (
      window as unknown as { linkedinDebugEnabled: boolean }
    ).linkedinDebugEnabled = true;
  }

  const hookParams = {
    redirectUri,
    clientId,
    onSuccess,
    onError,
    state,
    scope,
    closePopupMessage,
    debug,
  };

  // Call all hooks unconditionally (React rules)
  const { linkedInLogin: defaultLogin } = useLinkedIn(hookParams);
  const { linkedInLogin: broadcastLogin } = useLinkedInBroadcast(hookParams);
  const { linkedInLogin: mobileLogin } = useLinkedInMobile(hookParams);
  const { linkedInLogin: webviewLogin } = useLinkedInWebView(hookParams);
  const { linkedInLogin: pollingLogin } = useLinkedInPolling(hookParams);

  // Select the appropriate login function based on the method
  let linkedInLogin: () => void;

  switch (method) {
    case LinkedInMethod.BROADCAST:
      linkedInLogin = broadcastLogin;
      break;
    case LinkedInMethod.MOBILE:
      linkedInLogin = mobileLogin;
      break;
    case LinkedInMethod.WEBVIEW:
      linkedInLogin = webviewLogin;
      break;
    case LinkedInMethod.POLLING:
      linkedInLogin = pollingLogin;
      break;
    case LinkedInMethod.DEFAULT:
    default:
      linkedInLogin = defaultLogin;
      break;
  }

  return children({ linkedInLogin });
}

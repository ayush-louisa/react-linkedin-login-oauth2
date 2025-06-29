// Core exports (always minimal)
export * from './types';

// Default implementation (popup-based)
export { useLinkedIn } from './default/useLinkedInOptimized';
export { LinkedIn } from './LinkedIn';
export { LinkedInCallback } from './default/LinkedInCallback';

// Feature-specific exports (tree-shakable)
export { useLinkedInPolling } from './polling/useLinkedInPollingOptimized';
export { useLinkedInWebView } from './web-view/useLinkedInWebView';
export { useLinkedInMobile } from './mobile/useLinkedInMobile';
export { useLinkedInBroadcast } from './broadcast/useLinkedInBroadcast';

// Callback components
export { LinkedInCallbackWebView } from './web-view/LinkedInCallbackWebView';
export { LinkedInMobileCallback } from './mobile/LinkedInMobileCallback';
export { LinkedInCallbackBroadcast } from './broadcast/LinkedInCallbackBroadcast';

export interface useLinkedInType {
  redirectUri: string;
  clientId: string;
  onSuccess: (code: string) => void;
  onError?: ({
    error,
    errorMessage,
  }: {
    error: string;
    errorMessage: string;
  }) => void;
  state?: string;
  scope?: string;
  closePopupMessage?: string;
  debug?: boolean;
}

// Enhanced type for polling approach
export interface PollingConfig {
  /** Base URL for your backend that handles OAuth completion */
  pollingEndpoint: string;
  /** How often to poll for completion (ms) */
  pollingInterval?: number;
  /** Maximum time to poll before timing out (ms) */
  pollingTimeout?: number;
}

export interface useLinkedInPollingType extends useLinkedInType {
  polling?: PollingConfig;
}

// Type for broadcast channel approach (same as base type)
export type useLinkedInBroadcastType = useLinkedInType;

// Mobile-specific configuration
export interface MobileConfig {
  /** Whether to open LinkedIn in same window (true) or try new window (false) */
  useSameWindow?: boolean;
  /** Custom URL scheme for deep linking back to app (e.g., 'myapp://') */
  customScheme?: string;
  /** Whether to use polling for completion check */
  usePolling?: boolean;
  /** Polling configuration if usePolling is true */
  pollingConfig?: {
    endpoint: string;
    interval?: number;
    timeout?: number;
  };
}

export interface useLinkedInMobileType extends useLinkedInType {
  mobile?: MobileConfig;
}

export interface LinkedInType extends useLinkedInType {
  children: ({ linkedInLogin }: { linkedInLogin: () => void }) => JSX.Element;
  method?: LinkedInMethod;
}

// Enhanced return types
export interface LinkedInHookReturn {
  linkedInLogin: () => void;
  isLoading?: boolean;
}

export interface LinkedInMobileHookReturn extends LinkedInHookReturn {
  isInWebView: boolean;
}

// Enum for different LinkedIn authentication methods
export enum LinkedInMethod {
  DEFAULT = 'default',
  BROADCAST = 'broadcast',
  MOBILE = 'mobile',
  WEBVIEW = 'webview',
  POLLING = 'polling',
}

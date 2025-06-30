/**
 * Broadcast Channel-specific utilities
 * Only imported when using broadcast authentication
 */

export interface BroadcastMessage {
  type: string;
  code?: string;
  error?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface BroadcastManager {
  channel: BroadcastChannel | null;
  sessionId: string;
  listen: (onMessage: (data: BroadcastMessage) => void) => void;
  close: () => void;
}

export const createBroadcastManager = (
  channelName: string = 'linkedin-oauth-channel',
): BroadcastManager => {
  let channel: BroadcastChannel | null = null;
  let sessionId = '';

  // Check if BroadcastChannel is supported
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('BroadcastChannel not supported in this browser');
  }

  return {
    get channel() {
      return channel;
    },

    get sessionId() {
      return sessionId;
    },

    listen: (onMessage: (data: BroadcastMessage) => void) => {
      if (typeof BroadcastChannel === 'undefined') {
        return;
      }

      // Generate new session ID
      sessionId = Math.random().toString(36).substring(2, 15);

      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event) => {
        const { sessionId: messageSessionId, ...data } = event.data;

        // Verify this message is for our session
        if (messageSessionId === sessionId) {
          onMessage(data);
        }
      };
    },

    close: () => {
      if (channel) {
        channel.close();
        channel = null;
      }
      sessionId = '';
    },
  };
};

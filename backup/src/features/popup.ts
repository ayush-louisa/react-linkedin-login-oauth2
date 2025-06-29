/**
 * Popup-specific utilities
 * Only imported when using default/popup authentication
 */

import { POPUP_CONFIG } from '../config/constants';

export const getPopupPositionProperties = (
  width: number = POPUP_CONFIG.WIDTH,
  height: number = POPUP_CONFIG.HEIGHT,
): string => {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `left=${left},top=${top},width=${width},height=${height}`;
};

export interface PopupManager {
  open: (url: string, width?: number, height?: number) => Window | null;
  close: () => void;
  isClosed: () => boolean;
  getWindow: () => Window | null;
}

export const createPopupManager = (): PopupManager => {
  let popupWindow: Window | null = null;

  return {
    open: (
      url: string,
      width = POPUP_CONFIG.WIDTH,
      height = POPUP_CONFIG.HEIGHT,
    ) => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }

      popupWindow = window.open(
        url,
        '_blank',
        getPopupPositionProperties(width, height),
      );

      return popupWindow;
    },

    close: () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      popupWindow = null;
    },

    isClosed: () => {
      return !popupWindow || popupWindow.closed;
    },

    getWindow: () => popupWindow,
  };
};

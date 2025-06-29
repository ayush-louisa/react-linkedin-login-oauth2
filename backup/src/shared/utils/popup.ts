/**
 * Popup window utility functions
 */

export const getPopupPositionProperties = ({ width = 600, height = 600 }) => {
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
    open: (url: string, width = 600, height = 600) => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }

      popupWindow = window.open(
        url,
        '_blank',
        getPopupPositionProperties({ width, height }),
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

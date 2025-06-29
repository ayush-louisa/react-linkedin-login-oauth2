/**
 * Core utilities for LinkedIn OAuth2 flow
 * @module core/utils
 */

/**
 * Generates a cryptographically secure random string
 * @param length - Length of the string to generate
 * @returns Random string
 */
export const generateRandomString = (length = 20): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

/**
 * Calculates popup window position for centering
 * @param dimensions - Width and height of the popup
 * @returns CSS-formatted position string
 */
export const getPopupPositionProperties = ({
  width = 600,
  height = 600,
}: {
  width?: number;
  height?: number;
} = {}): string => {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `left=${left},top=${top},width=${width},height=${height}`;
};

/**
 * Core utilities needed by all authentication methods
 * These will always be included in the bundle
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

export const buildLinkedInAuthUrl = ({
  clientId,
  redirectUri,
  scope = 'r_emailaddress',
  state,
}: {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state: string;
}): string => {
  const scopeParam = `&scope=${encodeURI(scope)}`;
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${state}`;
};

export const validateState = (
  receivedState: string,
  savedState: string | null,
): boolean => {
  return receivedState === savedState;
};

/**
 * URL parsing and manipulation utilities
 * @module core/url
 */

/**
 * Parses URL search parameters into an object
 * @param search - URL search string (including or excluding leading '?')
 * @returns Object with parsed key-value pairs
 */
export const parseUrlParams = (search: string): Record<string, string> => {
  const query = search.startsWith('?') ? search.substring(1) : search;
  const vars = query.split('&');
  const parsed: Record<string, string> = {};

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (pair.length > 1) {
      parsed[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }

  return parsed;
};

/**
 * Builds LinkedIn OAuth2 authorization URL
 * @param params - OAuth2 parameters
 * @returns Complete authorization URL
 */
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
  const baseUrl = 'https://www.linkedin.com/oauth/v2/authorization';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return `${baseUrl}?${params.toString()}`;
};

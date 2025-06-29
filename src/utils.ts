import { debug } from './debug';

export const LINKEDIN_OAUTH2_STATE = 'linkedin_oauth2_state';

export function parse(search: string): Record<string, string> {
  debug.log('Parsing URL search parameters', { search });

  const query = search.substring(1);
  const vars = query.split('&');
  const parsed: Record<string, string> = {};

  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (pair.length > 1) {
      parsed[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
  }

  debug.log('Parsed parameters result', parsed);
  return parsed;
}

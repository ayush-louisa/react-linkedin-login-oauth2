import { describe, it, expect } from 'vitest';
import { parseUrlParams } from '../utils';

describe('parseUrlParams', () => {
  it('should parse query string with single parameter', () => {
    expect(parseUrlParams('?a=b')).toEqual({ a: 'b' });
  });

  it('should parse query string with multiple parameters', () => {
    expect(parseUrlParams('?a=b&c=d')).toEqual({ a: 'b', c: 'd' });
  });

  it('should return empty object for empty query string', () => {
    expect(parseUrlParams('?')).toEqual({});
    expect(parseUrlParams('')).toEqual({});
  });

  it('should handle URL encoded parameters', () => {
    expect(parseUrlParams('?a%20=b%20')).toEqual({ 'a ': 'b ' });
  });
});

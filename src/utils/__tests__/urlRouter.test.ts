import { describe, it, expect } from 'vitest';
import { parseRouteFromUrl } from '../urlRouter';

describe('urlRouter.parseRouteFromUrl', () => {
  it('parses valid main tab without sub-tab', () => {
    expect(parseRouteFromUrl('?tab=juniorPlayground')).toEqual({
      tab: 'juniorPlayground',
      sub: undefined,
    });
  });

  it('parses valid main tab and valid sub-tab', () => {
    expect(parseRouteFromUrl('?tab=codingLab&sub=microbit')).toEqual({
      tab: 'codingLab',
      sub: 'microbit',
    });
    expect(parseRouteFromUrl('?tab=safety&sub=searchLab')).toEqual({
      tab: 'safety',
      sub: 'searchLab',
    });
  });

  it('drops invalid sub-tab while keeping valid main tab', () => {
    expect(parseRouteFromUrl('?tab=thinking&sub=nonexistent')).toEqual({
      tab: 'thinking',
      sub: undefined,
    });
  });

  it('maps shared flowchart query (?fc=...) to thinking/flowchart', () => {
    expect(parseRouteFromUrl('?fc=abc123')).toEqual({
      tab: 'thinking',
      sub: 'flowchart',
    });
  });

  it('returns null for unknown, removed, or empty tab', () => {
    expect(parseRouteFromUrl('')).toBeNull();
    expect(parseRouteFromUrl('?tab=unknownModule')).toBeNull();
    expect(parseRouteFromUrl('?tab=bebrasArena')).toBeNull();
  });
});

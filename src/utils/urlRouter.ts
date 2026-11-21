export interface RouteState {
  tab: string;
  sub?: string;
}

export const VALID_MAIN_TABS = new Set([
  'dashboard',
  'learningMap',
  'profileManage',
  'classroom',
  'buddySystem',
  'rewards',
  'didYouKnow',
  'leaderboard',
  'safety',
  'thinking',
  'codingLab',
  'showcase',
  'juniorPlayground',
  'kidsAILab',
  'teamBattle',
  'digitalLibrary',
  'stemProjects',
  'binaryLab',
  'aiPromptLab',
  'microbitDataLogger',
  'musicLab',
  'pdpaConsent',
]);

export const VALID_SUB_TABS: Record<string, Set<string>> = {
  safety: new Set(['pdpaLab', 'pdpa', 'password', 'netiquette', 'quiz', 'pdpaGenerator', 'searchLab']),
  thinking: new Set(['pillars', 'flowchart', 'controls', 'puzzle', 'logicLab']),
  codingLab: new Set(['scratch', 'microbit', 'musicLab', 'examplesGallery', 'debugLab']),
  showcase: new Set(['gallery', 'reviews', 'reflection', 'dailyJournal', 'dataLab']),
};

export function parseRouteFromUrl(
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): RouteState | null {
  try {
    const params = new URLSearchParams(search);
    if (params.has('fc')) {
      return { tab: 'thinking', sub: 'flowchart' };
    }
    const tab = params.get('tab');
    if (!tab || !VALID_MAIN_TABS.has(tab)) {
      return null;
    }
    const rawSub = params.get('sub') || undefined;
    const allowedSubs = VALID_SUB_TABS[tab];
    const sub = rawSub && allowedSubs?.has(rawSub) ? rawSub : undefined;
    return { tab, sub };
  } catch {
    return null;
  }
}

export function syncRouteToUrl(route: RouteState, replace = false): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    // Preserve shared flowchart parameter when staying on thinking/flowchart
    if (url.searchParams.has('fc') && route.tab === 'thinking' && route.sub === 'flowchart') {
      return;
    }
    // Clear stale ?fc= when navigating away from flowchart
    if (url.searchParams.has('fc') && (route.tab !== 'thinking' || route.sub !== 'flowchart')) {
      url.searchParams.delete('fc');
    }

    if (route.tab === 'dashboard' && !route.sub) {
      url.searchParams.delete('tab');
      url.searchParams.delete('sub');
    } else {
      url.searchParams.set('tab', route.tab);
      if (route.sub && VALID_SUB_TABS[route.tab]?.has(route.sub)) {
        url.searchParams.set('sub', route.sub);
      } else {
        url.searchParams.delete('sub');
      }
    }

    const nextSearch = url.searchParams.toString();
    const currentSearch = new URLSearchParams(window.location.search).toString();
    if (nextSearch === currentSearch) return;

    const targetUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
    if (replace) {
      window.history.replaceState(route, '', targetUrl);
    } else {
      window.history.pushState(route, '', targetUrl);
    }
  } catch {
    // Ignore History API errors inside restricted sandbox frames
  }
}

export function buildShareableLessonUrl(tab: string, sub?: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.origin + window.location.pathname);
    if (tab && tab !== 'dashboard' && VALID_MAIN_TABS.has(tab)) {
      url.searchParams.set('tab', tab);
      if (sub && VALID_SUB_TABS[tab]?.has(sub)) {
        url.searchParams.set('sub', sub);
      }
    }
    return url.toString();
  } catch {
    return '';
  }
}

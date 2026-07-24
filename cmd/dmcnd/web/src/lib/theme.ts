// Shared light/dark + density preferences. The app shell owns the live toggles
// and persists them here; every other screen reads the same keys so the whole app
// stays visually consistent without a global provider.

export type Theme = 'light' | 'dark';
export type ThemePref = 'light' | 'dark' | 'system';

// readThemePref returns the raw stored preference (including "system"); anything
// not explicitly light/dark means "follow the OS".
export function readThemePref(): ThemePref {
  const saved = localStorage.getItem('dmcn_theme');
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

// resolveTheme maps a preference to the concrete theme to apply.
export function resolveTheme(pref: ThemePref): Theme {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readTheme(): Theme {
  return resolveTheme(readThemePref());
}

export function readDensity(): 'compact' | 'comfortable' {
  return localStorage.getItem('dmcn_density') === 'compact' ? 'compact' : 'comfortable';
}

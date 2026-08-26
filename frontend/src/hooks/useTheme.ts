import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode } from '../types/calendar.types';

const STORAGE_KEY = 'calendar-theme';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

/**
 * The initial value is read from `document.documentElement`'s `data-theme`
 * attribute, not recomputed from localStorage/matchMedia here. That
 * attribute is set synchronously by an inline script in index.html,
 * *before* React mounts (see the head script) — reading it back as the
 * lazy initializer means this hook's first render always matches what's
 * already painted on screen. Recomputing independently here risks a
 * mismatch (e.g. a stale closure over `prefers-color-scheme`) and a flash
 * of the wrong theme on mount.
 */
function readInitialTheme(): ThemeMode {
  const attr = document.documentElement.getAttribute('data-theme');
  return isThemeMode(attr) ? attr : 'dark';
}

export function useTheme(): [ThemeMode, () => void] {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);

  // Keeps the DOM attribute (which every CSS variable in index.css is
  // keyed off) and localStorage in sync with React state after the first
  // render. The head script only handles the *initial* paint; this effect
  // handles every subsequent toggle.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private browsing, disabled cookies).
      // The theme still applies for the session — it just won't persist.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggleTheme];
}

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'applyflow_theme';

export function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'light';
}

export function resolveEffectiveTheme(theme: Theme): EffectiveTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export function applyThemeToDOM(effectiveTheme: EffectiveTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', effectiveTheme);

  // Update browser theme-color meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#09090b' : '#fafafa');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveEffectiveTheme(getStoredTheme()));

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (err) {
      console.warn('Could not persist theme to localStorage:', err);
    }

    const resolved = resolveEffectiveTheme(newTheme);
    applyThemeToDOM(resolved);
    setThemeState(newTheme);
    setEffectiveTheme(resolved);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('applyflow_theme_changed', { detail: newTheme }));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  }, [effectiveTheme, setTheme]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const next = e.newValue as Theme;
        if (next === 'light' || next === 'dark' || next === 'system') {
          const resolved = resolveEffectiveTheme(next);
          applyThemeToDOM(resolved);
          setThemeState(next);
          setEffectiveTheme(resolved);
        }
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail) {
        const resolved = resolveEffectiveTheme(customEvent.detail);
        applyThemeToDOM(resolved);
        setThemeState(customEvent.detail);
        setEffectiveTheme(resolved);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (getStoredTheme() === 'system') {
        const resolved = getSystemTheme();
        applyThemeToDOM(resolved);
        setEffectiveTheme(resolved);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('applyflow_theme_changed', handleCustomChange);
    mediaQuery.addEventListener('change', handleMediaChange);

    // Initial mount apply
    const initialEffective = resolveEffectiveTheme(getStoredTheme());
    applyThemeToDOM(initialEffective);
    setEffectiveTheme(initialEffective);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applyflow_theme_changed', handleCustomChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  return {
    theme,
    effectiveTheme,
    isDark: effectiveTheme === 'dark',
    setTheme,
    toggleTheme,
  };
}

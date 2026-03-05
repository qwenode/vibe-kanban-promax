import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from 'shared/types';

type ThemeProviderProps = {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
};

type ThemeProviderState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const initialState: ThemeProviderState = {
  theme: ThemeMode.SYSTEM,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  initialTheme = ThemeMode.SYSTEM,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  // Update theme when initialTheme changes
  useEffect(() => {
    setThemeState(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    const applyTheme = (next: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(next);

      // Semi Design dark mode hook
      if (next === 'dark') {
        body.setAttribute('theme-mode', 'dark');
      } else {
        body.removeAttribute('theme-mode');
      }
    };

    if (theme === ThemeMode.SYSTEM) {
      const mql: MediaQueryList = window.matchMedia(
        '(prefers-color-scheme: dark)'
      );
      const getSystemTheme = () => (mql.matches ? 'dark' : 'light');

      applyTheme(getSystemTheme());

      const handler = () => applyTheme(getSystemTheme());
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
      }
      const legacy = mql as unknown as {
        addListener?: (listener: () => void) => void;
        removeListener?: (listener: () => void) => void;
      };
      legacy.addListener?.(handler);
      return () => legacy.removeListener?.(handler);
    }

    applyTheme(theme.toLowerCase() as 'light' | 'dark');
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

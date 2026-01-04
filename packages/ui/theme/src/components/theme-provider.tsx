import { createContext, useContext, useLayoutEffect } from 'react';
import { useAtomValue, useAtomSet } from '@effect-atom/atom-react';
import { colorModeAtom } from '../atoms/theme-atoms';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use Effect Atom for color mode with localStorage persistence
  const theme = useAtomValue(colorModeAtom);
  const setThemeAtom = useAtomSet(colorModeAtom);

  // Use useLayoutEffect for synchronous DOM updates to prevent flash
  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = window.document.documentElement;

    // Determine the actual theme to apply
    const actualTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;

    // Only update if the class isn't already correct (prevents flash during hydration)
    if (!root.classList.contains(actualTheme)) {
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
    }
  }, [theme]);

  const value = {
    theme: theme as Theme,
    setTheme: (newTheme: Theme) => {
      setThemeAtom(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

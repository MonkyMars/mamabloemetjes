import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      let isDark: boolean;

      if (theme === 'system') {
        isDark = mediaQuery.matches;
      } else {
        isDark = theme === 'dark';
      }

      setResolvedTheme(isDark ? 'dark' : 'light');
      applyTheme(isDark ? 'dark' : 'light');
    };

    // Apply theme immediately
    updateResolvedTheme();

    // Listen for system theme changes only if theme is "system"
    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateResolvedTheme);
    }

    // Save theme to localStorage
    localStorage.setItem('theme', theme);

    return () => {
      if (theme === 'system') {
        mediaQuery.removeEventListener('change', updateResolvedTheme);
      }
    };
  }, [theme, mounted]);

  const applyTheme = (resolvedTheme: 'light' | 'dark') => {
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#ededed');
      root.style.setProperty('--color-secondary', '#ffab91');
      root.style.setProperty('--glass-bg', 'rgba(10, 10, 10, 0.8)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--shadow-secondary', 'rgba(255, 171, 145, 0.25)');
      root.classList.add('dark');
    } else {
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#171717');
      root.style.setProperty('--color-secondary', '#ff9a8b');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--shadow-secondary', 'rgba(255, 154, 139, 0.2)');
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: resolvedTheme === 'dark',
    mounted,
  };
};

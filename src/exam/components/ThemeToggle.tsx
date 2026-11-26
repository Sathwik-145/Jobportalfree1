import { Moon, Sun } from 'lucide-react';
import { useTheme as useSiteTheme } from '@/components/ThemeProvider';

/** CodeXam uses the same light/dark choice as the rest of the site, so switching once applies everywhere. */
export function useTheme() {
  const { theme, setTheme } = useSiteTheme();
  const dark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return { theme: dark ? 'dark' as const : 'light' as const, toggle: () => setTheme(dark ? 'light' : 'dark') };
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

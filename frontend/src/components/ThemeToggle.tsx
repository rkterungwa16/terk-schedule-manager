import { memo } from 'react';
import type { ThemeMode } from '../types/calendar.types';

interface ThemeToggleProps {
  mode: ThemeMode;
  onToggle: () => void;
}

function ThemeToggleComponent({ mode, onToggle }: ThemeToggleProps) {
  const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextMode} theme`}
    >
      {mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}

export const ThemeToggle = memo(ThemeToggleComponent);

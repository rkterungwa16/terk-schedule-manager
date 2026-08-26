import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { CategoriesProvider } from '../context/CategoriesContext';

function AllProviders({ children }: { children: ReactNode }) {
  return <CategoriesProvider>{children}</CategoriesProvider>;
}

/**
 * Every component that reads `useCategories()` (Day, Legend, DayDetails,
 * ScheduleDayRow, EventFields and anything built on it) throws if rendered
 * outside a CategoriesProvider — see CategoriesContext's own guard. Rather
 * than every test file wrapping its own `render(<CategoriesProvider>...)`,
 * this one custom `render` does it once; a test that genuinely needs a
 * bare tree with no providers can still use RTL's own `render` directly.
 */
function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders as render };

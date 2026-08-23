import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EventCategory } from '../types/calendar.types';
import { DEFAULT_CATEGORIES } from '../data/categories';

interface CategoriesContextValue {
  categories: EventCategory[];
  addCategory: (name: string, color: string) => EventCategory;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

/**
 * Why Context, when nothing else in this app uses it: categories are read
 * by several components with no relationship to each other in the tree —
 * `Day` and `Legend` sit under Month view, `ScheduleDayRow` sits under
 * Schedule view, `AddEventForm` sits under the modal — while the
 * components *between* them (`MonthBlock`, `ScheduleView`, `Calendar`
 * itself) have no use for a category list at all. Prop-drilling
 * `categories` through every one of those intermediaries just to reach
 * five unrelated leaves is exactly the case Context exists for; passing it
 * as a normal prop everywhere else in this app has been fine specifically
 * because the tree is shallow and the data is genuinely local to a
 * parent-child relationship, neither of which is true here.
 */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<EventCategory[]>(DEFAULT_CATEGORIES);

  const addCategory = useCallback((name: string, color: string) => {
    const newCategory: EventCategory = { id: crypto.randomUUID(), name, color };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  }, []);

  const value = useMemo(() => ({ categories, addCategory }), [categories, addCategory]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesContextValue {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}

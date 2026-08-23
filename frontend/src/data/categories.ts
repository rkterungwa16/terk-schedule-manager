import type { EventCategory } from '../types/calendar.types';

/**
 * The four categories the app ships with — same identities and colors the
 * old CATEGORY_COLOR_MAP defined, just as data instead of a compile-time
 * map, since the category set is no longer closed (see calendar.types.ts
 * section 1). Seeded once, at app start; from then on categories are
 * ordinary state that CategoriesContext owns and `addCategory` extends.
 */
export const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'work', name: 'Work', color: '#d98e3c' },
  { id: 'sports', name: 'Sports', color: '#3e8e8e' },
  { id: 'kids', name: 'Kids', color: '#c15b7b' },
  { id: 'other', name: 'Other', color: '#6e9b4c' },
];

/**
 * Flat, muted swatch choices offered when creating a new category — not an
 * open color picker. Keeping new categories' colors drawn from the same
 * curated palette as the built-in four is what keeps a user-added category
 * looking like a native part of the app's ink-stamp identity, rather than
 * an arbitrary color clashing with it.
 */
export const CATEGORY_COLOR_PALETTE: string[] = [
  '#d98e3c', // ochre
  '#3e8e8e', // teal
  '#c15b7b', // rose
  '#6e9b4c', // olive
  '#7a6bb0', // plum
  '#4c7ba6', // slate blue
  '#b0793f', // mustard
  '#8a8f5c', // sage
];

/** Looks up a category by id, falling back to a neutral placeholder rather
 *  than throwing — an event can reference a category id that no longer
 *  resolves to anything the type checker would catch (categories are
 *  runtime data now), so every call site that reads a category needs a
 *  defined result even for a dangling reference. */
export function getCategory(categories: EventCategory[], categoryId: string): EventCategory {
  return (
    categories.find((category) => category.id === categoryId) ?? {
      id: categoryId,
      name: 'Unknown',
      color: '#888888',
    }
  );
}

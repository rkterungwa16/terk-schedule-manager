import { useCategories } from '../context/CategoriesContext';

/**
 * Previously derived by scanning `events` for whichever categories
 * happened to be in use and deduplicating. Now that categories are their
 * own first-class list (see CategoriesContext) rather than something only
 * implicitly known through the events that reference them, the legend can
 * just read that list directly — which also means a category the user
 * just created shows up here immediately, even before any event uses it,
 * rather than waiting for a matching event to exist.
 *
 * The swatch is a real `<span>`, not the `::before` pseudo-element the
 * fixed four categories used before: a pseudo-element isn't part of the
 * DOM React renders to, so there's no element there to attach an inline
 * `style` to. A user-created category's color is arbitrary data, not one
 * of four values CSS classes could enumerate, so it has to be painted via
 * `style`, which means it needs a real node.
 */
export function Legend() {
  const { categories } = useCategories();

  return (
    <div className="legend">
      {categories.map((category) => (
        <span className="entry" key={category.id}>
          <span className="entry-swatch" style={{ backgroundColor: category.color }} />
          {category.name}
        </span>
      ))}
    </div>
  );
}

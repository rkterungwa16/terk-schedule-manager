import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Deliberately no "is this element actually visible" filter on top of the
// selector above (e.g. checking `offsetParent !== null`). Every place in
// this app that hides a field — the category-creation sub-form in
// EventFields, for one — does it via real conditional rendering, not CSS
// visibility, so a matched element is always genuinely present and
// interactive. `offsetParent` in particular would be actively wrong here
// twice over: it's always `null` for every element in jsdom (no layout
// engine to compute it), which would break every test; and even in a real
// browser it's `null` for `position: fixed` elements regardless of
// whether they're visible, which is a real footgun for exactly the kind
// of overlay this hook is meant to be used inside of.

/**
 * Standard WAI-ARIA dialog keyboard behavior, applied to both the
 * center modal (AddEventForm) and the slide-in side panel
 * (EventEditPanel) — a keyboard or screen-reader user shouldn't be able
 * to Tab past the last field and land back on the calendar grid behind
 * an open dialog, and closing it shouldn't strand focus on `<body>`.
 *
 * Returns a ref to attach to the dialog's outermost container. Everything
 * else — finding what's focusable, moving focus in, cycling Tab at the
 * edges, restoring focus on close — happens inside the effect below,
 * scoped to whatever's actually inside that container at the time, so it
 * doesn't need to know anything about the specific form it's wrapping.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onEscape?: () => void) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Remembered once, when the trap activates — restored on cleanup,
    // whether that's from Escape, an explicit close button, or the
    // component simply unmounting some other way. Without this, closing
    // a dialog opened by clicking a day cell would leave focus nowhere
    // in particular rather than back on that cell.
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Move focus into the dialog on open. The first focusable element
    // (typically the name input) rather than the container itself — a
    // sighted keyboard user expects the field they'd naturally type into
    // first to be focused, not an invisible wrapper.
    const initialFocusTarget = getFocusable()[0] ?? container;
    initialFocusTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        // Nothing to tab between — keep focus pinned on the container
        // rather than letting it escape to the page behind the dialog.
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Covers both "focus is on the edge element, about to leave the
      // trap" and "focus somehow ended up outside the container entirely"
      // (e.g. a race with something else stealing focus) — either way,
      // the fix is the same: pull it back to the appropriate edge.
      const isOutsideOrAtEdge = (edge: HTMLElement) =>
        document.activeElement === edge || !container.contains(document.activeElement);

      if (event.shiftKey && isOutsideOrAtEdge(first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && isOutsideOrAtEdge(last)) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [active, onEscape]);

  return containerRef;
}

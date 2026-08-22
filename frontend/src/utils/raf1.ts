/**
 * Coalesces rapid calls (a scroll handler firing many times a second) down
 * to at most once per animation frame. Taken directly from the reference
 * vanilla implementation's `raf1` helper — scroll-driven recalculation
 * doesn't need to run more often than the browser can actually repaint.
 */
export function raf1(fn: () => void): () => void {
  let scheduled = false;
  return () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn();
    });
  };
}

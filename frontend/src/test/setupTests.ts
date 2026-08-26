import '@testing-library/jest-dom';

/**
 * jsdom doesn't implement ResizeObserver or IntersectionObserver at all —
 * referencing either throws `ReferenceError: ... is not defined`. Several
 * components in this app depend on them only transitively (the
 * virtualized scroll views use both internally), so even a test that
 * isn't exercising scrolling behavior directly can still crash on mount
 * without these. The stubs below are intentionally inert: they satisfy
 * the constructor signature so nothing throws, but never fire callbacks,
 * since jsdom has no real layout engine to observe changes in.
 *
 * That inertness is also why this app's virtualized scroll views
 * (MonthScrollView, ScheduleView) aren't covered by the component tests
 * here — meaningfully exercising scroll-driven loading and measurement
 * needs real layout and real observer callbacks, neither of which jsdom
 * provides. Testing that behavior is better suited to a browser-based
 * end-to-end tool than to jsdom-based unit tests.
 */
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ObserverStub;
}

if (!('IntersectionObserver' in globalThis)) {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = ObserverStub;
}

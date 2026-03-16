import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

if (!("ResizeObserver" in window)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test polyfill
  window.ResizeObserver = ResizeObserverMock;
  // @ts-expect-error test polyfill
  globalThis.ResizeObserver = ResizeObserverMock;
}

if (!("IntersectionObserver" in window)) {
  class IntersectionObserverMock {
    root: Element | Document | null = null;
    rootMargin = "";
    thresholds = [0];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  // @ts-expect-error test polyfill
  window.IntersectionObserver = IntersectionObserverMock;
  // @ts-expect-error test polyfill
  globalThis.IntersectionObserver = IntersectionObserverMock;
}

if (!window.scrollTo) {
  window.scrollTo = () => {};
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

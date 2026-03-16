import { describe, expect, it } from "vitest";
import { computeResumePageStarts } from "@/lib/resume-pagination";

function makeRoot(scrollHeight: number, sections: Array<{ top: number; height: number }> = []): HTMLElement {
  const root = document.createElement("div");
  Object.defineProperty(root, "scrollHeight", { configurable: true, value: scrollHeight });

  sections.forEach((section) => {
    const node = document.createElement("div");
    node.setAttribute("data-resume-section", "true");
    Object.defineProperty(node, "offsetTop", { configurable: true, value: section.top });
    Object.defineProperty(node, "offsetHeight", { configurable: true, value: section.height });
    root.appendChild(node);
  });

  return root;
}

describe("computeResumePageStarts", () => {
  it("uses default fixed splits when no section anchors exist", () => {
    const starts = computeResumePageStarts(makeRoot(2200), 1011);
    expect(starts).toEqual([0, 1011, 2022]);
  });

  it("snaps break before a section header near the boundary", () => {
    const starts = computeResumePageStarts(
      makeRoot(2300, [
        { top: 995, height: 24 },
      ]),
      1011,
    );
    expect(starts[1]).toBe(995);
  });

  it("prunes a trailing page when the final slice is visually empty", () => {
    const root = makeRoot(1123);
    Object.defineProperty(root, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          top: 0,
          bottom: 1123,
          left: 0,
          right: 794,
          width: 794,
          height: 1123,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    const content = document.createElement("p");
    content.textContent = "Visible content on first page only";
    Object.defineProperty(content, "getBoundingClientRect", {
      configurable: true,
      value: () =>
        ({
          top: 120,
          bottom: 680,
          left: 0,
          right: 794,
          width: 794,
          height: 560,
          x: 0,
          y: 120,
          toJSON: () => ({}),
        }) as DOMRect,
    });
    root.appendChild(content);

    const starts = computeResumePageStarts(root, 1011);
    expect(starts).toEqual([0]);
  });
});

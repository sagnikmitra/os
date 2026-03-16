const SECTION_SNAP_THRESHOLD_PX = 28;
const MIN_PAGE_FILL_RATIO = 0.66;
const MIN_PAGE_HEIGHT_RATIO = 0.5;
const MAX_PAGE_SPLITS = 100;
const CONTENT_SLICE_EPSILON_PX = 1;

interface SectionAnchor {
  top: number;
  bottom: number;
}

const getSectionAnchors = (root: HTMLElement): SectionAnchor[] =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-resume-section]"))
    .map((node) => {
      const top = node.offsetTop;
      const bottom = top + Math.max(node.offsetHeight, 1);
      return { top, bottom };
    })
    .filter((anchor) => Number.isFinite(anchor.top) && Number.isFinite(anchor.bottom) && anchor.top > 0)
    .sort((a, b) => a.top - b.top);

interface ContentBox {
  top: number;
  bottom: number;
}

const isMediaElement = (node: Element) =>
  node.tagName === "IMG" ||
  node.tagName === "SVG" ||
  node.tagName === "CANVAS" ||
  node.tagName === "VIDEO";

const hasOwnRenderableText = (node: Element) =>
  Array.from(node.childNodes).some(
    (child) => child.nodeType === Node.TEXT_NODE && Boolean(child.textContent?.trim()),
  );

const getRenderableContentBoxes = (root: HTMLElement): ContentBox[] => {
  const rootRect = root.getBoundingClientRect();
  if (!Number.isFinite(rootRect.height) || rootRect.height <= 0) return [];

  const boxes: ContentBox[] = [];
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("*"));

  for (const node of nodes) {
    const hasRenderableSurface =
      isMediaElement(node) || hasOwnRenderableText(node) || node.childElementCount === 0;
    if (!hasRenderableSurface) continue;

    const rect = node.getBoundingClientRect();
    if (!Number.isFinite(rect.height) || rect.height <= 0) continue;

    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;

    if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= top) continue;
    boxes.push({ top, bottom });
  }

  return boxes;
};

const hasRenderableContentInSlice = (
  boxes: ContentBox[],
  sliceStart: number,
  sliceEnd: number,
) =>
  boxes.some(
    (box) =>
      box.bottom > sliceStart + CONTENT_SLICE_EPSILON_PX &&
      box.top < sliceEnd - CONTENT_SLICE_EPSILON_PX,
  );

// Computes page starts for the visual preview/PDF slicer and nudges page breaks
// upward when a section header would otherwise be split between pages.
export function computeResumePageStarts(root: HTMLElement, printHeight: number): number[] {
  const totalHeight = root.scrollHeight;
  if (!Number.isFinite(totalHeight) || totalHeight <= printHeight) return [0];

  const anchors = getSectionAnchors(root);
  const starts = [0];
  let cursor = 0;
  let splits = 0;

  while (cursor + printHeight < totalHeight && splits < MAX_PAGE_SPLITS) {
    splits += 1;

    const nominalBreak = cursor + printHeight;
    const minBreakStart = cursor + printHeight * MIN_PAGE_FILL_RATIO;
    let breakAt = nominalBreak;

    if (anchors.length > 0) {
      const splitHeader = anchors.find(
        (anchor) =>
          anchor.top < nominalBreak &&
          anchor.bottom > nominalBreak &&
          nominalBreak - anchor.top <= SECTION_SNAP_THRESHOLD_PX &&
          anchor.top >= minBreakStart,
      );

      if (splitHeader) {
        breakAt = splitHeader.top;
      } else {
        const nearBoundary = anchors.find(
          (anchor) =>
            anchor.top >= minBreakStart &&
            anchor.top <= nominalBreak &&
            nominalBreak - anchor.top <= SECTION_SNAP_THRESHOLD_PX,
        );
        if (nearBoundary) breakAt = nearBoundary.top;
      }
    }

    const tooShortPage = breakAt - cursor < printHeight * MIN_PAGE_HEIGHT_RATIO;
    if (!Number.isFinite(breakAt) || breakAt <= cursor + 1 || tooShortPage) {
      breakAt = nominalBreak;
    }

    starts.push(breakAt);
    cursor = breakAt;
  }

  // Guardrail: remove trailing pages that are structurally present (e.g. min-height)
  // but contain no actual renderable content.
  const contentBoxes = getRenderableContentBoxes(root);
  if (contentBoxes.length > 0) {
    while (starts.length > 1) {
      const lastStart = starts[starts.length - 1];
      const sliceEnd = totalHeight;
      if (hasRenderableContentInSlice(contentBoxes, lastStart, sliceEnd)) break;
      starts.pop();
    }
  }

  return starts;
}

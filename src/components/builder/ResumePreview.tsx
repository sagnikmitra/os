import { ResumeData, TemplateName } from "@/types/resume";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ProfessionalTemplate } from "./templates/ProfessionalTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import { ExecutiveTemplate } from "./templates/ExecutiveTemplate";
import { DesignerProTemplate } from "./templates/DesignerProTemplate";
import { DesignerPhotoTemplate } from "./templates/DesignerPhotoTemplate";
import { MinimalPhotoTemplate } from "./templates/MinimalPhotoTemplate";
import { LatexAcademicTemplate } from "./templates/LatexAcademicTemplate";
import { LatexDeedyTemplate } from "./templates/LatexDeedyTemplate";
import { LatexJakeTemplate } from "./templates/LatexJakeTemplate";
import { LatexSBTemplate } from "./templates/LatexSBTemplate";
import { useEffect, useRef, useState } from "react";
import { computeResumePageStarts } from "@/lib/resume-pagination";

const templates: Record<TemplateName, React.FC<{ data: ResumeData }>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  executive: ExecutiveTemplate,
  "designer-pro": DesignerProTemplate,
  "designer-photo": DesignerPhotoTemplate,
  "minimal-photo": MinimalPhotoTemplate,
  "latex-academic": LatexAcademicTemplate,
  "latex-deedy": LatexDeedyTemplate,
  "latex-jake": LatexJakeTemplate,
  "latex-sb": LatexSBTemplate,
};

// A4 at 96 DPI: 794 x 1123 px
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_GAP = 32;
const PAGE_TOP_MARGIN = 20;
const CONTINUATION_PAGE_TOP_MARGIN = 34;
const PAGE_BOTTOM_MARGIN = 52;
const PRINT_HEIGHT = PAGE_HEIGHT - (PAGE_TOP_MARGIN + PAGE_BOTTOM_MARGIN);

interface Props {
  data: ResumeData;
  template: TemplateName;
  /** When true, renders a simple single-page preview (no pagination/hidden layers) */
  simple?: boolean;
}

// Shared container styles to prevent overflow in all templates
const templateContainerStyle: React.CSSProperties = {
  width: PAGE_WIDTH,
  maxWidth: PAGE_WIDTH,
  overflow: "hidden",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

export function ResumePreview({ data, template, simple }: Props) {
  const Template = templates[template];
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);
  const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT);

  useEffect(() => {
    if (simple) return;
    const el = contentRef.current;
    if (!el) return;
    const updatePagination = () => {
      setContentHeight(el.scrollHeight);
      setPageStarts(computeResumePageStarts(el, PRINT_HEIGHT));
    };
    updatePagination();
    const rafId = requestAnimationFrame(updatePagination);
    const observer = new ResizeObserver(() => {
      updatePagination();
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [data, template, simple]);

  // Simple mode: just render the template directly (for template picker cards)
  if (simple) {
    return (
      <div style={{ ...templateContainerStyle, minHeight: PAGE_HEIGHT, backgroundColor: "#ffffff" }}>
        <Template data={data} />
      </div>
    );
  }

  const pageCount = pageStarts.length;

  return (
    <div style={{ width: PAGE_WIDTH }}>
      {/* Hidden continuous render for PDF export */}
      <div
        ref={contentRef}
        data-pdf-content="true"
        style={{
          ...templateContainerStyle,
          minHeight: PAGE_HEIGHT,
          position: "absolute",
          left: "-9999px",
          top: 0,
          backgroundColor: "#ffffff",
        }}
      >
        <Template data={data} />
      </div>

      {/* Visual paged preview */}
      {pageStarts.map((startY, i) => {
        const nextStart = i < pageCount - 1 ? pageStarts[i + 1] : contentHeight;
        const pageSliceHeight = Math.max(1, Math.min(PRINT_HEIGHT, nextStart - startY));
        const pageTopMargin = i === 0 ? PAGE_TOP_MARGIN : CONTINUATION_PAGE_TOP_MARGIN;

        return (
          <div
            key={i}
            data-resume-page-wrapper="true"
            data-page-index={i + 1}
            style={{ marginBottom: i < pageCount - 1 ? PAGE_GAP : 0 }}
          >
            <div
              data-resume-page="true"
              className="group relative"
              style={{
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                overflow: "hidden",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                borderRadius: "4px",
                transition: "transform 0.2s ease",
              }}
            >
              {/* Page Content with Margins */}
              <div
                style={{
                  position: "absolute",
                  top: pageTopMargin,
                  left: 0,
                  right: 0,
                  height: pageSliceHeight,
                  overflow: "hidden",
                }}
              >
                <div style={{ transform: `translateY(-${startY}px)` }}>
                  <Template data={data} />
                </div>
              </div>

              {/* Visual Page Edge Indicators (Subtle) */}
              <div className="absolute top-0 left-0 right-0 h-px bg-border/10" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-border/10" />
            </div>

            <div
              data-html2canvas-ignore="true"
              style={{
                textAlign: "center",
                fontSize: "11px",
                fontWeight: 600,
                color: "#aaa",
                marginTop: "10px",
                fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Page {i + 1} of {pageCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}

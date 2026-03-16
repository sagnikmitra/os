import jsPDF from "jspdf";
import type { ResumeAnalysis } from "@/context/AnalysisContext";

// ── Brand Palette ────────────────────────────────────────
// ── McKinsey-Style Brand Palette ────────────────────────────────
const BRAND = { r: 10, g: 35, b: 85 };       // Deep Midnight Blue
const BRAND_LIGHT = { r: 35, g: 70, b: 130 }; // Firm Blue
const DARK_BG = { r: 5, g: 15, b: 40 };      // Dark Executive
const CARD_BG = { r: 248, g: 250, b: 252 };  // Slate-50 tint
const ACCENT_GREEN = { r: 20, g: 120, b: 80 }; 
const GREEN_BG = { r: 240, g: 253, b: 244 };
const ACCENT_AMBER = { r: 180, g: 80, b: 0 }; 
const ACCENT_RED = { r: 180, g: 30, b: 30 }; 
const RED_BG = { r: 254, g: 242, b: 242 };
const TEXT_PRIMARY = { r: 15, g: 25, b: 50 };
const TEXT_SECONDARY = { r: 70, g: 85, b: 110 };
const TEXT_MUTED = { r: 120, g: 135, b: 155 };
const WHITE = { r: 255, g: 255, b: 255 };
const BORDER = { r: 215, g: 225, b: 235 };
const TABLE_HEADER_BG = { r: 241, g: 245, b: 249 };
const TABLE_STRIPE_BG = { r: 249, g: 250, b: 251 };
const BLOCKQUOTE_BG = { r: 245, g: 247, b: 250 };
const BRAND_DARK = { r: 5, g: 25, b: 65 };
const PLATINUM = { r: 226, g: 232, b: 240 };

type RGB = { r: number; g: number; b: number };

// ── Font loading ───────────────────────────────────────── (Kept Jakarta)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function loadFonts(doc: jsPDF) {
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch("/fonts/PlusJakartaSans-Regular.ttf"),
      fetch("/fonts/PlusJakartaSans-Bold.ttf"),
    ]);
    if (regularRes.ok && boldRes.ok) {
      const [regularBuf, boldBuf] = await Promise.all([regularRes.arrayBuffer(), boldRes.arrayBuffer()]);
      doc.addFileToVFS("PlusJakartaSans-Regular.ttf", arrayBufferToBase64(regularBuf));
      doc.addFileToVFS("PlusJakartaSans-Bold.ttf", arrayBufferToBase64(boldBuf));
      doc.addFont("PlusJakartaSans-Regular.ttf", "PlusJakartaSans", "normal");
      doc.addFont("PlusJakartaSans-Bold.ttf", "PlusJakartaSans", "bold");
      return "PlusJakartaSans";
    }
  } catch (e) { console.warn("Font load failed", e); }
  return "helvetica";
}

const scoreWord = (s: number) => s >= 85 ? "Excellent" : s >= 70 ? "Strong" : s >= 55 ? "Fair" : s >= 40 ? "Weak" : "Critical";

export async function generateFullReport(analysis: ResumeAnalysis, fileName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fontFamily = await loadFonts(doc);

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 24; // Increased margin for McKinsey breathability
  const mr = 24;
  const maxW = pw - ml - mr;
  let y = 0;

  // ── Drawing primitives ─────────────────────────────────
  const setC = (c: RGB) => doc.setTextColor(c.r, c.g, c.b);
  const setF = (c: RGB) => doc.setFillColor(c.r, c.g, c.b);
  const setD = (c: RGB) => doc.setDrawColor(c.r, c.g, c.b);
  const scoreColor = (s: number): RGB => s >= 80 ? ACCENT_GREEN : s >= 60 ? ACCENT_AMBER : ACCENT_RED;

  const needPage = (h: number) => {
    if (y + h > ph - 18) { doc.addPage(); y = 25; }
  };
  const gap = (h = 5) => { y += h; };
  const setFont = (style: "normal" | "bold" = "normal", size = 9.5) => {
    doc.setFontSize(size);
    doc.setFont(fontFamily, style);
  };

  const textBlock = (t: string, size: number, style: "normal" | "bold" = "normal", color: RGB = TEXT_PRIMARY, lineHeight = 1.3) => {
    setFont(style, size);
    setC(color);
    const lines: string[] = doc.splitTextToSize(t, maxW);
    const lineH = size * 0.35 * lineHeight;
    needPage(lines.length * lineH + 2);
    doc.text(lines, ml, y);
    y += lines.length * lineH + 1.5;
  };

  const drawGauge = (x: number, yPos: number, score: number, label: string) => {
    const w = 35;
    const h = 4;
    setF({ r: 235, g: 240, b: 245 });
    doc.roundedRect(x, yPos - h + 1, w, h, 1, 1, "F");
    const color = scoreColor(score);
    setF(color);
    doc.roundedRect(x, yPos - h + 1, (score / 100) * w, h, 1, 1, "F");
    setFont("bold", 7);
    setC(TEXT_SECONDARY);
    doc.text(label, x, yPos - 6);
    setFont("bold", 7);
    setC(color);
    doc.text(`${score}`, x + w - doc.getTextWidth(`${score}`), yPos - 6);
  };

  const sectionHeading = (title: string, subtitle?: string) => {
    needPage(35);
    gap(15);
    setF(BRAND);
    doc.rect(ml, y - 5, 1.5, 10, "F");
    setFont("bold", 15);
    setC(TEXT_PRIMARY);
    doc.text(title.toUpperCase(), ml + 6, y + 2.5);
    if (subtitle) {
      setFont("normal", 9);
      setC(TEXT_MUTED);
      doc.text(subtitle, ml + 6, y + 8);
    }
    y += 14;
    setD(BORDER);
    doc.setLineWidth(0.15);
    doc.line(ml, y, pw - mr, y);
    y += 8;
  };

  const subHeading = (title: string) => {
    needPage(15);
    gap(6);
    setFont("bold", 11);
    setC(BRAND);
    doc.text(title, ml, y);
    y += 6;
  };

  const kvLine = (label: string, value: string, valueColor: RGB = TEXT_PRIMARY, indent = 0) => {
    needPage(8);
    setFont("bold", 9);
    setC(TEXT_SECONDARY);
    doc.text(`${label}:`, ml + indent, y);
    const labelW = doc.getTextWidth(`${label}: `);
    setFont("normal", 9);
    setC(valueColor);
    const valLines: string[] = doc.splitTextToSize(value, maxW - indent - labelW - 4);
    doc.text(valLines, ml + indent + labelW, y);
    y += valLines.length * 4.2 + 2;
  };

  const kvBold = (label: string, value: string, status: string, statusColor: RGB) => {
    needPage(6);
    setFont("bold", 8.5);
    setC(TEXT_SECONDARY);
    doc.text(`\u2022  ${label}:`, ml, y);
    const lW = doc.getTextWidth(`\u2022  ${label}: `);
    setFont("bold", 8.5);
    setC(TEXT_PRIMARY);
    doc.text(value, ml + lW, y);
    const vW = doc.getTextWidth(value + " ");
    setFont("normal", 8);
    setC(statusColor);
    doc.text(`\u2014 ${status}`, ml + lW + vW, y);
    y += 5;
  };

  const bullet = (t: string, color: RGB = TEXT_MUTED, indent = 0) => {
    needPage(6);
    setFont("normal", 8.5);
    setC(color);
    doc.text("\u2022", ml + indent, y);
    const lines: string[] = doc.splitTextToSize(t, maxW - indent - 5);
    doc.text(lines, ml + indent + 4, y);
    y += lines.length * 3.8 + 1.2;
  };

  const numberedItem = (num: number, t: string, color: RGB = TEXT_SECONDARY) => {
    needPage(6);
    setFont("bold", 8.5);
    setC(BRAND);
    doc.text(`${num}.`, ml + 2, y);
    setFont("normal", 8.5);
    setC(color);
    const lines: string[] = doc.splitTextToSize(t, maxW - 10);
    doc.text(lines, ml + 8, y);
    y += lines.length * 3.8 + 1.5;
  };

  const blockquote = (t: string) => {
    setFont("normal", 9);
    const qText = `"${t}"`;
    const lines: string[] = doc.splitTextToSize(qText, maxW - 16);
    const cardH = lines.length * 4.2 + 8;
    needPage(cardH + 2);
    setF(BLOCKQUOTE_BG);
    doc.roundedRect(ml, y - 1, maxW, cardH, 3, 3, "F");
    setF(BRAND);
    doc.roundedRect(ml + 1.5, y + 1.5, 2, cardH - 5, 1, 1, "F");
    setFont("normal", 9);
    setC(TEXT_SECONDARY);
    doc.text(lines, ml + 8, y + 4.5);
    y += cardH + 4;
  };

  const divider = () => {
    needPage(8);
    gap(4);
    setD(BORDER);
    doc.setLineWidth(0.12);
    doc.line(ml, y, pw - mr, y);
    gap(4);
  };

  const tag = (t: string, x: number, yPos: number, color: RGB, bg: RGB): number => {
    setFont("bold", 6.5);
    const tw = doc.getTextWidth(t) + 5;
    setF(bg);
    doc.roundedRect(x, yPos - 3.2, tw, 5.5, 2, 2, "F");
    setC(color);
    doc.text(t, x + 2.5, yPos);
    return tw + 2;
  };

  const renderTable = (
    headers: string[],
    rows: string[][],
    colWidths?: number[],
    opts?: { valueColors?: (RGB | null)[][] }
  ) => {
    const rowH = 6.5;
    const headerH = 7;
    needPage(headerH + Math.min(rows.length, 4) * rowH + 2);
    const widths = colWidths || headers.map(() => maxW / headers.length);
    const pad = 3;

    setF(TABLE_HEADER_BG);
    doc.roundedRect(ml, y, maxW, headerH, 1.5, 1.5, "F");
    setFont("bold", 7);
    setC(TEXT_MUTED);
    let hx = ml;
    headers.forEach((h, i) => {
      doc.text(h.toUpperCase(), hx + pad, y + 4.8);
      hx += widths[i];
    });
    y += headerH;

    rows.forEach((row, ri) => {
      needPage(rowH + 1);
      if (ri % 2 === 1) { setF(TABLE_STRIPE_BG); doc.rect(ml, y, maxW, rowH, "F"); }
      setD(BORDER);
      doc.setLineWidth(0.08);
      doc.line(ml, y + rowH, pw - mr, y + rowH);
      let rx = ml;
      row.forEach((cell, ci) => {
        setFont("normal", 8);
        const cellColor = opts?.valueColors?.[ri]?.[ci] || TEXT_PRIMARY;
        setC(cellColor);
        const maxChars = Math.floor(widths[ci] / 1.8);
        const truncated = cell.length > maxChars ? cell.substring(0, maxChars) + "\u2026" : cell;
        doc.text(truncated, rx + pad, y + 4.5);
        rx += widths[ci];
      });
      y += rowH;
    });
    gap(3);
  };

  const beforeAfter = (before: string, after: string) => {
    needPage(14);
    setFont("bold", 7.5);
    setC(ACCENT_RED);
    doc.text("BEFORE", ml + 4, y);
    setFont("normal", 8);
    setC(TEXT_MUTED);
    const bLines: string[] = doc.splitTextToSize(`"${before}"`, maxW - 22);
    doc.text(bLines, ml + 22, y);
    y += bLines.length * 3.5 + 2;
    setFont("bold", 7.5);
    setC(ACCENT_GREEN);
    doc.text("AFTER", ml + 4, y);
    setFont("normal", 8);
    setC(TEXT_SECONDARY);
    const aLines: string[] = doc.splitTextToSize(`"${after}"`, maxW - 22);
    doc.text(aLines, ml + 22, y);
    y += aLines.length * 3.5 + 3;
  };

  // ═══════════════════════════════════════════════════════════
  // Extract all analysis parts
  const scores = analysis.scores;
  const verdict = analysis.overall_verdict;
  const info = analysis.extracted_info;
  const ats = analysis.ats_analysis;
  const pa = analysis.parsing_analysis;
  const ra = analysis.recruiter_analysis;
  const ca = analysis.content_analysis;
  const ha = analysis.humanizer_analysis;
  const sa = analysis.structure_analysis;
  const sk = analysis.skills_analysis;
  const career = analysis.career_narrative;
  const roadmap = analysis.improvement_roadmap;
  const priorities = analysis.priorities || [];
  const redFlags = analysis.red_flags || [];
  const strengths = analysis.strengths || [];
  const consistency = analysis.consistency_audit;

  // ═══════════════════════════════════════════════════════════
  // ══ COVER PAGE ═════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // ══ COVER PAGE ═════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  // Full-page dark executive header
  setF(DARK_BG);
  doc.rect(0, 0, pw, 75, "F");
  setF(BRAND_LIGHT);
  doc.rect(0, 75, pw, 1.5, "F");

  setFont("bold", 10);
  setC({ r: 160, g: 180, b: 220 });
  doc.text("SGNK CAREEROS \u2022 STRATEGIC ADVISORY", ml, 18);

  setFont("bold", 34);
  setC(WHITE);
  doc.text("Candidate Performance Audit", ml, 36);
  
  setFont("bold", 12);
  setC({ r: 200, g: 215, b: 240 });
  doc.text(`Portfolio Analysis: ${fileName}`, ml, 48);

  // Grade badge - Refined
  if (verdict) {
    const badgeW = 34;
    const badgeH = 44;
    setF(WHITE);
    doc.roundedRect(pw - mr - badgeW, 12, badgeW, badgeH, 2, 2, "F");
    
    setFont("bold", 32);
    setC(BRAND);
    doc.text(verdict.grade, pw - mr - (badgeW/2), 32, { align: "center" });
    
    setFont("bold", 7);
    setC(TEXT_MUTED);
    doc.text("EXECUTIVE GRADE", pw - mr - (badgeW/2), 42, { align: "center" });
    
    const readyColor = verdict.ready_to_apply ? ACCENT_GREEN : ACCENT_RED;
    const readyBg = verdict.ready_to_apply ? GREEN_BG : RED_BG;
    tag(verdict.ready_to_apply ? "HIRE READY" : "GAP DETECTED", pw - mr - 29, 50, readyColor, readyBg);
  }

  // Cover Page Bottom - Executive Charter
  y = 95;
  setFont("bold", 12);
  setC(BRAND);
  doc.text("EXECUTIVE CHARTER", ml, y);
  y += 8;
  
  const charterText = "This report provides a multi-dimensional audit of candidate marketability, applying STAR/XYZ frameworks, ATS simulation models, and recruiter psychology heuristics. The objective is to identify strategic high-impact improvements to maximize interview conversion rates.";
  textBlock(charterText, 10, "normal", TEXT_SECONDARY, 1.4);
  gap(10);

  // Metrics Bar - Score Gauges on Cover or starting pg 1
  subHeading("Strategic Performance Indices");
  gap(2);
  const coreIndices = [
    { label: "ATS COMPATIBILITY", s: scores.ats.score },
    { label: "RECRUITER READABILITY", s: scores.recruiter_readability.score },
    { label: "CONTENT PRECISION", s: scores.content_quality.score },
    { label: "IMPACT VELOCITY", s: scores.impact_strength.score }
  ];
  
  coreIndices.forEach((idx, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawGauge(ml + (col * (maxW / 2 + 5)), y + (row * 15), idx.s, idx.label);
  });
  y += 30;

  // ═══════════════════════════════════════════════════════════
  // ══ 1. STRATEGIC POSITIONING ═══════════════════════════════
  // ═══════════════════════════════════════════════════════════

  sectionHeading("1. Strategic Positioning", "Value Proposition & Narrative Audit");

  if (verdict?.one_liner) {
    setFont("bold", 11);
    setC(TEXT_PRIMARY);
    doc.text("EXECUTIVE AUDIT SUMMARY", ml, y);
    y += 6;
    textBlock(verdict.one_liner, 10, "normal", TEXT_SECONDARY, 1.5);
    gap(4);
  }

  if (info) {
    subHeading("Candidate Signature");
    const snapshotRows = [
      ["Professional Title", info.current_title || "Not Found"],
      ["Primary Entity", info.current_company || "Not Found"],
      ["Experience Depth", `${info.total_experience_years || 0} Years`],
      ["Educational Pedigree", info.education_summary || "Not Found"]
    ];
    
    renderTable(["Attribute", "Extracted Persona"], snapshotRows, [maxW * 0.4, maxW * 0.6]);
  }

  // Detailed Dimension scores
  subHeading("Dimensional Benchmarking");
  const dimensionalScores = [
    { key: "Parsing Health", s: scores.parsing },
    { key: "Structural Integrity", s: scores.structure },
    { key: "Clarity & Conciseness", s: scores.clarity },
    { key: "Human Authenticity", s: scores.human_authenticity },
    { key: "Target Role Alignment", s: scores.strategic_positioning },
  ];
  
  dimensionalScores.forEach(({ key, s }) => {
    kvBold(key, `${s.score}/100`, scoreWord(s.score), scoreColor(s.score));
    if (s.summary) {
      setFont("normal", 8.5);
      setC(TEXT_MUTED);
      const lines: string[] = doc.splitTextToSize(s.summary, maxW - 10);
      doc.text(lines, ml + 6, y);
      y += lines.length * 3.8 + 2;
      needPage(6);
    }
  });

  if (verdict?.top_3_actions?.length) {
    gap(6);
    setFont("bold", 11);
    setC(BRAND);
    doc.text("TOP STRATEGIC IMPERATIVES", ml, y);
    y += 7;
    verdict.top_3_actions.forEach((a, i) => numberedItem(i + 1, a));
  }

  // Strengths & Red Flags
  if (strengths.length || redFlags.length) {
    gap(3);
    if (strengths.length) {
      subHeading("Strengths");
      strengths.slice(0, 8).forEach(s => bullet(s, ACCENT_GREEN, 2));
    }
    if (redFlags.length) {
      subHeading("Red Flags");
      redFlags.slice(0, 8).forEach(r => {
        const label = typeof r === "string" ? r : (r as any).label || String(r);
        bullet(label, ACCENT_RED, 2);
      });
    }
  }

  // Skills
  if (sk && (sk.technical_skills?.length || sk.missing_for_role?.length)) {
    gap(3);
    subHeading("Skills Snapshot");
    if (sk.technical_skills?.length) kvLine("Technical", sk.technical_skills.slice(0, 12).join(", "), TEXT_PRIMARY);
    if (sk.soft_skills?.length) kvLine("Soft Skills", sk.soft_skills.slice(0, 8).join(", "), TEXT_PRIMARY);
    if (sk.tools_platforms?.length) kvLine("Tools & Platforms", sk.tools_platforms.slice(0, 10).join(", "), TEXT_PRIMARY);
    if (sk.missing_for_role?.length) kvLine("Missing for Role", sk.missing_for_role.join(", "), ACCENT_RED);
    if (sk.skills_vs_experience_alignment) kvLine("Skills-Experience Alignment", sk.skills_vs_experience_alignment, TEXT_PRIMARY);
  }

  // Career narrative
  if (career) {
    gap(3);
    subHeading("Career Trajectory");
    kvLine("Progression", career.progression, TEXT_PRIMARY);
    kvLine("Trajectory Strength", `${career.trajectory_strength}/100`, scoreColor(career.trajectory_strength));
    if (career.story_coherence) kvLine("Story Coherence", career.story_coherence, TEXT_PRIMARY);
    kvLine("Tenure Pattern", `${career.job_tenure_pattern}  |  Avg: ${career.average_tenure_months}mo`, TEXT_PRIMARY);
    if (career.career_highlights?.length) {
      career.career_highlights.slice(0, 4).forEach(h => bullet(h, ACCENT_GREEN, 4));
    }
    if (career.gaps?.length) {
      gap(1);
      career.gaps.forEach(g => bullet(`Gap: ${g.period} (${g.duration}) \u2014 ${g.concern_level} concern`, ACCENT_AMBER, 4));
    }
    if (career.transitions?.length) {
      career.transitions.forEach(t => bullet(`${t.from} \u2192 ${t.to} (${t.type}) \u2014 narrative: ${t.narrative_strength}`, TEXT_MUTED, 4));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 2. ATS INTELLIGENCE ════════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (ats) {
    sectionHeading("2. ATS Intelligence", "Technical Architecture & Retrieval Context");

    setF(CARD_BG);
    doc.roundedRect(ml, y - 4, maxW, 18, 2, 2, "F");
    kvLine("PASS LIKELIHOOD", ats.pass_likelihood || "N/A", ats.pass_likelihood === "High" ? ACCENT_GREEN : ACCENT_RED);
    if (ats.estimated_rank_percentile) kvLine("ESTIMATED RANK", `Top ${ats.estimated_rank_percentile}% (Industry Benchmark)`, BRAND);
    gap(4);

    if (ats.ats_simulation) {
      subHeading("Multi-System Parsing Simulation");
      const sim = ats.ats_simulation;
      const simRows = [
        ["Greenhouse", `${sim.greenhouse?.parse_success || 0}%`, sim.greenhouse?.issues?.join(", ") || "No issues"],
        ["Lever", `${sim.lever?.parse_success || 0}%`, sim.lever?.issues?.join(", ") || "No issues"],
        ["Workday", `${sim.workday?.parse_success || 0}%`, sim.workday?.issues?.join(", ") || "No issues"],
        ["Taleo", `${sim.taleo?.parse_success || 0}%`, sim.taleo?.issues?.join(", ") || "No issues"]
      ];
      renderTable(["System", "Success rate", "Detected Extraction Conflicts"], simRows, [maxW * 0.25, maxW * 0.18, maxW * 0.57]);
    }

    if (ats.checks?.length) {
      subHeading("Algorithmic Compliance Audit");
      const checkRows = ats.checks.map(c => [c.label, c.status.toUpperCase(), c.detail]);
      const checkColors = ats.checks.map(c => [
        TEXT_PRIMARY,
        c.status === "pass" ? ACCENT_GREEN : c.status === "warning" ? ACCENT_AMBER : ACCENT_RED,
        TEXT_SECONDARY,
      ]);
      renderTable(["Audit Point", "Status", "Technical Feedback"], checkRows, [maxW * 0.3, maxW * 0.15, maxW * 0.55], { valueColors: checkColors });
    }

    const matched = ats.matched_keywords || [];
    const missing = ats.missing_keywords || [];
    if (matched.length || missing.length) {
      subHeading("Semantic Keyword Matrix");
      const kwRows: string[][] = [];
      const kwColors: (RGB | null)[][] = [];
      for (let i = 0; i < Math.min(Math.max(matched.length, missing.length), 10); i++) {
        kwRows.push([matched[i] || "", missing[i] || ""]);
        kwColors.push([ACCENT_GREEN, ACCENT_RED]);
      }
      renderTable(["Validated Signals", "Critical Omissions"], kwRows, [maxW * 0.5, maxW * 0.5], { valueColors: kwColors });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 3. PARSING ANALYSIS ════════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (pa) {
    sectionHeading("3. Parsing Analysis", `${scores.parsing.score}/100`);

    if (pa.overall_extractability) {
      const ec = pa.overall_extractability === "Excellent" || pa.overall_extractability === "Good" ? ACCENT_GREEN : ACCENT_AMBER;
      kvLine("Overall Extractability", pa.overall_extractability, ec);
    }

    // All fields
    if (pa.fields?.length) {
      subHeading("Field Extraction Results");
      const fieldRows = pa.fields.map(f => [
        f.field,
        f.extracted || "\u2014",
        f.status,
        f.note || "",
      ]);
      const fieldColors = pa.fields.map(f => [
        TEXT_PRIMARY,
        TEXT_SECONDARY,
        f.status === "clean" ? ACCENT_GREEN : f.status === "partial" ? ACCENT_AMBER : ACCENT_RED,
        TEXT_MUTED,
      ]);
      renderTable(
        ["Field", "Extracted", "Status", "Notes"],
        fieldRows,
        [maxW * 0.18, maxW * 0.35, maxW * 0.12, maxW * 0.35],
        { valueColors: fieldColors }
      );
    }

    // Date consistency
    if (pa.date_consistency) {
      kvLine("Date Format", pa.date_consistency.format_used, TEXT_PRIMARY);
      kvLine("Consistent", pa.date_consistency.consistent ? "Yes" : "No", pa.date_consistency.consistent ? ACCENT_GREEN : ACCENT_RED);
      pa.date_consistency.issues?.forEach(i => bullet(i, ACCENT_AMBER, 4));
    }

    // Section detection
    if (pa.section_detection?.length) {
      gap(2);
      subHeading("Section Detection");
      pa.section_detection.forEach(s => {
        const c = s.detected ? ACCENT_GREEN : ACCENT_RED;
        needPage(6);
        setFont("bold", 8);
        setC(c);
        doc.text(s.detected ? "\u2713" : "\u2717", ml + 2, y);
        setFont("normal", 8);
        setC(TEXT_PRIMARY);
        doc.text(s.section, ml + 8, y);
        if (s.header_text !== s.standard_header) {
          setFont("normal", 7.5);
          setC(TEXT_MUTED);
          doc.text(`(found: "${s.header_text}", standard: "${s.standard_header}")`, ml + 8 + doc.getTextWidth(s.section + "  "), y);
        }
        y += 4.5;
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 3. RECRUITER PSYCHOLOGY ════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (ra) {
    sectionHeading("3. Recruiter Psychology", "Visual Hierarchy & 6-Second Scan Diagnostics");

    if (ra.first_impression) {
      subHeading("Professional Impression Verdict");
      blockquote(ra.first_impression);
    }

    if (ra.six_second_scan) {
      subHeading("6-Second Scanning Simulation");
      const ss = ra.six_second_scan;
      drawGauge(ml, y + 5, ss.f_pattern_score || 0, "F-PATTERN COMPLIANCE");
      drawGauge(ml + (maxW/2 + 5), y + 5, ss.cognitive_load === "Low" ? 90 : ss.cognitive_load === "Moderate" ? 60 : 30, "COGNITIVE LOAD EFFICIENCY");
      y += 15;
      
      kvLine("Scanning Verdict", ss.immediate_verdict || "N/A", BRAND);
      kvLine("Seniority Perception", ss.seniority_read || "N/A", TEXT_PRIMARY);
      
      if (ss.eye_path?.length) {
        gap(2);
        setFont("bold", 8.5);
        setC(TEXT_SECONDARY);
        doc.text("Eye Path Trajectory:", ml, y);
        y += 5;
        setF(CARD_BG);
        const pathStr = ss.eye_path.join("  \u2192  ");
        const pathLines: string[] = doc.splitTextToSize(pathStr, maxW - 12);
        const pathH = pathLines.length * 4 + 5;
        doc.roundedRect(ml, y - 1, maxW, pathH, 2, 2, "F");
        setFont("bold", 8.5);
        setC(BRAND);
        doc.text(pathLines, ml + 5, y + 3);
        y += pathH + 3;
      }
    }

    // Perceived signals
    subHeading("Recruiter Perception");
    if (ra.perceived_role) kvLine("Perceived Role", ra.perceived_role, TEXT_PRIMARY);
    if (ra.perceived_level) kvLine("Perceived Level", ra.perceived_level, TEXT_PRIMARY);
    if (ra.perceived_strength) kvLine("Perceived Strength", ra.perceived_strength, TEXT_PRIMARY);
    if (ra.perceived_industry) kvLine("Industry", ra.perceived_industry, TEXT_PRIMARY);
    if (ra.comparison_to_ideal) kvLine("vs. Ideal Candidate", ra.comparison_to_ideal, TEXT_PRIMARY);

    // What was noticed / missed
    if (ra.noticed?.length) {
      gap(2);
      subHeading("What Recruiters Notice");
      ra.noticed.forEach(n => bullet(n, ACCENT_GREEN, 2));
    }
    if (ra.missed?.length) {
      subHeading("What Recruiters Miss");
      ra.missed.forEach(m => bullet(m, ACCENT_RED, 2));
    }

    // Hiring manager notes
    if (ra.hiring_manager_notes?.length) {
      gap(2);
      subHeading("Hiring Manager Insights");
      ra.hiring_manager_notes.forEach(n => blockquote(n));
    }
    if (ra.emotional_response) {
      kvLine("Emotional Response", ra.emotional_response, TEXT_PRIMARY);
    }

    // Recruiter issues — all of them
    if (ra.issues?.length) {
      gap(2);
      subHeading("Recruiter Issues");
      ra.issues.forEach(item => {
        const c = item.severity === "risk" ? ACCENT_RED : ACCENT_AMBER;
        bullet(item.issue, c, 2);
        if (item.fix) {
          needPage(5);
          setFont("normal", 7.5);
          setC(BRAND);
          doc.text(`\u2192 Fix: ${item.fix}`, ml + 10, y);
          y += 4;
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 4. CONTENT PRECISION ══════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (ca) {
    sectionHeading("4. Content Precision", "Linguistic Impact & Quantification Audit");

    setF(CARD_BG);
    doc.roundedRect(ml, y - 4, maxW, 20, 2, 2, "F");
    const metricsRows = [
      ["Total Bullets Analyzed", `${ca.total_bullets || 0}`],
      ["High-Impact (Strong)", `${ca.strong_bullets || 0}`],
      ["Low-Impact (Weak)", `${ca.weak_bullets || 0}`],
      ["Quantified Metrics", `${ca.metrics_used || 0}`]
    ];
    renderTable(["Core Content Metric", "Value"], metricsRows, [maxW * 0.5, maxW * 0.5]);

    if (ca.star_compliance || ca.xyz_compliance) {
      subHeading("Framework Compliance Indices");
      const star = ca.star_compliance;
      const xyz = ca.xyz_compliance;
      if (star) drawGauge(ml, y + 5, (star.complete / (star.complete + star.partial + star.missing || 1)) * 100, "STAR METHOD ADHERENCE");
      if (xyz) drawGauge(ml + (maxW/2 + 5), y + 5, (xyz.complete / (xyz.complete + xyz.partial + xyz.missing || 1)) * 100, "XYZ FORMULA ADHERENCE");
      y += 15;
    }

    if (ca.bullets?.some(b => b.strength === "weak")) {
      subHeading("High-Potential Rewrite Opportunities");
      const weakOnes = ca.bullets.filter(b => b.strength === "weak").slice(0, 5);
      weakOnes.forEach(b => {
        beforeAfter(b.text, b.fix);
        if (b.issue) {
          setFont("normal", 7.5);
          setC(TEXT_MUTED);
          doc.text(`ADVISORY: ${b.issue}`, ml + 24.5, y - 2);
          y += 2;
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 5. STRUCTURAL INTEGRITY ════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (sa) {
    sectionHeading("5. Structural Integrity", "Information Architecture & Section Balance");

    if (sa.layout_assessment) {
      const la = sa.layout_assessment;
      subHeading("Layout Assessment");
      kvLine("Page Count", `${la.page_count} Pages`, la.page_count > 2 ? ACCENT_AMBER : ACCENT_GREEN);
      kvLine("Visual Hierarchy", la.visual_hierarchy || "N/A", BRAND);
      kvLine("Whitespace Utilization", la.white_space || "N/A", TEXT_PRIMARY);
    }

    if (sa.sections?.length) {
      subHeading("Section-Level Health Diagnostics");
      const secRows = sa.sections.map(s => [
        s.name,
        `${s.score}/100`,
        s.status.toUpperCase(),
        s.notes || "No issues detected"
      ]);
      const secColors = sa.sections.map(s => [
        TEXT_PRIMARY,
        scoreColor(s.score),
        s.status === "excellent" || s.status === "strong" ? ACCENT_GREEN : ACCENT_RED,
        TEXT_SECONDARY
      ]);
      renderTable(["Section Name", "Score", "Rating", "Strategic Feedback"], secRows, [maxW * 0.25, maxW * 0.12, maxW * 0.18, maxW * 0.45], { valueColors: secColors });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 5b. AUTHENTICITY & TONE ════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (ha) {
    divider();
    subHeading("Authenticity & Tone");
    kvLine("Verdict", ha.verdict, TEXT_PRIMARY);
    if (ha.ai_probability !== undefined) kvLine("AI Probability", `${ha.ai_probability}%`, ha.ai_probability > 50 ? ACCENT_RED : ACCENT_GREEN);

    if (ha.tone_analysis) {
      const ta = ha.tone_analysis;
      kvLine("Overall Tone", ta.overall_tone, TEXT_PRIMARY);
      kvLine("Consistency", ta.consistency, TEXT_PRIMARY);
      kvLine("Voice Uniqueness", ta.voice_uniqueness, TEXT_PRIMARY);
      kvLine("Personality Score", `${ta.personality_score}/100`, scoreColor(ta.personality_score));
    }

    if (ha.vocabulary_analysis) {
      const va = ha.vocabulary_analysis;
      kvLine("Vocabulary Diversity", `${va.diversity_score}/100`, scoreColor(va.diversity_score));
      kvLine("Jargon Level", va.jargon_level, TEXT_PRIMARY);
      if (va.overused_buzzwords?.length) kvLine("Overused Buzzwords", va.overused_buzzwords.join(", "), ACCENT_AMBER);
      if (va.cliche_phrases?.length) kvLine("Cliché Phrases", va.cliche_phrases.join(", "), ACCENT_AMBER);
    }

    // All flagged detections
    if (ha.detections?.length) {
      gap(2);
      subHeading("Flagged Phrasing — Rewrite Suggestions");
      ha.detections.slice(0, 8).forEach(d => {
        beforeAfter(d.original, d.humanized);
        if (d.issue) {
          setFont("normal", 7);
          setC(TEXT_MUTED);
          doc.text(`Category: ${d.category || "General"}  |  Issue: ${d.issue}`, ml + 4, y);
          y += 3.5;
        }
      });
    }

    if (ha.flags?.length) {
      gap(1);
      subHeading("Authenticity Flags");
      ha.flags.forEach(f => bullet(f, ACCENT_AMBER, 2));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 6. STRUCTURE ANALYSIS ══════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (sa) {
    sectionHeading("6. Structure Analysis", `${scores.structure.score}/100`);

    // Layout assessment
    if (sa.layout_assessment) {
      const la = sa.layout_assessment;
      kvLine("Page Count", `${la.page_count} (Ideal: ${la.ideal_page_count})`, la.page_count <= la.ideal_page_count ? ACCENT_GREEN : ACCENT_AMBER);
      kvLine("Whitespace", la.white_space || "N/A", TEXT_PRIMARY);
      kvLine("Visual Hierarchy", la.visual_hierarchy || "N/A", la.visual_hierarchy?.toLowerCase().includes("clear") ? ACCENT_GREEN : ACCENT_AMBER);
      kvLine("Section Balance", la.section_balance || "N/A", TEXT_PRIMARY);
    }

    if (sa.seniority_signal) kvLine("Seniority Signal", sa.seniority_signal, TEXT_PRIMARY);

    // Section health — full table
    if (sa.sections?.length) {
      gap(2);
      subHeading("Section Health");
      const secRows = sa.sections.map(s => [
        s.name,
        `${s.score}/100`,
        s.status,
        s.notes || "",
      ]);
      const secColors = sa.sections.map(s => [
        TEXT_PRIMARY,
        scoreColor(s.score),
        s.status === "excellent" || s.status === "strong" ? ACCENT_GREEN : s.status === "warning" ? ACCENT_AMBER : ACCENT_RED,
        TEXT_MUTED,
      ]);
      renderTable(
        ["Section", "Score", "Status", "Notes"],
        secRows,
        [maxW * 0.22, maxW * 0.12, maxW * 0.13, maxW * 0.53],
        { valueColors: secColors }
      );
    }

    // MECE
    if (sa.mece_assessment) {
      const m = sa.mece_assessment;
      kvLine("Mutually Exclusive", m.mutually_exclusive ? "Yes" : "No", m.mutually_exclusive ? ACCENT_GREEN : ACCENT_RED);
      kvLine("Collectively Exhaustive", m.collectively_exhaustive ? "Yes" : "No", m.collectively_exhaustive ? ACCENT_GREEN : ACCENT_RED);
      if (m.overlapping_sections?.length) kvLine("Overlapping", m.overlapping_sections.join(", "), ACCENT_AMBER);
      if (m.missing_coverage?.length) kvLine("Missing Coverage", m.missing_coverage.join(", "), ACCENT_RED);
    }

    if (sa.missing_sections?.length) kvLine("Missing Sections", sa.missing_sections.join(", "), ACCENT_RED);
    if (sa.unnecessary_sections?.length) kvLine("Unnecessary Sections", sa.unnecessary_sections.join(", "), ACCENT_AMBER);
    if (sa.section_order_issues?.length) {
      gap(1);
      sa.section_order_issues.forEach(i => bullet(i, ACCENT_AMBER, 2));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 6. CONSISTENCY & AUTHENTICITY ══════════════════════════
  // ═══════════════════════════════════════════════════════════

  if (consistency || ha) {
    sectionHeading("6. Integrity & Consistency Audit", "Cross-Sectional Logic & Authentic Signal Detection");

    if (consistency) {
      subHeading("Timeline & Logic Diagnostics");
      kvLine("CONFORMANCE SCORE", `${consistency.overall_consistency_score}/100`, scoreColor(consistency.overall_consistency_score));
      
      if (consistency.contradictions?.length) {
        gap(2);
        setFont("bold", 9.5);
        setC(ACCENT_RED);
        doc.text("LOGICAL CONTRADICTIONS DETECTED", ml, y);
        y += 6;
        consistency.contradictions.forEach(c => {
          bullet(`CONFLICT: "${c.claim_a}" (${c.location_a}) vs "${c.claim_b}" (${c.location_b})`, ACCENT_RED, 2);
          if (c.resolution) {
            setFont("normal", 8.5);
            setC(BRAND);
            doc.text(`\u2192 CORRECTIVE ACTION: ${c.resolution}`, ml + 10, y);
            y += 5;
          }
        });
      }
    }

    if (ha) {
      subHeading("Linguistic Authenticity & AI Probability");
      kvLine("Probabilistic Origin", ha.verdict || "N/A", ha.ai_probability > 50 ? ACCENT_AMBER : ACCENT_GREEN);
      kvLine("AI Confidence", `${ha.ai_probability || 0}%`, ha.ai_probability > 50 ? ACCENT_RED : ACCENT_GREEN);
      
      if (ha.tone_analysis) {
        const ta = ha.tone_analysis;
        kvLine("Tone Blueprint", ta.overall_tone, TEXT_PRIMARY);
        kvLine("Voice Uniqueness", ta.voice_uniqueness, TEXT_PRIMARY);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ══ 7. STRATEGIC ROADMAP ═══════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  sectionHeading("7. Strategic Roadmap", "Phased Execution Plan for Market Dominance");

  // PHASE 1: QUICK WINS
  subHeading("PHASE 1: STRATEGIC QUICK WINS (0-48 HOURS)");
  setFont("normal", 9);
  setC(TEXT_SECONDARY);
  doc.text("Focus: Immediate ATS optimizations and visual clarity fixes and low-hanging content fruit.", ml, y);
  y += 7;

  // Aggregate high-priority items and immediate fixes
  const phase1Actions = [
    ...(priorities?.filter(p => p.severity === "critical" || p.severity === "risk").slice(0, 4) || []),
    ...(roadmap?.immediate_fixes?.slice(0, 4) || [])
  ];

  phase1Actions.forEach((action: any, i) => {
    needPage(15);
    const label = action.label || action.action || "Recommended Fix";
    const impact = action.estimated_impact || action.impact || "High";
    
    setFont("bold", 10);
    setC(TEXT_PRIMARY);
    doc.text(`${i + 1}.`, ml, y);
    const lines = doc.splitTextToSize(label, maxW - 10);
    doc.text(lines, ml + 6, y);
    y += lines.length * 4.5;
    
    setFont("normal", 8);
    setC(TEXT_MUTED);
    doc.text(`PRIORITY: HIGH  |  IMPACT: ${impact.toUpperCase()}  |  EFFORT: MINIMAL`, ml + 6, y);
    y += 5;
    
    if (action.improved || action.framework) {
      setFont("normal", 8.5);
      setC(BRAND_LIGHT);
      const detail = action.improved || action.framework;
      const dLines = doc.splitTextToSize(`Implementation Path: ${detail}`, maxW - 10);
      doc.text(dLines, ml + 6, y);
      y += dLines.length * 4.2 + 3;
    }
    gap(2);
  });

  // PHASE 2: STRATEGIC DEPTH
  gap(5);
  subHeading("PHASE 2: STRATEGIC DEPTH (1-2 WEEKS)");
  setFont("normal", 9);
  setC(TEXT_SECONDARY);
  doc.text("Focus: Narrative restructuring, impact quantification, and career storytelling alignment.", ml, y);
  y += 7;

  const phase2Actions = [
    ...(roadmap?.short_term_improvements?.slice(0, 3) || []),
    ...(roadmap?.section_by_section_rewrites?.slice(0, 3) || [])
  ];

  phase2Actions.forEach((action: any, i) => {
    needPage(20);
    const label = action.action || action.section || "Strategic Pivot";
    const reason = action.rationale || (action.issues ? action.issues[0] : "Structural improvement");
    
    setFont("bold", 10);
    setC(TEXT_PRIMARY);
    doc.text(`${i + 1}.`, ml, y);
    const lines = doc.splitTextToSize(label, maxW - 10);
    doc.text(lines, ml + 6, y);
    y += lines.length * 4.5;
    
    setFont("normal", 8.5);
    setC(TEXT_SECONDARY);
    const rLines = doc.splitTextToSize(`Rationale: ${reason}`, maxW - 12);
    doc.text(rLines, ml + 6, y);
    y += rLines.length * 4 + 4;
    
    if (action.rewrite_suggestions?.length) {
      setFont("bold", 8);
      setC(BRAND);
      doc.text("MCKINSEY ADIVSORY REWRITE:", ml + 6, y);
      y += 4;
      textBlock(action.rewrite_suggestions[0], 9.5, "normal", TEXT_SECONDARY, 1.4);
    }
    gap(3);
  });

  // ═══════════════════════════════════════════════════════════
  // ══ FOOTER & PAGE NUMBERS ══════════════════════════════════
  // ═══════════════════════════════════════════════════════════

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom border
    setD(BORDER);
    doc.setLineWidth(0.12);
    doc.line(ml, ph - 12, pw - mr, ph - 12);
    
    setFont("bold", 8);
    setC(TEXT_MUTED);
    doc.text("SGNK CAREEROS STRATEGIC AUDIT", ml, ph - 8);
    
    setFont("normal", 8);
    doc.text(`CONFIDENTIAL \u2022 PAGE ${i} OF ${totalPages}`, pw - mr, ph - 8, { align: "right" });
    
    if (i > 1) {
      setF(BRAND);
      doc.rect(0, 0, pw, 1.2, "F");
    }
  }

  doc.save(`${fileName.replace(/\.[^.]+$/, "")}_strategic_audit_report.pdf`);
}

import { ResumeData, TemplateName } from "@/types/resume";

export type ResumeCheckStatus = "pass" | "warn" | "fail";
export type ResumeCheckCategory = "ats" | "parsing" | "content" | "format" | "export";
export type TemplateRisk = "low" | "medium" | "high";

export interface TemplateMeta {
  id: TemplateName;
  label: string;
  description: string;
  group: "Standard" | "Designer" | "LaTeX";
  atsFit: "excellent" | "strong" | "fair";
  parseRisk: TemplateRisk;
}

export interface ResumeAuditCheck {
  id: string;
  label: string;
  status: ResumeCheckStatus;
  detail: string;
  category: ResumeCheckCategory;
}

export interface ResumeAuditResult {
  score: number;
  checks: ResumeAuditCheck[];
  blockers: string[];
  warnings: string[];
  recommendedTemplate: TemplateName;
  estimatedWordCount: number;
  estimatedPages: number;
  actionVerbPct: number;
  quantifiedPct: number;
  skillsCount: number;
  templateMeta: TemplateMeta;
}

export const TEMPLATE_META: Record<TemplateName, TemplateMeta> = {
  modern: {
    id: "modern",
    label: "Modern",
    description: "Balanced modern layout with clear hierarchy",
    group: "Standard",
    atsFit: "strong",
    parseRisk: "low",
  },
  classic: {
    id: "classic",
    label: "Classic",
    description: "Traditional recruiter-first single-column format",
    group: "Standard",
    atsFit: "excellent",
    parseRisk: "low",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Simple scan-friendly style with low visual noise",
    group: "Standard",
    atsFit: "excellent",
    parseRisk: "low",
  },
  professional: {
    id: "professional",
    label: "Professional",
    description: "Corporate ATS-safe layout optimized for enterprise hiring",
    group: "Standard",
    atsFit: "excellent",
    parseRisk: "low",
  },
  creative: {
    id: "creative",
    label: "Creative",
    description: "Design-forward style best for portfolio-heavy roles",
    group: "Standard",
    atsFit: "fair",
    parseRisk: "high",
  },
  executive: {
    id: "executive",
    label: "Executive",
    description: "Leadership-focused layout with denser positioning blocks",
    group: "Standard",
    atsFit: "strong",
    parseRisk: "medium",
  },
  "designer-pro": {
    id: "designer-pro",
    label: "Designer Pro",
    description: "Portfolio-led designer resume with balanced ATS readability",
    group: "Designer",
    atsFit: "strong",
    parseRisk: "medium",
  },
  "designer-photo": {
    id: "designer-photo",
    label: "Designer Photo",
    description: "Designer profile layout with photo support and featured work",
    group: "Designer",
    atsFit: "fair",
    parseRisk: "high",
  },
  "minimal-photo": {
    id: "minimal-photo",
    label: "Minimal Photo",
    description: "Clean profile-first resume with optional photo and compact sections",
    group: "Designer",
    atsFit: "strong",
    parseRisk: "medium",
  },
  "latex-academic": {
    id: "latex-academic",
    label: "Academic",
    description: "Publication-focused scholarly structure",
    group: "LaTeX",
    atsFit: "strong",
    parseRisk: "medium",
  },
  "latex-deedy": {
    id: "latex-deedy",
    label: "Deedy",
    description: "Compact two-column format for advanced users",
    group: "LaTeX",
    atsFit: "fair",
    parseRisk: "high",
  },
  "latex-jake": {
    id: "latex-jake",
    label: "Jake",
    description: "Clean technical single-column style",
    group: "LaTeX",
    atsFit: "strong",
    parseRisk: "low",
  },
  "latex-sb": {
    id: "latex-sb",
    label: "SB Classic",
    description: "Compact ATS-oriented LaTeX classic",
    group: "LaTeX",
    atsFit: "strong",
    parseRisk: "low",
  },
};

const ACTION_VERBS = new Set([
  "achieved", "accelerated", "architected", "automated", "built", "created", "delivered", "designed",
  "developed", "drove", "elevated", "enabled", "engineered", "established", "executed", "expanded",
  "generated", "grew", "implemented", "improved", "increased", "launched", "led", "managed",
  "mentored", "optimized", "orchestrated", "owned", "pioneered", "reduced", "resolved", "scaled",
  "shipped", "spearheaded", "streamlined", "transformed",
]);

const QUANT_REGEX =
  /\d+[%$xX]|\$[\d,.]+|\d+\+?\s*(users|customers|clients|members|teams|projects|products|roles|pipelines|requests|minutes|hours|days|months|years|k|m|b)/i;

const PROTOCOL_REGEX = /^https?:\/\//i;
const DOMAIN_REGEX = /^[a-z0-9.-]+\.[a-z]{2,}/i;
const DATE_MONTH_REGEX = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s/-]+\d{2,4}$/i;
const DATE_YEAR_REGEX = /^(19|20)\d{2}$/;
const DATE_RANGE_REGEX = /^\d{1,2}\/\d{2,4}$/;

const cleanWords = (value: string) => value.trim().split(/\s+/).filter(Boolean);

const countWords = (value: string) => cleanWords(value).length;

const firstWord = (value: string) => cleanWords(value)[0]?.toLowerCase().replace(/[^a-z]/g, "");

const hasActionVerb = (bullet: string) => ACTION_VERBS.has(firstWord(bullet) || "");

const hasQuantification = (bullet: string) => QUANT_REGEX.test(bullet);

const detectDatePattern = (value: string): string | null => {
  const v = value.trim();
  if (!v) return null;
  if (/present|current|now/i.test(v)) return null;
  if (DATE_MONTH_REGEX.test(v)) return "month-year";
  if (DATE_YEAR_REGEX.test(v)) return "year-only";
  if (DATE_RANGE_REGEX.test(v)) return "numeric";
  return "freeform";
};

const isLikelyUrl = (value: string) => PROTOCOL_REGEX.test(value) || DOMAIN_REGEX.test(value);

const estimatePages = (wordCount: number, bulletCount: number) => {
  const weighted = wordCount + Math.round(bulletCount * 3.2);
  return Math.max(1, Number((weighted / 520).toFixed(2)));
};

export function runResumeAudit(data: ResumeData, template: TemplateName): ResumeAuditResult {
  const checks: ResumeAuditCheck[] = [];
  const templateMeta = TEMPLATE_META[template];
  const addCheck = (check: ResumeAuditCheck) => checks.push(check);

  const allBullets = data.experience.flatMap((exp) => exp.bullets.map((bullet) => bullet.trim()).filter(Boolean));
  const bulletCount = allBullets.length;
  const actionVerbCount = allBullets.filter(hasActionVerb).length;
  const quantifiedCount = allBullets.filter(hasQuantification).length;
  const actionVerbPct = bulletCount > 0 ? Math.round((actionVerbCount / bulletCount) * 100) : 0;
  const quantifiedPct = bulletCount > 0 ? Math.round((quantifiedCount / bulletCount) * 100) : 0;

  const skillsCount = data.skills
    .flatMap((skill) => skill.items.split(","))
    .map((item) => item.trim())
    .filter(Boolean).length;

  const summaryWords = countWords(data.summary);
  const contactFilled = [data.contact.name, data.contact.email, data.contact.phone].filter((field) => field.trim()).length;

  const wordCount = [
    data.contact.name,
    data.contact.title,
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    data.summary,
    ...data.experience.flatMap((exp) => [exp.title, exp.company, exp.location, ...exp.bullets]),
    ...data.education.flatMap((edu) => [edu.institution, edu.degree, edu.field, edu.honors]),
    ...data.skills.map((skill) => `${skill.category} ${skill.items}`),
    ...data.projects.flatMap((project) => [project.name, project.description, project.technologies, ...project.bullets]),
    ...data.certifications.flatMap((cert) => [cert.name, cert.issuer]),
    ...data.awards.flatMap((award) => [award.title, award.issuer, award.description]),
    ...data.languages.flatMap((lang) => [lang.language, lang.proficiency]),
    ...data.volunteer.flatMap((item) => [item.organization, item.role, item.description]),
    ...data.publications.flatMap((item) => [item.title, item.publisher]),
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const estimatedPages = estimatePages(wordCount, bulletCount);

  addCheck({
    id: "contact-core",
    label: "Core contact fields",
    status: contactFilled === 3 ? "pass" : contactFilled === 2 ? "warn" : "fail",
    detail: contactFilled === 3
      ? "Name, email, and phone are in place."
      : "Add name, email, and phone for reliable ATS indexing.",
    category: "ats",
  });

  addCheck({
    id: "headline",
    label: "Target role headline",
    status: data.contact.title.trim() ? "pass" : "warn",
    detail: data.contact.title.trim()
      ? "Role headline helps ranking and recruiter context."
      : "Add a target role title under your name.",
    category: "ats",
  });

  addCheck({
    id: "summary-length",
    label: "Summary length",
    status: summaryWords >= 30 && summaryWords <= 90 ? "pass" : summaryWords >= 20 && summaryWords <= 120 ? "warn" : "fail",
    detail: summaryWords >= 30 && summaryWords <= 90
      ? `Summary is well-sized at ${summaryWords} words.`
      : `Keep summary between 30-90 words (current: ${summaryWords}).`,
    category: "content",
  });

  addCheck({
    id: "experience-coverage",
    label: "Experience coverage",
    status: data.experience.length >= 2 ? "pass" : data.experience.length === 1 ? "warn" : "fail",
    detail: data.experience.length >= 2
      ? "Experience depth is healthy for ATS filtering."
      : "Add at least 2 experience entries for stronger ranking.",
    category: "ats",
  });

  const rolesWithThinBullets = data.experience.filter((entry) => entry.bullets.map((bullet) => bullet.trim()).filter(Boolean).length < 2).length;
  const avgBulletsPerRole =
    data.experience.length > 0
      ? data.experience.reduce((total, entry) => total + entry.bullets.map((bullet) => bullet.trim()).filter(Boolean).length, 0) / data.experience.length
      : 0;

  addCheck({
    id: "impact-bullets",
    label: "Impact bullets per role",
    status: rolesWithThinBullets === 0 && avgBulletsPerRole >= 3 ? "pass" : rolesWithThinBullets <= 1 && avgBulletsPerRole >= 2 ? "warn" : "fail",
    detail: rolesWithThinBullets === 0 && avgBulletsPerRole >= 3
      ? `Strong bullet density (${avgBulletsPerRole.toFixed(1)} per role).`
      : "Aim for 3-5 bullets per role with measurable outcomes.",
    category: "content",
  });

  addCheck({
    id: "action-verbs",
    label: "Action-verb usage",
    status: actionVerbPct >= 65 ? "pass" : actionVerbPct >= 40 ? "warn" : "fail",
    detail: actionVerbPct >= 65
      ? `${actionVerbPct}% of bullets start with strong action verbs.`
      : `Raise action-verb rate to 65%+ (current: ${actionVerbPct}%).`,
    category: "content",
  });

  addCheck({
    id: "quantification",
    label: "Quantified impact",
    status: quantifiedPct >= 35 ? "pass" : quantifiedPct >= 18 ? "warn" : "fail",
    detail: quantifiedPct >= 35
      ? `${quantifiedPct}% of bullets include metrics.`
      : `Add metrics to 35%+ bullets (current: ${quantifiedPct}%).`,
    category: "ats",
  });

  addCheck({
    id: "skills-breadth",
    label: "Skills breadth",
    status: skillsCount >= 10 ? "pass" : skillsCount >= 6 ? "warn" : "fail",
    detail: skillsCount >= 10
      ? `${skillsCount} skills mapped for ATS keyword matching.`
      : `Target 10+ role-relevant skills (current: ${skillsCount}).`,
    category: "ats",
  });

  const coreSectionCount = [
    summaryWords > 0,
    data.experience.length > 0,
    data.education.length > 0,
    data.skills.length > 0,
  ].filter(Boolean).length;

  addCheck({
    id: "core-sections",
    label: "Parser section coverage",
    status: coreSectionCount === 4 ? "pass" : coreSectionCount === 3 ? "warn" : "fail",
    detail: coreSectionCount === 4
      ? "All core sections are present for stable parsing."
      : "Include summary, experience, education, and skills for parser completeness.",
    category: "parsing",
  });

  const datePatterns = new Set<string>();
  [...data.experience, ...data.education].forEach((entry) => {
    const startPattern = detectDatePattern(entry.startDate);
    const endPattern = detectDatePattern(entry.endDate);
    if (startPattern) datePatterns.add(startPattern);
    if (endPattern) datePatterns.add(endPattern);
  });

  addCheck({
    id: "date-consistency",
    label: "Date format consistency",
    status: datePatterns.size <= 1 ? "pass" : datePatterns.size === 2 ? "warn" : "fail",
    detail: datePatterns.size <= 1
      ? "Dates look consistent for parsing."
      : "Use one date style across all entries (e.g., Jan 2024).",
    category: "parsing",
  });

  const urlsToCheck = [
    data.contact.linkedin,
    data.contact.portfolio,
    ...data.experience.map((entry) => entry.url || ""),
    ...data.education.map((entry) => entry.url || ""),
    ...data.projects.map((entry) => entry.url || ""),
    ...data.certifications.map((entry) => entry.url || ""),
    ...data.awards.map((entry) => entry.url || ""),
    ...data.publications.map((entry) => entry.url || ""),
    ...data.volunteer.map((entry) => entry.url || ""),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  const malformedUrls = urlsToCheck.filter((value) => !isLikelyUrl(value));
  addCheck({
    id: "url-hygiene",
    label: "Link hygiene",
    status: malformedUrls.length === 0 ? "pass" : malformedUrls.length <= 2 ? "warn" : "fail",
    detail: malformedUrls.length === 0
      ? "Links look parser-friendly."
      : "Normalize links to valid domains or full URLs.",
    category: "parsing",
  });

  const templateStatus: ResumeCheckStatus =
    templateMeta.parseRisk === "low" ? "pass" : templateMeta.parseRisk === "medium" ? "warn" : "fail";
  addCheck({
    id: "template-risk",
    label: "Template parse risk",
    status: templateStatus,
    detail:
      templateMeta.parseRisk === "low"
        ? `${templateMeta.label} is ATS-safe for most systems.`
        : templateMeta.parseRisk === "medium"
        ? `${templateMeta.label} is usable, but validate parsing output.`
        : `${templateMeta.label} is high-risk for strict ATS parsers.`,
    category: "format",
  });

  const photoTemplate = template === "designer-photo" || template === "minimal-photo";
  if (photoTemplate) {
    addCheck({
      id: "photo-presence",
      label: "Photo template profile image",
      status: data.contact.photoUrl.trim() ? "pass" : "warn",
      detail: data.contact.photoUrl.trim()
        ? "Profile photo is configured."
        : "Add a profile photo or switch to a non-photo template.",
      category: "format",
    });
  }

  addCheck({
    id: "length-fit",
    label: "Length and density",
    status: estimatedPages <= 1.4 ? "pass" : estimatedPages <= 2.1 ? "warn" : "fail",
    detail:
      estimatedPages <= 1.4
        ? "Length is compact and recruiter-friendly."
        : estimatedPages <= 2.1
        ? `Estimated ${estimatedPages.toFixed(1)} pages; trim for faster review.`
        : `Estimated ${estimatedPages.toFixed(1)} pages; high risk for drop-off.`,
    category: "export",
  });

  const weight = { pass: 1, warn: 0.5, fail: 0 };
  const score = Math.round((checks.reduce((sum, check) => sum + weight[check.status], 0) / checks.length) * 100);

  const blockers = checks.filter((check) => check.status === "fail").map((check) => check.detail);
  const warnings = checks.filter((check) => check.status === "warn").map((check) => check.detail);

  const recommendedTemplate =
    templateMeta.parseRisk === "low" ? template : data.experience.length >= 2 ? "professional" : "classic";

  return {
    score,
    checks,
    blockers,
    warnings,
    recommendedTemplate,
    estimatedWordCount: wordCount,
    estimatedPages,
    actionVerbPct,
    quantifiedPct,
    skillsCount,
    templateMeta,
  };
}

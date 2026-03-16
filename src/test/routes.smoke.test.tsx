import { cleanup, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

type QueryResponse<T = unknown> = {
  data: T;
  error: null;
  count?: number;
  status?: number;
  statusText?: string;
};

const createResponse = <T,>(data: T): QueryResponse<T> => ({
  data,
  error: null,
  count: Array.isArray(data) ? data.length : 1,
  status: 200,
  statusText: "OK",
});

function createQueryBuilder(defaultData: unknown = []) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "order",
    "limit",
    "range",
    "match",
    "or",
    "in",
    "is",
    "not",
    "ilike",
    "like",
    "contains",
    "overlaps",
    "textSearch",
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn(() => builder);
  });

  builder.single = vi.fn(async () => createResponse(null));
  builder.maybeSingle = vi.fn(async () => createResponse(null));
  builder.then = (resolve: (v: QueryResponse) => void, reject?: (reason?: unknown) => void) =>
    Promise.resolve(createResponse(defaultData)).then(resolve, reject);
  builder.catch = (reject: (reason?: unknown) => void) =>
    Promise.resolve(createResponse(defaultData)).catch(reject);
  builder.finally = (onFinally: () => void) =>
    Promise.resolve(createResponse(defaultData)).finally(onFinally);

  return builder;
}

const mockUser = {
  id: "test-user-id",
  email: "tester@example.com",
  user_metadata: { full_name: "Test User" },
};

const mockResume = {
  id: "resume-1",
  title: "Test Resume",
  alias: "TR v1",
  template: "classic",
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  resume_data: {},
  source: "upload",
  is_primary: true,
};

const mockAnalysis = {
  _id: "analysis-1",
  resume_id: "resume-1",
  resume_text: "Sample resume text",
  extracted_info: {
    name: "Test User",
    current_title: "Software Engineer",
    skills_count: 12,
  },
  scores: {
    ats: { score: 78, summary: "Good ATS compatibility" },
    parsing: { score: 75, summary: "Mostly parseable" },
    recruiter_readability: { score: 74, summary: "Clear and concise" },
    content_quality: { score: 80, summary: "Strong bullet quality" },
    human_authenticity: { score: 82, summary: "Natural style" },
    impact_strength: { score: 76, summary: "Impact shown" },
    structure: { score: 79, summary: "Well-structured" },
    clarity: { score: 77, summary: "Readable and direct" },
    strategic_positioning: { score: 73, summary: "Reasonable positioning" },
  },
  ats_analysis: {
    pass_likelihood: "Good",
    checks: [],
    matched_keywords: ["React", "TypeScript", "Product"],
    missing_keywords: [],
    recommendations: [],
  },
  parsing_analysis: { fields: [] },
  recruiter_analysis: {
    first_impression: "Solid candidate profile",
    perceived_role: "Software Engineer",
    perceived_level: "Mid-Level",
    perceived_strength: "Strong",
    noticed: [],
    missed: [],
    issues: [],
  },
  content_analysis: {
    strong_bullets: 6,
    weak_bullets: 2,
    total_bullets: 8,
    metrics_used: 4,
    bullets: [],
    issues: [],
  },
  humanizer_analysis: { verdict: "Likely human-written", flags: [], detections: [] },
  structure_analysis: { sections: [], seniority_signal: "Mid-level" },
  improvement_roadmap: {
    immediate_fixes: [],
    short_term_improvements: [],
    long_term_development: [],
    section_by_section_rewrites: [],
  },
  overall_verdict: {
    grade: "B+",
    one_liner: "Strong baseline with room to improve keyword targeting.",
    ready_to_apply: true,
    biggest_risk: "Keyword gaps",
    biggest_asset: "Strong quantified experience",
    estimated_response_rate: "Moderate to high",
  },
  red_flags: [],
  priorities: [],
  strengths: [],
};

const supabaseMock = {
  from: vi.fn(() => createQueryBuilder([])),
  rpc: vi.fn(async () => createResponse({})),
  functions: {
    invoke: vi.fn(async () => createResponse({})),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(async () => createResponse({ path: "mock-path" })),
      download: vi.fn(async () => createResponse(new Blob(["mock"]))),
      remove: vi.fn(async () => createResponse([])),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/mock" } })),
    })),
  },
  auth: {
    getSession: vi.fn(async () => ({ data: { session: { user: mockUser } }, error: null })),
    getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
    onAuthStateChange: vi.fn((callback?: (event: string, session: unknown) => void) => {
      callback?.("SIGNED_IN", { user: mockUser });
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
    signUp: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  },
};

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    session: { user: mockUser },
    user: mockUser,
    loading: false,
    signUp: vi.fn(async () => ({ error: null })),
    signIn: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(async () => {}),
  }),
}));

vi.mock("@/context/AnalysisContext", () => ({
  AnalysisProvider: ({ children }: { children: ReactNode }) => children,
  useAnalysis: () => ({
    analysis: mockAnalysis,
    fileName: "TestResume.pdf",
    isLoading: false,
    error: null,
    setAnalysis: vi.fn(),
    clearAnalysis: vi.fn(),
  }),
}));

vi.mock("@/context/ActiveResumeContext", () => ({
  ActiveResumeProvider: ({ children }: { children: ReactNode }) => children,
  useActiveResume: () => ({
    resumes: [mockResume],
    activeResumeId: mockResume.id,
    activeResume: mockResume,
    loading: false,
    setActiveResumeId: vi.fn(),
    refreshResumes: vi.fn(async () => {}),
    updateAlias: vi.fn(async () => {}),
    getDisplayName: (resume: { alias?: string | null; title: string }) => resume.alias || resume.title,
  }),
}));

type RouteCase = { path: string; expectedPath?: string };

const routeCases: RouteCase[] = [
  { path: "/dashboard" },
  { path: "/upload" },
  { path: "/analysis" },
  { path: "/my-resumes" },
  { path: "/templates" },
  { path: "/export" },
  { path: "/builder" },
  { path: "/profile-hub" },
  { path: "/compare" },
  { path: "/compare-analytics" },
  { path: "/portfolios" },
  { path: "/portfolio-builder" },
  { path: "/portfolio-templates" },
  { path: "/portfolio-editor" },
  { path: "/publish" },
  { path: "/jobs-for-you" },
  { path: "/job-match" },
  { path: "/jd-tailor" },
  { path: "/rewrites" },
  { path: "/job-alerts" },
  { path: "/application-tracker" },
  { path: "/company-research" },
  { path: "/smart-recommendations" },
  { path: "/job-getting-roadmap" },
  { path: "/interview-prep" },
  { path: "/mock-interview" },
  { path: "/star-builder" },
  { path: "/salary-benchmark" },
  { path: "/salary-negotiation" },
  { path: "/offer-comparison" },
  { path: "/cover-letter" },
  { path: "/follow-up-email" },
  { path: "/thank-you-note" },
  { path: "/cold-email" },
  { path: "/elevator-pitch" },
  { path: "/referral-mapper" },
  { path: "/reference-letter" },
  { path: "/career-intelligence" },
  { path: "/career-path" },
  { path: "/skill-gap" },
  { path: "/learning-roadmap" },
  { path: "/market-digest" },
  { path: "/linkedin-optimizer" },
  { path: "/personal-branding" },
  { path: "/bio-generator" },
  { path: "/case-study" },
  { path: "/help" },
  { path: "/features" },
  { path: "/settings" },
  { path: "/analytics" },
  { path: "/hr-hub" },
  { path: "/notifications" },
  { path: "/activity" },
  { path: "/install" },
  { path: "/ats", expectedPath: "/analysis" },
  { path: "/parsing", expectedPath: "/analysis" },
  { path: "/recruiter", expectedPath: "/analysis" },
  { path: "/content", expectedPath: "/analysis" },
  { path: "/humanizer", expectedPath: "/analysis" },
  { path: "/structure", expectedPath: "/analysis" },
  { path: "/reports", expectedPath: "/analysis" },
  { path: "/recommendations", expectedPath: "/analysis" },
  { path: "/improvement-roadmap", expectedPath: "/analysis" },
  { path: "/shared/fake-token" },
];

let App: (props: Record<string, never>) => JSX.Element;

describe("route smoke tests", () => {
  beforeAll(async () => {
    App = (await import("@/App")).default;
  });

  afterEach(() => {
    cleanup();
  });

  it.each(routeCases)("renders route $path without crash", async ({ path, expectedPath }) => {
    window.history.pushState({}, "Smoke test route", path);

    expect(() => render(<App />)).not.toThrow();

    await waitFor(
      () => {
        const expected = expectedPath ?? path.split("?")[0];
        expect(window.location.pathname).toBe(expected);
        expect(document.body.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      },
      { timeout: 8000 }
    );
  }, 12000);
});

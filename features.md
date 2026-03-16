# sgnk CareerOS — Complete System Behavior & Feature Specification

> Last updated: March 15, 2026
> This document is derived from implementation in:
> - `src/App.tsx`
> - `src/pages/*`
> - `src/components/*`
> - `src/context/*`
> - `src/hooks/*`
> - `src/lib/*`
> - `src/integrations/supabase/*`
> - `supabase/functions/*`
> - `supabase/migrations/*`

---

## 1. Purpose of This Document

This file is the implementation-level system spec for CareerOS.
It documents:

- What the platform does
- How it behaves at runtime
- Which services and models are used
- What each route/module/tool does
- Data flow and checkpoints
- Persistence, sync behavior, and events
- Database entities and policy posture
- Edge function inventory and invocation map

---

## 2. Product Definition

CareerOS is a full-stack, AI-assisted career operating system with these top-level domains:

1. Resume ingestion, parsing, and deep analysis
2. Resume authoring and version management
3. Job discovery, matching, alerts, and tracking
4. Interview prep, mock interview simulation, and scoring
5. Outreach content generation (cover letters, emails, referral assets)
6. Salary intelligence and offer evaluation
7. Career growth tools (skill gaps, roadmaps, LinkedIn/branding)
8. Portfolio authoring/publishing system
9. Notifications, activity logging, analytics, and reporting

---

## 3. Current Implementation Snapshot

| Metric | Value |
|---|---:|
| Total route definitions in router | 72 |
| Public routes | 8 |
| Protected routes inside app shell | 64 |
| Page components (`src/pages`) | 71 |
| Supabase Edge Functions | 42 |
| DB tables created in migrations | 11 |
| Resume rendering templates | 10 |
| Portfolio templates | 8 |
| Role lens profiles in builder | 12 |

---

## 4. Stack & Core Dependencies

## 4.1 Frontend Runtime

- React 18
- TypeScript
- Vite 5
- React Router v6
- TanStack Query
- Tailwind CSS + shadcn/ui + Radix UI
- Framer Motion (and motion shim utilities)
- Sonner + shadcn toaster

## 4.2 Backend Runtime

- Supabase Auth
- Supabase Postgres
- Supabase Edge Functions (Deno)

## 4.3 AI Providers and Model Usage

Primary model family used in edge functions:
- Gemini (`gemini-2.5-flash`, `gemini-3-flash-preview`, legacy/alternate `gemini-1.5-*` in selected pipelines)

Additional external API used:
- Firecrawl (job search/scraping pipelines)

## 4.4 Build/Delivery Runtime

- `vite-plugin-pwa` enabled
- Service worker mode: `generateSW`
- Runtime caching for Google fonts
- Manual chunking configured (`vendor`, `ui`)

---

## 5. Global App Lifecycle & Runtime Behavior

## 5.1 App Composition Order

`App.tsx` wraps app in this order:

1. `QueryClientProvider`
2. `TooltipProvider`
3. `ThemeProvider`
4. `AuthProvider`
5. `AnalysisProvider`
6. `ActiveResumeProvider`
7. Notifications toasters
8. `BrowserRouter` with route tree

Behavioral implication:
- Auth, analysis, active resume state are globally available across protected pages.

## 5.2 Auth Gating Behavior

`ProtectedRoute` behavior:

- While auth is resolving: full-screen spinner
- If unauthenticated: redirect to `/login` and preserve `from` location
- If authenticated: render requested route

## 5.3 Route Loading Behavior

- Critical routes are eager-loaded (`Login`, `Signup`, `Dashboard`, `Upload`, `MyResumes`, `ResumeBuilder`, `Settings`, `Help`, `Features`, `NotFound`)
- Most secondary routes lazy-loaded with `<Suspense fallback={<PageLoader />}>`
- Prefetch timer imports common lazy pages ~2 seconds after initial load

## 5.4 App Shell Behavior

Protected routes render inside `AppShell`:

- Sidebar + main column layout
- Desktop and mobile-specific navigation behavior
- Global `CommandPalette`
- Global `OnboardingTour`

### Mobile shell behavior

Mobile header includes:
- Sidebar trigger
- Search trigger
- Notifications shortcut
- Theme toggle
- Active resume selector

### Desktop shell behavior

Desktop topbar (`AppLayout`) includes:
- Sidebar trigger
- Back navigation (if possible)
- Breadcrumbs
- Recent page chips (desktop-only)
- Active resume compact dropdown
- Global search, notifications, theme controls

---

## 6. State Architecture (Contexts)

## 6.1 `AuthContext`

Responsibilities:
- Session and user state
- sign up / sign in / sign out methods
- auth state subscription + initial session fetch

Behavior:
- listens to Supabase auth events
- keeps `loading` true until initial auth state resolved

## 6.2 `ThemeContext`

Responsibilities:
- theme mode (`light`, `dark`, `system`)
- resolved theme
- persistence to localStorage

Behavior:
- applies theme class on root element
- listens for system theme changes when in `system` mode

## 6.3 `AnalysisContext`

Responsibilities:
- current resume analysis object in memory
- associated source filename
- analysis reset and replacement methods

Schema includes advanced sections beyond basic ATS scores:
- core scores and summaries
- parsing breakdown
- recruiter scan simulation
- content bullet diagnostics
- human authenticity scan
- structure diagnostics
- skills mapping
- competency mapping
- career narrative
- executive presence
- industry benchmarking
- bias scan
- interview vulnerability graph
- consistency audit
- improvement roadmap
- overall verdict

## 6.4 `ActiveResumeContext`

Responsibilities:
- fetch and maintain saved resumes
- track active resume id across pages
- load analysis for selected resume
- fallback linkage heuristics when `resume_id` is absent
- alias updates and display naming

Key behavior:

1. Fetches user resumes sorted by `updated_at`
2. Auto-selects primary or newest resume when needed
3. Persists active id in session storage
4. Tries analysis lookup by `resume_id`
5. Falls back by filename variants (`title`, `.pdf`, `.docx`, `.doc`, `.txt`)
6. Auto-links matched analysis back to active resume for future direct lookup

---

## 7. Persistence, Keys, and Cross-Page Sync

## 7.1 Local Storage Keys

| Key | Purpose |
|---|---|
| `theme` | Theme preference |
| `sgnk_recent_pages` | Command palette + topbar recents |
| `sgnk_tour_completed` | Onboarding tour completion |
| `sgnk-sidebar-open` | Sidebar open/collapsed preference |
| `app_tracker_<userId>` | Application tracker Kanban data (local-only) |

## 7.2 Session Storage Keys

| Key | Purpose |
|---|---|
| `activeResumeId` | Current resume context id |
| `parsed_resume_data` | Parsed resume payload handed from upload to builder/fallback pages |
| `parsedResume_data` | Alternate fallback key used by `useResumeSource` |
| `parsedResume_text` | Alternate fallback plain text key in `useResumeSource` |

## 7.3 Custom Events Used

| Event | Triggered by | Purpose |
|---|---|---|
| `resumes-changed` | `notifyResumesChanged()` and resume workflows | Cross-page refresh of resume lists |
| `storage` (synthetic dispatch in active resume context) | `setActiveResumeId` | Force active-id listeners to sync |
| `sgnk-replay-tour` | Onboarding controls | Replay onboarding tour |
| `beforeinstallprompt` / `appinstalled` | Browser PWA lifecycle | Install UX |

---

## 8. Navigation & Discovery Systems

## 8.1 Sidebar Navigation

Groups include:
- Core routes
- Build/Edit routes
- Jobs/Matching routes
- Interview/Salary routes
- Outreach routes
- Career Growth routes
- Settings/system group

Includes collapsed and expanded modes with hover/click flyouts.

## 8.2 Command Palette

Capabilities:
- `Cmd/Ctrl + K` global toggle
- grouped route search
- recent routes
- active-route highlighting
- keyboard hints for navigation/open/close

Recent history behavior:
- auto-updates on pathname change
- max recent entries persisted

## 8.3 Onboarding Tour

- Multi-step overlay
- step navigation and replay support
- local completion persistence
- feature route links for quick jump-out

---

## 9. Upload & Analysis Pipeline (Detailed Checkpoints)

## 9.1 Accepted Inputs and Validation

Upload page accepts:
- PDF
- DOCX
- DOC
- TXT

Hard limits:
- max file size: 10 MB

Validation checkpoints:
1. MIME/ext compatibility check
2. File size check
3. UI state reset on new file

## 9.2 Runtime Pipeline Steps

Main flow in `/upload`:

1. Read file to Base64 (tracks file read progress)
2. Invoke `analyze-resume`
3. Set analysis in context
4. Navigate to `/reports`
5. In background:
   - invoke `parse-resume`
   - normalize parsed schema
   - create `saved_resumes` record
   - link analysis to `resume_id`
   - refresh active resume context

If parse content is weak/empty:
- fallback resume object is created from extracted analysis metadata
- fallback resume is still persisted

## 9.3 Live Analysis Progress Checkpoints

`AnalysisProgress` includes staged progress and rolling phase feed.

Top stages:
1. Reading
2. AI Analysis
3. Parsing
4. Scoring

Detailed analysis-phase checklist includes:

1. Extracting contact info & metadata
2. Mapping experience timeline
3. Reviewing education & credentials
4. Cataloging technical and soft skills
5. Running ATS compatibility checks
6. Simulating recruiter scan
7. Scoring bullets for impact
8. Checking human authenticity
9. Mapping competencies
10. Analyzing career progression
11. Running bias scan
12. Finding interview vulnerabilities
13. Benchmarking against peers
14. Computing final scores
15. Generating rewrites
16. Building improvement roadmap

Progress behavior:
- weighted completion percentages per major stage
- rotating active phase during AI stage
- completion panel and long-wait messaging

---

## 10. Analysis Domain (Deep Structure)

## 10.1 Analysis Dimensions Rendered

Core score dimensions:
- ATS
- Parsing
- Recruiter readability
- Content quality
- Human authenticity
- Impact strength
- Structure
- Clarity
- Strategic positioning

## 10.2 Unified Analysis Surface (`/analysis`)

Tabs:
- Overview
- Recommendations
- ATS Score
- Parsing Check
- Recruiter View
- Content Quality
- Structure
- AI Detection
- Fix Roadmap
- Full Report

Legacy routes are redirected to tab params, preserving existing links.

## 10.3 Report Generation & Deep Rescan

Reports page supports:
- full report PDF generation (`generateFullReport`)
- deep rescan invocation path via `analyze-resume` with `isDeep`
- persistence update back into `resume_analyses`
- recovery UI when report data is incomplete

---

## 11. Resume Authoring & Versioning System

## 11.1 Resume Builder

Primary builder capabilities:
- Modes: `edit`, `preview`, `split`, `inline`
- Mobile adaptive behavior (split suppressed on mobile)
- Template switching with preservation of content
- Undo/redo stack (bounded history)
- Debounced autosave to DB
- Manual save/update
- Export to PDF
- AI-assisted bullet rewrites
- Apply analysis fixes

## 11.2 Resume Templates

Renderer-backed templates:
- modern
- classic
- minimal
- professional
- creative
- executive
- latex-academic
- latex-deedy
- latex-jake
- latex-sb

Template picker behavior:
- grouped display (Standard + LaTeX)
- live mini previews
- immediate apply on selection

## 11.3 My Resumes Behavior

Capabilities:
- grouped display by candidate name
- search filtering
- duplicate version
- delete with linked analysis cleanup
- mark/unmark primary
- share-link generation (token or custom slug)
- per-resume alias generation (client-side Gemini API call in page)

Deletion workflow safeguards:
1. detaches `job_alerts.resume_id`
2. deletes linked analyses by `resume_id`
3. fallback delete analyses by `file_name`
4. deletes resume record

## 11.4 Active Resume UX

- sidebar full selector
- topbar compact selector
- mobile compact/full-width selector
- alias editing in sidebar variant
- display name logic: alias > title, with version disambiguation when duplicate titles exist

---

## 12. Job Discovery, Alerts, and Tracking

## 12.1 Jobs For You (`/jobs-for-you`)

Capabilities:
- aggregate context from multiple resumes + latest analysis
- invoke `find-jobs` for discovery and scoring
- optional URL/query scraping via `scrape-jobs`
- expired-link filtering
- save/unsave jobs to DB
- update notes/status on saved jobs
- tabs for discover/saved/scraper views

## 12.2 Job Alerts (`/job-alerts`)

Capabilities:
- create/update/delete alerts
- run alert immediately (`process-job-alerts`)
- read/unread management of alert results
- filtering by alert id

Alert filters include:
- keywords
- location
- seniority
- work mode
- salary range
- industries
- source set
- resume-based targeting

## 12.3 Application Tracker (`/application-tracker`)

Behavioral note:
- this board is localStorage-backed (`app_tracker_<userId>`) and not persisted in Supabase

Features:
- Kanban statuses: saved, applied, interview, offer, rejected
- follow-up date reminders
- inline move between statuses
- edit/delete application cards

---

## 13. Interview System (Prep + Simulation)

## 13.1 Interview Prep (`/interview-prep`)

- generates question sets from resume + role context
- answer evaluation workflow via `evaluate-answer`

## 13.2 Mock Interview (`/mock-interview`)

Major features:
- multi-mode session (`conversation` / `voice`)
- role/company/JD-driven interview generation
- question-by-question evaluation
- final interview assessment with breakdown
- session persistence to `mock_interview_sessions`
- history browser + past session viewer

Voice features:
- speech recognition with browser support checks
- silence detection auto-submit threshold
- TTS path:
  - native browser synth fallback
  - generated Gemini audio path from function when available

Recorded voice metrics:
- words per minute
- filler words
- response timing

---

## 14. Outreach Content Systems

Routes and generators:

- `/cover-letter` → `generate-cover-letter`
- `/follow-up-email` → `generate-follow-up-email`
- `/thank-you-note` → `thank-you-note`
- `/cold-email` → `cold-email-ab`
- `/elevator-pitch` → `elevator-pitch`
- `/referral-mapper` → `referral-mapper`
- `/reference-letter` → `reference-letter`
- `/bio-generator` → `bio-generator`
- `/case-study` → `case-study-builder`

Shared behavior pattern:
- collects structured form + resume context
- invokes edge function
- renders generated output with copy/use actions

---

## 15. Salary & Offer Systems

Routes:
- `/salary-benchmark`
- `/offer-comparison`
- `/salary-negotiation`

Function mapping:
- `salary-benchmark`
- `compare-offers`
- `salary-negotiation`

Behavior:
- structured user inputs
- model-generated compensation intelligence
- recommendation outputs surfaced in UI cards/sections

---

## 16. Career Growth Systems

Routes and function mapping:

- `/career-intelligence` → `career-intelligence`
- `/career-path` → `career-path-visualizer`
- `/skill-gap` → `skill-gap-heatmap`
- `/learning-roadmap` → `learning-roadmap`
- `/linkedin-optimizer` → `parse-linkedin-pdf`, `linkedin-optimizer`
- `/personal-branding` → `personal-branding`

Additionally:
- role lens selection framework (12 profiles) influences analysis framing in builder flows.

---

## 17. Research & Recommendation Systems

Routes:
- `/company-research`
- `/market-digest`
- `/smart-recommendations`
- `/hr-hub`

Function mapping:
- `company-research`
- `market-digest`
- `smart-recommendations`
- `generate-outreach` (used by HR Hub flows)

HR Hub behavior includes:
- recruiter favorites persistence
- outreach generation with selected context
- fallback resume context retrieval from recent saved resumes

---

## 18. Portfolio System

## 18.1 Current Status

- `/portfolios` currently renders a “Coming Soon” placeholder
- Supporting pages/features are implemented:
  - `/portfolio-templates`
  - `/portfolio-editor`
  - `/portfolio-builder`
  - `/publish`

## 18.2 Portfolio Template Catalog (8)

- minimal-editorial
- product-designer
- creative-visual
- technical-pro
- executive
- startup-operator
- research-academic
- hybrid-professional

## 18.3 Portfolio Data Behaviors

`usePortfolios` supports:
- fetch, create, update, delete
- publish/unpublish state toggles
- slug availability checks via `check-slug`

Publish UX currently references domain pattern:
- `<slug>.careeros.app`

---

## 19. Notifications, Activity, and Analytics

## 19.1 Notifications (`/notifications`)

Capabilities:
- list + filter (all/unread)
- mark one/all read
- delete one/all
- realtime insert subscription channel

Data source:
- `notifications` table

## 19.2 Activity Log (`/activity`)

Capabilities:
- entity-type filter
- grouped timeline by day
- load-more pagination increments

Data source:
- `activity_logs` table

## 19.3 Analytics

Routes:
- `/analytics`
- `/compare-analytics`

Data source mix:
- `saved_resumes`
- `resume_analyses`

---

## 20. PWA & Install Flow

Install route (`/install`) behavior:
- detects platform (`ios`/`android`/`desktop`)
- captures `beforeinstallprompt`
- handles install prompt acceptance flow
- detects installed mode via display mode and `appinstalled`

PWA config highlights:
- standalone display
- start URL `/dashboard`
- generated SW with asset pre-cache

---

## 21. Route Inventory (Complete)

## 21.1 Public Routes

| Route | Component/Behavior |
|---|---|
| `/` | Redirect to `/dashboard` |
| `/login` | Login page |
| `/signup` | Signup page |
| `/auth/callback` | OAuth callback processor with retry session check |
| `/forgot-password` | Forgot password page |
| `/reset-password` | Reset password page |
| `/shared/:token` | Public shared resume viewer |
| `*` | Not Found page |

## 21.2 Protected Routes

| Route | Primary Purpose |
|---|---|
| `/onboarding` | Onboarding experience |
| `/upload` | Resume upload + analysis kickoff |
| `/dashboard` | Home dashboard and analysis overview entry |
| `/my-resumes` | Resume library and version actions |
| `/templates` | Resume template gallery |
| `/export` | Export center |
| `/analysis` | Unified analysis dashboard |
| `/job-match` | Job matching |
| `/jd-tailor` | JD tailoring |
| `/rewrites` | Rewrite assistant |
| `/settings` | Settings page |
| `/analytics` | Analytics |
| `/builder` | Resume builder |
| `/cover-letter` | Cover letter tool |
| `/interview-prep` | Interview prep tool |
| `/career-intelligence` | Career intelligence |
| `/learning-roadmap` | Learning roadmap |
| `/personal-branding` | Personal branding |
| `/salary-negotiation` | Salary negotiation |
| `/compare` | Compare versions |
| `/compare-analytics` | Compare analytics |
| `/portfolios` | Portfolio home placeholder |
| `/portfolio-builder` | Portfolio builder |
| `/portfolio-templates` | Portfolio template selection |
| `/portfolio-editor` | Portfolio editor |
| `/publish` | Publish controls |
| `/jobs-for-you` | Job discovery |
| `/job-getting-roadmap` | Job roadmap |
| `/hr-hub` | Recruiter/HR hub |
| `/profile-hub` | Profile hub |
| `/smart-recommendations` | Personalized recommendations |
| `/job-alerts` | Job alerts management |
| `/application-tracker` | Kanban application tracker |
| `/follow-up-email` | Follow-up email tool |
| `/company-research` | Company research |
| `/referral-mapper` | Referral mapping |
| `/mock-interview` | Mock interview simulator |
| `/star-builder` | STAR builder |
| `/salary-benchmark` | Salary benchmark |
| `/offer-comparison` | Offer comparison |
| `/career-path` | Career path visualization |
| `/skill-gap` | Skill gap heatmap |
| `/market-digest` | Market digest |
| `/linkedin-optimizer` | LinkedIn optimization |
| `/elevator-pitch` | Elevator pitch tool |
| `/thank-you-note` | Thank-you note tool |
| `/cold-email` | Cold email A/B tool |
| `/reference-letter` | Reference letter tool |
| `/case-study` | Case study builder |
| `/bio-generator` | Bio generator |
| `/help` | Help page |
| `/features` | Features page |
| `/install` | Install/PWA page |
| `/notifications` | Notification center |
| `/activity` | Activity log |

## 21.3 Redirect Compatibility Routes

| Legacy Route | Redirect |
|---|---|
| `/ats` | `/analysis?tab=ats` |
| `/parsing` | `/analysis?tab=parsing` |
| `/recruiter` | `/analysis?tab=recruiter` |
| `/content` | `/analysis?tab=content` |
| `/humanizer` | `/analysis?tab=ai` |
| `/structure` | `/analysis?tab=structure` |
| `/reports` | `/analysis?tab=report` |
| `/recommendations` | `/analysis?tab=recommendations` |
| `/improvement-roadmap` | `/analysis?tab=roadmap` |

---

## 22. Supabase Edge Functions (Complete Inventory)

| Function | Used By | What It Does |
|---|---|---|
| `analyze-resume` | Upload, Reports, Content refresh | Deep structured analysis of resume data |
| `apply-analysis-fixes` | Resume Builder | Applies recommended changes from analysis |
| `bio-generator` | Bio Generator page | Produces professional bio variants |
| `career-intelligence` | Career Intelligence page | Career strategy analysis |
| `career-path-visualizer` | Career Path page | Career trajectory output |
| `case-study-builder` | Case Study page | Case study drafting |
| `check-slug` | Portfolio hooks | Slug availability check |
| `cold-email-ab` | Cold Email page | Outreach A/B generation |
| `company-research` | Company Research page | Company intelligence output |
| `compare-offers` | Offer Comparison page | Offer scoring/comparison |
| `elevator-pitch` | Elevator Pitch page | Pitch generation |
| `evaluate-answer` | Interview Prep page | Answer scoring + feedback |
| `find-jobs` | Jobs For You | AI job discovery and ranking |
| `generate-alias` | available in backend, not primary UI path | Resume alias generation |
| `generate-cover-letter` | Cover Letter page | Cover letter generation |
| `generate-docx` | Export Center | DOCX generation |
| `generate-follow-up-email` | Follow-Up page | Follow-up draft generation |
| `generate-from-text` | Builder helper dialog | Resume structure from plain text |
| `generate-latex` | Export Center | LaTeX generation |
| `generate-outreach` | HR Hub | Outreach content from context |
| `humanize-text` | Humanizer page | Humanization and AI-pattern edits |
| `interview-prep` | Interview Prep page | Interview questions by role/context |
| `jd-gap-analysis` | JD Tailor page | Resume-vs-JD gap mapping |
| `job-match` | Job Match page | Match scoring against target role/JD |
| `learning-roadmap` | Learning Roadmap page | Learning plan generation |
| `linkedin-optimizer` | LinkedIn Optimizer page | LinkedIn profile optimization |
| `market-digest` | Market Digest page | Market trends summary |
| `mock-interview` | Mock Interview page | Full interactive mock session orchestration |
| `parse-linkedin-pdf` | LinkedIn Optimizer | Parse uploaded LinkedIn PDF |
| `parse-resume` | Upload page | Resume parsing to structured schema |
| `personal-branding` | Personal Branding page | Brand positioning output |
| `process-job-alerts` | Job Alerts page | Alert execution and result insertion |
| `reference-letter` | Reference Letter page | Reference letter generation |
| `referral-mapper` | Referral Mapper page | Referral strategy generation |
| `rewrite-bullets` | Builder/Rewrites/JD flows | Bullet rewriting and improvement |
| `salary-benchmark` | Salary Benchmark page | Compensation benchmarking |
| `salary-negotiation` | Salary Negotiation page | Negotiation strategy generation |
| `scrape-jobs` | Jobs For You scraper tab | Structured job extraction from URLs/search |
| `skill-gap-heatmap` | Skill Gap page | Skill deficits and mapping |
| `smart-recommendations` | Smart Recommendations page | Personalized recommendations |
| `star-builder` | STAR Builder page | STAR answer generation |
| `thank-you-note` | Thank You page | Thank-you note generation |

---

## 23. Function Invocation Map from Frontend

| Frontend location | Function(s) invoked |
|---|---|
| `src/pages/Upload.tsx` | `analyze-resume`, `parse-resume` |
| `src/pages/ResumeBuilder.tsx` | `apply-analysis-fixes`, `rewrite-bullets` |
| `src/components/builder/ResumeForm.tsx` | `rewrite-bullets` |
| `src/components/builder/GenerateFromTextDialog.tsx` | `generate-from-text` |
| `src/pages/Reports.tsx` | `analyze-resume` |
| `src/components/analysis/ContentContent.tsx` | `analyze-resume` |
| `src/pages/JobsForYou.tsx` | `find-jobs`, `scrape-jobs` |
| `src/pages/JobAlerts.tsx` | `process-job-alerts` |
| `src/pages/JobMatch.tsx` | `job-match` |
| `src/pages/JDTailor.tsx` | `jd-gap-analysis` |
| `src/pages/Rewrites.tsx` | `rewrite-bullets` |
| `src/pages/InterviewPrep.tsx` | `interview-prep`, `evaluate-answer` |
| `src/pages/MockInterview.tsx` | `mock-interview` |
| `src/pages/CoverLetter.tsx` | `generate-cover-letter` |
| `src/pages/FollowUpEmail.tsx` | `generate-follow-up-email` |
| `src/pages/ThankYouNote.tsx` | `thank-you-note` |
| `src/pages/ColdEmailTester.tsx` | `cold-email-ab` |
| `src/pages/ElevatorPitch.tsx` | `elevator-pitch` |
| `src/pages/ReferralMapper.tsx` | `referral-mapper` |
| `src/pages/ReferenceLetterDrafter.tsx` | `reference-letter` |
| `src/pages/BioGenerator.tsx` | `bio-generator` |
| `src/pages/CaseStudyBuilder.tsx` | `case-study-builder` |
| `src/pages/SalaryBenchmark.tsx` | `salary-benchmark` |
| `src/pages/OfferComparison.tsx` | `compare-offers` |
| `src/pages/SalaryNegotiation.tsx` | `salary-negotiation` |
| `src/pages/CareerIntelligence.tsx` | `career-intelligence` |
| `src/pages/CareerPathVisualizer.tsx` | `career-path-visualizer` |
| `src/pages/SkillGapHeatmap.tsx` | `skill-gap-heatmap` |
| `src/pages/LearningRoadmap.tsx` | `learning-roadmap` |
| `src/pages/LinkedInOptimizer.tsx` | `parse-linkedin-pdf`, `linkedin-optimizer` |
| `src/pages/PersonalBranding.tsx` | `personal-branding` |
| `src/pages/CompanyResearch.tsx` | `company-research` |
| `src/pages/MarketDigest.tsx` | `market-digest` |
| `src/pages/SmartRecommendations.tsx` | `smart-recommendations` |
| `src/pages/HRHub.tsx` | `generate-outreach` |
| `src/pages/ExportCenter.tsx` | `generate-latex`, `generate-docx` |
| `src/hooks/usePortfolios.ts` | `check-slug` |

---

## 24. Database Schema (Current State)

## 24.1 Tables

| Table | Purpose | Commonly Accessed In |
|---|---|---|
| `saved_resumes` | Canonical resume records, template, sharing fields | Upload, Builder, My Resumes, ActiveResumeContext, Analytics |
| `resume_analyses` | Structured analysis payload and score datasets | Upload, Analysis context, Reports, Analytics |
| `profiles` | User profile metadata | Settings |
| `saved_jobs` | Saved/discovered jobs with status and notes | Jobs For You |
| `job_alerts` | User alert definitions | Job Alerts, My Resumes (detach on delete) |
| `job_alert_results` | Alert-run discovered jobs | Job Alerts |
| `portfolios` | Portfolio content, publish and SEO metadata | Portfolio hooks/pages |
| `recruiter_favorites` | Saved recruiter contacts | HR Hub |
| `notifications` | In-app notifications | Notifications page, notifications lib |
| `activity_logs` | User activity timeline | Activity Logs page, notifications lib |
| `mock_interview_sessions` | Stored mock interview sessions | Mock Interview, Interview History |

## 24.2 Important Resume Sharing Fields

On `saved_resumes`:
- `share_token`
- `custom_slug`
- `is_public`

Enables:
- public share rendering in `/shared/:token`
- slug/token copy workflow in My Resumes

## 24.3 Observed Query Surface (frontend)

Most frequent frontend table accesses by occurrence:
1. `saved_resumes`
2. `resume_analyses`
3. `portfolios`
4. `notifications`
5. `saved_jobs`
6. `job_alerts`
7. `recruiter_favorites`
8. `job_alert_results`
9. `mock_interview_sessions`
10. `profiles`
11. `activity_logs`

---

## 25. Security & Policy Posture

## 25.1 Route Security

- Protected routes require authenticated user via `ProtectedRoute`.

## 25.2 Database Security

Migrations show RLS with user-ownership policies across user tables.
Public-read exceptions are defined for explicit sharing/public publish cases.

Key policy patterns:
- `auth.uid() = user_id` (or profile id equivalence)
- public select policies for shared resume/portfolio conditions

## 25.3 Service Role Usage

Some edge functions use service-role credentials for background operations or privileged writes.

---

## 26. Environment Variables & External Dependencies

## 26.1 Frontend env vars

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- optional UI-page usage path: `VITE_GEMINI_API_KEY` (used in My Resumes alias generation flow)

## 26.2 Edge function env vars (observed)

- `GEMINI_API_KEY`
- `FIRECRAWL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

---

## 27. PWA and Install Behavior

Config highlights:
- app name and manifest metadata configured in `vite.config.ts`
- display mode: standalone
- start URL: `/dashboard`
- install UX surfaced on `/install`
- install steps shown per platform (iOS/Android/Desktop)

---

## 28. System Behaviors by Reliability Category

## 28.1 Real-time Behaviors

- Notifications page subscribes to realtime inserts on `notifications` and prepends new entries.

## 28.2 Eventually Consistent Behaviors

- Upload page triggers background parse/save after navigation to reports.
- Resume list sync propagated with `resumes-changed` event and refresh calls.

## 28.3 Local-only Behaviors

- Application tracker persistence is localStorage-based and user-keyed.

## 28.4 Recovery/Fallback Behaviors

- Upload fallback resume object when parse quality is poor.
- Active analysis fallback lookup by filename when `resume_id` link absent.
- Reports page deep rescan repair action when data appears missing.

---

## 29. Checkpoint Systems Summary

Checkpoint systems currently present in product:

1. Upload validation checkpoints
2. Analysis progress stage checkpoints
3. Analysis phase-level internal checkpoints (16 rotating phases)
4. Resume save/link checkpoints in background parse flow
5. Job alert run checkpoints (`runningAlert` state + results refresh)
6. Mock interview lifecycle checkpoints:
   - start
   - each response evaluation
   - final-analysis
   - persistence to history
7. PWA install checkpoints:
   - prompt captured
   - choice accepted/dismissed
   - app installed event

---

## 30. Known Implementation Notes

1. `portfolios` main landing route is explicitly a “coming soon” screen while supporting portfolio flows are already implemented in adjacent routes.
2. Session storage key naming has both snake-case and camel-case variants in different flows (`parsed_resume_data` vs `parsedResume_data/text`).
3. My Resumes page contains a direct client-side Gemini call for alias generation in addition to backend `generate-alias` function availability.

---

## 31. Maintenance Protocol (When Updating This File)

When system behavior changes, update this file by auditing in order:

1. `src/App.tsx` routes, redirects, eager/lazy strategy
2. `src/components/layout/*` shell, nav, command palette, onboarding
3. `src/context/*` contracts and state persistence behavior
4. `src/pages/*` route-specific features and checkpoints
5. `src/hooks/*` sync/storage behavior
6. `src/lib/*` reporting and telemetry helpers
7. `supabase/functions/*` function additions/removals and model/env changes
8. `supabase/migrations/*` schema and RLS changes


---

## 32. Route-by-Route Technical Matrix (Exhaustive)

Legend:
- Auth: `Public` or `Protected`
- Shell: whether route is rendered inside `AppShell`
- Data IO: primary DB tables touched by UI code
- Functions: primary edge functions invoked by UI for that route

## 32.1 Public Routes (8)

| Route | Auth | Shell | Primary Component | Description | Data IO | Functions | Special Runtime Behavior |
|---|---|---|---|---|---|---|---|
| `/` | Public | No | router redirect | Root entrypoint redirect | None | None | Immediate `Navigate` to `/dashboard` |
| `/login` | Public | No | `Login` | Email/password and OAuth entrypoint | Supabase auth | None | Redirects protected flows after sign-in |
| `/signup` | Public | No | `Signup` | New user registration | Supabase auth, `profiles` trigger backend | None | Sends `full_name` in auth metadata |
| `/auth/callback` | Public | No | `AuthCallback` | OAuth callback processing page | Supabase auth session | None | Retries session check up to max attempts then redirects |
| `/forgot-password` | Public | No | `ForgotPassword` | Password reset request UI | Supabase auth | None | Sends reset email flow |
| `/reset-password` | Public | No | `ResetPassword` | Password reset completion | Supabase auth | None | Accepts callback-based reset context |
| `/shared/:token` | Public | No | `SharedResume` | Public resume read-only view | `saved_resumes` | None | Supports token/slug-based public retrieval |
| `*` | Public | No | `NotFound` | Catch-all fallback route | None | None | Rendered when path does not resolve |

## 32.2 Protected Routes (64)

| Route | Primary Purpose | Data IO | Functions | Checkpoints / Runtime Notes |
|---|---|---|---|---|
| `/onboarding` | Guided onboarding | LocalStorage (`sgnk_tour_completed`) | None | Tour replay events supported |
| `/upload` | Resume upload and analysis entrypoint | `saved_resumes`, `resume_analyses` | `analyze-resume`, `parse-resume` | Validation -> analyze -> navigate -> background parse/save/link |
| `/dashboard` | Home and analysis summary gateway | `AnalysisContext` in-memory | None | Empty-state action hub when no analysis |
| `/my-resumes` | Resume library + operations | `saved_resumes`, `resume_analyses`, `job_alerts` | (page-local client Gemini call), none via supabase.functions | Duplicate/share/delete/primary/alias operations |
| `/templates` | Resume template gallery | None | None | Template browsing and route-to-builder handoff |
| `/export` | Export center | `saved_resumes` | `generate-latex`, `generate-docx` | Export format generation and download flow |
| `/analysis` | Unified deep analysis dashboard | `AnalysisContext` | None | Tabbed analysis with query param state |
| `/job-match` | Match resume to role/JD | Resume source tables | `job-match` | Uses resume context and target inputs |
| `/jd-tailor` | JD tailoring analysis | Resume source tables | `jd-gap-analysis` | Outputs gaps and tailoring guidance |
| `/rewrites` | Rewrite assistant | Resume source | `rewrite-bullets` | Bulk rewrite interactions |
| `/settings` | User settings/profile | `profiles` | None | Profile metadata update |
| `/analytics` | Analytics dashboard | `saved_resumes`, `resume_analyses` | None | Aggregated score and trend views |
| `/builder` | Full resume builder | `saved_resumes` | `apply-analysis-fixes`, `rewrite-bullets` | autosave, undo/redo, mode switching, template switching |
| `/cover-letter` | Cover letter generation | Resume source | `generate-cover-letter` | Role/JD-tailored output |
| `/interview-prep` | Interview question prep and answer evaluation | Resume source | `interview-prep`, `evaluate-answer` | Q generation + scoring loop |
| `/career-intelligence` | Career strategy intelligence | Resume source | `career-intelligence` | strategic insight output |
| `/learning-roadmap` | Learning roadmap generation | Resume source | `learning-roadmap` | role/skill-gap based learning plan |
| `/personal-branding` | Brand positioning | Resume source | `personal-branding` | identity and positioning guidance |
| `/salary-negotiation` | Negotiation script and strategy | Resume source | `salary-negotiation` | scenario-based negotiation guidance |
| `/compare` | Resume version comparison | `saved_resumes` | None | side-by-side version UX |
| `/compare-analytics` | Compare score analytics | `saved_resumes`, `resume_analyses` | None | left/right selection model |
| `/portfolios` | Portfolio landing | None | None | currently “Coming Soon” placeholder |
| `/portfolio-builder` | Portfolio builder route | `portfolios` | None | creation/editing path hooks |
| `/portfolio-templates` | Portfolio template chooser | `portfolios` | None | creates portfolio and routes to editor |
| `/portfolio-editor` | Portfolio editor | `portfolios` | None | save/update portfolio content |
| `/publish` | Publish and SEO controls | `portfolios` | `check-slug` (via hook path) | slug validation + publish/unpublish |
| `/jobs-for-you` | AI job discovery and saved-jobs workflow | `saved_jobs`, `saved_resumes`, `resume_analyses` | `find-jobs`, `scrape-jobs` | discover/saved/scraper tabs, link-status handling |
| `/job-getting-roadmap` | Job strategy roadmap | None | None | static/dynamic strategic content |
| `/hr-hub` | Recruiter database and outreach | `recruiter_favorites`, `saved_resumes` | `generate-outreach` | favorite toggle + outreach generation |
| `/profile-hub` | Profile-centric resume editing view | `saved_resumes` | None | profile-oriented resume updates |
| `/smart-recommendations` | Personalized recommendations | Resume source | `smart-recommendations` | recommendations synthesis |
| `/job-alerts` | Alert config + alert results | `job_alerts`, `job_alert_results`, `saved_resumes` | `process-job-alerts` | CRUD alerts + run-now + read-state workflows |
| `/application-tracker` | Kanban tracking board | LocalStorage (`app_tracker_<userId>`) | None | local-only persistence, no DB sync |
| `/follow-up-email` | Follow-up email drafting | Resume source | `generate-follow-up-email` | context-aware follow-up output |
| `/company-research` | Company intelligence | None/Resume source optional | `company-research` | company-specific deep profile output |
| `/referral-mapper` | Referral strategy | Resume source | `referral-mapper` | mapping of network paths |
| `/mock-interview` | Full interview simulation | `mock_interview_sessions` | `mock-interview` | voice mode, silence auto-submit, final analysis, save history |
| `/star-builder` | STAR response builder | Resume source | `star-builder` | structured STAR response generation |
| `/salary-benchmark` | Compensation benchmark | None/Resume source optional | `salary-benchmark` | role/location/experience benchmark output |
| `/offer-comparison` | Offer comparison and scoring | None | `compare-offers` | multi-offer structured comparison |
| `/career-path` | Career path visualization | Resume source | `career-path-visualizer` | path graph narrative |
| `/skill-gap` | Skill gap heatmap | Resume source | `skill-gap-heatmap` | missing skill and coverage output |
| `/market-digest` | Market trend digest | None | `market-digest` | role/industry trend synthesis |
| `/linkedin-optimizer` | LinkedIn optimization | Resume source | `parse-linkedin-pdf`, `linkedin-optimizer` | PDF parse path + text path |
| `/elevator-pitch` | Elevator pitch generation | Resume source | `elevator-pitch` | audience-tuned pitch output |
| `/thank-you-note` | Thank-you note drafting | None | `thank-you-note` | interviewer/topic-driven generation |
| `/cold-email` | Cold email A/B drafting | Resume source | `cold-email-ab` | variants for outreach testing |
| `/reference-letter` | Reference letter drafting | Resume source | `reference-letter` | recommender-role context generation |
| `/case-study` | Case study drafting | Resume source | `case-study-builder` | bullet-to-case-study conversion |
| `/bio-generator` | Professional bio generation | Resume source | `bio-generator` | context + channel specific bio outputs |
| `/help` | Help and user guidance | None | None | static/helpful reference content |
| `/features` | Features explorer | None | None | marketing/product feature listing |
| `/install` | PWA install flow | Browser install events | None | beforeinstallprompt/appinstalled lifecycle |
| `/notifications` | Notifications center | `notifications` | None | realtime inserts, mark read, clear workflows |
| `/activity` | Activity timeline | `activity_logs` | None | timeline grouping, filters, pagination |

## 32.3 Redirect Compatibility Routes (9)

| Route | Redirect Target | Why It Exists |
|---|---|---|
| `/ats` | `/analysis?tab=ats` | Backward compatibility |
| `/parsing` | `/analysis?tab=parsing` | Backward compatibility |
| `/recruiter` | `/analysis?tab=recruiter` | Backward compatibility |
| `/content` | `/analysis?tab=content` | Backward compatibility |
| `/humanizer` | `/analysis?tab=ai` | Backward compatibility |
| `/structure` | `/analysis?tab=structure` | Backward compatibility |
| `/reports` | `/analysis?tab=report` | Backward compatibility |
| `/recommendations` | `/analysis?tab=recommendations` | Backward compatibility |
| `/improvement-roadmap` | `/analysis?tab=roadmap` | Backward compatibility |

---

## 33. Database Schema Deep Reference (Columns, Indexes, RLS Intent)

## 33.1 `resume_analyses`

Core columns:
- `id` (uuid pk)
- `file_name`, `file_size`, `resume_text`
- `scores` (jsonb)
- `ats_analysis`, `parsing_analysis`, `recruiter_analysis`, `content_analysis`, `humanizer_analysis`, `structure_analysis` (jsonb)
- `red_flags`, `priorities`, `strengths` (jsonb arrays)
- `created_at`
- later-added linking: `user_id`, `resume_id`

Policy posture:
- migrated from permissive to user-scoped RLS policies

## 33.2 `saved_resumes`

Core columns:
- `id`, timestamps
- `title`, `resume_data`, `template`
- `version`, `parent_id`
- `tags`, `is_primary`, `source`, `notes`
- later additions: `user_id`, `share_token`, `is_public`, `custom_slug`, `alias`

Indexes/constraints:
- unique `share_token` (via column constraint)
- `custom_slug` unique + indexed

Policy posture:
- user-scoped CRUD by `user_id`
- public read policy for shared resumes (`is_public` + token/slug conditions)

## 33.3 `profiles`

Core columns:
- `id` (references `auth.users`)
- `full_name`, `avatar_url`, timestamps

Behavior:
- trigger `handle_new_user` auto-creates profile on auth user creation

Policy posture:
- user can read/update/insert own profile only

## 33.4 `portfolios`

Core columns:
- `id`, `user_id`, `title`, `slug`
- `portfolio_data`, `template`
- `is_published`, `is_public`
- SEO fields: `seo_title`, `seo_description`, `seo_keywords`, `og_image_url`
- `custom_domain`, timestamps, `published_at`

Indexes:
- partial unique index on `slug` when not null

Policy posture:
- owner CRUD
- public read for published/public slugged portfolios

## 33.5 `recruiter_favorites`

Core columns:
- `id`, `user_id`, `recruiter_name`, `recruiter_data`, `notes`, `created_at`

Indexes:
- unique `(user_id, recruiter_name)`

Policy posture:
- user-scoped CRUD

## 33.6 `saved_jobs`

Core columns (comprehensive job card storage):
- identity/user keys: `id`, `user_id`, `job_id` (unique per user)
- job metadata: title/company/location/work mode/employment/seniority/salary
- content arrays: requirements/matching/missing skills/benefits/tech stack
- extra intelligence: industry/size/logo letter/fit rationale/application tips
- workflow metadata: `notes`, `status`, `applied_at`, timestamps

Constraints:
- unique `(user_id, job_id)`

Policy posture:
- user-scoped CRUD

## 33.7 `job_alerts`

Core columns:
- `id`, `user_id`, `name`, `is_active`
- targeting: `keywords`, `location`, `seniority[]`, `work_mode[]`, salary min/max
- segmentation: `industries[]`, `sources[]`
- resume link: `resume_based`, `resume_id`
- scheduling: `frequency`, `last_run_at`, timestamps

Policy posture:
- user-scoped CRUD

## 33.8 `job_alert_results`

Core columns:
- `id`, `alert_id`, `user_id`
- `job_data` jsonb payload
- `is_read`, `is_saved`, `created_at`

Policy posture:
- user-scoped CRUD

## 33.9 `notifications`

Core columns:
- `id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`

Indexes:
- `(user_id, created_at desc)`
- partial unread index `(user_id, is_read) where is_read=false`

Realtime:
- table added to `supabase_realtime` publication

Policy posture:
- user-scoped CRUD

## 33.10 `activity_logs`

Core columns:
- `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`

Indexes:
- `(user_id, created_at desc)`
- `(user_id, entity_type)`

Policy posture:
- user read own, insert own

## 33.11 `mock_interview_sessions`

Core columns:
- identity/user keys: `id`, `user_id`, `resume_id`
- context: `role`, `company`, `interview_type`, `job_description`
- payload: `transcript` jsonb, `analysis` jsonb, `scores[]`, `overall_score`, `verdict`, `voice_metrics`
- session metadata: `duration_seconds`, `question_count`, timestamps

Indexes:
- `user_id`, `resume_id`, `created_at desc`

Policy posture:
- user-scoped select/insert/delete

---

## 34. Edge Function Runtime & Configuration Reference

## 34.1 Shared Runtime Characteristics

- Runtime: Deno edge functions
- CORS headers implemented across functions
- Frontend invokes via `supabase.functions.invoke(...)`
- Most AI functions call Gemini-compatible chat/completion endpoints

## 34.2 Environment Variable Usage (Observed Across Functions)

- `GEMINI_API_KEY`: primary LLM credential
- `FIRECRAWL_API_KEY`: job search/scrape pipelines
- `SUPABASE_URL`: service-side client initialization
- `SUPABASE_SERVICE_ROLE_KEY`: privileged writes/background jobs
- `SUPABASE_ANON_KEY`: fallback client path in some functions

## 34.3 Model Variants Observed in Function Code

- `gemini-2.5-flash` (dominant)
- `gemini-3-flash-preview` (selected flows)
- `gemini-1.5-flash` / `gemini-1.5-flash-latest` / `gemini-1.5-pro` (fallback/legacy in deep analysis paths)

## 34.4 External Integrations

- Firecrawl API in discovery/scraping flows
- Native browser speech APIs in client-side interview voice mode

---

## 35. End-to-End Behavioral Checklists by User Intent

## 35.1 “I uploaded a resume” checklist

1. File validated (type + size)
2. File converted to base64
3. `analyze-resume` invoked
4. Analysis stored in `AnalysisContext`
5. User routed to reports/analysis surfaces
6. Background `parse-resume` invoked
7. Parsed/normalized resume inserted in `saved_resumes`
8. Analysis linked to `resume_id` in `resume_analyses`
9. Active resume context refreshed and synchronized

## 35.2 “I changed active resume” checklist

1. Active id persisted (`sessionStorage`)
2. `ActiveResumeContext` resolves resume record
3. Attempts analysis fetch by `resume_id`
4. Fallback fetch by filename if needed
5. Back-links analysis to resume when fallback succeeds

## 35.3 “I ran job alerts” checklist

1. Alert configuration read from `job_alerts`
2. `process-job-alerts` invoked manually or scheduled path
3. Results inserted into `job_alert_results`
4. UI refreshes counts and unread state
5. Read markers persisted per result

## 35.4 “I completed mock interview” checklist

1. Session started with role/company/type/JD context
2. Question-answer loops scored by function
3. Final analysis and dimension breakdown generated
4. Session payload persisted to `mock_interview_sessions`
5. History retrievable in interview history views

## 35.5 “I published portfolio” checklist

1. Slug checked for uniqueness (`check-slug`)
2. Portfolio row updated with publish metadata
3. Public read path available when publish/public constraints satisfied


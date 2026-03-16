import { createContext, useContext, useState, ReactNode } from "react";

export interface ExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  current_title?: string;
  current_company?: string;
  total_experience_years?: string;
  education_summary?: string;
  skills_count?: number;
  certifications?: string[];
}

export interface AnalysisScores {
  ats: { score: number; summary: string };
  parsing: { score: number; summary: string };
  recruiter_readability: { score: number; summary: string };
  content_quality: { score: number; summary: string };
  human_authenticity: { score: number; summary: string };
  impact_strength: { score: number; summary: string };
  structure: { score: number; summary: string };
  clarity: { score: number; summary: string };
  strategic_positioning: { score: number; summary: string };
}

export interface ATSCheck {
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
  category?: string;
}

export interface KeywordDensity {
  total_keywords: number;
  unique_keywords: number;
  top_repeated: { keyword: string; count: number }[];
  industry_coverage: string;
}

export interface ATSSimulation {
  parse_success: number;
  issues: string[];
}

export interface ATSAnalysis {
  pass_likelihood: string;
  estimated_rank_percentile?: number;
  checks: ATSCheck[];
  matched_keywords: string[];
  missing_keywords: string[];
  keyword_density?: KeywordDensity;
  ats_simulation?: {
    greenhouse?: ATSSimulation;
    lever?: ATSSimulation;
    workday?: ATSSimulation;
    taleo?: ATSSimulation;
  };
  recommendations: { priority: string; text: string; impact?: string }[];
  formatting_issues?: string[];
}

export interface ParsingField {
  field: string;
  extracted: string;
  status: "clean" | "partial" | "ambiguous" | "failed";
  note?: string;
  confidence?: number;
}

export interface SectionDetection {
  section: string;
  detected: boolean;
  header_text: string;
  standard_header: string;
}

export interface ParsingAnalysis {
  overall_extractability?: string;
  fields: ParsingField[];
  date_consistency?: { format_used: string; consistent: boolean; issues: string[] };
  section_detection?: SectionDetection[];
}

export interface RecruiterAnalysis {
  first_impression: string;
  six_second_scan?: {
    eye_path: string[];
    immediate_verdict: string;
    clarity_of_role: string;
    seniority_read: string;
    f_pattern_score?: number;
    cognitive_load?: string;
  };
  perceived_role: string;
  perceived_level: string;
  perceived_strength: string;
  perceived_industry?: string;
  noticed: string[];
  missed: string[];
  emotional_response?: string;
  comparison_to_ideal?: string;
  issues: { issue: string; severity: "warning" | "risk"; fix?: string }[];
  hiring_manager_notes?: string[];
}

export interface BulletAnalysis {
  text: string;
  strength: "strong" | "weak";
  issue: string;
  fix: string;
  section?: string;
  has_metric?: boolean;
  verb?: string;
}

export interface ContentAnalysis {
  strong_bullets: number;
  weak_bullets: number;
  total_bullets: number;
  metrics_used: number;
  action_verbs_used?: string[];
  repeated_verbs?: string[];
  star_compliance?: { complete: number; partial: number; missing: number };
  xyz_compliance?: { complete: number; partial: number; missing: number };
  bullets: BulletAnalysis[];
  issues: string[];
  quantification_depth?: {
    score: number;
    bullets_with_numbers: number;
    bullets_with_percentages: number;
    bullets_with_dollar_amounts: number;
    bullets_with_time_frames: number;
    recommendations: string[];
  };
  redundancy_report?: string[];
  power_language_score?: number;
}

export interface HumanizerDetection {
  original: string;
  severity: "critical" | "risk" | "warning";
  issue: string;
  humanized: string;
  category?: string;
}

export interface HumanizerAnalysis {
  verdict: string;
  ai_probability?: number;
  flags: string[];
  tone_analysis?: {
    overall_tone: string;
    consistency: string;
    personality_score: number;
    voice_uniqueness: string;
  };
  vocabulary_analysis?: {
    diversity_score: number;
    overused_buzzwords: string[];
    cliche_phrases: string[];
    jargon_level: string;
  };
  detections: HumanizerDetection[];
}

export interface StructureSection {
  name: string;
  status: "excellent" | "strong" | "warning" | "critical";
  notes: string;
  score: number;
  word_count?: number;
  position?: number;
  recommended_position?: number;
}

export interface StructureAnalysis {
  sections: StructureSection[];
  seniority_signal: string;
  layout_assessment?: {
    page_count: number;
    ideal_page_count: number;
    white_space: string;
    visual_hierarchy: string;
    section_balance: string;
  };
  mece_assessment?: {
    mutually_exclusive: boolean;
    collectively_exhaustive: boolean;
    overlapping_sections: string[];
    missing_coverage: string[];
  };
  missing_sections?: string[];
  unnecessary_sections?: string[];
  section_order_issues?: string[];
}

export interface SkillEvidence {
  skill: string;
  evidenced: boolean;
  where: string;
}

export interface SkillsAnalysis {
  technical_skills: string[];
  soft_skills: string[];
  tools_platforms: string[];
  missing_for_role: string[];
  skill_evidence: SkillEvidence[];
  skills_vs_experience_alignment: string;
  onet_mapping?: {
    matched_occupation: string;
    occupation_code: string;
    match_percentage: number;
    missing_core_competencies: string[];
  };
}

export interface CompetencyScore {
  score: number;
  evidence: string[];
  gaps: string[];
}

export interface CompetencyMapping {
  leadership: CompetencyScore;
  technical_depth: CompetencyScore;
  communication: CompetencyScore;
  problem_solving: CompetencyScore;
  collaboration: CompetencyScore;
  innovation: CompetencyScore;
  business_impact: CompetencyScore;
  interview_extractable_competencies: string[];
  unsubstantiated_claims: string[];
}

export interface ExecutivePresence {
  applicable: boolean;
  strategic_thinking_signals: number;
  p_and_l_ownership: boolean;
  board_readiness_signals: number;
  cross_functional_leadership: number;
  transformation_narratives: string[];
  executive_language_score: number;
  gravitas_assessment: string;
}

export interface IndustryBenchmarking {
  target_role: string;
  target_level: string;
  percentile_estimate: number;
  strengths_vs_peers: string[];
  weaknesses_vs_peers: string[];
  market_positioning: string;
  salary_signal: string;
}

export interface GenderCodedPhrase {
  phrase: string;
  coding: string;
  suggestion: string;
}

export interface BiasScan {
  age_indicators: string[];
  gender_coded_language: GenderCodedPhrase[];
  cultural_bias_flags: string[];
  overall_risk: string;
  recommendations: string[];
}

export interface CareerGap {
  period: string;
  duration: string;
  concern_level: string;
}

export interface CareerTransition {
  from: string;
  to: string;
  type: string;
  narrative_strength: string;
}

export interface CareerNarrative {
  progression: string;
  trajectory_strength: number;
  gaps: CareerGap[];
  job_tenure_pattern: string;
  average_tenure_months: number;
  transitions: CareerTransition[];
  story_coherence: string;
  career_highlights: string[];
}

// Interview Vulnerability Types
export interface CrossQuestionZone {
  section: string;
  claim: string;
  risk_level: string;
  why_risky: string;
  likely_questions: string[];
  preparation_advice: string;
  ideal_answer_framework: string;
}

export interface VagueClaim {
  text: string;
  problem: string;
  interviewer_reaction: string;
  better_version: string;
  follow_up_questions: string[];
}

export interface InflatedClaim {
  text: string;
  suspicion: string;
  verification_questions: string[];
  how_to_substantiate: string;
}

export interface TechnicalDepthProbe {
  skill_or_technology: string;
  depth_signal: string;
  evidence_on_resume: string;
  likely_technical_questions: string[];
  preparation_topics: string[];
}

export interface GapExplanation {
  gap: string;
  duration: string;
  expected_question: string;
  recommended_narrative: string;
}

export interface BehavioralQuestionPrediction {
  competency: string;
  question: string;
  resume_evidence: string;
  story_elements_available: string;
  preparation_tip: string;
}

export interface WeakSectionForInterview {
  section: string;
  vulnerability: string;
  improvement: string;
}

export interface InterviewVulnerability {
  overall_risk_score: number;
  cross_question_zones: CrossQuestionZone[];
  vague_claims: VagueClaim[];
  inflated_claims: InflatedClaim[];
  technical_depth_probes: TechnicalDepthProbe[];
  gap_explanations_needed: GapExplanation[];
  behavioral_question_predictions: BehavioralQuestionPrediction[];
  weakest_sections_for_interview: WeakSectionForInterview[];
}

// Consistency Audit Types
export interface Contradiction {
  claim_a: string;
  location_a: string;
  claim_b: string;
  location_b: string;
  conflict: string;
  resolution: string;
}

export interface TimelineIssue {
  issue: string;
  details: string;
  fix: string;
}

export interface SkillClaimMismatch {
  claimed_skill: string;
  experience_evidence: string;
  mismatch_type: string;
  recommendation: string;
}

export interface TitleProgressionIssue {
  issue: string;
  details: string;
  interviewer_concern: string;
}

export interface ToneShift {
  section_a: string;
  section_b: string;
  description: string;
  concern: string;
}

export interface ConsistencyAudit {
  overall_consistency_score: number;
  contradictions: Contradiction[];
  timeline_issues: TimelineIssue[];
  skill_claim_mismatches: SkillClaimMismatch[];
  title_progression_issues: TitleProgressionIssue[];
  tone_shifts: ToneShift[];
}

// Improvement Roadmap Types
export interface ImmediateFix {
  action: string;
  current: string;
  improved: string;
  impact: string;
  time_estimate: string;
}

export interface ShortTermImprovement {
  action: string;
  rationale: string;
  impact: string;
  time_estimate: string;
}

export interface LongTermDevelopment {
  area: string;
  recommendation: string;
  timeline: string;
}

export interface SectionRewrite {
  section: string;
  current_grade: string;
  issues: string[];
  rewrite_suggestions: string[];
}

export interface ImprovementRoadmap {
  immediate_fixes: ImmediateFix[];
  short_term_improvements: ShortTermImprovement[];
  long_term_development: LongTermDevelopment[];
  section_by_section_rewrites: SectionRewrite[];
}

export interface OverallVerdict {
  grade: string;
  one_liner: string;
  ready_to_apply: boolean;
  biggest_risk: string;
  biggest_asset: string;
  estimated_response_rate: string;
  top_3_actions?: string[];
}

export interface ResumeAnalysis {
  _id?: string;
  resume_id?: string;
  resume_text?: string;
  full_raw_text?: string;
  extracted_info?: ExtractedInfo;
  scores: AnalysisScores;
  ats_analysis: ATSAnalysis;
  parsing_analysis: ParsingAnalysis;
  recruiter_analysis: RecruiterAnalysis;
  content_analysis: ContentAnalysis;
  humanizer_analysis: HumanizerAnalysis;
  structure_analysis: StructureAnalysis;
  skills_analysis?: SkillsAnalysis;
  career_narrative?: CareerNarrative;
  competency_mapping?: CompetencyMapping;
  executive_presence?: ExecutivePresence;
  industry_benchmarking?: IndustryBenchmarking;
  bias_scan?: BiasScan;
  interview_vulnerability?: InterviewVulnerability;
  consistency_audit?: ConsistencyAudit;
  improvement_roadmap?: ImprovementRoadmap;
  overall_verdict?: OverallVerdict;
  red_flags: string[];
  priorities: { label: string; severity: string; estimated_impact?: string; effort?: string; framework?: string }[];
  strengths: string[];
}

interface AnalysisContextType {
  analysis: ResumeAnalysis | null;
  fileName: string;
  isLoading: boolean;
  error: string | null;
  setAnalysis: (analysis: ResumeAnalysis, fileName: string) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysisState] = useState<ResumeAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const setAnalysis = (a: ResumeAnalysis, fn: string) => {
    setAnalysisState(a);
    setFileName(fn);
  };

  const clearAnalysis = () => {
    setAnalysisState(null);
    setFileName("");
  };

  return (
    <AnalysisContext.Provider value={{ analysis, fileName, isLoading, error, setAnalysis, clearAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

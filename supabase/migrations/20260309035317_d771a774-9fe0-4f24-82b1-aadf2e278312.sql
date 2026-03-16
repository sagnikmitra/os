
CREATE TABLE public.saved_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  work_mode TEXT NOT NULL DEFAULT 'Remote',
  employment_type TEXT DEFAULT 'Full-time',
  seniority TEXT NOT NULL,
  salary_range TEXT NOT NULL,
  posted_date TEXT,
  application_deadline TEXT,
  short_description TEXT NOT NULL,
  key_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  matching_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  match_score INTEGER NOT NULL DEFAULT 0,
  career_page_url TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  team_size TEXT,
  reports_to TEXT,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  company_industry TEXT NOT NULL,
  company_size TEXT,
  company_logo_letter TEXT,
  why_good_fit TEXT,
  application_tips TEXT,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'saved',
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved jobs" ON public.saved_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved jobs" ON public.saved_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved jobs" ON public.saved_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved jobs" ON public.saved_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

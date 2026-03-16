
-- Job alerts configuration table
CREATE TABLE public.job_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Alert',
  is_active BOOLEAN NOT NULL DEFAULT true,
  keywords TEXT NOT NULL,
  location TEXT,
  seniority TEXT[],
  work_mode TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  industries TEXT[],
  sources TEXT[] DEFAULT '{"search","boards","startups","career_pages"}'::TEXT[],
  resume_based BOOLEAN NOT NULL DEFAULT false,
  resume_id UUID REFERENCES public.saved_resumes(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own alerts" ON public.job_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.job_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.job_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.job_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Job alert results / notifications table
CREATE TABLE public.job_alert_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.job_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  job_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_alert_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own results" ON public.job_alert_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON public.job_alert_results FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own results" ON public.job_alert_results FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.job_alert_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

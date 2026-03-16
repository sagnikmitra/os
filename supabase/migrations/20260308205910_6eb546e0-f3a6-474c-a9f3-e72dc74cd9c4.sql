CREATE TABLE public.resume_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  resume_text TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  ats_analysis JSONB DEFAULT '{}',
  parsing_analysis JSONB DEFAULT '{}',
  recruiter_analysis JSONB DEFAULT '{}',
  content_analysis JSONB DEFAULT '{}',
  humanizer_analysis JSONB DEFAULT '{}',
  structure_analysis JSONB DEFAULT '{}',
  red_flags JSONB DEFAULT '[]',
  priorities JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analyses"
  ON public.resume_analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read analyses"
  ON public.resume_analyses FOR SELECT
  USING (true);
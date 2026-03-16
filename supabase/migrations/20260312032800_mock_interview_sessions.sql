-- Create mock_interview_sessions table for interview history
CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.saved_resumes(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  company TEXT,
  interview_type TEXT NOT NULL,
  job_description TEXT,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis JSONB,
  scores INTEGER[] DEFAULT '{}',
  overall_score INTEGER,
  verdict TEXT,
  voice_metrics JSONB,
  duration_seconds INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own sessions
CREATE POLICY "Users can view own interview sessions"
  ON public.mock_interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions"
  ON public.mock_interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview sessions"
  ON public.mock_interview_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups by user and resume
CREATE INDEX IF NOT EXISTS idx_mock_interview_sessions_user_id ON public.mock_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interview_sessions_resume_id ON public.mock_interview_sessions(resume_id);
CREATE INDEX IF NOT EXISTS idx_mock_interview_sessions_created_at ON public.mock_interview_sessions(created_at DESC);

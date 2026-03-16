ALTER TABLE public.saved_resumes ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_saved_resumes_custom_slug ON public.saved_resumes(custom_slug);
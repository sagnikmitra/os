
CREATE TABLE public.saved_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  resume_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  template TEXT NOT NULL DEFAULT 'modern',
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES public.saved_resumes(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  source TEXT DEFAULT 'builder',
  notes TEXT DEFAULT ''
);

ALTER TABLE public.saved_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert resumes" ON public.saved_resumes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read resumes" ON public.saved_resumes FOR SELECT USING (true);
CREATE POLICY "Anyone can update resumes" ON public.saved_resumes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete resumes" ON public.saved_resumes FOR DELETE USING (true);

CREATE TABLE public.recruiter_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recruiter_name text NOT NULL,
  recruiter_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiter_favorites ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_recruiter_favorites_user_name ON public.recruiter_favorites(user_id, recruiter_name);

CREATE POLICY "Users can read own favorites" ON public.recruiter_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.recruiter_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.recruiter_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own favorites" ON public.recruiter_favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
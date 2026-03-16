
-- Add user_id to saved_resumes
ALTER TABLE public.saved_resumes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add share_token for public sharing
ALTER TABLE public.saved_resumes ADD COLUMN share_token TEXT UNIQUE DEFAULT NULL;
ALTER TABLE public.saved_resumes ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Add user_id to resume_analyses
ALTER TABLE public.resume_analyses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies on saved_resumes
DROP POLICY IF EXISTS "Anyone can insert resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Anyone can read resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Anyone can update resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Anyone can delete resumes" ON public.saved_resumes;

-- New RLS policies for saved_resumes (user-scoped)
CREATE POLICY "Users can insert own resumes" ON public.saved_resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own resumes" ON public.saved_resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.saved_resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.saved_resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Public can read shared resumes
CREATE POLICY "Anyone can read public shared resumes" ON public.saved_resumes FOR SELECT USING (is_public = true AND share_token IS NOT NULL);

-- Drop old policies on resume_analyses
DROP POLICY IF EXISTS "Anyone can insert analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Anyone can read analyses" ON public.resume_analyses;

-- New RLS policies for resume_analyses (user-scoped)
CREATE POLICY "Users can insert own analyses" ON public.resume_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own analyses" ON public.resume_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.resume_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.resume_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

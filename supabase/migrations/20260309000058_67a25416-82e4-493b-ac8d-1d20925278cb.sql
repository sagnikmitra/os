
-- Portfolios table for hosting and publishing
CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'My Portfolio',
  slug text UNIQUE,
  portfolio_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  template text NOT NULL DEFAULT 'minimal-editorial',
  is_published boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image_url text,
  custom_domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

-- Index for slug lookups
CREATE UNIQUE INDEX portfolios_slug_idx ON public.portfolios (slug) WHERE slug IS NOT NULL;

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "Users can read own portfolios" ON public.portfolios
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON public.portfolios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Public access for published portfolios by slug
CREATE POLICY "Anyone can read published portfolios by slug" ON public.portfolios
  FOR SELECT USING (is_published = true AND is_public = true AND slug IS NOT NULL);

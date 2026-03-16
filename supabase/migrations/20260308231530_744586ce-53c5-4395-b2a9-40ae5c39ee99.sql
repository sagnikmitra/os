CREATE POLICY "Anyone can read public shared resumes by slug"
ON public.saved_resumes
FOR SELECT
TO anon, authenticated
USING ((is_public = true) AND (custom_slug IS NOT NULL));
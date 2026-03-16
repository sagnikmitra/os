
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for saved_resumes
DROP POLICY IF EXISTS "Users can read own resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Anyone can read public shared resumes" ON public.saved_resumes;
DROP POLICY IF EXISTS "Anyone can read public shared resumes by slug" ON public.saved_resumes;

CREATE POLICY "Users can read own resumes" ON public.saved_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON public.saved_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.saved_resumes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.saved_resumes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read public shared resumes" ON public.saved_resumes FOR SELECT USING (is_public = true AND share_token IS NOT NULL);
CREATE POLICY "Anyone can read public shared resumes by slug" ON public.saved_resumes FOR SELECT USING (is_public = true AND custom_slug IS NOT NULL);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for resume_analyses
DROP POLICY IF EXISTS "Users can read own analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.resume_analyses;

CREATE POLICY "Users can read own analyses" ON public.resume_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.resume_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.resume_analyses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.resume_analyses FOR DELETE USING (auth.uid() = user_id);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for saved_jobs
DROP POLICY IF EXISTS "Users can read own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can insert own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can update own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can delete own saved jobs" ON public.saved_jobs;

CREATE POLICY "Users can read own saved jobs" ON public.saved_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved jobs" ON public.saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved jobs" ON public.saved_jobs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved jobs" ON public.saved_jobs FOR DELETE USING (auth.uid() = user_id);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for job_alerts
DROP POLICY IF EXISTS "Users can read own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.job_alerts;

CREATE POLICY "Users can read own alerts" ON public.job_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.job_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.job_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.job_alerts FOR DELETE USING (auth.uid() = user_id);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for job_alert_results
DROP POLICY IF EXISTS "Users can read own results" ON public.job_alert_results;
DROP POLICY IF EXISTS "Users can insert own results" ON public.job_alert_results;
DROP POLICY IF EXISTS "Users can update own results" ON public.job_alert_results;
DROP POLICY IF EXISTS "Users can delete own results" ON public.job_alert_results;

CREATE POLICY "Users can read own results" ON public.job_alert_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.job_alert_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON public.job_alert_results FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own results" ON public.job_alert_results FOR DELETE USING (auth.uid() = user_id);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for portfolios
DROP POLICY IF EXISTS "Users can read own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can insert own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Anyone can read published portfolios by slug" ON public.portfolios;

CREATE POLICY "Users can read own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read published portfolios by slug" ON public.portfolios FOR SELECT USING (is_published = true AND is_public = true AND slug IS NOT NULL);

-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for recruiter_favorites
DROP POLICY IF EXISTS "Users can read own favorites" ON public.recruiter_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.recruiter_favorites;
DROP POLICY IF EXISTS "Users can update own favorites" ON public.recruiter_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.recruiter_favorites;

CREATE POLICY "Users can read own favorites" ON public.recruiter_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.recruiter_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own favorites" ON public.recruiter_favorites FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.recruiter_favorites FOR DELETE USING (auth.uid() = user_id);

-- Capture employer activity and administration data in dedicated tables

-- Ensure the user_role enum exists for access logs and app users
DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- Table storing application users managed by the administrator dashboard
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated can manage app users"
ON public.app_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Reuse the generic updated_at trigger for this table
CREATE TRIGGER IF NOT EXISTS update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table storing login attempts recorded by the platform
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  role public.user_role NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated can insert access logs"
ON public.access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can read access logs"
ON public.access_logs
FOR SELECT
TO authenticated
USING (true);

-- Candidate profile views performed by employers
CREATE TABLE IF NOT EXISTS public.candidate_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_username TEXT NOT NULL,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated can insert candidate view logs"
ON public.candidate_view_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can read candidate view logs"
ON public.candidate_view_logs
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS candidate_view_logs_candidate_idx
  ON public.candidate_view_logs(candidate_id, viewed_at DESC);

-- Candidate meeting requests triggered by employers
CREATE TABLE IF NOT EXISTS public.schedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_username TEXT NOT NULL,
  employer_email TEXT NOT NULL,
  employer_name TEXT,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  availability TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated can insert schedule requests"
ON public.schedule_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can read schedule requests"
ON public.schedule_requests
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS schedule_requests_candidate_idx
  ON public.schedule_requests(candidate_id, requested_at DESC);

-- Search logs keeping track of employer queries and resulting candidates
CREATE TABLE IF NOT EXISTS public.employer_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_username TEXT NOT NULL,
  query TEXT NOT NULL,
  candidate_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated can insert search logs"
ON public.employer_search_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can update search logs"
ON public.employer_search_logs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can read search logs"
ON public.employer_search_logs
FOR SELECT
TO authenticated
USING (true);

CREATE TRIGGER IF NOT EXISTS update_employer_search_logs_updated_at
BEFORE UPDATE ON public.employer_search_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS employer_search_logs_employer_idx
  ON public.employer_search_logs(employer_username, searched_at DESC);

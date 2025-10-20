-- Align database objects with the hardened schema used by the admin dashboard
set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = off;
set client_min_messages = warning;
set row_security = on;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Ensure required enums exist
DO $$
BEGIN
  CREATE TYPE public.care_setting AS ENUM (
    'domicilio_geriatrico',
    'hospitalario',
    'urgencias'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

ALTER TYPE public.care_setting ADD VALUE IF NOT EXISTS 'domicilio';

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'role') = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.hash_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND NEW.password IS DISTINCT FROM OLD.password) THEN
    NEW.password = extensions.crypt(NEW.password, extensions.gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

-- Replace legacy data structures with the new normalized schema
DROP TABLE IF EXISTS public.candidate_view_logs CASCADE;
DROP TABLE IF EXISTS public.schedule_requests CASCADE;
DROP TABLE IF EXISTS public.employer_search_logs CASCADE;
DROP TABLE IF EXISTS public.access_logs CASCADE;
DROP TABLE IF EXISTS public.candidate_data CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;

CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  experience TEXT NOT NULL,
  languages TEXT NOT NULL,
  cover_letter_summary TEXT NOT NULL,
  cover_letter_full TEXT NOT NULL,
  education TEXT NOT NULL,
  experience_detail JSONB NOT NULL,
  profile_en JSONB NOT NULL,
  profile_no JSONB NOT NULL,
  birth_date DATE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  primary_care_setting public.care_setting NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidates_primary_care_setting_matches_detail CHECK (
    experience_detail ? 'care_setting'
    AND (experience_detail->>'care_setting')::public.care_setting = primary_care_setting
  ),
  CONSTRAINT candidates_experience_detail_is_object CHECK (
    jsonb_typeof(experience_detail) = 'object'
    AND experience_detail ? 'title'
    AND experience_detail ? 'duration'
  ),
  CONSTRAINT candidates_experience_detail_titles_are_objects CHECK (
    NOT (experience_detail ? 'titles')
    OR jsonb_typeof(experience_detail->'titles') = 'object'
  ),
  CONSTRAINT candidates_experience_detail_durations_are_objects CHECK (
    NOT (experience_detail ? 'durations')
    OR jsonb_typeof(experience_detail->'durations') = 'object'
  ),
  CONSTRAINT candidates_profile_en_is_object CHECK (
    jsonb_typeof(profile_en) = 'object'
    AND profile_en ? 'profession'
    AND profile_en ? 'experience'
    AND profile_en ? 'languages'
    AND profile_en ? 'cover_letter_summary'
    AND profile_en ? 'cover_letter_full'
    AND profile_en ? 'education'
  ),
  CONSTRAINT candidates_profile_no_is_object CHECK (
    jsonb_typeof(profile_no) = 'object'
    AND profile_no ? 'profession'
    AND profile_no ? 'experience'
    AND profile_no ? 'languages'
    AND profile_no ? 'cover_letter_summary'
    AND profile_no ? 'cover_letter_full'
    AND profile_no ? 'education'
  )
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_select_authenticated"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "candidates_insert_admin_only"
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "candidates_update_admin_only"
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "candidates_delete_admin_only"
  ON public.candidates
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX candidates_primary_care_setting_idx
  ON public.candidates(primary_care_setting);
CREATE INDEX candidates_created_at_idx
  ON public.candidates(created_at DESC);
CREATE INDEX idx_candidates_experience_detail_gin
  ON public.candidates USING GIN (experience_detail);
CREATE INDEX idx_candidates_profile_en_gin
  ON public.candidates USING GIN (profile_en);
CREATE INDEX idx_candidates_profile_no_gin
  ON public.candidates USING GIN (profile_no);

ALTER TABLE public.candidates
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(full_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(profession, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(languages, '')), 'C')
  ) STORED;

CREATE INDEX idx_candidates_search_vector
  ON public.candidates USING GIN (search_vector);

-- Logs
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  username TEXT NOT NULL,
  role public.user_role NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_logs_insert_any_auth"
  ON public.access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "access_logs_select_admin"
  ON public.access_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE INDEX idx_access_logs_user_time
  ON public.access_logs (username, logged_at DESC);

CREATE TABLE public.candidate_view_logs (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  employer_id UUID NOT NULL,
  employer_username TEXT NOT NULL,
  candidate_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cvl_insert_any_auth"
  ON public.candidate_view_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cvl_select_admin_or_owner"
  ON public.candidate_view_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
  );

CREATE INDEX candidate_view_logs_candidate_idx
  ON public.candidate_view_logs(candidate_id, viewed_at DESC);
CREATE INDEX idx_candidate_view_logs_emp_time
  ON public.candidate_view_logs (employer_username, viewed_at DESC);
CREATE INDEX idx_candidate_view_logs_employer_id
  ON public.candidate_view_logs (employer_id, viewed_at DESC);

DROP TRIGGER IF EXISTS set_candidate_view_employer_id ON public.candidate_view_logs;
CREATE TRIGGER set_candidate_view_employer_id
BEFORE INSERT ON public.candidate_view_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_employer_id_from_username();

CREATE TABLE public.schedule_requests (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  employer_id UUID NOT NULL,
  employer_username TEXT NOT NULL,
  employer_email TEXT NOT NULL,
  employer_name TEXT,
  candidate_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  availability TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_insert_any_auth"
  ON public.schedule_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "sr_select_admin_or_owner"
  ON public.schedule_requests
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
    OR employer_email = (auth.jwt() ->> 'email')
  );

CREATE INDEX schedule_requests_candidate_idx
  ON public.schedule_requests(candidate_id, requested_at DESC);
CREATE INDEX idx_schedule_requests_emp_time
  ON public.schedule_requests (employer_username, requested_at DESC);
CREATE INDEX idx_schedule_requests_employer_id
  ON public.schedule_requests (employer_id, requested_at DESC);

DROP TRIGGER IF EXISTS set_schedule_request_employer_id ON public.schedule_requests;
CREATE TRIGGER set_schedule_request_employer_id
BEFORE INSERT ON public.schedule_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_employer_id_from_username();

CREATE TABLE public.employer_search_logs (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  employer_id UUID NOT NULL,
  employer_username TEXT NOT NULL,
  query TEXT NOT NULL,
  candidate_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esl_insert_owner"
  ON public.employer_search_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (employer_username = (auth.jwt() ->> 'email'));

CREATE POLICY "esl_update_owner"
  ON public.employer_search_logs
  FOR UPDATE
  TO authenticated
  USING (employer_username = (auth.jwt() ->> 'email'))
  WITH CHECK (employer_username = (auth.jwt() ->> 'email'));

CREATE POLICY "esl_select_admin_or_owner"
  ON public.employer_search_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
  );

CREATE TRIGGER update_employer_search_logs_updated_at
BEFORE UPDATE ON public.employer_search_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX employer_search_logs_employer_idx
  ON public.employer_search_logs(employer_username, searched_at DESC);
CREATE INDEX idx_employer_search_logs_time
  ON public.employer_search_logs (searched_at DESC);
CREATE INDEX idx_employer_search_logs_employer_id
  ON public.employer_search_logs (employer_id, searched_at DESC);

DROP TRIGGER IF EXISTS set_search_log_employer_id ON public.employer_search_logs;
CREATE TRIGGER set_search_log_employer_id
BEFORE INSERT ON public.employer_search_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_employer_id_from_username();

-- Hardened helpers for app_users management
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_users_admin_all" ON public.app_users;
CREATE POLICY "app_users_admin_all"
  ON public.app_users
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS app_users_hash_password ON public.app_users;
CREATE TRIGGER app_users_hash_password
BEFORE INSERT OR UPDATE OF password ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.hash_password();

CREATE OR REPLACE FUNCTION public.set_employer_id_from_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  matched_user_id UUID;
BEGIN
  IF NEW.employer_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id
    INTO matched_user_id
    FROM public.app_users
    WHERE username = NEW.employer_username
    LIMIT 1;

  IF matched_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el empleador con username %', NEW.employer_username;
  END IF;

  NEW.employer_id = matched_user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_app_user(
  p_username text,
  p_password text,
  p_full_name text default null,
  p_email text default null
)
RETURNS public.app_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_user public.app_users;
BEGIN
  INSERT INTO public.app_users AS au (
    id,
    username,
    password,
    full_name,
    email,
    is_active
  )
  VALUES (
    extensions.gen_random_uuid(),
    trim(lower(p_username)),
    trim(p_password),
    nullif(trim(coalesce(p_full_name, '')),''),
    nullif(trim(lower(coalesce(p_email, ''))),''),
    true
  )
  ON CONFLICT (username) DO UPDATE
    SET
      full_name = excluded.full_name,
      email = excluded.email,
      is_active = true,
      updated_at = now()
  RETURNING au.* INTO new_user;

  RETURN new_user;
END;
$$;

COMMENT ON FUNCTION public.admin_create_app_user(text, text, text, text)
  IS 'Crea o reactiva usuarios desde el panel admin sin exponer la service key en el cliente.';

REVOKE ALL ON FUNCTION public.admin_create_app_user(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_app_user(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.authenticate_app_user(
  p_identifier text,
  p_password text
)
RETURNS public.app_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  normalized_identifier text := trim(lower(coalesce(p_identifier, '')));
  matched_user public.app_users;
BEGIN
  IF normalized_identifier = '' THEN
    RETURN NULL;
  END IF;

  SELECT au.*
    INTO matched_user
  FROM public.app_users AS au
  WHERE au.is_active
    AND (
      lower(au.username) = normalized_identifier
      OR (au.email IS NOT NULL AND lower(au.email) = normalized_identifier)
    )
  LIMIT 1;

  IF matched_user IS NULL THEN
    RETURN NULL;
  END IF;

  IF matched_user.password = extensions.crypt(trim(coalesce(p_password, '')), matched_user.password) THEN
    RETURN matched_user;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.authenticate_app_user(text, text)
  IS 'Autentica usuarios de app_users utilizando crypt() para validar contraseñas hasheadas.';

REVOKE ALL ON FUNCTION public.authenticate_app_user(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.authenticate_app_user(text, text) TO authenticated;

GRANT SELECT ON public.candidates TO authenticated;
REVOKE SELECT ON public.candidates FROM PUBLIC, anon;

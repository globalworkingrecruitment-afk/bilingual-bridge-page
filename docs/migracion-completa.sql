-- Migración completa para desplegar el modelo de datos en Supabase/PostgreSQL
-- Ejecuta este script en una base de datos vacía para obtener la estructura final
-- utilizada por la aplicación Bilingual Bridge.

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tipos enumerados reutilizados por varias tablas
DO $$
BEGIN
  CREATE TYPE public.care_setting AS ENUM (
    'domicilio_geriatrico',
    'hospitalario',
    'urgencias'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- Función genérica para mantener updated_at sincronizado
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabla principal de candidatos con metadatos bilingües
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  experience TEXT NOT NULL,
  languages TEXT NOT NULL,
  cover_letter_summary TEXT NOT NULL,
  cover_letter_full TEXT NOT NULL,
  education TEXT NOT NULL,
  birth_date DATE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  primary_care_setting public.care_setting NOT NULL,
  experience_detail JSONB NOT NULL,
  profile_en JSONB NOT NULL,
  profile_no JSONB NOT NULL,
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

CREATE POLICY IF NOT EXISTS "Public can read candidates"
ON public.candidates
FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated can manage candidates"
ON public.candidates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE OR REPLACE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS candidates_primary_care_setting_idx
  ON public.candidates(primary_care_setting);

CREATE INDEX IF NOT EXISTS candidates_created_at_idx
  ON public.candidates(created_at DESC);

-- Usuarios administrados desde el panel de control
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated can manage app users"
ON public.app_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER IF NOT EXISTS update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Registro de accesos a la plataforma
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  role public.user_role NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Vistas de candidatos realizadas por empleadores
CREATE TABLE IF NOT EXISTS public.candidate_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_username TEXT NOT NULL,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Solicitudes de reunión generadas por empleadores
CREATE TABLE IF NOT EXISTS public.schedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_username TEXT NOT NULL,
  employer_email TEXT NOT NULL,
  employer_name TEXT,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  availability TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Historial de búsquedas realizadas por empleadores
CREATE TABLE IF NOT EXISTS public.employer_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_username TEXT NOT NULL,
  query TEXT NOT NULL,
  candidate_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

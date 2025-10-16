-- Migración completa para desplegar el modelo de datos en Supabase/PostgreSQL
-- Ejecuta este script en una base de datos vacía para obtener la estructura final
-- utilizada por la aplicación Bilingual Bridge.

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- Helper to identify administrator accounts inside RLS policies (optional)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb := auth.jwt();
  has_admin_role boolean := false;
BEGIN
  IF claims IS NULL THEN
    RETURN FALSE;
  END IF;

  IF claims ? 'role' AND claims->>'role' = 'admin' THEN
    RETURN TRUE;
  END IF;

  IF claims ? 'user_role' AND claims->>'user_role' = 'admin' THEN
    RETURN TRUE;
  END IF;

  IF claims ? 'app_metadata' THEN
    IF claims->'app_metadata' ? 'role' AND claims->'app_metadata'->>'role' = 'admin' THEN
      RETURN TRUE;
    END IF;

    IF claims->'app_metadata' ? 'user_role' AND claims->'app_metadata'->>'user_role' = 'admin' THEN
      RETURN TRUE;
    END IF;

    IF claims->'app_metadata' ? 'roles' AND jsonb_typeof(claims->'app_metadata'->'roles') = 'array' THEN
      SELECT TRUE
        INTO has_admin_role
      FROM jsonb_array_elements_text(claims->'app_metadata'->'roles') AS role(value)
      WHERE value = 'admin'
      LIMIT 1;

      IF has_admin_role THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;

  IF claims ? 'user_metadata' THEN
    IF claims->'user_metadata' ? 'role' AND claims->'user_metadata'->>'role' = 'admin' THEN
      RETURN TRUE;
    END IF;

    IF claims->'user_metadata' ? 'roles' AND jsonb_typeof(claims->'user_metadata'->'roles') = 'array' THEN
      SELECT TRUE
        INTO has_admin_role
      FROM jsonb_array_elements_text(claims->'user_metadata'->'roles') AS role(value)
      WHERE value = 'admin'
      LIMIT 1;

      IF has_admin_role THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Función genérica para mantener updated_at sincronizado
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Información bilingüe y metadatos de candidatos
DROP TABLE IF EXISTS public.candidate_data CASCADE;

CREATE TABLE public.candidate_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  experiencia_medica_en TEXT,
  experiencia_medica_no TEXT,
  experiencia_no_medica_en TEXT,
  experiencia_no_medica_no TEXT,
  formacion_en TEXT,
  formacion_no TEXT,
  profesion_en TEXT,
  profesion_no TEXT,
  idiomas_en TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  idiomas_no TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  carta_resumen_en TEXT,
  carta_en TEXT,
  carta_resumen_no TEXT,
  carta_no TEXT,
  estado TEXT NOT NULL DEFAULT 'activo',
  anio_nacimiento SMALLINT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidate_data_correo_email_chk CHECK (position('@' in correo) > 1),
  CONSTRAINT candidate_data_birth_year_chk CHECK (
    anio_nacimiento BETWEEN 1900 AND EXTRACT(YEAR FROM now())::INT
  )
);

CREATE TRIGGER trg_candidate_data_updated_at
BEFORE UPDATE ON public.candidate_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_candidate_data_nombre
  ON public.candidate_data (nombre);
CREATE INDEX idx_candidate_data_estado
  ON public.candidate_data (estado);
CREATE INDEX idx_candidate_data_anio
  ON public.candidate_data (anio_nacimiento);

ALTER TABLE public.candidate_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_data_select_auth ON public.candidate_data;
DROP POLICY IF EXISTS candidate_data_insert_auth ON public.candidate_data;
DROP POLICY IF EXISTS candidate_data_update_auth ON public.candidate_data;
DROP POLICY IF EXISTS candidate_data_delete_auth ON public.candidate_data;

CREATE POLICY candidate_data_select_auth
ON public.candidate_data
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY candidate_data_insert_auth
ON public.candidate_data
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY candidate_data_update_auth
ON public.candidate_data
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY candidate_data_delete_auth
ON public.candidate_data
FOR DELETE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_data TO authenticated;
REVOKE ALL ON public.candidate_data FROM PUBLIC, anon;

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
  candidate_id UUID NOT NULL REFERENCES public.candidate_data(id) ON DELETE CASCADE,
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
  candidate_id UUID NOT NULL REFERENCES public.candidate_data(id) ON DELETE CASCADE,
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

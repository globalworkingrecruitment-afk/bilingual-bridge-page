-- Comprehensive base schema for the bilingual bridge admin platform
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'care_setting'
      AND e.enumlabel = 'domicilio'
  ) THEN
    ALTER TYPE public.care_setting ADD VALUE 'domicilio';
  END IF;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

-- Generic helpers ----------------------------------------------------------
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

-- Core identities ----------------------------------------------------------
CREATE TABLE public.app_users (
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

-- Candidates ---------------------------------------------------------------
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  nombre TEXT NOT NULL,
  experiencia_medica_en TEXT,
  experiencia_medica_no TEXT,
  experiencia_no_medica_en TEXT,
  experiencia_no_medica_no TEXT,
  formacion_en TEXT,
  formacion_no TEXT,
  profesion_en TEXT,
  profesion_no TEXT,
  idiomas_en TEXT,
  idiomas_no TEXT,
  carta_resumen_en TEXT,
  carta_en TEXT,
  carta_resumen_no TEXT,
  carta_no TEXT,
  estado TEXT,
  anio_nacimiento SMALLINT,
  correo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(nombre, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(profesion_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(profesion_no, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(idiomas_en, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(idiomas_no, '')), 'C')
  ) STORED
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "candidates_select_authenticated" ON public.candidates;
CREATE POLICY "candidates_select_authenticated"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "candidates_insert_admin_only" ON public.candidates;
CREATE POLICY "candidates_insert_admin_only"
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "candidates_update_admin_only" ON public.candidates;
CREATE POLICY "candidates_update_admin_only"
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "candidates_delete_admin_only" ON public.candidates;
CREATE POLICY "candidates_delete_admin_only"
  ON public.candidates
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS candidates_created_at_idx
  ON public.candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_search_vector
  ON public.candidates USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_candidates_estado
  ON public.candidates (estado);
CREATE INDEX IF NOT EXISTS idx_candidates_anio_nacimiento
  ON public.candidates (anio_nacimiento);

GRANT SELECT ON public.candidates TO authenticated;
REVOKE SELECT ON public.candidates FROM PUBLIC, anon;

-- Access and activity logging ----------------------------------------------
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  username TEXT NOT NULL,
  role public.user_role NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_logs_insert_any_auth" ON public.access_logs;
CREATE POLICY "access_logs_insert_any_auth"
  ON public.access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "access_logs_select_admin" ON public.access_logs;
CREATE POLICY "access_logs_select_admin"
  ON public.access_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_access_logs_user_time
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

DROP POLICY IF EXISTS "cvl_insert_any_auth" ON public.candidate_view_logs;
CREATE POLICY "cvl_insert_any_auth"
  ON public.candidate_view_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "cvl_select_admin_or_owner" ON public.candidate_view_logs;
CREATE POLICY "cvl_select_admin_or_owner"
  ON public.candidate_view_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
  );

CREATE INDEX IF NOT EXISTS candidate_view_logs_candidate_idx
  ON public.candidate_view_logs(candidate_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_view_logs_emp_time
  ON public.candidate_view_logs (employer_username, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_view_logs_employer_id
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

DROP POLICY IF EXISTS "sr_insert_any_auth" ON public.schedule_requests;
CREATE POLICY "sr_insert_any_auth"
  ON public.schedule_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "sr_select_admin_or_owner" ON public.schedule_requests;
CREATE POLICY "sr_select_admin_or_owner"
  ON public.schedule_requests
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
    OR employer_email = (auth.jwt() ->> 'email')
  );

CREATE INDEX IF NOT EXISTS schedule_requests_candidate_idx
  ON public.schedule_requests(candidate_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_emp_time
  ON public.schedule_requests (employer_username, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_employer_id
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

DROP POLICY IF EXISTS "esl_insert_owner" ON public.employer_search_logs;
CREATE POLICY "esl_insert_owner"
  ON public.employer_search_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (employer_username = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "esl_update_owner" ON public.employer_search_logs;
CREATE POLICY "esl_update_owner"
  ON public.employer_search_logs
  FOR UPDATE
  TO authenticated
  USING (employer_username = (auth.jwt() ->> 'email'))
  WITH CHECK (employer_username = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "esl_select_admin_or_owner" ON public.employer_search_logs;
CREATE POLICY "esl_select_admin_or_owner"
  ON public.employer_search_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
  );

DROP TRIGGER IF EXISTS update_employer_search_logs_updated_at ON public.employer_search_logs;
CREATE TRIGGER update_employer_search_logs_updated_at
BEFORE UPDATE ON public.employer_search_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS employer_search_logs_employer_idx
  ON public.employer_search_logs(employer_username, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_employer_search_logs_time
  ON public.employer_search_logs (searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_employer_search_logs_employer_id
  ON public.employer_search_logs (employer_id, searched_at DESC);

DROP TRIGGER IF EXISTS set_search_log_employer_id ON public.employer_search_logs;
CREATE TRIGGER set_search_log_employer_id
BEFORE INSERT ON public.employer_search_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_employer_id_from_username();

CREATE TABLE public.employer_interactions (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  employer_id UUID NOT NULL,
  employer_username TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employer_interactions_username_chk CHECK (char_length(trim(employer_username)) > 0),
  CONSTRAINT employer_interactions_type_chk CHECK (char_length(trim(interaction_type)) > 0),
  CONSTRAINT employer_interactions_context_object CHECK (jsonb_typeof(context) = 'object')
);

ALTER TABLE public.employer_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ei_insert_owner ON public.employer_interactions;
CREATE POLICY ei_insert_owner
  ON public.employer_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (employer_username = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS ei_select_admin_or_owner ON public.employer_interactions;
CREATE POLICY ei_select_admin_or_owner
  ON public.employer_interactions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR employer_username = (auth.jwt() ->> 'email')
  );

DROP TRIGGER IF EXISTS set_employer_interaction_employer_id ON public.employer_interactions;
CREATE TRIGGER set_employer_interaction_employer_id
BEFORE INSERT ON public.employer_interactions
FOR EACH ROW
EXECUTE FUNCTION public.set_employer_id_from_username();

CREATE INDEX IF NOT EXISTS employer_interactions_username_time_idx
  ON public.employer_interactions (employer_username, occurred_at DESC);
CREATE INDEX IF NOT EXISTS employer_interactions_type_time_idx
  ON public.employer_interactions (interaction_type, occurred_at DESC);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.employer_interactions TO authenticated;
REVOKE ALL ON public.employer_interactions FROM PUBLIC, anon;

-- Administrative helpers ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_app_user(
  p_username text,
  p_password text,
  p_full_name text DEFAULT null,
  p_email text DEFAULT null
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

CREATE OR REPLACE FUNCTION public.admin_list_app_users()
RETURNS SETOF public.app_users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.app_users
  ORDER BY created_at ASC;
$$;

COMMENT ON FUNCTION public.admin_list_app_users()
  IS 'Devuelve todos los registros de app_users ordenados por fecha de creación para el panel administrador.';

REVOKE ALL ON FUNCTION public.admin_list_app_users() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_app_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_toggle_app_user_status(
  p_user_id uuid
)
RETURNS public.app_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  updated_user public.app_users;
BEGIN
  UPDATE public.app_users AS au
     SET is_active = NOT au.is_active,
         updated_at = now()
   WHERE au.id = p_user_id
   RETURNING au.* INTO updated_user;

  RETURN updated_user;
END;
$$;

COMMENT ON FUNCTION public.admin_toggle_app_user_status(uuid)
  IS 'Alterna el estado is_active de un usuario y devuelve el registro actualizado.';

REVOKE ALL ON FUNCTION public.admin_toggle_app_user_status(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_toggle_app_user_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_access_logs()
RETURNS SETOF public.access_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.access_logs
  ORDER BY logged_at DESC;
$$;

COMMENT ON FUNCTION public.admin_list_access_logs()
  IS 'Devuelve los registros de acceso ordenados desde el más reciente.';

REVOKE ALL ON FUNCTION public.admin_list_access_logs() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_access_logs() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_candidate_view_logs()
RETURNS SETOF public.candidate_view_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.candidate_view_logs
  ORDER BY viewed_at DESC;
$$;

COMMENT ON FUNCTION public.admin_list_candidate_view_logs()
  IS 'Devuelve todas las vistas de candidatos para análisis administrativo.';

REVOKE ALL ON FUNCTION public.admin_list_candidate_view_logs() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_candidate_view_logs() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_schedule_requests()
RETURNS SETOF public.schedule_requests
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.schedule_requests
  ORDER BY requested_at DESC;
$$;

COMMENT ON FUNCTION public.admin_list_schedule_requests()
  IS 'Devuelve todas las solicitudes de reunión ordenadas de la más reciente a la más antigua.';

REVOKE ALL ON FUNCTION public.admin_list_schedule_requests() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_schedule_requests() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_employer_search_logs()
RETURNS SETOF public.employer_search_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.employer_search_logs
  ORDER BY searched_at DESC;
$$;

COMMENT ON FUNCTION public.admin_list_employer_search_logs()
  IS 'Devuelve todas las búsquedas realizadas por empleadores para el panel administrador.';

REVOKE ALL ON FUNCTION public.admin_list_employer_search_logs() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_employer_search_logs() TO authenticated;

CREATE OR REPLACE FUNCTION public.log_employer_search(
  p_employer_username text,
  p_query text,
  p_candidate_names text[] DEFAULT ARRAY[]::text[]
)
RETURNS public.employer_search_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.employer_search_logs;
BEGIN
  INSERT INTO public.employer_search_logs (employer_username, query, candidate_names)
  VALUES (
    trim(p_employer_username),
    trim(p_query),
    COALESCE(p_candidate_names, ARRAY[]::text[])
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.log_employer_search(text, text, text[])
  IS 'Registra búsquedas de empleadores sin requerir la política RLS por usuario.';

REVOKE ALL ON FUNCTION public.log_employer_search(text, text, text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.log_employer_search(text, text, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_employer_interaction(
  p_employer_username text,
  p_interaction_type text,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS public.employer_interactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.employer_interactions;
  v_username text := trim(p_employer_username);
  v_type text := trim(p_interaction_type);
  v_context jsonb := COALESCE(p_context, '{}'::jsonb);
BEGIN
  IF v_username IS NULL OR v_username = '' THEN
    RAISE EXCEPTION 'El nombre de usuario del empleador es obligatorio';
  END IF;

  IF v_type IS NULL OR v_type = '' THEN
    RAISE EXCEPTION 'El tipo de interacción es obligatorio';
  END IF;

  IF jsonb_typeof(v_context) IS DISTINCT FROM 'object' THEN
    v_context := '{}'::jsonb;
  END IF;

  INSERT INTO public.employer_interactions (employer_username, interaction_type, context)
  VALUES (
    v_username,
    v_type,
    v_context
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.log_employer_interaction(text, text, jsonb)
  IS 'Registra interacciones de empleadores con metadatos para análisis posterior en el panel.';

REVOKE ALL ON FUNCTION public.log_employer_interaction(text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_employer_interaction(text, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_employer_interactions()
RETURNS SETOF public.employer_interactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.employer_interactions
  ORDER BY occurred_at DESC;
$$;

COMMENT ON FUNCTION public.admin_list_employer_interactions()
  IS 'Devuelve las interacciones registradas por los empleadores ordenadas desde la más reciente.';

REVOKE ALL ON FUNCTION public.admin_list_employer_interactions() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_employer_interactions() TO authenticated;

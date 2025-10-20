set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = off;
set client_min_messages = warning;
set row_security = on;

CREATE TABLE IF NOT EXISTS public.employer_interactions (
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

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.employer_interactions TO authenticated;
REVOKE ALL ON public.employer_interactions FROM PUBLIC, anon;

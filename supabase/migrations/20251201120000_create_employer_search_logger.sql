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

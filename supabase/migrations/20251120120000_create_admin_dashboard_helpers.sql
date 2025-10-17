-- Administrative helpers to expose app_users and related activity through RPCs
set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = off;
set client_min_messages = warning;
set row_security = on;

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

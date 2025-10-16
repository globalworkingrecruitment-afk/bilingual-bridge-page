-- Allow the admin dashboard to create application users even when RLS blocks direct inserts
set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = off;
set client_min_messages = warning;
set row_security = on;

create or replace function public.admin_create_app_user(
  p_username text,
  p_password text,
  p_full_name text default null,
  p_email text default null
)
returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user public.app_users;
begin
  insert into public.app_users as au (
    username,
    password,
    full_name,
    email
  )
  values (
    trim(p_username),
    trim(p_password),
    nullif(trim(coalesce(p_full_name, '')),''),
    nullif(trim(coalesce(p_email, '')),'')
  )
  returning au.* into new_user;

  return new_user;
end;
$$;

comment on function public.admin_create_app_user(text, text, text, text)
  is 'Creates an app user on behalf of the admin dashboard without exposing the service key in the client.';

revoke all on function public.admin_create_app_user(text, text, text, text) from public;
grant execute on function public.admin_create_app_user(text, text, text, text) to authenticated;

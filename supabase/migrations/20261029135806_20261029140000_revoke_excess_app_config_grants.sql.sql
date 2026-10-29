/*
  # Fix: Revoke excess grants on app_config

  app_config was created with RLS and only a service_role grant in the migration,
  but Postgres may have default grants. Revoke all anon/authenticated access
  so only service_role can reach it. RLS with no policies means even if a grant
  leaked, no rows would be returned — but we remove the grants anyway.
*/

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.app_config FROM anon, authenticated;

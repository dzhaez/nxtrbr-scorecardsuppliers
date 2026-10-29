/*
  # Fix: Revoke PUBLIC execute on count_active_admins

  The previous migration revoked anon but not PUBLIC. Since Postgres grants
  EXECUTE to PUBLIC by default, anon can still call it. Revoke PUBLIC.
*/

REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM PUBLIC;

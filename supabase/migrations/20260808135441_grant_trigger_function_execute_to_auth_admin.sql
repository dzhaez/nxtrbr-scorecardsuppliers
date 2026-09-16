/*
  # Keep the signup trigger executable by the auth service (follow-up)

  The previous migration revoked the blanket PUBLIC EXECUTE grant on
  `handle_new_user()`. The auth service performs the INSERT that fires the
  trigger, so it is granted EXECUTE explicitly.
*/

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

/*
  # Revoke PUBLIC execute on set_admin_flag trigger function

  set_admin_flag is a SECURITY DEFINER trigger function, not an RPC. It should
  not be callable by anon or authenticated. Only the trigger (running as the
  table owner) and service_role need it.
*/

REVOKE EXECUTE ON FUNCTION public.set_admin_flag() FROM PUBLIC, anon, authenticated;

/*
  # Corrective: revoke the default PUBLIC EXECUTE grant (F3, F4, F5)

  Postgres grants EXECUTE to PUBLIC on new functions, so the previous revoke
  from `anon`/`authenticated` left the functions reachable through the inherited
  PUBLIC grant. This removes that grant and re-grants EXECUTE only where the
  application needs it: `get_id_usuario` and `is_admin_user` are called inside
  the RLS policies and must remain available to signed-in users.
*/

REVOKE EXECUTE ON FUNCTION public.get_email_by_id_usuario(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.id_exists_in_usuarios(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.id_exists_in_ordens_compra(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_id_usuario() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_id_usuario() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

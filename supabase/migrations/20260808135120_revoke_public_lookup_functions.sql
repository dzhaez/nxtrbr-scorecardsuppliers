/*
  # Remove unauthenticated lookup and enumeration surfaces (F3, F4, F5)

  `get_email_by_id_usuario` returned a real account e-mail to any caller
  holding the public anon key. `id_exists_in_usuarios` and
  `id_exists_in_ordens_compra` answered true/false for arbitrary employee IDs,
  letting an outsider enumerate staff and spreadsheet IDs.

  All three now live behind the `auth-broker` edge function, which runs with the
  service role and returns a single opaque failure. The client no longer calls
  any of them, so EXECUTE is revoked from both browser-facing roles.

  `get_id_usuario` and `is_admin_user` stay available to `authenticated` (the
  RLS policies depend on them) but lose their pointless `anon` grant.
*/

REVOKE EXECUTE ON FUNCTION public.get_email_by_id_usuario(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.id_exists_in_usuarios(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.id_exists_in_ordens_compra(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_id_usuario() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

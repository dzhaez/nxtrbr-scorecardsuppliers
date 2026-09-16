/*
  # Remove client write access to profile records (F7)

  `insert_usuarios` only checked `id = auth.uid()` while `authenticated` held
  INSERT on every column, including `is_admin`. Profile rows are created by the
  SECURITY DEFINER signup trigger, and the client never writes to this table,
  so all write privileges are withdrawn. The unused UPDATE/DELETE grants on
  `acessos` are withdrawn for the same reason.
*/

DROP POLICY IF EXISTS insert_usuarios ON public.usuarios;

REVOKE INSERT, UPDATE, DELETE ON public.usuarios FROM authenticated, anon;
REVOKE UPDATE, DELETE ON public.acessos FROM authenticated, anon;

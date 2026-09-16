/*
  # Stop granting admin rights by username match (F8)

  `set_admin_flag()` set `is_admin := true` for anyone whose `id_usuario`
  equalled the literal 'dzhaez', a value that was also compiled into the
  browser bundle. Since `id_usuario` originates from caller-supplied signup
  metadata, that made administrator a self-assignable property whenever the
  profile row was absent.

  The trigger and function are removed. Existing admin flags are untouched;
  future admin rights must be granted out of band.
*/

DROP TRIGGER IF EXISTS trg_set_admin ON public.usuarios;
DROP FUNCTION IF EXISTS public.set_admin_flag();

/*
  # Bind access-log entries to the signed-in user (F10)

  `insert_acessos` checked only `user_id = auth.uid()`, leaving the
  `id_usuario` column free for the caller to set to a colleague's employee ID
  and pollute the administrator's access history.
*/

DROP POLICY IF EXISTS insert_acessos ON public.acessos;

CREATE POLICY insert_acessos ON public.acessos
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND lower(id_usuario) = lower(get_id_usuario())
  );

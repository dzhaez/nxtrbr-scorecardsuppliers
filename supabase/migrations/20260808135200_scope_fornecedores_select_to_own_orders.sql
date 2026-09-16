/*
  # Scope the supplier list to the caller's own purchase orders (F6)

  `select_fornecedores` used `USING (true)`, so any signed-in buyer could read
  the whole supplier master list including `cnpj_cpf` tax registration numbers
  and the owning buyer of suppliers outside their remit.

  The application only ever needs a scoped read for regular users (MainScreen
  filters by the supplier codes on the user's own orders) and a full read for
  admins (management panel), both of which this predicate preserves.
*/

DROP POLICY IF EXISTS select_fornecedores ON public.fornecedores;

CREATE POLICY select_fornecedores ON public.fornecedores
  FOR SELECT TO authenticated
  USING (
    is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.ordens_compra o
      WHERE o.codigo_fornecedor = fornecedores.codigo_fornecedor
        AND lower(o.id_usuario) = lower(get_id_usuario())
    )
  );

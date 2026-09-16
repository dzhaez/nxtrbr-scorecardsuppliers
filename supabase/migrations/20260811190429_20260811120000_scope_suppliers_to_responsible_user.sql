/*
# Scope supplier visibility to the responsible user (revised)

1. Purpose
   - The administrator `dzhaez` sees every supplier.
   - Every other authenticated user sees only suppliers that have at least one
     purchase order whose `id_usuario` matches the signed-in user's ID. The
     link between a user and a supplier is `ordens_compra.id_usuario`, not the
     `owner` column on `fornecedores`.

2. Modified tables
   - `fornecedores`: SELECT policy now requires `is_admin_user()` OR an
     `ordens_compra` row matching the supplier code and the caller's
     `get_id_usuario()`.
   - `ordens_compra`: SELECT policy now requires `is_admin_user()` OR
     `lower(id_usuario) = lower(get_id_usuario())`.
   - `avaliacoes`: SELECT policy now requires `is_admin_user()` OR an
     `ordens_compra` row matching the supplier code, cycle, and the caller's
     `get_id_usuario()`.

3. Security
   - Regular users can no longer read supplier records, purchase orders, or
     evaluations outside their responsibility through the browser or direct
     data requests.
   - INSERT and UPDATE permissions remain unchanged.
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

DROP POLICY IF EXISTS select_ordens ON public.ordens_compra;
CREATE POLICY select_ordens ON public.ordens_compra
  FOR SELECT TO authenticated
  USING (
    is_admin_user()
    OR lower(id_usuario) = lower(get_id_usuario())
  );

DROP POLICY IF EXISTS select_avaliacoes ON public.avaliacoes;
CREATE POLICY select_avaliacoes ON public.avaliacoes
  FOR SELECT TO authenticated
  USING (
    is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.ordens_compra o
      WHERE o.codigo_fornecedor = avaliacoes.codigo_fornecedor
        AND o.ciclo = avaliacoes.ciclo
        AND lower(o.id_usuario) = lower(get_id_usuario())
    )
  );
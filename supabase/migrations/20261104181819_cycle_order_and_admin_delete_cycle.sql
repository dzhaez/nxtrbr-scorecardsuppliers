/*
# Sort cycles by date and add admin removal of a single cycle

Plain-English summary
- Cycles named MM/YYYY (for example 01/2026) now list from most recent to oldest. Before, they sorted as plain text, so 12/2025 appeared above 01/2026.
- Adds an admin-only function that removes one cycle's imported base: its imports, purchase orders and evaluations (including comments). Suppliers that no longer belong to any cycle are removed too. Other cycles are not touched.

New or changed functions
1. list_ciclos() - same output as before, new sort order.
2. admin_delete_ciclo(p_ciclo text) - deletes data for one cycle. Only administrators can run it.

Security changes
- admin_delete_ciclo is SECURITY DEFINER with a fixed search_path and checks is_admin_user() first.
- EXECUTE is revoked from PUBLIC and anon, and granted only to authenticated.
- No table policies or grants are changed.

Important notes
1. Removal is permanent. Database deletes are not covered by the project's version history.
2. Legacy cycle values such as 2026-2 remain in the data and sort before MM/YYYY cycles of the same year.
*/

CREATE OR REPLACE FUNCTION public.list_ciclos()
RETURNS TABLE (ciclo text, data_importacao timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.ciclo, max(i.data_importacao)
  FROM public.importacoes i
  WHERE auth.uid() IS NOT NULL
  GROUP BY i.ciclo
  ORDER BY CASE
    WHEN i.ciclo ~ '^\d{2}/\d{4}$' THEN substr(i.ciclo, 4, 4) || substr(i.ciclo, 1, 2)
    ELSE replace(i.ciclo, '-', '')
  END DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_ciclos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_ciclos() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_ciclo(p_ciclo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.avaliacoes WHERE ciclo = p_ciclo;
  DELETE FROM public.ordens_compra WHERE ciclo = p_ciclo;
  DELETE FROM public.importacoes WHERE ciclo = p_ciclo;
  DELETE FROM public.fornecedores f
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ordens_compra o WHERE o.codigo_fornecedor = f.codigo_fornecedor
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_ciclo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_ciclo(text) TO authenticated;

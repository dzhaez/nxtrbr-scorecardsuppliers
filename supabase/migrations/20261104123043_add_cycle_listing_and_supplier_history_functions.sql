/*
# Add cycle listing and supplier cycle history functions

Plain-English summary
- Users who are not admins cannot read the import history table, so they had no way to list the evaluation cycles. This adds a read-only function that returns only the cycle names and their latest import date.
- Adds a second read-only function that returns the average score per supplier per cycle, so the app can show how each supplier evolved across cycles.

New functions
1. list_ciclos() - returns each cycle (ciclo) with its most recent import date. Requires a signed-in user. Does not expose file names.
2. get_supplier_cycle_history() - returns, for each supplier the caller is related to, the average score (media), the number of evaluations, and the cycle. Admins receive every supplier. Regular users receive only suppliers that appear in their own orders. No user identifiers are returned.

Security changes
- Both functions are SECURITY DEFINER with a fixed search_path.
- EXECUTE is revoked from PUBLIC and anon and granted only to authenticated.
- No table policies or grants are changed.

Important notes
1. No existing data is modified or deleted.
2. Cycle values are text. New imports use the format YYYY-MM (for example 2026-01). Older values such as 2026-2 remain untouched.
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
  ORDER BY i.ciclo DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_ciclos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_ciclos() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_supplier_cycle_history()
RETURNS TABLE (codigo_fornecedor text, razao_social text, ciclo text, media numeric, total_avaliacoes integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH visiveis AS (
    SELECT DISTINCT o.codigo_fornecedor
    FROM public.ordens_compra o
    WHERE public.is_admin_user()
       OR lower(o.id_usuario) = lower(public.get_id_usuario())
  )
  SELECT a.codigo_fornecedor,
         f.razao_social,
         a.ciclo,
         round(avg(a.media), 2),
         count(*)::integer
  FROM public.avaliacoes a
  JOIN visiveis v ON v.codigo_fornecedor = a.codigo_fornecedor
  JOIN public.fornecedores f ON f.codigo_fornecedor = a.codigo_fornecedor
  GROUP BY a.codigo_fornecedor, f.razao_social, a.ciclo
  ORDER BY a.codigo_fornecedor, a.ciclo;
$$;

REVOKE EXECUTE ON FUNCTION public.get_supplier_cycle_history() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_supplier_cycle_history() TO authenticated;

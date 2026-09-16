/*
# Add secure administrator data cleanup function

1. New Functions
- `clear_imported_data` removes all imported evaluations, purchase orders, suppliers, and import history in one database operation.

2. Modified Tables
- No table definitions or columns are changed.
- Existing imported-data rows are removed only when an authorized administrator explicitly calls the function.

3. Security
- The function runs with owner privileges so it can perform the complete cleanup without exposing table-wide DELETE permissions to the browser.
- The function verifies the signed-in caller with the existing `is_admin_user()` check before deleting anything.
- Anonymous callers cannot execute the function.
- Authenticated non-administrators cannot execute the cleanup successfully.

4. Important Notes
- This function is intentionally destructive and is used only by the administrator cleanup action.
- Deletion order preserves referential integrity by removing purchase orders before suppliers.
*/

CREATE OR REPLACE FUNCTION public.clear_imported_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.avaliacoes;
  DELETE FROM public.ordens_compra;
  DELETE FROM public.fornecedores;
  DELETE FROM public.importacoes;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_imported_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_imported_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.clear_imported_data() TO authenticated;
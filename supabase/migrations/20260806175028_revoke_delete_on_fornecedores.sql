/*
# F8 — Remove the ability to delete supplier records

The `anon_delete_fornecedores` policy allowed any caller holding the public anon
key to DELETE supplier master data. Because ordens_compra references
fornecedores ON DELETE CASCADE, a single request could remove the supplier list
and every purchase order along with it.

The application never deletes suppliers -- the import uses upsert -- so removing
this changes no behaviour. INSERT is kept for the import, and SELECT is kept for
every read.
*/

DROP POLICY IF EXISTS "anon_delete_fornecedores" ON fornecedores;

REVOKE DELETE ON fornecedores FROM anon;
REVOKE DELETE ON fornecedores FROM authenticated;

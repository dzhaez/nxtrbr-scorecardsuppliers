/*
# F9 — Remove the ability to delete the import history

The `anon_delete_importacoes` policy allowed any caller holding the public anon
key to DELETE the import records. Both the main screen and the admin screen
derive the active evaluation cycle from the newest row of this table, so wiping
it blanks the whole application.

Nothing in the application deletes import records, so removing this changes no
behaviour. INSERT is kept so the import can still register a new cycle.
*/

DROP POLICY IF EXISTS "anon_delete_importacoes" ON importacoes;

REVOKE DELETE ON importacoes FROM anon;
REVOKE DELETE ON importacoes FROM authenticated;

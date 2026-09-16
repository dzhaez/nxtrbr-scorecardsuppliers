/*
# F2 — Remove the ability to erase a submitted evaluation

The `anon_delete_avaliacoes` policy allowed any caller holding the public anon
key to DELETE any row in `avaliacoes` (`USING (true)`), destroying an entire
cycle of evaluation work in one request. It also defeated the one-evaluation-
per-supplier-per-cycle rule: the UNIQUE constraint blocks a second INSERT, but
a DELETE followed by a fresh INSERT bypassed it, so an "already evaluated"
state was never final.

No code path in the application deletes evaluations, so removing this changes
no behaviour. Submitted evaluations are now append-only.
*/

DROP POLICY IF EXISTS "anon_delete_avaliacoes" ON avaliacoes;

REVOKE DELETE ON avaliacoes FROM anon;
REVOKE DELETE ON avaliacoes FROM authenticated;

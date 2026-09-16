/*
# F1 — Remove the ability to rewrite a submitted evaluation

The `anon_update_avaliacoes` policy allowed any caller holding the public
anon key to PATCH any row in `avaliacoes` (`USING (true) WITH CHECK (true)`),
replacing any evaluator's scores for any supplier. The application never
updates this table -- the only write is the INSERT in EvaluationForm -- so the
capability is unused and can be removed with no behaviour change.

Table-level SELECT and INSERT are left untouched so all existing reads and the
evaluation submission continue to work.
*/

DROP POLICY IF EXISTS "anon_update_avaliacoes" ON avaliacoes;

REVOKE UPDATE ON avaliacoes FROM anon;
REVOKE UPDATE ON avaliacoes FROM authenticated;

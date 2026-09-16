/*
# F13 — Require a canonical form for evaluator identifiers

`id_usuario` is free text used to route evaluation work to a person and to group
every management report. With no constraint, identifiers differing only by
surrounding whitespace became separate people: the evaluator saw a partial
supplier list and their evaluations were counted under a separate row in the
management panel.

These constraints reject untrimmed and empty identifiers at write time, so the
spreadsheet import cannot introduce a near-duplicate evaluator. Case-insensitive
matching at sign-in is handled in the application, which now resolves and carries
the spelling actually stored in the database.

Verified before applying: 0 existing rows in either table violate this, and
there are currently no identifiers that differ only by case. No data is modified.
*/

ALTER TABLE ordens_compra
  ADD CONSTRAINT ordens_compra_id_usuario_canonical
  CHECK (id_usuario = btrim(id_usuario) AND length(id_usuario) > 0);

ALTER TABLE avaliacoes
  ADD CONSTRAINT avaliacoes_id_usuario_canonical
  CHECK (id_usuario = btrim(id_usuario) AND length(id_usuario) > 0);

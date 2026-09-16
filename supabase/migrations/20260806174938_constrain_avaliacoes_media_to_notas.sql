/*
# F3 — Force the overall score to match the three answers

`media` was computed in the browser and accepted on trust, so a crafted request
could store nota1..3 = 1 alongside media = 5.0 and have the supplier ranked
"Otimo" across the dashboard, the Top 5 table and every management average.

This constraint re-derives the average in the database. It is identical to what
the client computes: verified across all 125 combinations of nota1..3 that
round((n1+n2+n3)/3.0, 1) equals the client's Math.round(media*10)/10 for every
case, so legitimate submissions are unaffected.

All 4 existing rows already satisfy the rule, so the constraint is added
validated rather than NOT VALID. No data is modified.
*/

ALTER TABLE avaliacoes
  ADD CONSTRAINT avaliacoes_media_matches_notas
  CHECK (media = round((nota1 + nota2 + nota3) / 3.0, 1));

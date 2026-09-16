/*
# Revoke anon on usuarios and acessos

The initial auth migration forgot to REVOKE ALL FROM anon on the two new
tables. RLS blocks anon reads, but the grants should not be there at all.
*/

REVOKE ALL ON usuarios FROM anon;
REVOKE ALL ON acessos  FROM anon;

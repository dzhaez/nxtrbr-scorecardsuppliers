/*
# Restrict supplier visibility to the responsible user

1. Purpose
   - Keep the administrator `dzhaez` able to view every supplier.
   - Limit every other authenticated user to suppliers whose `owner` matches
     the signed-in user's ID.

2. Modified tables
   - `fornecedores`: replace the broad SELECT policy with an administrator
     exception or an exact case-insensitive owner match.

3. Security
   - Regular users can no longer read supplier records assigned to another
     responsible user through the browser or direct data requests.
   - Existing INSERT and UPDATE permissions remain unchanged.
*/

DROP POLICY IF EXISTS select_fornecedores ON public.fornecedores;

CREATE POLICY select_fornecedores ON public.fornecedores
  FOR SELECT TO authenticated
  USING (
    is_admin_user()
    OR lower(owner) = lower(get_id_usuario())
  );
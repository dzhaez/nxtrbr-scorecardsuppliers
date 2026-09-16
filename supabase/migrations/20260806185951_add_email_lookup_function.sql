/*
# Add email lookup function for ID-based login

Allows users to log in with just their ID + password, without typing
their email. The function looks up the email associated with a given
id_usuario so the frontend can call signInWithPassword with it.

Security: SECURITY DEFINER, search_path = public. Only returns the email
for id_usuarios that exist in the usuarios table. Does not expose any
other user data.
*/

CREATE OR REPLACE FUNCTION public.get_email_by_id_usuario(p_id_usuario text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT au.email
  FROM auth.users au
  JOIN public.usuarios u ON u.id = au.id
  WHERE lower(u.id_usuario) = lower(p_id_usuario);
$$;

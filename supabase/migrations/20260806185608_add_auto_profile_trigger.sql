/*
# Auto-create user profile on signup

Fixes a race condition: the onAuthStateChange handler in App.tsx fires
during signUp before the usuarios row is inserted, finds no profile, and
signs the user out — causing the profile insert to fail.

This trigger runs AFTER INSERT on auth.users (same transaction) and creates
the usuarios row automatically using the id_usuario stored in the user's
raw_user_meta_data. The existing trg_set_admin trigger on usuarios still
fires, so is_admin is auto-set for 'dzhaez'.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, id_usuario)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'id_usuario');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

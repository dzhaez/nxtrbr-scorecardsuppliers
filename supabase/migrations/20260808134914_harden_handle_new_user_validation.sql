/*
  # Validate the employee ID at account creation (F1)

  The signup trigger copied `id_usuario` straight out of client-supplied
  `raw_user_meta_data`, so anyone could claim any employee ID by calling the
  signup endpoint directly. The eligibility check existed only in the browser.

  This rewrites the trigger to:
    1. trim and reject empty / missing IDs
    2. require the ID to exist in `ordens_compra` (the imported spreadsheet),
       unless it already belongs to an existing profile, in which case the
       unique index rejects it anyway
  Failing either check raises, which aborts the signup transaction.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id text;
BEGIN
  v_id := btrim(COALESCE(NEW.raw_user_meta_data->>'id_usuario', ''));

  IF v_id = '' THEN
    RAISE EXCEPTION 'invalid_user_id';
  END IF;

  IF length(v_id) > 64 THEN
    RAISE EXCEPTION 'invalid_user_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ordens_compra o
    WHERE lower(o.id_usuario) = lower(v_id)
  ) THEN
    RAISE EXCEPTION 'user_id_not_eligible';
  END IF;

  INSERT INTO public.usuarios (id, id_usuario)
  VALUES (NEW.id, v_id);

  RETURN NEW;
END;
$function$;

/*
  # Restrict the upload history to administrators (F11)

  `select_importacoes` used `USING (true)`, exposing every uploaded spreadsheet
  filename, timestamp and past cycle to any signed-in buyer. Regular users only
  need the current cycle label, which is now served by a narrow definer
  function returning that single value.
*/

DROP POLICY IF EXISTS select_importacoes ON public.importacoes;

CREATE POLICY select_importacoes ON public.importacoes
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE OR REPLACE FUNCTION public.get_ciclo_atual()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ciclo
  FROM public.importacoes
  WHERE auth.uid() IS NOT NULL
  ORDER BY data_importacao DESC
  LIMIT 1;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_ciclo_atual() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_ciclo_atual() TO authenticated;

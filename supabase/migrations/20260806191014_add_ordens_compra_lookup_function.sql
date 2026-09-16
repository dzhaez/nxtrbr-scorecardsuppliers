CREATE OR REPLACE FUNCTION public.id_exists_in_ordens_compra(p_id_usuario text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ordens_compra
    WHERE lower(id_usuario) = lower(p_id_usuario)
  );
$$;

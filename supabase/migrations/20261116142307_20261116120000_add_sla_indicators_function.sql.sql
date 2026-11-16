/*
# SLA indicators by OWNER

1. Plain-English summary
- Adds a read-only SECURITY DEFINER function that computes evaluation SLA
  indicators per OWNER (requisitante), used by the Admin control panel and by
  the reminder e-mail edge function.
- For the given cycle (or the latest cycle when omitted), for each owner in
  ordens_compra it returns:
  - owner: the OWNER name from the spreadsheet.
  - email: the E-mail column from the spreadsheet (nullable).
  - total_suppliers: distinct suppliers under the owner's responsibility.
  - avaliados: how many already have an evaluation in the cycle.
  - pendentes: total_suppliers - avaliados.
  - percentual_concluido: rounded percent complete (0 when no suppliers).
  - fornecedores_aguardando: same as pendentes (kept explicit for e-mail copy).
  - dias_sem_avaliacao: whole days since that owner's most recent evaluation;
    if the owner never evaluated in this cycle, days since the cycle import
    date instead (days waiting for a first evaluation).
  - ultimo_ciclo_import: import date of the cycle (anchor for "days waiting").

2. Security
- SECURITY DEFINER with fixed search_path; readable only by authenticated
  users; admins see every owner, regular users only their own row (matched by
  e-mail or derived id_usuario) so the numbers can be shown to owners too.
- EXECUTE revoked from PUBLIC/anon, granted to authenticated.

3. Notes
- No data is modified. Existing policies untouched.
- The caller's e-mail is taken from the usuarios profile side (auth.users email
  via service-side join is not needed); the usuarios table has no email column,
  so matching uses the auth JWT email claim against the spreadsheet E-mail.
*/

CREATE OR REPLACE FUNCTION public.get_sla_indicators(p_ciclo text DEFAULT NULL)
RETURNS TABLE (
  owner text,
  email text,
  total_suppliers bigint,
  avaliados bigint,
  pendentes bigint,
  percentual_concluido numeric,
  fornecedores_aguardando bigint,
  dias_sem_avaliacao integer,
  ultimo_ciclo_import timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_ciclo text;
  v_caller_email text;
  v_caller_id_usuario text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Resolve cycle: explicit param or the newest cycle by import date
  IF p_ciclo IS NULL THEN
    SELECT i.ciclo INTO v_ciclo
    FROM public.importacoes i
    GROUP BY i.ciclo
    ORDER BY max(i.data_importacao) DESC
    LIMIT 1;
  ELSE
    v_ciclo := p_ciclo;
  END IF;

  IF v_ciclo IS NULL THEN
    RETURN;
  END IF;

  -- The Entra login e-mail arrives as the JWT email claim (coalesce upn).
  v_caller_email := lower(coalesce(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'claims' ->> 'email',
    ''
  ));
  v_caller_id_usuario := coalesce(public.get_id_usuario(), '');

  RETURN QUERY
  WITH ordens_owner AS (
    SELECT DISTINCT
      lower(trim(o.owner)) AS owner_key,
      o.owner AS owner_display,
      lower(trim(o.email)) AS owner_email,
      o.codigo_fornecedor
    FROM public.ordens_compra o
    WHERE o.ciclo = v_ciclo AND o.owner IS NOT NULL AND trim(o.owner) <> ''
  ),
  avaliacoes_ciclo AS (
    SELECT a.codigo_fornecedor, max(a.data_avaliacao) AS ultima_avaliacao
    FROM public.avaliacoes a
    WHERE a.ciclo = v_ciclo
    GROUP BY a.codigo_fornecedor
  ),
  por_owner AS (
    SELECT
      oo.owner_key,
      max(oo.owner_display) AS owner_display,
      max(oo.owner_email) AS owner_email,
      count(DISTINCT oo.codigo_fornecedor) AS total,
      count(DISTINCT ac.codigo_fornecedor) AS avaliados,
      max(ac.ultima_avaliacao) AS ultima_avaliacao,
      max(imp.data_importacao) AS data_importacao
    FROM ordens_owner oo
    LEFT JOIN avaliacoes_ciclo ac ON ac.codigo_fornecedor = oo.codigo_fornecedor
    LEFT JOIN public.importacoes imp ON imp.ciclo = v_ciclo
    GROUP BY oo.owner_key
  )
  SELECT
    po.owner_display,
    po.owner_email,
    po.total,
    po.avaliados,
    po.total - po.avaliados,
    CASE WHEN po.total > 0
      THEN round(100.0 * po.avaliados / po.total, 0)
      ELSE 0 END,
    po.total - po.avaliados,
    CASE
      WHEN po.ultima_avaliacao IS NOT NULL
        THEN extract(day FROM now() - po.ultima_avaliacao)::integer
      WHEN po.data_importacao IS NOT NULL
        THEN extract(day FROM now() - po.data_importacao)::integer
      ELSE NULL
    END,
    po.data_importacao
  FROM por_owner po
  WHERE public.is_admin_user()
     OR (v_caller_email <> '' AND po.owner_email = v_caller_email)
     OR lower(po.owner_key) = lower(v_caller_id_usuario)
  ORDER BY 6 ASC, 1 ASC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_sla_indicators(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sla_indicators(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sla_indicators(text) TO service_role;

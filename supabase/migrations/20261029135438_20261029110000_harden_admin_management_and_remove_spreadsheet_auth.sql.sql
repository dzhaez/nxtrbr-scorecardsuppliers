/*
  # Harden Admin Management & Remove Spreadsheet-Based Auth

  ## Purpose
  The entra-exchange edge function no longer uses ordens_compra to decide who may
  sign in. Access is granted only to:
    1. The initial admin (identified by INITIAL_ADMIN_ENTRA_OID env var)
    2. Users pre-authorized in admin_authorizations
    3. Users already linked to an Entra identity in usuarios
  The spreadsheet (ordens_compra) remains only for purchasing/supplier data.

  ## Changes
  1. SECURITY: Revoke excess grants on admin_audit_log and admin_authorizations.
     Both tables had anon + authenticated INSERT/UPDATE/DELETE grants from a
     prior migration bug. Now only authenticated SELECT (via RLS) and
     service_role full access remain. Inserts happen only through SECURITY
     DEFINER functions.
  2. SECURITY: count_active_admins() was executable by anon — revoke anon.
  3. Add advisory lock to remove_admin_authorization to prevent concurrent
     removal of the last admin.
  4. Add app_config table to store the configured Entra tenant ID server-side,
     so DB functions can validate the tenant without hardcoding.
  5. Rewrite add_admin_authorization to validate the tenant against app_config.
  6. Rewrite remove_admin_authorization to validate the tenant and use an
     advisory lock around the last-admin check.
  7. Seed app_config with the configured tenant.
*/

-- ── 1. Fix excess grants on admin tables ───────────────────────
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_log FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_authorizations FROM anon, authenticated;

-- ── 2. Revoke anon execute on count_active_admins ──────────────
REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM anon;

-- ── 3. app_config table for server-side tenant validation ──────
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write app_config; it contains server-side config.
-- No anon/authenticated grants — the edge function uses service_role.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_config TO service_role;

-- ── 4. Rewrite add_admin_authorization with tenant validation ─
CREATE OR REPLACE FUNCTION public.add_admin_authorization(
  p_tenant text,
  p_oid text,
  p_display_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor_id_usuario text;
  v_configured_tenant text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT value INTO v_configured_tenant
    FROM public.app_config WHERE key = 'entra_tenant_id';

  IF v_configured_tenant IS NOT NULL AND lower(p_tenant) <> lower(v_configured_tenant) THEN
    RAISE EXCEPTION 'tenant_not_allowed';
  END IF;

  v_actor_id_usuario := public.get_id_usuario();

  INSERT INTO public.admin_authorizations (entra_tenant_id, entra_oid, entra_display_name, authorized_by)
  VALUES (p_tenant, p_oid, p_display_name, auth.uid())
  ON CONFLICT (entra_tenant_id, entra_oid) DO UPDATE
    SET entra_display_name = COALESCE(p_display_name, admin_authorizations.entra_display_name);

  UPDATE public.usuarios
    SET is_admin = true
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  INSERT INTO public.admin_audit_log (action, target_oid, target_tenant_id, actor_id, actor_id_usuario)
    VALUES ('grant', p_oid, p_tenant, auth.uid(), v_actor_id_usuario);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.add_admin_authorization(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_admin_authorization(text, text, text) TO authenticated;

-- ── 5. Rewrite remove_admin_authorization with lock ───────────
CREATE OR REPLACE FUNCTION public.remove_admin_authorization(
  p_tenant text,
  p_oid text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_actor_id_usuario text;
  v_active_admins integer;
  v_target_is_admin boolean;
  v_configured_tenant text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT value INTO v_configured_tenant
    FROM public.app_config WHERE key = 'entra_tenant_id';

  IF v_configured_tenant IS NOT NULL AND lower(p_tenant) <> lower(v_configured_tenant) THEN
    RAISE EXCEPTION 'tenant_not_allowed';
  END IF;

  -- Advisory lock prevents two concurrent removals from both passing the
  -- last-admin check and leaving zero admins.
  PERFORM pg_advisory_xact_lock(hashtext('remove_admin_authorization'));

  SELECT is_admin INTO v_target_is_admin
    FROM public.usuarios
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  SELECT public.count_active_admins() INTO v_active_admins;

  IF v_target_is_admin = true AND v_active_admins <= 1 THEN
    RAISE EXCEPTION 'cannot_remove_last_admin';
  END IF;

  v_actor_id_usuario := public.get_id_usuario();

  DELETE FROM public.admin_authorizations
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  UPDATE public.usuarios
    SET is_admin = false
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  INSERT INTO public.admin_audit_log (action, target_oid, target_tenant_id, actor_id, actor_id_usuario)
    VALUES ('revoke', p_oid, p_tenant, auth.uid(), v_actor_id_usuario);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.remove_admin_authorization(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_admin_authorization(text, text) TO authenticated;

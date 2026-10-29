/*
  # Save handle_new_user trigger with Entra-only validation

  ## Purpose
  Captures the current live definition of public.handle_new_user() as a
  versioned migration. The function was already corrected in-database to:
    - Not consult ordens_compra (spreadsheet) for user validation
    - Only create a usuarios profile when raw_app_meta_data.auth_source = 'entra'
    - Require entra_tenant_id to match app_config.entra_tenant_id
    - Require entra_oid to be a valid UUID
  This migration also locks down execute privileges so only Supabase Auth
  internals (supabase_auth_admin) and service_role can call the trigger.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_id text; v_tenant text; v_oid text; v_configured_tenant text;
BEGIN
 v_id := btrim(COALESCE(NEW.raw_user_meta_data->>'id_usuario', ''));
 v_tenant := lower(btrim(COALESCE(NEW.raw_app_meta_data->>'entra_tenant_id', '')));
 v_oid := lower(btrim(COALESCE(NEW.raw_app_meta_data->>'entra_oid', '')));
 SELECT lower(value) INTO v_configured_tenant FROM public.app_config WHERE key = 'entra_tenant_id';
 IF v_id = '' OR length(v_id) > 64 THEN RAISE EXCEPTION 'invalid_user_id'; END IF;
 IF COALESCE(NEW.raw_app_meta_data->>'auth_source', '') <> 'entra'
 OR v_configured_tenant IS NULL OR v_tenant <> v_configured_tenant
 OR v_oid !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 THEN RAISE EXCEPTION 'server_authorized_entra_identity_required'; END IF;
 INSERT INTO public.usuarios (id, id_usuario, is_admin, entra_tenant_id, entra_oid)
 VALUES (NEW.id, v_id, false, v_tenant, v_oid);
 RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

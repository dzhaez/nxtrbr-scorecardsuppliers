/*
  # Save handle_new_user + trigger with AFTER INSERT OR UPDATE semantics

  ## Purpose
  GoTrue's adminUserCreate runs tx.Create(user) BEFORE UpdateAppMetaData, so
  the AFTER INSERT trigger fires before app_metadata is populated. The fix:
    - handle_new_user returns NEW early when auth_source <> 'entra' (no profile)
    - When auth_source = 'entra', validates tenant/OID and inserts usuarios
      with is_admin=false, ON CONFLICT(id) DO NOTHING
    - The trigger now fires AFTER INSERT OR UPDATE OF raw_app_meta_data so the
      profile is created when app_metadata is set on the UPDATE pass
  The edge function handles admin grant after Entra validation.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_id text; v_tenant text; v_oid text; v_configured_tenant text;
BEGIN
 IF COALESCE(NEW.raw_app_meta_data->>'auth_source','') <> 'entra' THEN RETURN NEW; END IF;
 v_id:=btrim(COALESCE(NEW.raw_user_meta_data->>'id_usuario',''));
 v_tenant:=lower(btrim(COALESCE(NEW.raw_app_meta_data->>'entra_tenant_id','')));
 v_oid:=lower(btrim(COALESCE(NEW.raw_app_meta_data->>'entra_oid','')));
 SELECT lower(value) INTO v_configured_tenant FROM public.app_config WHERE key='entra_tenant_id';
 IF v_id='' OR length(v_id)>64 THEN RAISE EXCEPTION 'invalid_user_id'; END IF;
 IF v_configured_tenant IS NULL OR v_tenant<>v_configured_tenant OR v_oid !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RAISE EXCEPTION 'server_authorized_entra_identity_required'; END IF;
 INSERT INTO public.usuarios(id,id_usuario,is_admin,entra_tenant_id,entra_oid) VALUES(NEW.id,v_id,false,v_tenant,v_oid) ON CONFLICT(id) DO NOTHING;
 RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger to fire on AFTER INSERT OR UPDATE OF raw_app_meta_data
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF raw_app_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

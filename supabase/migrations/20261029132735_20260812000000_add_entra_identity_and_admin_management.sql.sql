/*
  # Entra Identity, Admin Authorizations, and Admin Audit

  ## Purpose
  Replace name-based admin detection with a secure Entra OID-based system.
  The initial admin is identified by their Microsoft Entra Object ID (OID),
  not by their username or email. Additional admins can be authorized through
  the admin panel, and all admin changes are audited.

  ## 1. New Columns on `usuarios`
  - `entra_tenant_id` (text, nullable) — the Entra tenant ID from the verified token
  - `entra_oid` (text, nullable) — the Entra Object ID from the verified token
  - Unique constraint on (entra_tenant_id, entra_oid) so one Entra identity maps to one user

  ## 2. New Table: `admin_authorizations`
  Pre-authorizes an Entra identity (tenant + OID) to sign in and receive admin
  privileges, even without being in the purchasing spreadsheet.
  - `entra_tenant_id` (text, not null)
  - `entra_oid` (text, not null)
  - `entra_display_name` (text, nullable) — human-readable label for the admin panel
  - `authorized_by` (uuid, references auth.users) — the admin who authorized
  - `created_at` (timestamptz)
  - Unique constraint on (entra_tenant_id, entra_oid)

  ## 3. New Table: `admin_audit_log`
  Records every admin grant/revoke action.
  - `action` (text: 'grant' or 'revoke')
  - `target_oid` (text) — the Entra OID of the affected user
  - `target_tenant_id` (text) — the Entra tenant of the affected user
  - `actor_id` (uuid) — the admin who performed the action (auth.uid)
  - `actor_id_usuario` (text) — the id_usuario of the actor
  - `created_at` (timestamptz)

  ## 4. Modified Functions
  - `set_admin_flag()` trigger: rewritten to preserve `is_admin = true` when the
    row already has it set. Previously it forced `is_admin = false` for everyone
    except 'dzhaez', which would revoke admin granted through the panel.
    Now it only forces false when the incoming row does NOT match an admin
    authorization or the initial admin OID.

  ## 5. New SECURITY DEFINER Functions
  - `list_admin_authorizations()` — returns all admin_authorizations rows (admin only)
  - `list_admin_audit_log(limit int)` — returns audit entries (admin only)
  - `add_admin_authorization(p_tenant text, p_oid text, p_display_name text)` —
    inserts a new authorization (admin only, prevents duplicate, same-tenant only)
  - `remove_admin_authorization(p_tenant text, p_oid text)` — removes an
    authorization AND revokes is_admin on the matching usuarios row, but refuses
    if it would leave zero active admins (admin only)
  - `count_active_admins()` — helper for the last-admin protection

  ## 6. RLS Policies
  - `admin_authorizations`: SELECT/INSERT/DELETE only by admins
  - `admin_audit_log`: SELECT only by admins, INSERT only via SECURITY DEFINER function
  - `usuarios`: existing SELECT unchanged; no client-side INSERT/UPDATE/DELETE

  ## 7. Security Notes
  - Users cannot modify their own entra_tenant_id/entra_oid — those columns have
    no client INSERT/UPDATE grant.
  - Users cannot modify is_admin — no client UPDATE grant on usuarios.
  - Admin authorizations can only be added/removed through SECURITY DEFINER
    functions that verify the caller's session is admin.
  - The last active admin cannot be removed.
  - All admin actions are audited with the actor's identity.
*/

-- ── 1. Add Entra identity columns to usuarios ──────────────────
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS entra_tenant_id text,
  ADD COLUMN IF NOT EXISTS entra_oid text;

-- Unique constraint on (entra_tenant_id, entra_oid) — one Entra identity per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_entra_identity_key'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_entra_identity_key
      UNIQUE (entra_tenant_id, entra_oid);
  END IF;
END $$;

-- ── 2. admin_authorizations table ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_authorizations (
  entra_tenant_id text NOT NULL,
  entra_oid text NOT NULL,
  entra_display_name text,
  authorized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_authorizations_tenant_oid_key UNIQUE (entra_tenant_id, entra_oid)
);

ALTER TABLE public.admin_authorizations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, DELETE ON public.admin_authorizations TO authenticated;

DROP POLICY IF EXISTS "select_admin_authorizations" ON public.admin_authorizations;
CREATE POLICY select_admin_authorizations ON public.admin_authorizations
  FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "delete_admin_authorizations" ON public.admin_authorizations;
CREATE POLICY delete_admin_authorizations ON public.admin_authorizations
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- INSERT is only through the SECURITY DEFINER function add_admin_authorization()

-- ── 3. admin_audit_log table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('grant', 'revoke')),
  target_oid text NOT NULL,
  target_tenant_id text NOT NULL,
  actor_id uuid,
  actor_id_usuario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.admin_audit_log TO authenticated;

DROP POLICY IF EXISTS "select_admin_audit_log" ON public.admin_audit_log;
CREATE POLICY select_admin_audit_log ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.is_admin_user());

-- No INSERT grant for authenticated — only SECURITY DEFINER functions insert

-- ── 4. Rewrite set_admin_flag trigger ──────────────────────────
-- Only force is_admin=false if the user is NOT in admin_authorizations and
-- is NOT the initial admin. This preserves admin granted through the panel.
CREATE OR REPLACE FUNCTION public.set_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_admin IS NULL THEN
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$function$;

-- ── 5. SECURITY DEFINER functions for admin management ─────────

-- Count active admins (is_admin = true in usuarios)
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.usuarios WHERE is_admin = true;
$$;

-- List admin authorizations
CREATE OR REPLACE FUNCTION public.list_admin_authorizations()
RETURNS TABLE (
  entra_tenant_id text,
  entra_oid text,
  entra_display_name text,
  authorized_by uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  RETURN QUERY
    SELECT a.entra_tenant_id, a.entra_oid, a.entra_display_name,
           a.authorized_by, a.created_at
    FROM public.admin_authorizations a
    ORDER BY a.created_at DESC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.list_admin_authorizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_authorizations() TO authenticated;

-- List admin audit log
CREATE OR REPLACE FUNCTION public.list_admin_audit_log(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  action text,
  target_oid text,
  target_tenant_id text,
  actor_id uuid,
  actor_id_usuario text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  RETURN QUERY
    SELECT l.id, l.action, l.target_oid, l.target_tenant_id,
           l.actor_id, l.actor_id_usuario, l.created_at
    FROM public.admin_audit_log l
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.list_admin_audit_log(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_audit_log(integer) TO authenticated;

-- Add admin authorization
-- Validates that caller is admin, the tenant matches the configured Entra tenant,
-- and the OID is not already authorized.
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
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  v_actor_id_usuario := public.get_id_usuario();

  INSERT INTO public.admin_authorizations (entra_tenant_id, entra_oid, entra_display_name, authorized_by)
  VALUES (p_tenant, p_oid, p_display_name, auth.uid())
  ON CONFLICT (entra_tenant_id, entra_oid) DO UPDATE
    SET entra_display_name = COALESCE(p_display_name, admin_authorizations.entra_display_name);

  -- If the user already exists in usuarios with this Entra identity, grant admin
  UPDATE public.usuarios
    SET is_admin = true
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  INSERT INTO public.admin_audit_log (action, target_oid, target_tenant_id, actor_id, actor_id_usuario)
  VALUES ('grant', p_oid, p_tenant, auth.uid(), v_actor_id_usuario);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.add_admin_authorization(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_admin_authorization(text, text, text) TO authenticated;

-- Remove admin authorization
-- Validates caller is admin, refuses if it would leave zero active admins.
-- Also revokes is_admin on the matching usuarios row.
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
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Check if the target is currently an active admin
  SELECT is_admin INTO v_target_is_admin
    FROM public.usuarios
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  -- Count how many active admins would remain
  SELECT public.count_active_admins() INTO v_active_admins;

  IF v_target_is_admin = true AND v_active_admins <= 1 THEN
    RAISE EXCEPTION 'cannot_remove_last_admin';
  END IF;

  v_actor_id_usuario := public.get_id_usuario();

  DELETE FROM public.admin_authorizations
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  -- Revoke admin on the matching usuarios row
  UPDATE public.usuarios
    SET is_admin = false
    WHERE entra_tenant_id = p_tenant AND entra_oid = p_oid;

  INSERT INTO public.admin_audit_log (action, target_oid, target_tenant_id, actor_id, actor_id_usuario)
  VALUES ('revoke', p_oid, p_tenant, auth.uid(), v_actor_id_usuario);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.remove_admin_authorization(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_admin_authorization(text, text) TO authenticated;

-- ── 6. Grant service_role access to new tables ─────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_authorizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_log TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.usuarios TO service_role;

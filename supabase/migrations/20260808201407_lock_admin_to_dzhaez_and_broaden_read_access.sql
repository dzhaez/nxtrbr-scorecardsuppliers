/*
  # Lock admin to 'dzhaez' and broaden supplier read access

  1. Purpose
     - Ensure only the user `id_usuario = 'dzhaez'` is ever marked as admin.
       All other profiles must have `is_admin = false`.
     - Allow any authenticated buyer to view the full supplier base
       (all owners), not just suppliers tied to their own purchase orders.
       This makes the complete supplier list visible on the main screen
       so buyers can see all suppliers awaiting evaluation across every
       owner.

  2. Data Changes
     - UPDATE usuarios SET is_admin = false WHERE lower(id_usuario) != 'dzhaez'
       (revokes admin from anyone who was accidentally promoted)
     - UPDATE usuarios SET is_admin = true WHERE lower(id_usuario) = 'dzhaez'
       (ensures dzhaez is admin)

  3. Trigger Hardening
     - Rewrite `set_admin_flag()` so it sets `is_admin = true` ONLY when
       `lower(NEW.id_usuario) = 'dzhaez'`, and forces `is_admin = false`
       for every other ID. This prevents any future INSERT or UPDATE from
       elevating a non-dzhaez user to admin.

  4. RLS Policy Changes
     - `fornecedores` SELECT: changed from "admin OR has matching orders"
       to `USING (true)` for all authenticated users. Every signed-in
       buyer can now read the full supplier master list.
     - `ordens_compra` SELECT: changed from "own orders OR admin" to
       `USING (true)` for all authenticated users. Buyers can now see
       all purchase orders across all owners, so the main screen can
       display the complete supplier base with order counts.
     - `avaliacoes` SELECT: changed from "own evaluations OR admin" to
       `USING (true)` for all authenticated users. This lets the main
       screen show whether a supplier has already been evaluated by
       any buyer (not just the current user), giving a complete picture
       of evaluation status across all owners.

  5. Security Notes
     - INSERT/UPDATE/DELETE policies on all tables remain unchanged.
       Only SELECT (read) access is broadened.
     - Evaluations can still only be submitted for suppliers assigned
       to the caller (insert_avaliacoes policy unchanged).
     - Import history, access logs, and user profiles remain admin-only
       or self-only for SELECT.
     - The `is_admin_user()` function is unchanged; it still reads the
       `is_admin` column. The trigger now guarantees that column is
       true only for 'dzhaez'.
*/

-- ── 1. Normalize existing admin flags ──────────────────────────
UPDATE public.usuarios SET is_admin = false WHERE lower(id_usuario) != 'dzhaez';
UPDATE public.usuarios SET is_admin = true  WHERE lower(id_usuario) = 'dzhaez';

-- ── 2. Harden the trigger function ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF lower(NEW.id_usuario) = 'dzhaez' THEN
    NEW.is_admin := true;
  ELSE
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$function$;

-- ── 3. Broaden fornecedores SELECT to all authenticated ─────────
DROP POLICY IF EXISTS select_fornecedores ON public.fornecedores;
CREATE POLICY select_fornecedores ON public.fornecedores
  FOR SELECT TO authenticated USING (true);

-- ── 4. Broaden ordens_compra SELECT to all authenticated ───────
DROP POLICY IF EXISTS select_ordens ON public.ordens_compra;
CREATE POLICY select_ordens ON public.ordens_compra
  FOR SELECT TO authenticated USING (true);

-- ── 5. Broaden avaliacoes SELECT to all authenticated ──────────
DROP POLICY IF EXISTS select_avaliacoes ON public.avaliacoes;
CREATE POLICY select_avaliacoes ON public.avaliacoes
  FOR SELECT TO authenticated USING (true);

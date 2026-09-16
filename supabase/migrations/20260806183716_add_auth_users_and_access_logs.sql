/*
# Add authentication: user profiles, access logs, and auth-scoped RLS

1. Purpose
   Replaces the no-auth ID-only login with Supabase email/password
   authentication. Each user registers on first access with their evaluator
   ID + email + password. The admin user (id_usuario = 'dzhaez') gets total
   access to all data plus a login history showing when each user accessed
   the system.

2. New Tables
   - `usuarios`: maps auth.users (uuid) to evaluator IDs (text)
     - id (uuid, PK, references auth.users ON DELETE CASCADE)
     - id_usuario (text, NOT NULL — the evaluator ID from the spreadsheet)
     - is_admin (boolean, default false; auto-set true for 'dzhaez')
     - created_at (timestamptz, default now)
   - `acessos`: login history
     - id (uuid, PK)
     - user_id (uuid, references auth.users ON DELETE CASCADE)
     - id_usuario (text, the evaluator ID at time of access)
     - data_hora (timestamptz, default now)

3. Helper Functions (SECURITY DEFINER, bypass RLS safely)
   - public.get_id_usuario(): returns the current user's evaluator ID
   - public.is_admin_user(): returns true if the current user is admin
   Both are STABLE, set search_path = public, and only read the caller's own row.

4. Trigger
   - trg_set_admin: BEFORE INSERT on usuarios, auto-sets is_admin = true
     when id_usuario = 'dzhaez'. The first person to register with 'dzhaez'
     becomes the admin; the unique index on lower(id_usuario) prevents anyone
     else from registering that ID afterwards.

5. RLS Changes — all existing tables
   - Revoke ALL from anon on ordens_compra, avaliacoes, fornecedores, importacoes.
   - Revoke unnecessary UPDATE from authenticated on ordens_compra and importacoes.
   - Grant authenticated: SELECT+INSERT+DELETE on ordens_compra; SELECT+INSERT on
     avaliacoes; SELECT+INSERT+UPDATE on fornecedores; SELECT+INSERT on importacoes.
   - Drop old anon_* policies; create new authenticated-scoped policies:
     - ordens_compra: SELECT for owner or admin; INSERT/DELETE for admin only.
     - avaliacoes: SELECT for owner or admin; INSERT for owner or admin.
     - fornecedores: SELECT for all authenticated; INSERT/UPDATE for admin only.
     - importacoes: SELECT for all authenticated; INSERT for admin only.
   - New tables:
     - usuarios: SELECT for self or admin; INSERT for self (id = auth.uid()).
     - acessos: SELECT for self or admin; INSERT for self (user_id = auth.uid()).

6. Case-insensitive matching
   - RLS predicates use lower(id_usuario) = lower(public.get_id_usuario()).
   - Unique index on lower(id_usuario) in usuarios prevents case-variant dupes.
   - Replaces the case-sensitive UNIQUE constraint on avaliacoes with a
     case-insensitive unique index on (codigo_fornecedor, lower(id_usuario), ciclo).
     Verified: 0 existing rows violate the new index.

7. Important Notes
   - No data is modified or deleted.
   - Email confirmation stays OFF (sign-up grants immediate session).
   - The admin user 'dzhaez' can register even without orders in ordens_compra.
*/

-- ── 1. New tables ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_usuario text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  id_usuario text NOT NULL,
  data_hora timestamptz DEFAULT now()
);

-- ── 2. Case-insensitive unique indexes ────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_id_usuario_lower
  ON usuarios (lower(id_usuario));

ALTER TABLE avaliacoes
  DROP CONSTRAINT IF EXISTS avaliacoes_codigo_fornecedor_id_usuario_ciclo_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_avaliacoes_unique_eval
  ON avaliacoes (codigo_fornecedor, lower(id_usuario), ciclo);

-- ── 3. Indexes for access history queries ──────────────────────
CREATE INDEX IF NOT EXISTS idx_acessos_user_id   ON acessos (user_id);
CREATE INDEX IF NOT EXISTS idx_acessos_data_hora ON acessos (data_hora DESC);

-- ── 4. Helper functions (SECURITY DEFINER) ─────────────────────
CREATE OR REPLACE FUNCTION public.get_id_usuario()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id_usuario FROM usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM usuarios WHERE id = auth.uid()), false);
$$;

-- ── 5. Trigger: auto-set admin flag ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id_usuario = 'dzhaez' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_admin ON usuarios;
CREATE TRIGGER trg_set_admin BEFORE INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION public.set_admin_flag();

-- ── 6. Enable RLS on new tables ────────────────────────────────
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE acessos  ENABLE ROW LEVEL SECURITY;

-- ── 7. Revoke anon on ALL tables ───────────────────────────────
REVOKE ALL ON ordens_compra FROM anon;
REVOKE ALL ON avaliacoes    FROM anon;
REVOKE ALL ON fornecedores  FROM anon;
REVOKE ALL ON importacoes   FROM anon;

-- Revoke unnecessary UPDATE from authenticated
REVOKE UPDATE ON ordens_compra FROM authenticated;
REVOKE UPDATE ON importacoes   FROM authenticated;

-- ── 8. Grant authenticated ─────────────────────────────────────
GRANT SELECT, INSERT, DELETE ON ordens_compra TO authenticated;
GRANT SELECT, INSERT         ON avaliacoes    TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fornecedores  TO authenticated;
GRANT SELECT, INSERT         ON importacoes   TO authenticated;
GRANT SELECT, INSERT         ON usuarios      TO authenticated;
GRANT SELECT, INSERT         ON acessos       TO authenticated;

-- ── 9. Policies: ordens_compra ─────────────────────────────────
DROP POLICY IF EXISTS "anon_select_ordens" ON ordens_compra;
DROP POLICY IF EXISTS "anon_insert_ordens" ON ordens_compra;
DROP POLICY IF EXISTS "anon_delete_ordens" ON ordens_compra;

CREATE POLICY "select_ordens" ON ordens_compra FOR SELECT
  TO authenticated
  USING (lower(id_usuario) = lower(public.get_id_usuario()) OR public.is_admin_user());

CREATE POLICY "insert_ordens" ON ordens_compra FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user());

CREATE POLICY "delete_ordens" ON ordens_compra FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- ── 10. Policies: avaliacoes ──────────────────────────────────
DROP POLICY IF EXISTS "anon_select_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "anon_insert_avaliacoes" ON avaliacoes;

CREATE POLICY "select_avaliacoes" ON avaliacoes FOR SELECT
  TO authenticated
  USING (lower(id_usuario) = lower(public.get_id_usuario()) OR public.is_admin_user());

CREATE POLICY "insert_avaliacoes" ON avaliacoes FOR INSERT
  TO authenticated
  WITH CHECK (lower(id_usuario) = lower(public.get_id_usuario()) OR public.is_admin_user());

-- ── 11. Policies: fornecedores ─────────────────────────────────
DROP POLICY IF EXISTS "anon_select_fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "anon_insert_fornecedores" ON fornecedores;

CREATE POLICY "select_fornecedores" ON fornecedores FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_fornecedores" ON fornecedores FOR INSERT
  TO authenticated WITH CHECK (public.is_admin_user());

CREATE POLICY "update_fornecedores" ON fornecedores FOR UPDATE
  TO authenticated
  USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- ── 12. Policies: importacoes ──────────────────────────────────
DROP POLICY IF EXISTS "anon_select_importacoes" ON importacoes;
DROP POLICY IF EXISTS "anon_insert_importacoes" ON importacoes;

CREATE POLICY "select_importacoes" ON importacoes FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_importacoes" ON importacoes FOR INSERT
  TO authenticated WITH CHECK (public.is_admin_user());

-- ── 13. Policies: usuarios ──────────────────────────────────────
DROP POLICY IF EXISTS "select_usuarios" ON usuarios;
CREATE POLICY "select_usuarios" ON usuarios FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin_user());

DROP POLICY IF EXISTS "insert_usuarios" ON usuarios;
CREATE POLICY "insert_usuarios" ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ── 14. Policies: acessos ──────────────────────────────────────
DROP POLICY IF EXISTS "select_acessos" ON acessos;
CREATE POLICY "select_acessos" ON acessos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_user());

DROP POLICY IF EXISTS "insert_acessos" ON acessos;
CREATE POLICY "insert_acessos" ON acessos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

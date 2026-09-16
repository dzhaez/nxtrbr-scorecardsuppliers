/*
# Supplier Performance Evaluation Schema (Nexteer Automotive)

1. Purpose
   Creates the full data model for the Supplier Performance Evaluation System.
   This is a no-auth application (users enter their ID without a password), so
   all policies are open to the anon + authenticated roles. Data is scoped by
   the `id_usuario` text column at the application layer.

2. New Tables
   - `importacoes`: records each Excel import event. Each import = a new evaluation cycle.
     - `id` (uuid, PK)
     - `data_importacao` (timestamptz, default now)
     - `nome_arquivo` (text, the uploaded file name)
     - `ciclo` (text, the cycle label, e.g. "2026-2" for second semester 2026)
   - `fornecedores`: unique suppliers (deduplicated by codigo_fornecedor).
     - `codigo_fornecedor` (text, PK)
     - `razao_social` (text)
   - `ordens_compra`: purchase orders, one row per order+requisition line.
     - `id` (uuid, PK)
     - `codigo_fornecedor` (text, FK to fornecedores)
     - `ordem_compra` (text)
     - `numero_requisicao` (text)
     - `data` (date)
     - `id_usuario` (text, the requesting user's ID)
     - `ciclo` (text, the evaluation cycle this order belongs to)
   - `avaliacoes`: one evaluation per supplier per cycle per user.
     - `id` (uuid, PK)
     - `codigo_fornecedor` (text)
     - `id_usuario` (text)
     - `ciclo` (text)
     - `nota1` (integer, 1-5)
     - `nota2` (integer, 1-5)
     - `nota3` (integer, 1-5)
     - `media` (numeric, 1 decimal place)
     - `comentario` (text, up to 1000 chars, optional)
     - `data_avaliacao` (timestamptz, default now)

3. Indexes
   - `ordens_compra` on (id_usuario, ciclo) for filtering by user+cycle.
   - `ordens_compra` on (codigo_fornecedor) for grouping.
   - `avaliacoes` unique on (codigo_fornecedor, id_usuario, ciclo) to prevent duplicate evaluations.
   - `avaliacoes` on (ciclo) for dashboard queries.

4. Security (RLS)
   - RLS enabled on all tables.
   - All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
     because this is a no-auth shared-data application (no sign-in screen). The data
     is intentionally public within the app; row-level scoping by user is done in
     application queries (filtering by id_usuario).

5. Important Notes
   - No `user_id` / `auth.uid()` columns — this app has no sign-in flow.
   - The unique constraint on avaliacoes enforces "one evaluation per supplier per cycle per user".
   - The ciclo column on ordens_compra lets multiple cycles coexist (historical preservation).
*/

CREATE TABLE IF NOT EXISTS importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_importacao timestamptz DEFAULT now(),
  nome_arquivo text NOT NULL,
  ciclo text NOT NULL
);

CREATE TABLE IF NOT EXISTS fornecedores (
  codigo_fornecedor text PRIMARY KEY,
  razao_social text NOT NULL
);

CREATE TABLE IF NOT EXISTS ordens_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_fornecedor text NOT NULL REFERENCES fornecedores(codigo_fornecedor) ON DELETE CASCADE,
  ordem_compra text NOT NULL,
  numero_requisicao text NOT NULL,
  data date,
  id_usuario text NOT NULL,
  ciclo text NOT NULL
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_fornecedor text NOT NULL,
  id_usuario text NOT NULL,
  ciclo text NOT NULL,
  nota1 integer NOT NULL CHECK (nota1 >= 1 AND nota1 <= 5),
  nota2 integer NOT NULL CHECK (nota2 >= 1 AND nota2 <= 5),
  nota3 integer NOT NULL CHECK (nota3 >= 1 AND nota3 <= 5),
  media numeric(2,1) NOT NULL,
  comentario text DEFAULT '' CHECK (length(coalesce(comentario, '')) <= 1000),
  data_avaliacao timestamptz DEFAULT now(),
  UNIQUE (codigo_fornecedor, id_usuario, ciclo)
);

CREATE INDEX IF NOT EXISTS idx_ordens_usuario_ciclo ON ordens_compra (id_usuario, ciclo);
CREATE INDEX IF NOT EXISTS idx_ordens_fornecedor ON ordens_compra (codigo_fornecedor);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_ciclo ON avaliacoes (ciclo);

ALTER TABLE importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_importacoes" ON importacoes;
CREATE POLICY "anon_select_importacoes" ON importacoes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_importacoes" ON importacoes;
CREATE POLICY "anon_insert_importacoes" ON importacoes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_importacoes" ON importacoes;
CREATE POLICY "anon_delete_importacoes" ON importacoes FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_fornecedores" ON fornecedores;
CREATE POLICY "anon_select_fornecedores" ON fornecedores FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fornecedores" ON fornecedores;
CREATE POLICY "anon_insert_fornecedores" ON fornecedores FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fornecedores" ON fornecedores;
CREATE POLICY "anon_delete_fornecedores" ON fornecedores FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_ordens" ON ordens_compra;
CREATE POLICY "anon_select_ordens" ON ordens_compra FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ordens" ON ordens_compra;
CREATE POLICY "anon_insert_ordens" ON ordens_compra FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ordens" ON ordens_compra;
CREATE POLICY "anon_delete_ordens" ON ordens_compra FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_avaliacoes" ON avaliacoes;
CREATE POLICY "anon_select_avaliacoes" ON avaliacoes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_avaliacoes" ON avaliacoes;
CREATE POLICY "anon_insert_avaliacoes" ON avaliacoes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_avaliacoes" ON avaliacoes;
CREATE POLICY "anon_update_avaliacoes" ON avaliacoes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_avaliacoes" ON avaliacoes;
CREATE POLICY "anon_delete_avaliacoes" ON avaliacoes FOR DELETE
  TO anon, authenticated USING (true);

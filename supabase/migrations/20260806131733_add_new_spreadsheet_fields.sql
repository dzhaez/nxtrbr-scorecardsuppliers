/*
# Add new spreadsheet fields to supplier evaluation schema

1. Purpose
   The import spreadsheet structure changed. New columns: ORD., Loc Emb,
   Nome Clas, CNPJ/CPF, Commodities, ID USER, OWNER.
   This migration adds the new columns to existing tables without dropping
   or renaming anything, preserving all existing data.

2. Changes to `fornecedores`
   - `cnpj_cpf` (text) — supplier identifier from the spreadsheet (CNPJ/CPF)
   - `nome_clas` (text) — supplier classification name
   - `commodities` (text) — commodities description
   - `loc_emb` (text) — location/embarkation code
   - `owner` (text) — owner identifier

3. Changes to `ordens_compra`
   - `loc_emb` (text) — location/embarkation
   - `nome_clas` (text) — classification name
   - `commodities` (text) — commodities
   - `owner` (text) — owner

4. Notes
   - `codigo_fornecedor` remains the primary key of `fornecedores`.
     The CNPJ/CPF value from the spreadsheet is stored in `codigo_fornecedor`
     (it serves as the supplier code). The new `cnpj_cpf` column is a
     convenience copy for display.
   - `razao_social` remains; `nome_clas` is stored alongside it.
   - All new columns are nullable so existing rows are not affected.
   - RLS policies unchanged (already open to anon, authenticated).
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fornecedores' AND column_name='cnpj_cpf') THEN
    ALTER TABLE fornecedores ADD COLUMN cnpj_cpf text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fornecedores' AND column_name='nome_clas') THEN
    ALTER TABLE fornecedores ADD COLUMN nome_clas text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fornecedores' AND column_name='commodities') THEN
    ALTER TABLE fornecedores ADD COLUMN commodities text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fornecedores' AND column_name='loc_emb') THEN
    ALTER TABLE fornecedores ADD COLUMN loc_emb text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fornecedores' AND column_name='owner') THEN
    ALTER TABLE fornecedores ADD COLUMN owner text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_compra' AND column_name='loc_emb') THEN
    ALTER TABLE ordens_compra ADD COLUMN loc_emb text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_compra' AND column_name='nome_clas') THEN
    ALTER TABLE ordens_compra ADD COLUMN nome_clas text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_compra' AND column_name='commodities') THEN
    ALTER TABLE ordens_compra ADD COLUMN commodities text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_compra' AND column_name='owner') THEN
    ALTER TABLE ordens_compra ADD COLUMN owner text;
  END IF;
END $$;

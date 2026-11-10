/*
# Add email column to purchase orders

1. Modified Tables
- `ordens_compra`: new nullable column `email` (text) that stores the E-mail value read from each row of the imported spreadsheet.

2. Security
- No change to RLS policies or grants. Existing per-verb policies on `ordens_compra` continue to apply.

3. Notes
- Existing rows keep `email` as NULL until the next spreadsheet import for their cycle.
- Column is nullable so historical imports remain valid.
*/

ALTER TABLE ordens_compra ADD COLUMN IF NOT EXISTS email text;

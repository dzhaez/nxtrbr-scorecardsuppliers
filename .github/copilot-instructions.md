# Scorecard Indirect Suppliers — Nexteer Automotive
## Copilot Instructions

You are developing a supplier evaluation (scorecard) web application for **Nexteer Automotive**. Buyers log in with their employee ID, see only suppliers assigned to them via purchase orders, and submit semester-based evaluations scoring three criteria on a 1–5 scale. An administrator imports supplier and purchase-order data via Excel spreadsheet, manages cycles, and reviews analytics and access logs.

The app supports four languages (Portuguese, English, Polish, Spanish) with a language selector on the login screen, persisting the choice across sessions. The entire UI must be translated.

---

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** recharts (RadialBarChart, lazy-loaded)
- **Excel parsing:** xlsx library (lazy-loaded only on the admin import screen)
- **Backend:** Supabase (Postgres database, Auth, Edge Functions)
- **Icons:** lucide-react
- **i18n:** Custom React Context + flat translation key system (no external i18n library)

---

## Build & Typecheck

- `npm run build` runs `tsc -b && vite build`. Always run this after changes to verify the project compiles.
- `npm run typecheck` runs `tsc --noEmit -p tsconfig.app.json` for type checking only.
- `npm run lint` runs ESLint.
- Do NOT start the dev server manually — it runs automatically in the environment.

---

## File Structure

```
/src
  /components
    AdminScreen.tsx        — admin: import, analytics, access history
    Dashboard.tsx          — KPI cards and rating distribution
    EvaluationForm.tsx     — evaluation modal (3 scores + comment)
    LoginScreen.tsx        — login + first-access registration + language selector
    MainScreen.tsx         — buyer: supplier list, filters, dashboard
    ManagementPanel.tsx    — admin analytics with charts
    SupplierCard.tsx       — supplier display card
    /ui                    — shadcn/ui primitives (button, card, input, select, table, tabs, etc.)
  /i18n
    LanguageContext.tsx    — React context provider + useI18n hook
    translations.ts        — Translation interface + 4 language implementations (pt, en, pl, es)
  /lib
    supabase.ts            — Supabase client, types, auth broker, helper functions
    utils.ts               — shadcn utility (cn)
  /hooks
    use-toast.ts           — toast notification hook
  App.tsx                  — root: auth state, screen routing, language provider
  main.tsx                 — entry point
  index.css                — Tailwind + custom styles
  App.css                  — app-specific styles
supabase
  /functions
    /auth-broker
      index.ts             — edge function for login/register
  /migrations
    *.sql                  — all database migrations
public
  nexteer-logo-transparent.png
  images-removebg-preview.png
  automotive-industrial-background.webp
```

---

## Coding Conventions

- Use **named exports** for all components.
- Use `import { ... } from '@/...'` path aliases (`@` = `src/`).
- Follow `<template> → <script> → <style>` ordering is NOT applicable (React, not Vue).
- Use React hooks (useState, useEffect, useMemo, useCallback, lazy, Suspense).
- Heavy components (recharts, xlsx, admin screens) are lazy-loaded via `React.lazy()` + `Suspense`.
- Use shadcn/ui components from `@/components/ui/*` — do NOT install other UI frameworks.
- Use icons from `lucide-react`.
- All text shown to the user must use translation keys from the i18n system, never hardcoded strings.
- TypeScript: every function parameter and variable must have explicit types. Avoid `any`.
- Comments: only write comments for non-obvious decisions. Do not write comments that describe what code does.
- Do not add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).
- Do not add features, refactor, or introduce abstractions beyond what the task requires.
- Prefer editing existing files to creating new ones.
- When moving or replacing code, delete what it replaced. Do not leave orphaned files or dead code.

---

## Database Schema (6 tables)

All tables have **Row Level Security (RLS) enabled** with per-verb policies (SELECT, INSERT, UPDATE, DELETE as separate policies, never `FOR ALL`).

### 1. `usuarios` (user profiles)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, FK to `auth.users.id` |
| `id_usuario` | text | Employee/buyer ID (business identifier, not email) |
| `is_admin` | boolean | Default `false` |
| `created_at` | timestamptz | Default `now()` |

- Unique index on `lower(id_usuario)`.
- A `SECURITY DEFINER` trigger `on_auth_user_created AFTER INSERT ON auth.users` auto-creates the `usuarios` row from `raw_user_meta_data->>'id_usuario'`, validating that the ID exists in `ordens_compra` and is non-empty.
- **Client has no INSERT/UPDATE/DELETE access** — profiles are created only by the server-side trigger.
- SELECT policy: `id = auth.uid() OR is_admin_user()`

### 2. `fornecedores` (suppliers)
| Column | Type | Notes |
|---|---|---|
| `codigo_fornecedor` | text | PK (supplier code = CNPJ/CPF) |
| `razao_social` | text | Company name |
| `cnpj_cpf` | text | Brazilian tax registration |
| `nome_clas` | text | Classification name |
| `commodities` | text | Commodity category |
| `loc_emb` | text | Embarkation location |
| `owner` | text | Buyer/owner assignment |

- SELECT policy: `is_admin_user() OR EXISTS (matching ordens_compra for this supplier + caller's id_usuario)`
- INSERT/UPDATE: admin only

### 3. `ordens_compra` (purchase orders)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `codigo_fornecedor` | text | FK to fornecedores |
| `ordem_compra` | text | Purchase order number |
| `numero_requisicao` | text | Requisition number |
| `data` | date | Order date |
| `id_usuario` | text | Assigned buyer's employee ID |
| `ciclo` | text | Evaluation cycle (e.g. `2026-1`) |
| `loc_emb` | text | |
| `nome_clas` | text | |
| `commodities` | text | |
| `owner` | text | |

- SELECT policy: `lower(id_usuario) = lower(get_id_usuario()) OR is_admin_user()` — buyers see only their own orders.
- INSERT/DELETE: admin only.

### 4. `avaliacoes` (evaluations/scorecards)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `codigo_fornecedor` | text | Supplier being evaluated |
| `id_usuario` | text | Evaluator's employee ID |
| `ciclo` | text | Evaluation cycle |
| `nota1` | int | Score 1–5 (CHECK constraint) |
| `nota2` | int | Score 1–5 (CHECK constraint) |
| `nota3` | int | Score 1–5 (CHECK constraint) |
| `media` | numeric(2,1) | `= round((nota1 + nota2 + nota3) / 3, 1)` (CHECK constraint enforces) |
| `comentario` | text | Max 1000 chars |
| `data_avaliacao` | timestamptz | Default `now()` |

- Unique index on `(codigo_fornecedor, lower(id_usuario), ciclo)` — prevents double-evaluation.
- **No UPDATE or DELETE grant** — evaluations are immutable once submitted.
- SELECT policy: `lower(id_usuario) = lower(get_id_usuario()) OR is_admin_user()`
- INSERT policy: `is_admin_user() OR (lower(id_usuario) = lower(get_id_usuario()) AND EXISTS (matching ordens_compra for this supplier + cycle + caller))` — buyers can only evaluate suppliers assigned to them in the current cycle.

### 5. `importacoes` (import history)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `data_importacao` | timestamptz | Default `now()` |
| `nome_arquivo` | text | Uploaded filename |
| `ciclo` | text | Cycle generated at import time |

- SELECT: admin only. INSERT: admin only.

### 6. `acessos` (access/login logs)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK to auth.users |
| `id_usuario` | text | Employee ID at login time |
| `data_hora` | timestamptz | Default `now()` |

- INSERT policy: `user_id = auth.uid() AND lower(id_usuario) = lower(get_id_usuario())`.
- SELECT policy: `user_id = auth.uid() OR is_admin_user()`.

---

## SECURITY DEFINER Functions

| Function | Purpose | Executable by |
|---|---|---|
| `get_id_usuario()` | Returns the caller's `id_usuario` from `usuarios` | `authenticated` only |
| `is_admin_user()` | Returns the caller's `is_admin` flag | `authenticated` only |
| `get_ciclo_atual()` | Returns the latest `ciclo` from `importacoes` | `authenticated` only |
| `get_email_by_id_usuario(text)` | Resolves employee ID to auth email (server-side only) | `service_role` only |
| `id_exists_in_usuarios(text)` | Checks if an ID is already registered | `service_role` only |
| `id_exists_in_ordens_compra(text)` | Checks if an ID exists in the spreadsheet | `service_role` only |
| `handle_new_user()` | Trigger function: validates and creates the `usuarios` profile row on signup | `supabase_auth_admin` only |

All functions have `search_path` set to `'public'` to prevent search-path injection.

**`handle_new_user()` validation logic:**
1. Trim the `id_usuario` from `raw_user_meta_data`.
2. Reject if empty or longer than 64 characters.
3. Reject if the ID does not exist in `ordens_compra` (the current spreadsheet).
4. Only then insert into `usuarios`.

---

## Edge Function: `auth-broker`

A Deno Edge Function (`supabase/functions/auth-broker/index.ts`) handles both login and registration server-side so that:
- Employee email addresses are never sent to the browser.
- Account existence and ID eligibility cannot be probed by outsiders.
- All failures return the same opaque error code.

**Login (`action: "login"`):**
- Input: `{ action: "login", id_usuario: string, password: string }`
- Server resolves `id_usuario` to `usuarios.id` to `auth.users.email` using the service role key.
- Calls `signInWithPassword` with the resolved email and supplied password.
- Returns: `{ access_token, refresh_token, id_usuario, is_admin }` or `{ error: "invalid_credentials" }`.

**Register (`action: "register"`):**
- Input: `{ action: "register", id_usuario: string, password: string, email: string }`
- Validates email format, password length (8 to 72 chars).
- Checks the ID is not already registered and exists in `ordens_compra`.
- Creates the auth user with `email_confirm: true` and `user_metadata: { id_usuario }`.
- The `handle_new_user` trigger fires, validating and creating the profile.
- Signs in and returns the session tokens.
- Returns: `{ access_token, refresh_token, id_usuario, is_admin }` or `{ error: "registration_failed" }`.

**CORS headers (mandatory on every response including OPTIONS preflight):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
```

---

## Authentication Flow

1. **Login screen** has two modes: "Login" and "First Access" (registration).
2. User enters their **employee ID** (`id_usuario`), not their email.
3. **First access:** user provides employee ID + email + password (min 8 chars). The call goes to the `auth-broker` edge function, which validates the ID against the spreadsheet, creates the account, and returns a session.
4. **Login:** user provides employee ID + password. The edge function resolves the email server-side and signs in.
5. On success, the client calls `supabase.auth.setSession()` with the returned tokens.
6. The app fetches the user profile via `get_id_usuario()` and `is_admin_user()` RPCs, retries up to 5 times (300ms apart) to handle trigger propagation lag.
7. A login record is inserted into `acessos`.
8. Sessions persist across reloads (`persistSession: true`, `autoRefreshToken: true`).

**Admin designation:** `is_admin` is set out-of-band in the database. There is no admin ID in the client code. The admin screen is double-gated: both in the navigation event handler (`if (!isAdmin) return`) and at render (`if (screen === 'admin' && isAdmin)`).

---

## Internationalization (i18n)

- **4 languages:** Portuguese (`pt`), English (`en`), Polish (`pl`), Spanish (`es`).
- Language selector (globe icon) in the top-right corner of the login screen.
- Persisted in `localStorage` under key `scorecard-lang`.
- `LanguageProvider` wraps the entire app; `useI18n()` hook returns `{ lang, t, setLang, locale }`.
- `t` is a flat translation object with approximately 150 keys covering every UI string.
- `locale` maps to BCP-47 (`pt-BR`, `en-US`, `pl-PL`, `es-ES`) for `toLocaleString()` date formatting.
- `document.documentElement.lang` is updated on language change.
- When adding new UI text, add keys to the `Translation` interface in `translations.ts` and provide values in all 4 languages.

---

## Screens

### 1. Login Screen (`LoginScreen.tsx`)
- Nexteer logo + subtitle.
- Language selector dropdown (top-right, globe icon, flag emojis).
- Two modes toggle: "Login" and "First Access".
- Login: employee ID + password fields, show/hide password toggle.
- First Access: employee ID + email + password + confirm password fields.
- Password min 8 chars on registration; sign-in accepts any length.
- All errors show generic translated messages (no raw Supabase errors).
- Copyright footer.

### 2. Main Screen (`MainScreen.tsx`) — buyer view
- Sticky header: logo, app title "Scorecard Indirect Suppliers", user ID, current cycle, refresh button, admin button (if admin), logout button.
- **Dashboard** with KPI cards: total suppliers, pending, evaluated, and rating breakdown. Clicking a KPI card filters the list.
- **Controls bar:** search (by name or code), commodity filter dropdown, status filter (all/pending/evaluated), sort dropdown (by code, orders, name, status, order number), sort direction toggle.
- **Supplier list** displayed in two sections: "Pending Evaluation" and "Evaluated Suppliers", each with a count badge. Empty states with icons.
- Each supplier is a **SupplierCard** showing: supplier name, code, CNPJ/CPF, commodity, location, owner, order count, status badge, and an "Evaluate" button (or the submitted score if already evaluated).
- Clicking "Evaluate" opens the **EvaluationForm** modal.
- Refresh button reloads all data.

### 3. Evaluation Form (`EvaluationForm.tsx`) — modal
- Shows supplier name and code.
- Three rating questions, each scored 1 to 5 (button scale).
- Real-time average calculation and classification display (Ruim < 2.0, Bom < 4.0, Otimo >= 4.0) with color coding (red/amber/emerald).
- Comment field (max 1000 characters).
- "Answer all questions" validation before saving.
- On save: inserts into `avaliacoes` with `nota1/2/3`, `media` (rounded to 1 decimal), `comentario` (truncated to 1000 chars).
- Duplicate detection: if unique constraint violation (code 23505), shows "already evaluated" message.
- On success: closes modal and refreshes the supplier list.

### 4. Admin Screen (`AdminScreen.tsx`) — admin only
- Three tabs: "Panel" (management analytics), "Import" (Excel upload), "Accesses" (login history).
- **Import tab:** drag-and-drop or click-to-select `.xlsx`/`.xls` file. Parses with xlsx, shows preview table (first 50 rows), lists expected columns. On import: generates cycle (`YYYY-1` or `YYYY-2` based on current month), inserts `importacoes` row, upserts `fornecedores`, deletes then re-inserts `ordens_compra` for the cycle.
- **Accesses tab:** table of login records (employee ID + timestamp), limited to 200, sorted newest first.
- **History modal:** import history table (cycle, filename, date).
- Back button returns to main screen.

### 5. Management Panel (`ManagementPanel.tsx`) — admin analytics
- Lazy-loaded inside the admin "Panel" tab.
- Fetches all `avaliacoes`, `ordens_compra`, `fornecedores`, `importacoes`, and `acessos` data.
- Displays charts and analytics using recharts (RadialBarChart).
- Shows supplier performance breakdown by commodity and owner.

### 6. Dashboard (`Dashboard.tsx`)
- KPI cards with click-to-filter functionality.
- Rating distribution visualization.
- Color-coded classification system.

### 7. Supplier Card (`SupplierCard.tsx`)
- Compact card showing supplier details and evaluation status.
- "Evaluate" button for pending suppliers.
- Score display for evaluated suppliers.

---

## Excel Import — Expected Columns

The spreadsheet parser uses fuzzy header matching (case-insensitive, whitespace-stripped). The expected columns are:

| Internal name | Header aliases |
|---|---|
| `ord` | ORD, Ord, Ordem |
| `locEmb` | LocEmb, LocalEmbark |
| `nomeClas` | NomeClas, NomeClassificacao |
| `cnpjCpf` | CNPJCPF, CNPJ, CPF, CnpjCpf |
| `commodities` | Commodities, Commodity, Commodit |
| `idUsuario` | IDUSER, IdUsuario, IDUsuario, ID |
| `owner` | OWNER, Owner |

Rows without a `cnpjCpf` or `ord` value are filtered out. Duplicate supplier+order pairs are deduplicated.

---

## Cycle System

- Format: `YYYY-S` where S is `1` (Jan-Jun) or `2` (Jul-Dec).
- Generated automatically at import time by `gerarCiclo()`.
- All evaluations and orders are tied to a cycle.
- Users see only the current (latest) cycle's data.
- Importing a new spreadsheet for an existing cycle replaces that cycle's orders.

---

## Scoring System

- Three criteria, each scored 1 to 5 (integer, enforced by CHECK constraint).
- Average (`media`) = `round((nota1 + nota2 + nota3) / 3, 1)` — enforced by CHECK constraint in the database.
- Classification:
  - **Ruim** (Poor): media < 2.0 — red
  - **Bom** (Good): 2.0 <= media < 4.0 — amber
  - **Otimo** (Excellent): media >= 4.0 — emerald
- Evaluations are **immutable** — no edit or delete once submitted.
- One evaluation per supplier per cycle per buyer (unique index).

---

## Security Model

- RLS enabled on all 6 tables, with per-verb policies (never `FOR ALL`).
- `SECURITY DEFINER` functions have `search_path` set; public execute revoked on all; only `authenticated` can call `get_id_usuario`, `is_admin_user`, `get_ciclo_atual`.
- Account creation validates the employee ID server-side against the spreadsheet.
- Email addresses never reach the browser.
- All auth failures return identical opaque error messages.
- Supplier data (including tax IDs) scoped to the buyer's own orders.
- Import history and access logs are admin-only (except a user's own access logs).
- Evaluations can only be submitted for assigned suppliers in the current cycle.
- No client-side write access to `usuarios` (profiles created by trigger only).
- Admin rights set out-of-band in the database, no admin identifier in client code.
- Password minimum 8 characters on registration, max 72; sign-in accepts any length.
- `.env` is gitignored; only the anon key and project URL are in the client bundle; the service role key is never in the client.

---

## Environment Variables

```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is available server-side in the Edge Function environment but is never referenced in client code or committed to `.env`.

---

## Design Requirements

- **Brand:** Nexteer Automotive (automotive/industrial aesthetic).
- Dark-mode capable with proper contrast ratios on all backgrounds.
- Responsive: mobile to desktop, breakpoints for all viewport sizes.
- 8px spacing system.
- Color ramps: primary (blue), secondary, accent, success (emerald), warning (amber), error (red), plus neutral tones.
- Animations: fade-in, slide-up, scale-in on modals and cards; hover states on all interactive elements.
- Sticky headers with backdrop blur.
- Lazy-loaded heavy components (recharts, xlsx, admin screens) via `React.lazy` + `Suspense`.
- Font: system stack with 3 weights max, 150% line-height for body, 120% for headings.
- Logo: Nexteer Automotive logo image in headers and login screen.
- Never use purple, indigo, or violet hues unless explicitly requested.

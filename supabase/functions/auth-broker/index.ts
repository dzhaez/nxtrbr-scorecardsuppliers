import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

/**
 * Every failure answers with the same opaque code so the endpoint cannot be
 * used to tell an existing account, an eligible employee ID and a wrong
 * password apart from one another.
 */
function fail(code: "invalid_credentials" | "registration_failed") {
  return new Response(JSON.stringify({ error: code }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return fail("invalid_credentials");
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("invalid_credentials");
  }

  const action = String(body.action ?? "");
  const idUsuario = String(body.id_usuario ?? "").trim();
  const password = String(body.password ?? "");

  if (!idUsuario || idUsuario.length > 64 || !password) {
    return fail(action === "register" ? "registration_failed" : "invalid_credentials");
  }

  try {
    if (action === "login") {
      // Resolve the employee ID to an account id server-side. The e-mail address
      // is never returned to the browser.
      const { data: profile } = await admin
        .from("usuarios")
        .select("id, id_usuario, is_admin")
        .ilike("id_usuario", idUsuario)
        .maybeSingle();

      if (!profile) return fail("invalid_credentials");

      const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
      const email = authUser?.user?.email;
      if (!email) return fail("invalid_credentials");

      const { data: signIn, error: signInError } = await publicClient.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !signIn.session) return fail("invalid_credentials");

      return ok({
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
        id_usuario: profile.id_usuario,
        is_admin: profile.is_admin === true,
      });
    }

    if (action === "register") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
        return fail("registration_failed");
      }
      if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return fail("registration_failed");
      }

      // Already registered, or not present in the current purchasing
      // spreadsheet: both answer with the same opaque failure.
      const { data: existing } = await admin
        .from("usuarios")
        .select("id")
        .ilike("id_usuario", idUsuario)
        .maybeSingle();
      if (existing) return fail("registration_failed");

      const { data: eligible } = await admin
        .from("ordens_compra")
        .select("id_usuario")
        .ilike("id_usuario", idUsuario)
        .limit(1)
        .maybeSingle();
      if (!eligible) return fail("registration_failed");

      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { id_usuario: idUsuario },
      });
      if (createError) return fail("registration_failed");

      const { data: signIn, error: signInError } = await publicClient.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !signIn.session) return fail("registration_failed");

      const { data: profile } = await admin
        .from("usuarios")
        .select("id_usuario, is_admin")
        .eq("id", signIn.session.user.id)
        .maybeSingle();

      return ok({
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
        id_usuario: profile?.id_usuario ?? idUsuario,
        is_admin: profile?.is_admin === true,
      });
    }

    return fail("invalid_credentials");
  } catch {
    return fail(action === "register" ? "registration_failed" : "invalid_credentials");
  }
});

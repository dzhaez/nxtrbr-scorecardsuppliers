import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ENTRA_TENANT_ID = Deno.env.get("ENTRA_TENANT_ID") ?? "";
const ENTRA_CLIENT_ID = Deno.env.get("ENTRA_CLIENT_ID") ?? "";

const ENTRA_ISSUER = `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`;
const entraKeys = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/${ENTRA_TENANT_ID}/discovery/v2.0/keys`),
);

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return respond(405, { error: "method_not_allowed" });
  }
  if (!ENTRA_TENANT_ID || !ENTRA_CLIENT_ID) {
    return respond(500, { error: "server_misconfigured" });
  }

  try {
    const body = await req.json().catch(() => null);
    const idToken = typeof body?.id_token === "string" ? body.id_token : "";
    if (!idToken || idToken.length > 8192) {
      return respond(400, { error: "invalid_request" });
    }

    let claims;
    try {
      ({ payload: claims } = await jwtVerify(idToken, entraKeys, {
        issuer: ENTRA_ISSUER,
        audience: ENTRA_CLIENT_ID,
      }));
    } catch {
      return respond(401, { error: "invalid_token" });
    }

    const upn = String(claims.preferred_username ?? claims.upn ?? claims.email ?? "")
      .trim()
      .toLowerCase();
    const [localPart] = upn.split("@");
    if (!upn.includes("@") || !localPart || localPart.length > 64) {
      return respond(403, { error: "not_authorized" });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const publicClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // The employee ID is the Entra user name before the "@". Only IDs present in
    // the imported purchasing spreadsheet may sign in.
    const idPattern = escapeLike(localPart);
    let authUserId: string;

    const { data: existing } = await admin
      .from("usuarios")
      .select("id")
      .ilike("id_usuario", idPattern)
      .maybeSingle();

    if (existing) {
      authUserId = existing.id;
    } else {
      const { data: eligible } = await admin
        .from("ordens_compra")
        .select("id_usuario")
        .ilike("id_usuario", idPattern)
        .limit(1)
        .maybeSingle();
      if (!eligible) {
        return respond(403, { error: "not_authorized" });
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: upn,
        email_confirm: true,
        user_metadata: { id_usuario: eligible.id_usuario },
      });
      if (createError || !created.user) {
        return respond(403, { error: "not_authorized" });
      }
      authUserId = created.user.id;
    }

    const { data: profile } = await admin
      .from("usuarios")
      .select("id_usuario, is_admin")
      .eq("id", authUserId)
      .maybeSingle();
    if (!profile) {
      return respond(500, { error: "server_error" });
    }

    const { data: authUser } = await admin.auth.admin.getUserById(authUserId);
    const email = authUser?.user?.email;
    if (!email) {
      return respond(500, { error: "server_error" });
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      return respond(500, { error: "server_error" });
    }

    const { data: session, error: verifyError } = await publicClient.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyError || !session.session) {
      return respond(500, { error: "server_error" });
    }

    return respond(200, {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      id_usuario: profile.id_usuario,
      is_admin: profile.is_admin === true,
    });
  } catch (err) {
    console.error("entra-exchange failed", err);
    return respond(500, { error: "server_error" });
  }
});

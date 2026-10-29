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
const INITIAL_ADMIN_ENTRA_OID = Deno.env.get("INITIAL_ADMIN_ENTRA_OID") ?? "";

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

    // Identify by verified Entra claims: tid (tenant) + oid (object ID).
    const tid = String(claims.tid ?? "").trim().toLowerCase();
    const oid = String(claims.oid ?? "").trim().toLowerCase();
    if (!tid || !oid) {
      return respond(403, { error: "not_authorized" });
    }

    // Reject tokens from a different tenant than the configured one.
    if (tid !== ENTRA_TENANT_ID.toLowerCase()) {
      return respond(403, { error: "not_authorized" });
    }

    const upn = String(claims.preferred_username ?? claims.upn ?? claims.email ?? "")
      .trim()
      .toLowerCase();
    const [localPart] = upn.split("@");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const publicClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const isInitialAdmin = oid === INITIAL_ADMIN_ENTRA_OID.toLowerCase();

    // Check if this Entra identity is already linked to a usuarios row.
    const { data: existingByOid } = await admin
      .from("usuarios")
      .select("id, id_usuario, is_admin, entra_tenant_id, entra_oid")
      .eq("entra_tenant_id", tid)
      .eq("entra_oid", oid)
      .maybeSingle();

    let authUserId: string;
    let profile: { id_usuario: string; is_admin: boolean };
    let needSetAdmin = false;

    if (existingByOid) {
      authUserId = existingByOid.id;
      profile = { id_usuario: existingByOid.id_usuario, is_admin: existingByOid.is_admin };

      if (isInitialAdmin && !existingByOid.is_admin) {
        needSetAdmin = true;
      }
    } else {
      // Check if there's a pre-existing usuarios row by username (local part)
      // that hasn't been linked to an Entra identity yet.
      const idPattern = escapeLike(localPart);
      const { data: existingByName } = await admin
        .from("usuarios")
        .select("id, id_usuario, is_admin, entra_tenant_id, entra_oid")
        .ilike("id_usuario", idPattern)
        .is("entra_oid", null)
        .maybeSingle();

      // Check if this identity is pre-authorized as an admin.
      const { data: authorized } = await admin
        .from("admin_authorizations")
        .select("entra_tenant_id, entra_oid")
        .eq("entra_tenant_id", tid)
        .eq("entra_oid", oid)
        .maybeSingle();

      const isAuthorizedAdmin = !!authorized || isInitialAdmin;

      if (existingByName) {
        // Link this Entra identity to the existing usuarios row.
        authUserId = existingByName.id;

        const { error: linkError } = await admin
          .from("usuarios")
          .update({ entra_tenant_id: tid, entra_oid: oid })
          .eq("id", authUserId);

        if (linkError) {
          return respond(500, { error: "server_error" });
        }

        const isAdmin = isAuthorizedAdmin || existingByName.is_admin;
        profile = { id_usuario: existingByName.id_usuario, is_admin: isAdmin };
        if (isAuthorizedAdmin && !existingByName.is_admin) {
          needSetAdmin = true;
        }
      } else if (isAuthorizedAdmin) {
        // Admin authorized by OID but not in the spreadsheet — create account.
        // Use the OID as the id_usuario if no spreadsheet match exists.
        const idUsuario = localPart || oid;

        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: upn || `${oid}@entra.local`,
          email_confirm: true,
          user_metadata: { id_usuario: idUsuario },
        });
        if (createError || !created.user) {
          return respond(500, { error: "server_error" });
        }
        authUserId = created.user.id;

        const { error: insertError } = await admin
          .from("usuarios")
          .insert({
            id: authUserId,
            id_usuario: idUsuario,
            is_admin: true,
            entra_tenant_id: tid,
            entra_oid: oid,
          });

        if (insertError) {
          // The auto-profile trigger may have already created the row.
          const { error: updateError } = await admin
            .from("usuarios")
            .update({ is_admin: true, entra_tenant_id: tid, entra_oid: oid })
            .eq("id", authUserId);
          if (updateError) {
            return respond(500, { error: "server_error" });
          }
        }

        profile = { id_usuario: idUsuario, is_admin: true };
      } else {
        // Not authorized as admin. Check if the user exists in the spreadsheet.
        const idPattern2 = escapeLike(localPart);
        const { data: eligible } = await admin
          .from("ordens_compra")
          .select("id_usuario")
          .ilike("id_usuario", idPattern2)
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

        // The auto-profile trigger creates the usuarios row.
        // Link the Entra identity to it.
        const { error: linkError } = await admin
          .from("usuarios")
          .update({ entra_tenant_id: tid, entra_oid: oid })
          .eq("id", authUserId);

        if (linkError) {
          return respond(500, { error: "server_error" });
        }

        profile = { id_usuario: eligible.id_usuario, is_admin: false };
      }
    }

    // Grant admin if needed (initial admin or pre-authorized).
    if (needSetAdmin) {
      const { error: adminError } = await admin
        .from("usuarios")
        .update({ is_admin: true })
        .eq("id", authUserId);
      if (adminError) {
        return respond(500, { error: "server_error" });
      }
      profile.is_admin = true;
    }

    // Generate a Supabase session via magic link.
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

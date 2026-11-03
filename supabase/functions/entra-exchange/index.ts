import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// entra-exchange: Entra ID token exchange with staged error codes
//
// Accepts any valid Entra identity from the configured tenant:
//   - Verified by cryptographic JWT signature, issuer, audience, expiration.
//   - Identity is (tid + oid) from the verified token — never client-supplied.
//   - Admin status is granted ONLY via admin_authorizations or INITIAL_ADMIN_ENTRA_OID.
//   - Regular users get is_admin=false. No auto-admin, no account takeover.
//   - Collision-safe: if id_usuario collides with an existing unlinked legacy
//     row, provisioning fails with a clear error instead of taking over the row.
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

    // ── 1. Cryptographic verification: signature, issuer, audience, expiration ──
    let claims;
    try {
      ({ payload: claims } = await jwtVerify(idToken, entraKeys, {
        issuer: ENTRA_ISSUER,
        audience: ENTRA_CLIENT_ID,
      }));
    } catch {
      return respond(401, { error: "invalid_token" });
    }

    // ── 2. Identify by verified Entra claims: tid (tenant) + oid (object ID) ──
    const tid = String(claims.tid ?? "").trim().toLowerCase();
    const oid = String(claims.oid ?? "").trim().toLowerCase();
    if (!tid || !oid) {
      return respond(403, { error: "not_authorized" });
    }

    // Reject tokens from a different tenant than the configured one.
    if (tid !== ENTRA_TENANT_ID.toLowerCase()) {
      return respond(403, { error: "not_authorized" });
    }

    // Email from verified token claims — used for display and auth.users account.
    const upn = String(claims.preferred_username ?? claims.upn ?? claims.email ?? "")
      .trim()
      .toLowerCase();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const publicClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const isInitialAdmin = oid === INITIAL_ADMIN_ENTRA_OID.toLowerCase();

    // ── 3. Check if this Entra identity is already linked to a usuarios row ──
    const { data: existingByOid } = await admin
      .from("usuarios")
      .select("id, id_usuario, is_admin, entra_tenant_id, entra_oid")
      .eq("entra_tenant_id", tid)
      .eq("entra_oid", oid)
      .maybeSingle();

    // ── 4. Check if this identity is pre-authorized as an admin ──
    const { data: authorized } = await admin
      .from("admin_authorizations")
      .select("entra_tenant_id, entra_oid")
      .eq("entra_tenant_id", tid)
      .eq("entra_oid", oid)
      .maybeSingle();

    const isAuthorizedAdmin = !!authorized || isInitialAdmin;

    // ── 5. If identity already linked, use it. Do NOT re-grant admin. ──
    if (existingByOid) {
      const profile = {
        id_usuario: existingByOid.id_usuario,
        is_admin: existingByOid.is_admin === true,
      };
      return await generateSession(admin, publicClient, existingByOid.id, profile, upn);
    }

    // ── 6. Identity not linked yet. Determine admin vs. regular user. ──
    const shouldBeAdmin = isAuthorizedAdmin;

    // Derive id_usuario from the verified email prefix.
    // This preserves the existing convention and keeps ordens_compra linkage.
    const derivedIdUsuario = upn ? upn.split("@")[0] : oid;

    // ── 7. Collision check: does id_usuario already exist? ──
    // If an unlinked legacy row has the same id_usuario, we must NOT take it
    // over. Fail safely with a clear error.
    const { data: existingByIdUsuario } = await admin
      .from("usuarios")
      .select("id, id_usuario, entra_oid, is_admin")
      .ilike("id_usuario", derivedIdUsuario)
      .maybeSingle();

    if (existingByIdUsuario) {
      // If the row has a different entra_oid (or null), it belongs to someone
      // else or is a legacy unlinked row. Do not take possession.
      const linkedOid = (existingByIdUsuario.entra_oid ?? "").trim().toLowerCase();
      if (linkedOid !== oid) {
        console.error(JSON.stringify({
          stage: "id_usuario_collision",
          derived_id_usuario: derivedIdUsuario,
          existing_entra_oid: existingByIdUsuario.entra_oid,
        }));
        return respond(409, { error: "id_usuario_conflict" });
      }
      // Same oid but different tenant? Should not happen (unique constraint),
      // but guard anyway.
      console.error(JSON.stringify({
        stage: "id_usuario_same_oid_different_path",
        derived_id_usuario: derivedIdUsuario,
      }));
      return respond(409, { error: "id_usuario_conflict" });
    }

    // ── 8. Create auth.users account and usuarios profile ──
    // Check if an auth.users account with this email already exists.
    const { data: usersList, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error(JSON.stringify({ stage: "list_users_by_email", code: listError.code, message: listError.message }));
      return respond(500, { error: "server_error_list_users" });
    }

    const existingByEmail = usersList?.users?.find(
      (u) => u.email?.toLowerCase() === upn,
    );

    let authUserId: string;

    if (existingByEmail) {
      // An auth.users account with this email exists. Check if it already has
      // a usuarios row linked to a different Entra identity.
      const { data: existingProfile } = await admin
        .from("usuarios")
        .select("id, entra_oid, entra_tenant_id")
        .eq("id", existingByEmail.id)
        .maybeSingle();

      if (existingProfile) {
        const profileOid = (existingProfile.entra_oid ?? "").trim().toLowerCase();
        if (profileOid && profileOid !== oid) {
          // The auth account belongs to a different Entra identity. Refuse.
          console.error(JSON.stringify({
            stage: "auth_account_owned_by_different_identity",
            auth_user_id: existingByEmail.id,
          }));
          return respond(409, { error: "id_usuario_conflict" });
        }
        // If profileOid is null, it's a legacy unlinked row. But we already
        // checked id_usuario collision above and it didn't match, so this
        // profile has a different id_usuario. We must not modify it. Instead,
        // link the Entra identity to this auth account and update id_usuario
        // only if the existing id_usuario matches our derived one.
        // Since the collision check passed, the existing id_usuario differs.
        // Link the Entra identity but preserve the existing id_usuario.
        authUserId = existingByEmail.id;

        const { data: linked, error: linkError } = await admin
          .from("usuarios")
          .update({
            entra_tenant_id: tid,
            entra_oid: oid,
            is_admin: shouldBeAdmin,
          })
          .eq("id", authUserId)
          .select("id_usuario")
          .maybeSingle();

        if (linkError) {
          console.error(JSON.stringify({ stage: "link_existing_profile", code: linkError.code, message: linkError.message }));
          return respond(500, { error: "server_error_link_profile" });
        }

        const finalIdUsuario = linked?.id_usuario ?? derivedIdUsuario;
        return await generateSession(admin, publicClient, authUserId, {
          id_usuario: finalIdUsuario,
          is_admin: shouldBeAdmin,
        }, upn);
      }

      // auth.users exists but no usuarios row — safe to create one.
      authUserId = existingByEmail.id;
    } else {
      // No existing auth account — create one.
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: upn || `${oid}@entra.local`,
        email_confirm: true,
        user_metadata: { id_usuario: derivedIdUsuario },
        app_metadata: {
          auth_source: "entra",
          entra_tenant_id: tid,
          entra_oid: oid,
        },
      });

      if (createError || !created.user) {
        console.error(JSON.stringify({ stage: "create_user", code: createError?.code, message: createError?.message }));
        return respond(500, { error: "server_error_create_user" });
      }
      authUserId = created.user.id;
    }

    // ── 9. Insert usuarios profile (handle trigger race) ──
    // The handle_new_user trigger may have already created the row via
    // AFTER UPDATE OF raw_app_meta_data. Use ON CONFLICT to avoid duplicates.
    const { error: insertError } = await admin
      .from("usuarios")
      .insert({
        id: authUserId,
        id_usuario: derivedIdUsuario,
        is_admin: shouldBeAdmin,
        entra_tenant_id: tid,
        entra_oid: oid,
      });

    if (insertError) {
      // Row may already exist from the trigger. Update it with Entra identity.
      const { error: updateError } = await admin
        .from("usuarios")
        .update({
          entra_tenant_id: tid,
          entra_oid: oid,
          is_admin: shouldBeAdmin,
        })
        .eq("id", authUserId)
        .is("entra_oid", null);

      if (updateError) {
        console.error(JSON.stringify({
          stage: "insert_or_update_usuarios",
          insert_code: insertError.code,
          update_code: updateError.code,
        }));
        return respond(500, { error: "server_error_profile" });
      }
    }

    return await generateSession(admin, publicClient, authUserId, {
      id_usuario: derivedIdUsuario,
      is_admin: shouldBeAdmin,
    }, upn);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ stage: "top_level_catch", message: msg }));
    return respond(500, { error: "server_error_unexpected" });
  }
});

async function generateSession(
  admin: ReturnType<typeof createClient>,
  publicClient: ReturnType<typeof createClient>,
  authUserId: string,
  profile: { id_usuario: string; is_admin: boolean },
  email: string,
): Promise<Response> {
  const { data: authUser, error: getUserError } = await admin.auth.admin.getUserById(authUserId);
  if (getUserError) {
    console.error(JSON.stringify({ stage: "get_user_by_id", code: getUserError.code, message: getUserError.message }));
    return respond(500, { error: "server_error_get_auth_user" });
  }
  const userEmail = email || authUser?.user?.email;
  if (!userEmail) {
    console.error(JSON.stringify({ stage: "get_user_by_id_no_email" }));
    return respond(500, { error: "server_error_missing_email" });
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userEmail,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error(JSON.stringify({ stage: "generate_link", code: linkError?.code, message: linkError?.message }));
    return respond(500, { error: "server_error_generate_session" });
  }

  const { data: session, error: verifyError } = await publicClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError || !session.session) {
    console.error(JSON.stringify({ stage: "verify_otp", code: verifyError?.code, message: verifyError?.message }));
    return respond(500, { error: "server_error_verify_session" });
  }

  return respond(200, {
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    id_usuario: profile.id_usuario,
    is_admin: profile.is_admin === true,
    email: userEmail,
  });
}

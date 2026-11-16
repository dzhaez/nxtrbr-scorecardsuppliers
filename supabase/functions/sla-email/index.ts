import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// sla-email: sends SLA reminder e-mails to owners (requisitantes).
//
// POST { ciclo?: string, owner?: string, dryRun?: boolean }
// - Caller must be an authenticated admin (verified via is_admin_user RPC with
//   the caller's JWT) OR the request must carry a valid admin service secret.
// - Reads SLA indicators from the get_sla_indicators() SECURITY DEFINER RPC.
// - dryRun returns the rendered e-mails without sending.
// - Sending uses RESEND_API_KEY when configured; otherwise it reports that
//   e-mail delivery is not configured yet (admin can still copy the content).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://nexteer-supplier-eval.bolt.app";
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "Nexteer Supplier Evaluation <onboarding@resend.dev>";

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface SlaRow {
  owner: string;
  email: string | null;
  total_suppliers: number;
  avaliados: number;
  pendentes: number;
  percentual_concluido: number;
  fornecedores_aguardando: number;
  dias_sem_avaliacao: number | null;
  ultimo_ciclo_import: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Nexteer-branded reminder e-mail (dark header + light body, logo from the app).
function buildEmailHtml(row: SlaRow, ciclo: string, toolUrl: string): string {
  const pct = Number(row.percentual_concluido ?? 0);
  const barColor = pct >= 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  const dias = row.dias_sem_avaliacao ?? 0;
  const diasLabel = row.avaliados > 0
    ? `${dias} dias desde a última avaliação`
    : `${dias} dias aguardando a primeira avaliação`;
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#101828;padding:28px 32px;" align="center">
            <img src="${APP_URL}/nexteer-logo-transparent.png" alt="Nexteer" width="180" style="display:block;margin:0 auto 12px;"/>
            <div style="color:#94a3b8;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Avaliação de Fornecedores</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#101828;">Olá, ${esc(row.owner)},</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:150%;color:#475569;">
              Este é um lembrete de SLA sobre as avaliações de fornecedores sob a sua responsabilidade
              no ciclo <strong>${esc(ciclo)}</strong>. Confira o andamento abaixo:
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
              <tr>
                <td width="33%" align="center" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 8px;">
                  <div style="font-size:26px;font-weight:700;color:#101828;">${pct}%</div>
                  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">concluído</div>
                </td>
                <td width="2%"></td>
                <td width="33%" align="center" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 8px;">
                  <div style="font-size:26px;font-weight:700;color:${barColor};">${dias}</div>
                  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">dias sem avaliação</div>
                </td>
                <td width="2%"></td>
                <td width="33%" align="center" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 8px;">
                  <div style="font-size:26px;font-weight:700;color:#dc2626;">${row.fornecedores_aguardando}</div>
                  <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">aguardando</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;font-size:13px;color:#475569;">${esc(diasLabel)}.</p>
            <p style="margin:0 0 20px;font-size:13px;color:#475569;">
              Fornecedores sob sua responsabilidade: <strong>${row.total_suppliers}</strong> &middot;
              Avaliados: <strong>${row.avaliados}</strong> &middot; Pendentes: <strong>${row.pendentes}</strong>
            </p>

            <div style="background:#f1f5f9;border-radius:8px;padding:14px;margin:0 0 24px;">
              <div style="font-size:12px;color:#64748b;margin-bottom:6px;">Progresso do ciclo</div>
              <div style="background:#e2e8f0;border-radius:999px;height:12px;overflow:hidden;">
                <div style="background:${barColor};height:12px;width:${Math.min(100, pct)}%;border-radius:999px;"></div>
              </div>
            </div>

            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="border-radius:8px;background:#e11d1d;">
                  <a href="${toolUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Acessar a ferramenta</a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:150%;">
              Ao acessar a ferramenta você encontra todas as informações em um só lugar:
              fornecedores pendentes, avaliações concluídas e o histórico por ciclo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;" align="center">
            <div style="font-size:11px;color:#94a3b8;">Nexteer &middot; Supplier Evaluation &middot; Mensagem automática de SLA</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      return { ok: false, error: `resend_${res.status}: ${bodyText.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return respond(405, { error: "method_not_allowed" });
  }

  try {
    const body = await req.json().catch(() => null);
    const ciclo = typeof body?.ciclo === "string" ? body.ciclo : null;
    const ownerFilter = typeof body?.owner === "string" ? body.owner : null;
    const dryRun = body?.dryRun === true;

    // ── Authorization: caller must be an admin (verify own JWT server-side) ──
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token || token === ANON_KEY) {
      return respond(401, { error: "not_authorized" });
    }

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: isAdmin, error: adminErr } = await callerClient.rpc("is_admin_user");
    if (adminErr || isAdmin !== true) {
      return respond(403, { error: "not_authorized" });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rows, error: rpcError } = await admin.rpc("get_sla_indicators", {
      p_ciclo: ciclo,
    });
    if (rpcError) {
      console.error(JSON.stringify({ stage: "sla_rpc", message: rpcError.message }));
      return respond(500, { error: "server_error_indicators" });
    }

    let slaRows = (rows ?? []) as SlaRow[];
    if (ownerFilter) {
      slaRows = slaRows.filter((r) => r.owner === ownerFilter);
    }

    const resolvedCiclo = ciclo ?? (slaRows.length > 0 ? "atual" : "atual");
    const results = [] as Array<{
      owner: string;
      email: string | null;
      sent: boolean;
      skipped?: string;
      error?: string;
      html?: string;
    }>;

    for (const row of slaRows) {
      if (!row.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) {
        results.push({ owner: row.owner, email: row.email, sent: false, skipped: "sem_email" });
        continue;
      }
      if (row.pendentes === 0) {
        results.push({ owner: row.owner, email: row.email, sent: false, skipped: "sem_pendencias" });
        continue;
      }
      const html = buildEmailHtml(row, resolvedCiclo, APP_URL);
      if (dryRun) {
        results.push({ owner: row.owner, email: row.email, sent: false, skipped: "dry_run", html });
        continue;
      }
      if (!RESEND_API_KEY) {
        results.push({ owner: row.owner, email: row.email, sent: false, error: "email_nao_configurado", html });
        continue;
      }
      const subject = `SLA Avaliação de Fornecedores - ciclo ${resolvedCiclo} - ${row.percentual_concluido}% concluído`;
      const send = await sendViaResend(row.email, subject, html);
      results.push({
        owner: row.owner,
        email: row.email,
        sent: send.ok,
        error: send.error,
        html: send.ok ? undefined : html,
      });
    }

    return respond(200, {
      ciclo: resolvedCiclo,
      email_delivery_configured: RESEND_API_KEY !== "",
      total: results.length,
      enviados: results.filter((r) => r.sent).length,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ stage: "top_level_catch", message: msg }));
    return respond(500, { error: "server_error_unexpected" });
  }
});

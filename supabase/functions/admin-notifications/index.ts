import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type DenoEnv = {
  get: (key: string) => string | undefined;
};

type DenoLike = {
  env: DenoEnv;
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const deno = (globalThis as { Deno?: DenoLike }).Deno;

if (!deno?.env || !deno?.serve) {
  throw new Error("Deno runtime is required for this Edge Function");
}

type AdminNotification = {
  id: string;
  type: "profile_pending" | "photo_pending";
  target_user_id: string | null;
  target_photo_id: string | null;
  status: "pending" | "sent" | "error";
  error_message: string | null;
  created_at: string;
};

const ADMIN_EMAIL = deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "lobido1988@gmail.com";
const EMAIL_FROM = deno.env.get("EMAIL_FROM") ?? "Couple2Couple <onboarding@resend.dev>";
const ADMIN_DASHBOARD_URL = deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://couple2couple.netlify.app/admin";
const RESEND_API_KEY = deno.env.get("RESEND_API_KEY") ?? "";
const CRON_SECRET = deno.env.get("NOTIFICATION_CRON_SECRET") ?? "";
const SUPABASE_URL = deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DEFAULT_BATCH_SIZE = 25;

const jsonHeaders = {
  "Content-Type": "application/json",
  "Connection": "keep-alive"
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders
  });
}

function truncateError(message: string, maxLen = 500) {
  if (message.length <= maxLen) return message;
  return `${message.slice(0, maxLen - 3)}...`;
}

function buildEmail(notification: AdminNotification) {
  const typeLabel = notification.type === "profile_pending" ? "нов потребител" : "нова снимка";
  const subject = notification.type === "profile_pending"
    ? "Couple2Couple: Нов потребител чака одобрение"
    : "Couple2Couple: Нова снимка чака одобрение";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Имате ${typeLabel} за одобрение</h2>
      <p style="margin: 0 0 8px;"><strong>Тип:</strong> ${notification.type}</p>
      <p style="margin: 0 0 8px;"><strong>User ID:</strong> ${notification.target_user_id ?? "—"}</p>
      <p style="margin: 0 0 8px;"><strong>Photo ID:</strong> ${notification.target_photo_id ?? "—"}</p>
      <p style="margin: 0 0 16px;"><strong>Създадено на:</strong> ${new Date(notification.created_at).toLocaleString("bg-BG")}</p>
      <a href="${ADMIN_DASHBOARD_URL}" style="display:inline-block;background:#2563eb;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Отвори Admin Panel</a>
    </div>
  `;

  return { subject, html };
}

async function sendEmail(subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [ADMIN_EMAIL],
      subject,
      html
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend error (${resp.status}): ${text}`);
  }
}

function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function markStatus(
  client: AdminClient,
  id: string,
  status: "sent" | "error",
  errorMessage: string | null
) {
  const { error } = await client
    .from("admin_notifications")
    .update({ status, error_message: errorMessage })
    .eq("id", id);

  if (error) {
    throw new Error(`DB update failed for notification ${id}: ${error.message}`);
  }
}

deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return response({ error: "Method Not Allowed" }, 405);
    }

    if (CRON_SECRET) {
      const authHeader = req.headers.get("authorization") ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (token !== CRON_SECRET) {
        return response({ error: "Unauthorized" }, 401);
      }
    }

    const client = createAdminClient();
    const url = new URL(req.url);
    const batchSize = Math.max(1, Math.min(Number(url.searchParams.get("batch") ?? DEFAULT_BATCH_SIZE), 100));

    const { data, error } = await client
      .from("admin_notifications")
      .select("id, type, target_user_id, target_photo_id, status, error_message, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (error) {
      throw new Error(`Failed to load notifications: ${error.message}`);
    }

    const notifications = (data ?? []) as AdminNotification[];
    if (!notifications.length) {
      return response({ processed: 0, sent: 0, failed: 0, message: "No pending notifications" });
    }

    let sent = 0;
    let failed = 0;

    for (const n of notifications) {
      try {
        const { subject, html } = buildEmail(n);
        await sendEmail(subject, html);
        await markStatus(client, n.id, "sent", null);
        sent += 1;
      } catch (error) {
        const errorMessage = truncateError(error instanceof Error ? error.message : String(error));
        await markStatus(client, n.id, "error", errorMessage);
        failed += 1;
      }
    }

    return response({ processed: notifications.length, sent, failed });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

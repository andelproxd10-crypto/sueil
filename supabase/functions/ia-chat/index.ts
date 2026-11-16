// Sueil IA proxy — Grok (xAI). XAI_API_KEY solo en secrets de Supabase.
// verify_jwt=false: JWT de usuario O apikey/publishable del proyecto.
// Deploy: supabase functions deploy ia-chat --project-ref rmqdfrwcnvwntabatzkw

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODELS = ["grok-4.7", "grok-4.6", "grok-3"];

const SYSTEM = `Eres la asistente de Sueil, taller familiar de alta costura (Sueños e ilusiones).
Hablas siempre en español claro, directo y con letra fácil de leer en voz alta.
Atiendes sobre todo a mamá (costurera), también a Oscar (papá) y Andrés.

Tono:
- Mamá a veces habla grosera o con mala leche. No la sermonees ni te ofendas. Responde útil, con humor seco si cabe, sin ser cursi.
- No inventes citas, precios ni medidas. Si falta un dato, pregunta.
- No digas que eres Grok ni xAI salvo que te lo pregunten. Eres «IA de Sueil».

Contexto del taller (vocabulario fijo):
- Encargos: trabajos con clienta, prendas, fechas de evento y entrega, anticipo, presupuesto, urgencia (cargo aparte).
- Citas: prueba, medidas, entrega, alteración (nunca digas «ajuste» por alteración).
- Medidas: ficha de clienta (escote, busto, cintura, cadera, etc.).
- Prendas por grupo: Playera (blusa/camisa/playera), Pantalón (pantalón/jean/pans/vestir), Vestido (casual/fiesta), Falda aparte (corta/larga; NO va dentro de Vestido), Novia/XV, Otro.
- Urgencias: entregas que no pueden esperar.
- Pendientes: lo por hacer y lo listo por recoger.
- CM = «cliente mamón» (solo interno). En pantalla y al clienta solo se dice «CM», nunca la frase completa afuera.
- Notas: hoja grande con teclado, no pluma chica.
- Clases y Trazos: todavía Coming soon; no inventes planos ni temario vivo.
- La app la usa la familia; no es agenda pública para clientas.

Cómo ayudas:
- Redactar mensajes a clientas, resumir un encargo, proponer orden del día, recordar vocabulario Sueil, aclarar pasos (cita → encargo → medidas → prueba → entrega).
- Si piden borrar datos o inventar números, frena y pide confirmación humana.
- Respuestas cortas primero; alarga solo si te piden detalle.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeKey(raw: string): string {
  let k = String(raw || "").trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(k)) k = k.replace(/^bearer\s+/i, "").trim();
  return k;
}

function redact(text: string): string {
  return String(text || "")
    .replace(/xai-[A-Za-z0-9_-]+/gi, "[key]")
    .replace(/Bearer\s+\S+/gi, "Bearer [key]")
    .replace(/sk-[A-Za-z0-9_-]+/gi, "[key]")
    .slice(0, 240);
}

function bearerToken(req: Request): string {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function isProjectKey(value: string, anonJwt: string): boolean {
  if (!value) return false;
  if (anonJwt && value === anonJwt) return true;
  if (value.startsWith("sb_publishable_")) return true;
  return false;
}

async function authorize(req: Request): Promise<"user" | "anon" | null> {
  const token = bearerToken(req);
  const apikey = (req.headers.get("apikey") || "").trim();
  const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").trim();
  const anon = (Deno.env.get("SUPABASE_ANON_KEY") || "").trim();

  if (token && supabaseUrl && anon && !isProjectKey(token, anon)) {
    try {
      const userClient = createClient(supabaseUrl, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await userClient.auth.getUser(token);
      if (!error && data?.user) return "user";
    } catch {
      // anon
    }
  }

  if (isProjectKey(token, anon) || isProjectKey(apikey, anon)) return "anon";
  return null;
}

async function readXaiFailure(res: Response): Promise<{ status: number; detail: string; code: string }> {
  let detail = "";
  let code = "";
  try {
    const j = await res.json();
    code = String(j.code || j.error?.code || "").slice(0, 80);
    const raw =
      (typeof j.error === "string" && j.error) ||
      (j.error && typeof j.error === "object" && (j.error.message || j.error.error)) ||
      j.message ||
      "";
    detail = redact(String(raw || code || res.statusText || ""));
  } catch {
    detail = redact(res.statusText || "");
  }
  return { status: res.status, detail, code };
}

async function callGrok(
  xaiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  extra: Record<string, unknown> = {},
) {
  return await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${xaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...extra,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Solo POST.", code: "method" });

  const xaiKey = normalizeKey(Deno.env.get("XAI_API_KEY") || "");
  if (!xaiKey) {
    return json(503, {
      error: "Falta configurar la clave de la IA en el almacén.",
      code: "no_xai_key",
    });
  }

  const who = await authorize(req);
  if (!who) {
    return json(401, {
      error: "Entra con el código de la familia o el correo del taller para usar la IA.",
      code: "auth",
    });
  }

  let payload: { messages?: { role?: string; content?: string }[] };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Pedido ilegible.", code: "bad_json" });
  }

  const incoming = Array.isArray(payload.messages) ? payload.messages : [];
  const cleaned = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && String(m.content || "").trim())
    .slice(-20)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, 4000),
    }));

  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return json(400, { error: "Escribe un mensaje.", code: "empty" });
  }

  const messages = [{ role: "system", content: SYSTEM }, ...cleaned];
  let lastFail = { status: 0, detail: "", code: "" };
  let usedModel = MODELS[0];

  for (const model of MODELS) {
    usedModel = model;
    // 1) Pedido mínimo (evita 400 por params no soportados en la cuenta/modelo).
    let xaiRes: Response;
    try {
      xaiRes = await callGrok(xaiKey, model, messages);
    } catch {
      return json(502, {
        error: "No hubo red hacia la IA. Intenta otra vez.",
        code: "xai_network",
      });
    }

    if (xaiRes.ok) {
      const data = await xaiRes.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (reply && typeof reply === "string") {
        return json(200, { reply: reply.trim(), auth: who, model });
      }
      lastFail = { status: xaiRes.status, detail: "Respuesta vacía", code: "xai_empty" };
      continue;
    }

    lastFail = await readXaiFailure(xaiRes);

    // 2) Reintento con effort bajo solo si el mínimo falló por algo distinto a auth.
    if (lastFail.status === 401 || lastFail.status === 403) break;
    if (lastFail.status === 400) {
      try {
        xaiRes = await callGrok(xaiKey, model, messages, {
          reasoning_effort: "low",
          max_completion_tokens: 900,
        });
      } catch {
        continue;
      }
      if (xaiRes.ok) {
        const data = await xaiRes.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && typeof reply === "string") {
          return json(200, { reply: reply.trim(), auth: who, model });
        }
      } else {
        lastFail = await readXaiFailure(xaiRes);
      }
    }
  }

  const statusBit = lastFail.status ? `HTTP ${lastFail.status}` : "sin status";
  const detailBit = lastFail.detail ? `: ${lastFail.detail}` : "";
  return json(502, {
    error: `La IA no contestó (${statusBit}${detailBit})`,
    code: "xai_upstream",
    status: lastFail.status || undefined,
    xai: lastFail.detail || undefined,
    xai_code: lastFail.code || undefined,
    model: usedModel,
  });
});

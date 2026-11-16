// Sueil IA proxy — Grok (xAI). XAI_API_KEY solo en secrets de Supabase.
// verify_jwt=false: autenticamos aquí (JWT de familia O apikey pública del proyecto).
// Deploy: supabase functions deploy ia-chat --project-ref rmqdfrwcnvwntabatzkw

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4.7";

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
- Respuestas cortas primero; alarga solo si te piden detalle.

Ejemplos:
Usuario: «esta clienta está bien mamona, qué le pongo en la nota»
Asistente: «Pon CM en la ficha y en la nota algo como: pide cambios a cada rato; confirmar todo por escrito antes de cortar.»

Usuario: «necesito una falda aparte del vestido o va junto»
Asistente: «Falda es grupo aparte. No la metas en Vestido. Elige Falda corta o Falda larga.»

Usuario: «arma el texto pa' avisar que ya está listo pa' recoger»
Asistente: «Hola, ya quedó listo tu encargo en Sueil. Puedes pasar a recogerlo cuando gustes. ¡Gracias!»`;

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

function bearerToken(req: Request): string {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function isProjectKey(value: string, anonJwt: string): boolean {
  if (!value) return false;
  if (anonJwt && value === anonJwt) return true;
  // Nueva clave publishable del cliente (ya es pública en la PWA).
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
      // sigue a anon
    }
  }

  // Tras código de familia en la PWA: se permite la apikey/publishable del proyecto.
  if (isProjectKey(token, anon) || isProjectKey(apikey, anon)) return "anon";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Solo POST.", code: "method" });

  const xaiKey = (Deno.env.get("XAI_API_KEY") || "").trim();
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

  let xaiRes: Response;
  try {
    xaiRes = await fetch(XAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        // Chat corto del taller: poco razonamiento para no tumbar el edge por tiempo.
        reasoning_effort: "low",
        temperature: 0.7,
        max_completion_tokens: 900,
        messages: [{ role: "system", content: SYSTEM }, ...cleaned],
      }),
    });
  } catch {
    return json(502, {
      error: "No hubo red hacia la IA. Intenta otra vez.",
      code: "xai_network",
    });
  }

  if (!xaiRes.ok) {
    // No reenviar cuerpo de xAI (puede filtrar detalles). Solo código HTTP.
    return json(502, {
      error: "La IA no contestó. Intenta otra vez en un momento.",
      code: "xai_upstream",
      status: xaiRes.status,
    });
  }

  const data = await xaiRes.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply || typeof reply !== "string") {
    return json(502, { error: "Respuesta vacía de la IA.", code: "xai_empty" });
  }

  return json(200, { reply: reply.trim(), auth: who });
});

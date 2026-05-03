import { corsHeaders } from "../_shared/cors.ts";

type AssistantMode = "general" | "report_description";

interface ChatRequest {
  message: string;
  mode?: AssistantMode;
  context?: {
    lakeName?: string;
    category?: string;
    severity?: number;
    locationHint?: string;
  };
}

const defaultApiUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const defaultModel = "qwen/qwen3.5-122b-a10b";

function buildSystemPrompt(mode: AssistantMode): string {
  if (mode === "report_description") {
    return [
      "You are EcoLake AI, helping users write accurate lake-pollution reports.",
      "Output only the improved report description text.",
      "Keep it concise (60-140 words), factual, and action-oriented.",
      "Do not invent details that are not provided.",
      "If details are missing, use neutral phrasing and avoid speculation.",
    ].join(" ");
  }

  return [
    "You are EcoLake AI assistant.",
    "Give practical, eco-friendly, safety-aware advice for lake cleanup and pollution reporting.",
    "Keep responses clear and concise.",
  ].join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AI_API_KEY");
    const apiUrl = Deno.env.get("AI_API_URL") ?? defaultApiUrl;
    const model = Deno.env.get("AI_MODEL") ?? defaultModel;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing AI_API_KEY secret" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as ChatRequest;
    const message = body?.message?.trim();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const mode: AssistantMode = body.mode ?? "general";
    const contextBits: string[] = [];

    if (body.context?.lakeName) {
      contextBits.push(`Lake: ${body.context.lakeName}`);
    }
    if (body.context?.category) {
      contextBits.push(`Pollution category: ${body.context.category}`);
    }
    if (typeof body.context?.severity === "number") {
      contextBits.push(`Severity: ${body.context.severity}/5`);
    }
    if (body.context?.locationHint) {
      contextBits.push(`Location hint: ${body.context.locationHint}`);
    }

    const contextualPrompt = contextBits.length > 0
      ? `${message}\n\nContext:\n- ${contextBits.join("\n- ")}`
      : message;

    const upstreamRes = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: mode === "report_description" ? 0.3 : 0.5,
        messages: [
          { role: "system", content: buildSystemPrompt(mode) },
          { role: "user", content: contextualPrompt },
        ],
      }),
    });

    const upstreamData = await upstreamRes.json();

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({
          error: "AI provider request failed",
          details: upstreamData?.error ?? upstreamData,
        }),
        {
          status: upstreamRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const reply = upstreamData?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        reply,
        usage: upstreamData?.usage ?? null,
        model,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

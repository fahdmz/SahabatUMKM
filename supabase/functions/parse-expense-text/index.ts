// Parses free-text expense entries ("Minyak 28rb, Ayam 150rb") into
// structured {description, amount} items via a self-hosted Ollama instance.
//
// This function only extracts/classifies — it never computes totals or
// writes to the database itself. The caller (CatatBelanja.jsx) shows the
// parsed items as a preview and only saves them after the user confirms.
//
// Requires two secrets set via `supabase secrets set`:
//   OLLAMA_BASE_URL  - e.g. https://your-ollama-host.example.com
//   OLLAMA_MODEL     - the model name pulled on that host (e.g. "llama3.1")
// Optional:
//   OLLAMA_API_KEY   - sent as `Authorization: Bearer <key>` if the host
//                       requires auth (recommended for anything public-facing)
//
// If OLLAMA_BASE_URL isn't set, or the call fails/times out, this returns
// an error and the frontend falls back to its local regex parser — expense
// recording never just breaks because the AI is unavailable.

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
        },
        required: ["description", "amount"],
      },
    },
    confidence: { type: "number" },
  },
  required: ["items", "confidence"],
};

const SYSTEM_PROMPT = `Kamu membantu mengubah catatan belanja warung yang ditulis santai (seperti chat WhatsApp) menjadi daftar barang terstruktur dalam JSON.

Aturan:
- Setiap barang punya "description" (nama barang) dan "amount" (harga dalam Rupiah, angka biasa, bukan string, tanpa "Rp").
- "rb" atau "ribu" berarti dikali 1000 (contoh: "26rb" jadi 26000).
- Abaikan satuan seperti "2L", "1kg", "sebungkus" — itu bukan bagian dari harga, hanya deskripsikan barangnya apa adanya.
- "confidence" adalah angka 0 sampai 1, seberapa yakin kamu terhadap keseluruhan hasil.
- Kalau teksnya sama sekali tidak bisa dibaca sebagai daftar belanja, kembalikan items kosong dan confidence rendah (di bawah 0.3).

Balas HANYA dengan JSON sesuai schema yang diberikan, tanpa penjelasan tambahan.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let text: unknown;

  try {
    const body = await req.json();
    text = body?.text;
  } catch {
    return jsonResponse({ error: "Body request tidak valid." }, 400);
  }

  if (typeof text !== "string" || !text.trim()) {
    return jsonResponse({ error: "Teks belanja kosong." }, 400);
  }

  const baseUrl = Deno.env.get("OLLAMA_BASE_URL");
  const model = Deno.env.get("OLLAMA_MODEL");
  const apiKey = Deno.env.get("OLLAMA_API_KEY");

  if (!baseUrl || !model) {
    return jsonResponse(
      { error: "AI parser belum dikonfigurasi (OLLAMA_BASE_URL/OLLAMA_MODEL)." },
      503
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let ollamaResponse: Response;

  try {
    ollamaResponse = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        format: RESPONSE_SCHEMA,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error("OLLAMA REQUEST FAILED:", error);
    return jsonResponse(
      { error: isTimeout ? "Asisten AI kelamaan merespons." : "Gagal menghubungi asisten AI." },
      isTimeout ? 504 : 502
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!ollamaResponse.ok) {
    const errText = await ollamaResponse.text();
    console.error("OLLAMA ERROR:", ollamaResponse.status, errText);
    return jsonResponse({ error: "Asisten AI gagal merespons." }, 502);
  }

  const ollamaData = await ollamaResponse.json();
  const rawContent = ollamaData?.message?.content;

  let parsed: { items: { description: string; amount: number }[]; confidence: number };

  try {
    parsed = JSON.parse(rawContent);

    if (
      !Array.isArray(parsed.items) ||
      typeof parsed.confidence !== "number"
    ) {
      throw new Error("Shape mismatch");
    }
  } catch (error) {
    console.error("PARSE ERROR:", error, rawContent);
    return jsonResponse({ error: "Hasil AI tidak sesuai format." }, 502);
  }

  return jsonResponse(
    {
      items: parsed.items,
      confidence: parsed.confidence,
      rawResponse: ollamaData,
    },
    200
  );
});

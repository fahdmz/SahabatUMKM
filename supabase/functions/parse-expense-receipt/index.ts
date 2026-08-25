// Parses a photographed receipt into structured {description, amount} items
// via a self-hosted Ollama vision model.
//
// Same contract as parse-expense-text: extracts/classifies only, never
// writes to the database or computes a total — the caller shows a preview
// and the user confirms before anything is saved.
//
// Requires (via `supabase secrets set`):
//   OLLAMA_BASE_URL     - e.g. https://your-ollama-host.example.com
//   OLLAMA_VISION_MODEL - a vision-capable model pulled on that host
//                         (e.g. "llama3.2-vision", "qwen2.5vl")
// Optional:
//   OLLAMA_API_KEY      - sent as `Authorization: Bearer <key>` if required
//
// There is no deterministic fallback for a photo (unlike the text parser) —
// if this fails, the frontend tells the user to type the expense instead.

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

const SYSTEM_PROMPT = `Kamu membaca foto nota/struk belanja warung dan mengubahnya jadi daftar barang terstruktur dalam JSON.

Aturan:
- Setiap barang punya "description" (nama barang, seringkas mungkin) dan "amount" (harga dalam Rupiah untuk baris itu, angka biasa tanpa "Rp" atau titik pemisah ribuan).
- Kalau ada quantity dan harga satuan, pakai harga TOTAL baris itu (quantity x harga satuan), bukan harga satuan saja.
- Abaikan baris yang bukan barang (subtotal, pajak, kembalian, nama toko, tanggal) kecuali diminta lain.
- "confidence" adalah angka 0 sampai 1, seberapa yakin kamu terhadap keseluruhan hasil — turunkan kalau foto buram atau struk sulit dibaca.
- Kalau foto sama sekali tidak bisa dibaca sebagai struk belanja, kembalikan items kosong dan confidence di bawah 0.3.

Balas HANYA dengan JSON sesuai schema yang diberikan, tanpa penjelasan tambahan.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let imageBase64: unknown;
  let mediaType: unknown;

  try {
    const body = await req.json();
    imageBase64 = body?.imageBase64;
    mediaType = body?.mediaType ?? "image/jpeg";
  } catch {
    return jsonResponse({ error: "Body request tidak valid." }, 400);
  }

  if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
    return jsonResponse({ error: "Foto struk kosong." }, 400);
  }

  const baseUrl = Deno.env.get("OLLAMA_BASE_URL");
  const model = Deno.env.get("OLLAMA_VISION_MODEL");
  const apiKey = Deno.env.get("OLLAMA_API_KEY");

  if (!baseUrl || !model) {
    return jsonResponse(
      { error: "AI pembaca struk belum dikonfigurasi (OLLAMA_BASE_URL/OLLAMA_VISION_MODEL)." },
      503
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

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
          {
            role: "user",
            content: "Baca struk belanja ini.",
            images: [imageBase64],
          },
        ],
        format: RESPONSE_SCHEMA,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error("OLLAMA VISION REQUEST FAILED:", error);
    return jsonResponse(
      { error: isTimeout ? "Asisten AI kelamaan membaca struk." : "Gagal menghubungi asisten AI." },
      isTimeout ? 504 : 502
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!ollamaResponse.ok) {
    const errText = await ollamaResponse.text();
    console.error("OLLAMA VISION ERROR:", ollamaResponse.status, errText);
    return jsonResponse({ error: "Asisten AI gagal membaca struk." }, 502);
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

// Turns already-computed dashboard numbers into one short, casual Indonesian
// sentence — e.g. "Hari ini kamu jualan Rp420.000, belanja Rp180.000.
// Ricebowl ayam masih paling laris."
//
// Rule: AI never computes numbers here. Every value in the request body is
// already deterministic (computed in Beranda.jsx from real sales/expenses
// rows) — this function only narrates them in plain language. It never
// touches the database.
//
// Requires (via `supabase secrets set`):
//   OLLAMA_BASE_URL  - e.g. https://your-ollama-host.example.com
//   OLLAMA_MODEL     - the model name pulled on that host
// Optional:
//   OLLAMA_API_KEY
//
// If unavailable, Beranda.jsx falls back to its existing hand-written
// sentences — the dashboard never shows nothing.

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `Kamu menulis satu kalimat ringkasan untuk dashboard warung kecil di Indonesia. Pembacanya ibu pemilik warung yang tidak paham istilah bisnis/akuntansi.

Aturan:
- Tulis 1-2 kalimat pendek saja, bahasa Indonesia santai, pakai "kamu" (bukan "Anda").
- JANGAN pakai istilah Inggris atau jargon (jangan "dashboard", "transaksi", "insight", "growth" — pakai "jualan", "belanja", "untung", "laku").
- JANGAN menghitung atau mengubah angka apa pun — hanya ceritakan ulang angka yang sudah diberikan, apa adanya.
- Kalau ada menu paling laku, sebutkan namanya. Kalau ada stok menipis, itu lebih penting untuk disebut daripada menu laku.
- Nada positif kalau untung positif, dan suportif (bukan menghakimi) kalau untung negatif.

Balas HANYA dengan kalimat ringkasannya, tanpa tanda kutip, tanpa penjelasan tambahan.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let payload: {
    untung?: number;
    totalMasuk?: number;
    totalBelanja?: number;
    growthPercent?: number;
    topMenuName?: string | null;
    topMenuPorsi?: number | null;
    urgentLowStockName?: string | null;
    urgentLowStockRemaining?: number | null;
  };

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid." }, 400);
  }

  const baseUrl = Deno.env.get("OLLAMA_BASE_URL");
  const model = Deno.env.get("OLLAMA_MODEL");
  const apiKey = Deno.env.get("OLLAMA_API_KEY");

  if (!baseUrl || !model) {
    return jsonResponse(
      { error: "AI narasi belum dikonfigurasi (OLLAMA_BASE_URL/OLLAMA_MODEL)." },
      503
    );
  }

  const userMessage = JSON.stringify({
    untung: payload.untung ?? 0,
    totalMasuk: payload.totalMasuk ?? 0,
    totalBelanja: payload.totalBelanja ?? 0,
    growthPercentDibandingKemarin: payload.growthPercent ?? 0,
    menuPalingLaku: payload.topMenuName
      ? { nama: payload.topMenuName, porsi: payload.topMenuPorsi }
      : null,
    stokMenipis: payload.urgentLowStockName
      ? { nama: payload.urgentLowStockName, sisaStok: payload.urgentLowStockRemaining }
      : null,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

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
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error("OLLAMA NARRATE REQUEST FAILED:", error);
    return jsonResponse(
      { error: isTimeout ? "Asisten AI kelamaan merespons." : "Gagal menghubungi asisten AI." },
      isTimeout ? 504 : 502
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!ollamaResponse.ok) {
    const errText = await ollamaResponse.text();
    console.error("OLLAMA NARRATE ERROR:", ollamaResponse.status, errText);
    return jsonResponse({ error: "Asisten AI gagal merespons." }, 502);
  }

  const ollamaData = await ollamaResponse.json();
  const narrative = ollamaData?.message?.content?.trim();

  if (!narrative) {
    return jsonResponse({ error: "Asisten AI tidak memberi jawaban." }, 502);
  }

  return jsonResponse({ narrative }, 200);
});

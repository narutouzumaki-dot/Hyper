/**
 * LUXION AI — Cloudflare Worker Backend
 * 
 * Proxies requests between the frontend and Google Gemini API securely.
 * Provider keys are stored in Cloudflare Worker Secrets (GEMINI_API_KEY).
 * 
 * Architecture:
 * Frontend -> Cloudflare Worker -> Gemini API -> Cloudflare Worker -> Frontend
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-luxion-client",
};

const LUXION_SYSTEM_INSTRUCTION = `You are LUXION, a highly capable personal AI assistant.
Your personality is intelligent, calm, confident, precise, and helpful. Communicate naturally and adapt explanations to the user's skill level.
Help with:
- General questions and explanations.
- Programming and debugging.
- Studying and learning.
- Writing and editing.
- Planning and organization.
- Supported document and image analysis.
- Brainstorming and creative work.
Explain complex subjects in manageable steps. When providing code, explain where it belongs and how to run it.
Be transparent about uncertainty, limitations, unavailable tools, and actions you have not performed.
Never pretend to access a device, account, file, website, or service unless the required capability is actually available and authorized.
Ask for confirmation before consequential actions such as deleting data, sending messages, publishing content, or changing important settings.
Protect user privacy. Do not request passwords, API secrets, or unnecessary sensitive information.
Your greeting is:
'LUXION online. How can I assist you today?'
Your tagline is:
'Beyond Intelligence. Beyond Limits.'`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "LUXION AI Cloudflare Worker",
          model: "gemini-3.8-flash",
          hasKey: Boolean(env.GEMINI_API_KEY),
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Cloudflare Worker: GEMINI_API_KEY secret is not set. Run 'wrangler secret put GEMINI_API_KEY'.",
        }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Route: Chat endpoint
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const { messages, userMessage, customInstruction } = body;

        let contents = [];
        if (Array.isArray(messages) && messages.length > 0) {
          contents = messages.map((m) => ({
            role: m.role === "assistant" || m.role === "model" ? "model" : "user",
            parts: [{ text: m.content }],
          }));
        } else if (userMessage) {
          contents = [{ role: "user", parts: [{ text: userMessage }] }];
        } else {
          return new Response(
            JSON.stringify({ error: "Missing prompt or messages payload." }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        const systemText = customInstruction
          ? `${LUXION_SYSTEM_INSTRUCTION}\n\nAdditional Guidance: ${customInstruction}`
          : LUXION_SYSTEM_INSTRUCTION;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemText }] },
            contents,
            generationConfig: {
              temperature: 0.7,
            },
          }),
        });

        if (!geminiRes.ok) {
          const errData = await geminiRes.text();
          return new Response(
            JSON.stringify({ error: `Gemini API error: ${errData}` }),
            { status: geminiRes.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        const data = await geminiRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "LUXION: Received no response.";

        return new Response(
          JSON.stringify({
            role: "model",
            content: reply,
            model: "gemini-3.8-flash",
            timestamp: new Date().toISOString(),
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || "Failed to process chat request." }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // Default fallback
    return new Response(
      JSON.stringify({
        message: "LUXION AI Cloudflare Worker is active. Use /api/chat or /api/health.",
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  },
};

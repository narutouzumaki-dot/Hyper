import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize GoogleGenAI server-side with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DEFAULT_MODEL = "gemini-3.8-flash";

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

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    name: "LUXION AI",
    tagline: "Beyond Intelligence. Beyond Limits.",
    version: "2.4.0",
    model: DEFAULT_MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userMessage, customInstruction } = req.body;

    if (!userMessage && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: "No prompt or conversation messages provided." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "LUXION Core: GEMINI_API_KEY is not configured in environment.",
      });
    }

    const systemInstruction = customInstruction
      ? `${LUXION_SYSTEM_INSTRUCTION}\n\nAdditional User Guidance: ${customInstruction}`
      : LUXION_SYSTEM_INSTRUCTION;

    // Build contents for multi-turn or single turn
    let contents: any[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    } else {
      contents = [{ role: "user", parts: [{ text: userMessage }] }];
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "LUXION: Neural link responded with an empty sequence.";
    return res.json({
      role: "model",
      content: reply,
      model: DEFAULT_MODEL,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[LUXION Chat Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to communicate with LUXION AI neural core.",
    });
  }
});

// File Analysis endpoint (handles Text, Code, PDF parsed text, JSON, CSV, and base64 Images)
app.post("/api/analyze-file", async (req, res) => {
  try {
    const { fileName, fileType, fileContent, base64Data, prompt, task } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "LUXION Core: GEMINI_API_KEY is not configured.",
      });
    }

    const isImage = fileType?.startsWith("image/") || (base64Data && !fileContent);
    const userPrompt =
      prompt ||
      (task === "summary"
        ? "Please summarize the core concepts, key data points, and actionable takeaways from this file in clear sections."
        : task === "insights"
        ? "Extract high-impact insights, trends, potential anomalies, and deep observations from this file."
        : task === "bugs"
        ? "Audit this file for logical errors, security vulnerabilities, edge-case risks, and formatting issues."
        : `Analyze this file (${fileName}) in detail, providing a breakdown of its contents, structure, and significance.`);

    let parts: any[] = [];

    if (isImage && base64Data) {
      // Strip potential data URL prefix if sent
      const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
      parts = [
        {
          inlineData: {
            mimeType: fileType || "image/png",
            data: cleanBase64,
          },
        },
        {
          text: `[File: ${fileName}]\n\nUser request: ${userPrompt}`,
        },
      ];
    } else {
      parts = [
        {
          text: `[File: ${fileName} | Type: ${fileType}]\n\nFILE CONTENT:\n\`\`\`\n${(fileContent || "").slice(0, 100000)}\n\`\`\`\n\nUSER PROMPT: ${userPrompt}`,
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts },
      config: {
        systemInstruction: LUXION_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    return res.json({
      analysis: response.text,
      fileName,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[LUXION File Analysis Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze file.",
    });
  }
});

// Study Mode Generator endpoint (Returns structured explanation, breakdown, quiz, and flashcards)
app.post("/api/study", async (req, res) => {
  try {
    const { topic, difficulty = "Intermediate", subject = "General" } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "GEMINI_API_KEY missing." });
    }

    const prompt = `You are LUXION's Adaptive Learning Core.
Create a comprehensive study module on the topic "${topic}" in the subject "${subject}" at "${difficulty}" difficulty level.
Return your output strictly as a JSON object matching this structure:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "explanation": "A clear, intuitive explanation with vivid analogies suited to the ${difficulty} level.",
  "keyConcepts": [
    { "name": "Concept Name", "description": "Crisp definition and importance" }
  ],
  "stepByStep": [
    { "stepNumber": 1, "title": "Phase/Step Title", "detail": "Concrete explanation of how this step works." }
  ],
  "flashcards": [
    { "front": "Question / Prompt", "back": "Clear concise answer or concept", "category": "Category name" }
  ],
  "practiceQuiz": [
    {
      "id": 1,
      "question": "Realistic scenario or knowledge check question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct and others are flawed"
    }
  ],
  "summary": "Crisp 3-bullet revision summary"
}
Provide at least 3-5 key concepts, 3-5 steps, 4-6 flashcards, and 3-4 practice quiz questions. Ensure clean valid JSON.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: LUXION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("[LUXION Study Mode Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate study module.",
    });
  }
});

// Coding Lab Assistant endpoint
app.post("/api/coding", async (req, res) => {
  try {
    const { code, language = "typescript", action = "explain", userQuestion } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code content is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "GEMINI_API_KEY missing." });
    }

    const actionPrompt =
      action === "debug"
        ? "Thoroughly inspect this code for syntax bugs, logical flaws, performance bottlenecks, and security vulnerabilities. Provide line-by-line findings and the complete corrected code."
        : action === "improve"
        ? "Refactor and optimize this code for modern best practices, readability, type safety, and computational efficiency. Explain what was changed and why."
        : action === "test"
        ? "Write comprehensive unit tests with edge cases and mock data for this code. Explain the test coverage and simulated behavior."
        : "Provide a crystal-clear, structured explanation of how this code works, explaining architectural choices, data structures, and algorithms used.";

    const prompt = `You are LUXION's Coding Lab Engine.
Language: ${language}
Target Action: ${action}
${userQuestion ? `Specific User Query: ${userQuestion}\n` : ""}

SOURCE CODE:
\`\`\`${language}
${code}
\`\`\`

TASK:
${actionPrompt}

Format your response in structured Markdown with:
1. Executive Overview / Diagnosis
2. Deep Dive Analysis
3. Recommended Code (in clean \`\`\`${language} blocks)
4. Key Takeaways & Caveats (clearly mention: this code was analyzed and simulated by LUXION AI, and should be verified in your target runtime).`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: LUXION_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    return res.json({
      result: response.text,
      language,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[LUXION Coding Lab Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to process coding request.",
    });
  }
});

// Vite middleware for dev or static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[LUXION AI] Neural Server operating on port ${PORT}`);
  });
}

startServer();

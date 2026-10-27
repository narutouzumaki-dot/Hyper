# LUXION AI — Ultimate AI Assistant

> **"Beyond Intelligence. Beyond Limits."**

LUXION AI is a futuristic personal AI assistant designed with an electric purple, neon cyan, and deep black interface for Android phones, tablets, and laptops.

---

## ⚡ System Architecture

```
[ Frontend: React 19 + Tailwind v4 + Lucide ]
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
[ Local Express Server ]   [ Cloudflare Worker ]
   (/server.ts on :3000)      (/worker/worker.js)
         │                     │
         └──────────┬──────────┘
                    ▼
     [ Google Gemini 3.8 Flash ]
                    │
   [ Supabase Auth & PostgreSQL ]
         (/database/schema.sql)
```

---

## 🚀 Key Features

1. **Neural Chat Engine**: Connected to `gemini-3.8-flash` via server proxy. Full conversation history, multiline text, copy responses, stop generation, and suggested prompts.
2. **Interactive AI Core Orb**: Central animated energy orb glowing with purple and cyan gradients, reacting to idle, listening, processing, speaking, and offline states with reduced-motion support.
3. **Voice Assistant**: Speech recognition for speech input, real-time transcript display, and text-to-speech spoken responses with voice picker and rate/pitch/volume controls.
4. **File Analysis Workspace**: Multimodal intelligence parsing PDFs, CSVs, JSON, Source Code, and Images using Gemini Vision.
5. **Study Mode**: Generates topic explanations, step-by-step breakdowns, 3D flip flashcards, practice quizzes with instant grading, and follow-up AI tutoring.
6. **Coding Lab**: Code editor with line numbers, language selection, AST debugging, optimization recommendations, and test simulation.
7. **Supabase Cloud Sync**: User profiles, conversations, and messages synchronized with PostgreSQL and protected by Row Level Security (RLS) policies. Includes offline Guest Mode fallback.
8. **Cloudflare Worker**: Standalone production worker script in `/worker/worker.js` ready for global edge deployment.

---

## 🛠️ Setup & Deployment Guide

### A. Local Run
```bash
npm install
npm run dev
```
The server runs on port 3000 with `server.ts` providing full backend endpoints (`/api/chat`, `/api/analyze-file`, `/api/study`, `/api/coding`, `/api/health`).

### B. Cloudflare Worker Deployment
1. Set the secret: `wrangler secret put GEMINI_API_KEY`
2. Deploy: `wrangler deploy` inside the `/worker` directory.
3. In LUXION AI Settings, enter your deployed Worker URL.

### C. Supabase Setup
1. In the Supabase Dashboard, open SQL Editor.
2. Run the SQL script from `/database/schema.sql`.
3. In LUXION AI Settings > Supabase Cloud Sync, enter your Project URL and Anon Key.

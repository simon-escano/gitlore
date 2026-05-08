# ⚡ Gitlore

**Portfolio Intelligence Platform — React GUI + API on Cloudflare's Edge.**

Gitlore transforms any GitHub repository into a structured, high-impact technical case study. The API runs on **Cloudflare Workers** and the frontend on **Cloudflare Pages** — both on the free tier at zero cost.

### 🔗 Try It Live
* 🌐 **React SPA Dashboard**: [https://web.gitlore.workers.dev](https://web.gitlore.workers.dev)
* ⚙️ **REST API Gateway**: [https://api.gitlore.workers.dev](https://api.gitlore.workers.dev)

> [!NOTE]
> Gitlore is completely free to run. Cloudflare Workers (100K req/day), Cloudflare Pages (unlimited sites), and Cerebras Cloud (free inference) — no credit card required.

---

## 🏗️ Architecture

```mermaid
graph LR
    A["Browser (React SPA)"] --> B["Cloudflare Pages"]
    B --> C["Cloudflare Worker (API)"]
    C --> D["GitHub REST API"]
    C --> E["Cerebras Cloud"]
```

This is a **pnpm monorepo** with two packages:

```
gitlore/
├── api/                    # Cloudflare Worker — Hono REST API
│   ├── src/
│   │   ├── index.ts        # Hono app with CORS
│   │   ├── routes/         # /api/generate + /api/generate/stream (SSE)
│   │   ├── modules/        # Ingestion (subrequest budget-capped), inference, validation
│   │   ├── schemas/        # Zod request/response schemas
│   │   └── lib/            # config, errors, constants, progress
│   ├── wrangler.toml
│   └── package.json
├── web/                    # Cloudflare Pages — React + Tailwind v4
│   ├── src/
│   │   ├── App.tsx         # Main app shell & workspaces
│   │   ├── components/     # Live JSON, Interactive Mermaid canvas editors
│   │   ├── layouts/        # Customizable portfolio layout
│   │   ├── lib/            # SSE client, theme, queue state
│   │   └── types/          # Frontend type definitions
│   ├── wrangler.toml
│   └── package.json
├── package.json            # Workspace root
└── pnpm-workspace.yaml
```

---

## 🖥️ Frontend & Workspace Features

| Feature | Description |
|---------|-------------|
| **Real-time Stages Progress** | SSE streaming captures step-by-step progress categorized into Ingestion, Inference, and Validation. Shows in a frosted Glassmorphism backdrop modal. |
| **Interactive Diagram Canvas** | Dual-pane Mermaid.js section showing live-rendered SVGs and a text editor simultaneously. Supports pan-and-zoom and real-time live editing of the architecture diagram. |
| **Live JSON Workspace Editor** | Syntax-highlighted, interactive JSON code editor with a floating copy-code trigger. Live edits synchronize instantly back into the visual Bento grid case study! |
| **Dual Bulk-Queue** | Queue multiple repositories for sequential processing, switching between queue previews with automatic result-caching. |
| **Collapsible Diagnostics** | Embedded "See more details" collapsible tray on pipeline errors displaying full backtrace stacks or JSON schemas. |
| **Theme System** | Dark / Light / System with smooth CSS animations and CSS-variable blending. |

---

## 📋 Input & Output Schemas

Gitlore utilizes strict, type-safe API contracts validated on Cloudflare's Edge using **Zod**.

### 📥 Request Input Contract
POST requests sent to `/api/generate` or `/api/generate/stream` accept the following payload:

```json
{
  "url": "https://github.com/owner/repo",                      // Required: GitHub repository HTTP URL
  "title": "My Project Title",                                 // Required: Catchy, readable title for the workspace
  "contributions": "Designed database schema, built API",      // Required: Raw text detailing your active contributions
  "context": "Optional extra system guidance or constraints",  // Optional: Extra guidelines for LLM steering
  "links": [                                                   // Optional: Custom links displayed alongside the title
    { "label": "Live Demo", "url": "https://demo.example.com" }
  ],
  "gallery": []                                                // Optional: Custom screenshot or mockup URLs
}
```

### 📤 Response Output Contract (`GitloreOutput`)
The API processes source code and returns a validated JSON structure mapping to this schema:

```json
{
  "_thinking": "Concise architectural system planning and analysis under 150 words.",
  "title": "Refined Professional Title",
  "one_liner": "A single sentence summary encapsulating the system's main value.",
  "contributions": "Polished comma-separated titles representing your core contributions.",
  "links": [
    { "icon": "github", "label": "GitHub", "url": "https://github.com/owner/repo" }
  ],
  "problem": "Operational pain-point or high-impact technical constraint solved by the project.",
  "goal": "The target engineering or product outcome.",
  "gallery": [],
  "key_features": [
    { "icon": "zap", "text": "Core feature description 1" },
    { "icon": "layers", "text": "Core feature description 2" },
    { "icon": "shield", "text": "Core feature description 3" }
  ],
  "architecture_diagram_code": "graph TD\n  A[\"Node A\"] --> B[\"Node B\"]", // Mermaid.js graph TD diagram
  "tech_stack": {
    "Primary": [
      { "name": "React" },
      { "name": "TypeScript" }
    ],
    "Supporting": [
      { "name": "Zod" },
      { "name": "TailwindCSS" }
    ],
    "Infrastructure": [
      { "name": "Cloudflare Workers" },
      { "name": "Cerebras Cloud" }
    ]
  },
  "stack_reason": "Architectural explanation explaining why this stack was selected.",
  "results": {
    "performance": { "icon": "zap", "text": "Performance acceleration achievements" },
    "scale": { "icon": "layers", "text": "Resource utilization & structural scalability gains" },
    "utility": { "icon": "shield", "text": "Reliability, safety, or workflow enhancement advantages" }
  }
}
```

---

## 📦 Setup

### Prerequisites
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- [Cerebras API key](https://cloud.cerebras.ai) (free)
- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io)

### 1. Clone & Install
```bash
git clone https://github.com/simon-escano/gitlore.git
cd gitlore
pnpm install
```

### 2. Configure API Secrets
```bash
cd api
npx wrangler login
npx wrangler secret put CEREBRAS_API_KEY
# Optional: npx wrangler secret put GITHUB_PAT
```

### 3. Local Development
```bash
# From the repo root:
pnpm dev          # Starts both API (8787) and Web (5173) in parallel
pnpm dev:api      # API only
pnpm dev:web      # Web only
```

Create `api/.dev.vars` for local API secrets:
```env
CEREBRAS_API_KEY=your_key_here
GITHUB_PAT=your_github_pat_here
```

For the frontend, create `web/.env` if you need a custom API URL:
```env
VITE_API_URL=http://localhost:8787
```

### 4. Deploy
```bash
pnpm deploy       # Deploys both API and Web to Cloudflare
pnpm deploy:api   # API only
pnpm deploy:web   # Web only
```

---

## 🎮 API Usage

The API has two endpoints:

### Standard (JSON response)
```bash
curl -X POST https://api.gitlore.workers.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://github.com/owner/repo", "title": "My Project", "contributions": "Built the API and database layer" }'
```

### Streaming (SSE with progress events)
```bash
curl -N -X POST https://api.gitlore.workers.dev/api/generate/stream \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://github.com/owner/repo", "title": "My Project", "contributions": "Built the API and database layer" }'
```

---

## 🎨 Customizing the Portfolio Layout

Edit `web/src/layouts/DefaultLayout.tsx` — this controls how your bento-grid portfolio output is rendered in the Preview tab. The component receives the full `GitloreOutput` as props, updating reactively on any live workspace edits.

---

## 📊 Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start both API + Web dev servers |
| `pnpm dev:api` | Start API dev server (port 8787) |
| `pnpm dev:web` | Start Web dev server (port 5173) |
| `pnpm deploy` | Deploy both to Cloudflare |
| `pnpm typecheck` | TypeScript check both packages |

---

## 💰 Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Cloudflare Workers | Free (100K req/day, max 50 subrequests/run) | **$0** |
| Cloudflare Pages | Free (unlimited sites) | **$0** |
| Cerebras Cloud | Free (rate-limited, high-speed Llama completions) | **$0** |
| GitHub REST API | Free (5K req/hr with GITHUB_PAT) | **$0** |
| **Total** | | **$0/month** |

---

## 🛡️ License
MIT

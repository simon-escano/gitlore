# ⚡ Gitlore

**Portfolio Intelligence Platform — React GUI + API on Cloudflare's Edge.**

Gitlore transforms any GitHub repository into a structured, high-impact technical case study. The API runs on **Cloudflare Workers** and the frontend on **Cloudflare Pages** — both on the free tier at zero cost.

> [!NOTE]
> Gitlore is completely free to run. Cloudflare Workers (100K req/day), Cloudflare Pages (unlimited sites), and Cerebras Cloud (free inference) — no credit card required.

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
│   │   ├── modules/        # ingestion, inference, validation
│   │   ├── schemas/        # Zod request/response schemas
│   │   └── lib/            # config, errors, constants, progress
│   ├── wrangler.toml
│   └── package.json
├── web/                    # Cloudflare Pages — React + Tailwind v4
│   ├── src/
│   │   ├── App.tsx         # Main app shell
│   │   ├── components/     # Input, Progress, Output components
│   │   ├── layouts/        # Customizable portfolio layout
│   │   ├── lib/            # SSE client, theme, queue state
│   │   └── types/          # Frontend type definitions
│   ├── wrangler.toml
│   └── package.json
├── package.json            # Workspace root
└── pnpm-workspace.yaml
```

## 🖥️ Frontend Features

| Feature | Description |
|---------|-------------|
| **Real-time Progress** | SSE streaming shows live ingestion/inference/validation events with Lucide icons |
| **Bulk Queue** | Queue multiple repos for sequential processing |
| **JSON View** | Syntax-highlighted output with copy-to-clipboard |
| **Preview View** | Rich portfolio card with Mermaid diagrams rendered as SVG |
| **Customizable Layout** | Edit `web/src/layouts/DefaultLayout.tsx` to change the output UI |
| **Theme System** | Dark / Light / System with smooth transitions |

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

## 🎨 Customizing the Portfolio Layout

Edit `web/src/layouts/DefaultLayout.tsx` — this single file controls how portfolio output is rendered in the Preview tab. The component receives the full `GitloreOutput` as props.

## 📊 Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start both API + Web dev servers |
| `pnpm dev:api` | Start API dev server (port 8787) |
| `pnpm dev:web` | Start Web dev server (port 5173) |
| `pnpm deploy` | Deploy both to Cloudflare |
| `pnpm typecheck` | TypeScript check both packages |

## 💰 Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Cloudflare Workers | Free (100K req/day) | **$0** |
| Cloudflare Pages | Free (unlimited sites) | **$0** |
| Cerebras Cloud | Free (rate-limited) | **$0** |
| GitHub REST API | Free (5K req/hr with PAT) | **$0** |
| **Total** | | **$0/month** |

## 🛡️ License
MIT

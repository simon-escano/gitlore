# Gitlore

Local-first portfolio intelligence API. Transforms GitHub repositories into structured, high-impact portfolio case studies using AI that runs entirely on your machine.

**Zero cloud cost. Zero API keys. Zero data leaving your machine.**

## Stack

- **Runtime:** Node.js + [Hono](https://hono.dev) + [@hono/node-server](https://github.com/honojs/node-server)
- **Inference:** [Ollama](https://ollama.com) (local, `llama3.1:8b` default)
- **Validation:** [Zod](https://zod.dev) schemas + Mermaid syntax checking
- **Language:** TypeScript (strict mode)

## Prerequisites

- **Arch Linux** (or any Linux)
- **Node.js** ≥ 22 (via `fnm`)
- **pnpm** (package manager)
- **Ollama** installed and running

```bash
# Install Ollama (Arch)
sudo pacman -S ollama

# Pull the default model (~4.7GB one-time download)
ollama pull llama3.1:8b
```

## Setup

```bash
# Clone and install
git clone https://github.com/yourusername/gitlore.git
cd gitlore
pnpm install

# Configure (optional — defaults work out of the box)
cp .env.example .env

# Start Ollama daemon (Terminal 1)
ollama serve

# Start Gitlore (Terminal 2)
pnpm dev
```

## Usage

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"owner":"denoland","repo":"deno"}'
```

### Response

Returns a structured JSON portfolio case study with:
- **Identity:** title, one-liner, contributions
- **Impact:** problem, goal, results (performance/scale/utility)
- **Tech Strategy:** stack breakdown with roles, reasoning
- **Visualization:** Mermaid.js architecture diagram
- **Execution:** links, key features with Lucide icons

### Health Check

```bash
curl http://localhost:3000/
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload (checks Ollama first) |
| `pnpm start` | Start production server |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm run check:ollama` | Verify Ollama daemon is running |
| `pnpm run health` | Check if Gitlore server is responding |

## Architecture

```
POST /api/generate → Ingestion → Inference → Validation → JSON Response
```

Three modules, synchronous pipeline, native `fetch()` everywhere. No SDKs, no cloud calls, no abstractions-for-abstractions.

## License

MIT

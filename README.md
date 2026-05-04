# ⚡ Gitlore
**High-performance Portfolio Intelligence API — Powered by Cerebras Cloud.**

Gitlore transforms any GitHub repository into a structured, high-impact technical case study. By migrating from local CPU inference to **Cerebras Wafer-Scale inference**, Gitlore now generates production-grade architectural analysis in seconds rather than minutes.

> [!NOTE]
> Gitlore was originally built for local-only LLM orchestration. While it now leverages Cerebras Cloud for speed, it maintains its "zero-cost" philosophy by utilizing the Cerebras Free Tier.

## 🚀 Performance
Results from sequential stress tests (Cerebras Llama 3.1-8B):

| Metric | Result |
|--------|--------|
| **Average Latency** | **8.68s** |
| **Fastest Run** | **7.86s** |
| **Throughput** | ~1,200 tokens/sec |
| **Reliability** | 100% (5/5 successful runs) |

## 🛠️ Stack
- **Inference:** [Cerebras Cloud](https://cloud.cerebras.ai) (Llama 3.1-8B)
- **Runtime:** Node.js + [Hono](https://hono.dev)
- **Validation:** [Zod](https://zod.dev) (Strict JSON enforcement)
- **Visuals:** [Mermaid.js](https://mermaid.js.org) (Dynamic architecture mapping)
- **Language:** TypeScript

## 📦 Setup

1. **Get a Cerebras API Key:**
   Sign up for free at [cloud.cerebras.ai](https://cloud.cerebras.ai).

2. **Clone & Install:**
   ```bash
   git clone https://github.com/simon-escano/gitlore.git
   cd gitlore
   pnpm install
   ```

3. **Configure Environment:**
   Create a `.env` file based on `.env.example`:
   ```env
   CEREBRAS_API_KEY=your_key_here
   CEREBRAS_MODEL=llama3.1-8b
   ```

4. **Start Development:**
   ```bash
   pnpm dev
   ```

## 🎮 Usage

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/simon-escano/gitlore",
    "title": "Gitlore - The Local AI Portfolio Builder",
    "role": "Lead Architect",
    "context": "Demonstrating high-performance LLM orchestration."
  }'
```

### Response Features
Returns a structured JSON payload ready for your portfolio site:
- **`_thinking`**: Chain-of-thought architectural analysis.
- **`architecture_diagram_code`**: File-level Mermaid.js system map.
- **`results`**: Qualitative and quantitative impact metrics.
- **`stack`**: Automatic tech stack discovery with roles.
- **`key_features`**: High-impact feature highlights with Lucide icons.

## 📊 Scripts
| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm start` | Start production server |
| `pnpm tsx scripts/benchmark.ts` | Run the performance stress test suite |

## 🛡️ License
MIT

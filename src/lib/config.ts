const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

/**
 * HARD GUARD: Only loopback addresses allowed for LLM inference.
 * Runs at import time — crashes the process if misconfigured.
 */
function assertLocalEndpoint(url: string): void {
  const parsed = new URL(url);
  const allowed = ["127.0.0.1", "localhost", "::1", "0.0.0.0"];
  if (!allowed.includes(parsed.hostname)) {
    throw new Error(
      `BLOCKED: "${parsed.hostname}" is not a local address. ` +
        `Gitlore only connects to local Ollama. ` +
        `Set OLLAMA_BASE_URL to http://127.0.0.1:11434`
    );
  }
}

assertLocalEndpoint(OLLAMA_BASE);

export const config = Object.freeze({
  ollama: {
    baseUrl: OLLAMA_BASE,
    model: OLLAMA_MODEL,
    chatEndpoint: `${OLLAMA_BASE}/api/chat`,
  },
  github: {
    pat: process.env.GITHUB_PAT ?? "",
    apiBase: "https://api.github.com",
  },
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  inference: {
    temperature: 0.3,
    maxContextChars: Number(process.env.MAX_CONTEXT_CHARS ?? 24000),
    numCtx: 8192,
  },
}) as const;

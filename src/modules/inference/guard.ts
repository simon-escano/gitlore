/**
 * Zero-API Guard.
 * Wraps native fetch to block any outbound LLM call that isn't to local Ollama.
 * Used exclusively by the inference module.
 */
export function guardedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const parsed = new URL(url);

  // Explicit blocklist of known cloud LLM providers
  const blocked = [
    "api.openai.com",
    "api.anthropic.com",
    "api.groq.com",
    "generativelanguage.googleapis.com",
    "api.mistral.ai",
    "api.cohere.ai",
    "api.together.xyz",
    "api.fireworks.ai",
    "api.deepseek.com",
  ];

  if (blocked.some((h) => parsed.hostname.includes(h))) {
    throw new Error(
      `BLOCKED: Attempted call to cloud LLM provider "${parsed.hostname}". ` +
        `This violates the Zero-API Policy. All inference must go through local Ollama.`
    );
  }

  // Allowlist: only loopback addresses
  const local = ["127.0.0.1", "localhost", "::1", "0.0.0.0"];
  if (!local.includes(parsed.hostname)) {
    throw new Error(
      `BLOCKED: Inference call to unknown host "${parsed.hostname}". ` +
        `Only loopback addresses are permitted for LLM inference.`
    );
  }

  return fetch(url, init);
}

export type Bindings = {
  CEREBRAS_API_KEY: string;
  CEREBRAS_MODEL?: string;
  GITHUB_PAT?: string;
  MAX_CONTEXT_CHARS?: string;
};

export interface AppConfig {
  cerebras: {
    apiKey: string;
    model: string;
    chatEndpoint: string;
  };
  github: {
    pat: string;
    apiBase: string;
  };
  inference: {
    temperature: number;
    maxContextChars: number;
    numCtx: number;
  };
}

export function getConfig(env: Bindings): AppConfig {
  if (!env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is required. Set it via `wrangler secret put CEREBRAS_API_KEY`.");
  }

  return Object.freeze({
    cerebras: {
      apiKey: env.CEREBRAS_API_KEY,
      model: env.CEREBRAS_MODEL ?? "llama3.1-8b",
      chatEndpoint: "https://api.cerebras.ai/v1/chat/completions",
    },
    github: {
      pat: env.GITHUB_PAT ?? "",
      apiBase: "https://api.github.com",
    },
    inference: {
      temperature: 0.2,
      maxContextChars: Number(env.MAX_CONTEXT_CHARS ?? "12000"),
      numCtx: 8192,
    },
  });
}

export type Bindings = {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  CEREBRAS_API_KEY?: string;
  CEREBRAS_MODEL?: string;
  GITHUB_PAT?: string;
  MAX_CONTEXT_CHARS?: string;
};

export interface AppConfig {
  gemini: {
    apiKey: string;
    model: string;
    apiBase: string;
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
  const apiKey = env.GEMINI_API_KEY || env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required. Set it via `wrangler secret put GEMINI_API_KEY` or in .dev.vars.");
  }

  const model = env.GEMINI_MODEL ?? env.CEREBRAS_MODEL ?? "gemini-3.6-flash";

  return Object.freeze({
    gemini: {
      apiKey,
      model,
      apiBase: "https://generativelanguage.googleapis.com/v1beta",
    },
    github: {
      pat: env.GITHUB_PAT ?? "",
      apiBase: "https://api.github.com",
    },
    inference: {
      temperature: 0.2,
      maxContextChars: Number(env.MAX_CONTEXT_CHARS ?? "16000"),
      numCtx: 8192,
    },
  });
}

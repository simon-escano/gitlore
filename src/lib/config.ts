import { z } from "zod";

const envSchema = z.object({
  CEREBRAS_API_KEY: z.string({ required_error: "CEREBRAS_API_KEY is required" }),
  CEREBRAS_MODEL: z.string().default("llama3.1-8b"),
  GITHUB_PAT: z.string().optional(),
  PORT: z.string().default("3000"),
  MAX_CONTEXT_CHARS: z.string().default("12000"),
});

const env = envSchema.parse(process.env);

export const config = Object.freeze({
  cerebras: {
    apiKey: env.CEREBRAS_API_KEY,
    model: env.CEREBRAS_MODEL,
    chatEndpoint: "https://api.cerebras.ai/v1/chat/completions",
  },
  github: {
    pat: env.GITHUB_PAT ?? "",
    apiBase: "https://api.github.com",
  },
  server: {
    port: Number(env.PORT),
  },
  inference: {
    temperature: 0.2,
    maxContextChars: Number(env.MAX_CONTEXT_CHARS),
    numCtx: 8192,
  },
}) as const;

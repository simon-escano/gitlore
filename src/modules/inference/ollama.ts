import { guardedFetch } from "./guard";
import { config } from "../../lib/config";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GitloreOutputSchema } from "../../schemas/response";
import { Errors } from "../../lib/errors";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { RepoContext } from "../ingestion/types";
import type { GitloreOutput } from "../../schemas/response";

// Convert Zod schema to JSON Schema for Ollama's `format` field.
// $refStrategy: "none" inlines everything — Ollama doesn't resolve $refs.
const OUTPUT_JSON_SCHEMA = zodToJsonSchema(GitloreOutputSchema, {
  $refStrategy: "none",
});

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export async function analyzeWithOllama(
  context: RepoContext
): Promise<GitloreOutput> {
  const body = {
    model: config.ollama.model,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(context) },
    ],
    format: OUTPUT_JSON_SCHEMA,
    stream: false,
    options: {
      temperature: config.inference.temperature,
      num_ctx: config.inference.numCtx,
    },
  };

  let res: Response;
  try {
    res = await guardedFetch(config.ollama.chatEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Connection refused = Ollama not running
    if (err instanceof TypeError && String(err.message).includes("fetch")) {
      throw Errors.ollamaDown();
    }
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    throw Errors.inferenceFailure(`Ollama returned ${res.status}: ${text}`);
  }

  const data = (await res.json()) as OllamaChatResponse;

  // Log inference stats for debugging
  if (data.eval_count && data.eval_duration) {
    const tokPerSec = (data.eval_count / (data.eval_duration / 1e9)).toFixed(1);
    console.log(
      `🧠 Inference complete: ${data.eval_count} tokens, ${tokPerSec} tok/s`
    );
  }

  // Parse raw JSON from model output
  let parsed: unknown;
  try {
    parsed = JSON.parse(data.message.content);
  } catch {
    throw Errors.inferenceFailure(
      "Model returned invalid JSON: " + data.message.content.slice(0, 200)
    );
  }

  // Zod validation as the final gatekeeper
  const result = GitloreOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw Errors.validationFailure(
      "Model output failed schema validation: " + result.error.message
    );
  }

  return result.data;
}

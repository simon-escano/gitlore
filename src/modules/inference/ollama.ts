import { guardedFetch } from "./guard";
import { config } from "../../lib/config";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GitloreOutputSchema } from "../../schemas/response";
import { Errors } from "../../lib/errors";
import type { InferenceContext } from "../ingestion/types";
import type { GitloreOutput } from "../../schemas/response";

interface OllamaStreamChunk {
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
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
}

export async function analyzeWithOllama(
  context: InferenceContext
): Promise<GitloreOutput> {
  const startTime = Date.now();

  const body = {
    model: config.ollama.model,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(context) },
    ],
    format: "json",
    stream: true,
    options: {
      temperature: config.inference.temperature,
      num_thread: config.inference.numThread,
      num_predict: 4000,
    },
  };

  console.log(`  ├─ Model: ${config.ollama.model}`);
  console.log(`  ├─ Endpoint: ${config.ollama.chatEndpoint}`);
  console.log(`  ├─ Sending prompt (stream mode)...`);

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

  if (!res.body) {
    throw Errors.inferenceFailure("Ollama returned no response body");
  }

  // Stream and accumulate tokens with live progress
  let fullContent = "";
  let tokenCount = 0;
  let lastProgressUpdate = Date.now();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Ollama streams newline-delimited JSON
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      let chunk: OllamaStreamChunk;
      try {
        chunk = JSON.parse(line);
      } catch {
        continue;
      }

      if (chunk.message?.content) {
        fullContent += chunk.message.content;
        tokenCount++;
      }

      // Print progress every 500ms to avoid flooding
      const now = Date.now();
      if (now - lastProgressUpdate > 500) {
        const elapsed = ((now - startTime) / 1000).toFixed(0);
        process.stdout.write(`\r  │  🧠 Generating... ${tokenCount} tokens | ${elapsed}s elapsed`);
        lastProgressUpdate = now;
      }

      // Final chunk — print stats
      if (chunk.done) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write("\n");

        if (chunk.eval_count && chunk.eval_duration) {
          const tokPerSec = (chunk.eval_count / (chunk.eval_duration / 1e9)).toFixed(1);
          console.log(`  ├─ Inference complete: ${chunk.eval_count} tokens in ${elapsed}s (${tokPerSec} tok/s)`);
        } else {
          console.log(`  ├─ Inference complete: ${tokenCount} tokens in ${elapsed}s`);
        }

        if (chunk.prompt_eval_count) {
          console.log(`  ├─ Prompt tokens evaluated: ${chunk.prompt_eval_count}`);
        }
      }
    }
  }

  console.log(`  ├─ Raw output: ${fullContent.length} chars`);

  // Parse raw JSON from model output
  let parsed: unknown;
  try {
    parsed = JSON.parse(fullContent);
  } catch {
    console.log(`  ├─ ✗ JSON parse failed. First 300 chars:`);
    console.log(`  │  ${fullContent.slice(0, 300)}`);
    throw Errors.inferenceFailure(
      "Model returned invalid JSON: " + fullContent.slice(0, 200)
    );
  }

  console.log(`  ├─ ✓ JSON parsed successfully`);

  // Zod validation as the final gatekeeper
  const result = GitloreOutputSchema.safeParse(parsed);
  if (!result.success) {
    console.log(`  ├─ ✗ Schema validation failed:`);
    console.log(`  │  ${result.error.message.slice(0, 300)}`);
    throw Errors.validationFailure(
      "Model output failed schema validation: " + result.error.message
    );
  }

  console.log(`  └─ ✓ Schema validation passed`);
  return result.data;
}


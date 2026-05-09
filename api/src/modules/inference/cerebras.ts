import type { AppConfig } from "../../lib/config";
import { noopProgress, type ProgressCallback } from "../../lib/progress";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GitloreOutputSchema } from "../../schemas/response";
import { Errors } from "../../lib/errors";
import type { InferenceContext } from "../ingestion/types";
import type { GitloreOutput } from "../../schemas/response";

/**
 * Safely escape any invalid raw control characters (like newlines, carriage returns, or tabs)
 * that occur inside JSON string values, preventing JSON.parse syntax errors.
 */
function escapeControlCharactersInStrings(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Clean up AI output before parsing JSON. Strips markdown fences,
 * single-line comments, and multi-line comments.
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();

  // 1. Remove markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();

  // 2. Remove single-line comments // that are not part of URLs
  cleaned = cleaned.replace(/(?<!http:|https:)\/\/.*$/gm, "");

  // 3. Remove multi-line comments /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  // 4. Safely escape invalid control characters inside JSON strings
  cleaned = escapeControlCharactersInStrings(cleaned);

  return cleaned.trim();
}

export async function analyzeWithCerebras(
  context: InferenceContext,
  config: AppConfig,
  onProgress: ProgressCallback = noopProgress
): Promise<GitloreOutput> {
  const startTime = Date.now();

  const body = {
    model: config.cerebras.model,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(context) },
    ],
    response_format: { type: "json_object" },
    temperature: config.inference.temperature,
    max_completion_tokens: 8192,
    stream: true,
  };

  onProgress({ phase: "inference", message: `Model: ${config.cerebras.model}` });
  onProgress({ phase: "inference", message: "Sending prompt to Cerebras Cloud..." });

  let res: Response;
  try {
    res = await fetch(config.cerebras.chatEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.cerebras.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw Errors.inferenceFailure(`Network error connecting to Cerebras: ${err}`);
  }

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      throw Errors.inferenceFailure("Invalid Cerebras API Key (401 Unauthorized)");
    }
    throw Errors.inferenceFailure(`Cerebras returned ${res.status}: ${text}`);
  }

  if (!res.body) {
    throw Errors.inferenceFailure("Cerebras returned no response body");
  }

  let fullContent = "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let ttftReported = false;
  let lastProgressAt = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;

      const jsonStr = trimmed.slice(6).trim();
      try {
        const chunk = JSON.parse(jsonStr);
        const content = chunk.choices?.[0]?.delta?.content;

        if (content) {
          if (!ttftReported) {
            const ttft = ((Date.now() - startTime) / 1000).toFixed(2);
            onProgress({ phase: "inference", message: `Time to first token: ${ttft}s` });
            ttftReported = true;
          }
          fullContent += content;
        }
      } catch {
        continue;
      }
    }

    // Throttle streaming progress updates to every 500ms
    const now = Date.now();
    if (now - lastProgressAt > 500) {
      onProgress({
        phase: "inference",
        message: "Generating...",
        detail: `${fullContent.length.toLocaleString()} chars received`,
      });
      lastProgressAt = now;
    }
  }

  // Process any remaining content left in the buffer at stream end
  if (buffer.length > 0) {
    const trimmed = buffer.trim();
    if (trimmed && trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
      const jsonStr = trimmed.slice(6).trim();
      try {
        const chunk = JSON.parse(jsonStr);
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
        }
      } catch {}
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  onProgress({
    phase: "inference",
    message: `Inference complete in ${elapsed}s`,
    detail: `${fullContent.length.toLocaleString()} chars total`,
  });

  const cleanedContent = cleanJsonString(fullContent);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedContent);
  } catch (err: any) {
    console.error("[Cerebras JSON Parse Error]", err);
    throw Errors.inferenceFailure(
      `Cerebras returned invalid JSON: ${err.message}. Raw output snippet (first 2000 chars):\n${cleanedContent.slice(0, 2000)}`
    );
  }

  onProgress({ phase: "inference", message: "JSON parsed successfully" });

  const result = GitloreOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw Errors.validationFailure("Model output failed schema validation: " + result.error.message);
  }

  return result.data;
}

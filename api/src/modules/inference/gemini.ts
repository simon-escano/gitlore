import type { AppConfig } from "../../lib/config";
import { noopProgress, type ProgressCallback } from "../../lib/progress";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GitloreOutputSchema } from "../../schemas/response";
import { Errors } from "../../lib/errors";
import type { InferenceContext } from "../ingestion/types";
import type { GitloreOutput } from "../../schemas/response";

/**
 * Safely escape any invalid raw control characters (like unescaped newlines, carriage returns, or tabs)
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

export async function analyzeWithGemini(
  context: InferenceContext,
  config: AppConfig,
  onProgress: ProgressCallback = noopProgress
): Promise<GitloreOutput> {
  const startTime = Date.now();

  const endpoint = `${config.gemini.apiBase}/models/${config.gemini.model}:streamGenerateContent?alt=sse&key=${config.gemini.apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt() }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: buildUserPrompt(context) }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: config.inference.temperature,
    },
  };

  onProgress({ phase: "inference", message: `Model: ${config.gemini.model}` });
  onProgress({ phase: "inference", message: "Sending prompt to Google Gemini..." });

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw Errors.inferenceFailure(`Network error connecting to Gemini API: ${err}`);
  }

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw Errors.inferenceFailure("Invalid Gemini API Key or permissions issue (401/403)");
    }
    if (res.status === 429) {
      throw Errors.inferenceFailure("Gemini API rate limit exceeded (429). Please try again shortly.");
    }
    if (res.status === 503) {
      throw Errors.inferenceFailure("Gemini model is currently experiencing high demand (503). Please retry in a moment.");
    }
    throw Errors.inferenceFailure(`Gemini returned ${res.status}: ${text}`);
  }

  if (!res.body) {
    throw Errors.inferenceFailure("Gemini returned no response body");
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
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const jsonStr = trimmed.slice(6).trim();
      try {
        const chunk = JSON.parse(jsonStr);
        const parts = chunk.candidates?.[0]?.content?.parts;

        if (parts && Array.isArray(parts)) {
          for (const part of parts) {
            if (part.text) {
              if (!ttftReported) {
                const ttft = ((Date.now() - startTime) / 1000).toFixed(2);
                onProgress({ phase: "inference", message: `Time to first token: ${ttft}s` });
                ttftReported = true;
              }
              fullContent += part.text;
            }
          }
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
        message: "Generating portfolio case study...",
        detail: `${fullContent.length.toLocaleString()} chars received`,
      });
      lastProgressAt = now;
    }
  }

  // Process any remaining content in the buffer at stream end
  if (buffer.length > 0) {
    const trimmed = buffer.trim();
    if (trimmed && trimmed.startsWith("data: ")) {
      const jsonStr = trimmed.slice(6).trim();
      try {
        const chunk = JSON.parse(jsonStr);
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (parts && Array.isArray(parts)) {
          for (const part of parts) {
            if (part.text) {
              fullContent += part.text;
            }
          }
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
    console.error("[Gemini JSON Parse Error]", err);
    throw Errors.inferenceFailure(
      `Gemini returned invalid JSON: ${err.message}. Raw output snippet (first 2000 chars):\n${cleanedContent.slice(0, 2000)}`
    );
  }

  onProgress({ phase: "inference", message: "JSON parsed successfully" });

  const result = GitloreOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw Errors.validationFailure("Model output failed schema validation: " + result.error.message);
  }

  return result.data;
}

// Keep backwards-compatible alias
export const analyzeWithCerebras = analyzeWithGemini;

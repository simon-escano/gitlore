import type { AppConfig } from "../../lib/config";
import { noopProgress, type ProgressCallback } from "../../lib/progress";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GitloreOutputSchema } from "../../schemas/response";
import { Errors } from "../../lib/errors";
import type { InferenceContext } from "../ingestion/types";
import type { GitloreOutput } from "../../schemas/response";

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

    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

      const jsonStr = line.slice(6);
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

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  onProgress({
    phase: "inference",
    message: `Inference complete in ${elapsed}s`,
    detail: `${fullContent.length.toLocaleString()} chars total`,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(fullContent);
  } catch {
    throw Errors.inferenceFailure("Cerebras returned invalid JSON: " + fullContent.slice(0, 200));
  }

  onProgress({ phase: "inference", message: "JSON parsed successfully" });

  const result = GitloreOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw Errors.validationFailure("Model output failed schema validation: " + result.error.message);
  }

  return result.data;
}

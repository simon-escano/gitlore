import { config } from "../../lib/config";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { GitloreOutputSchema } from "../../schemas/response";
import { Errors } from "../../lib/errors";
import type { InferenceContext } from "../ingestion/types";
import type { GitloreOutput } from "../../schemas/response";

export async function analyzeWithCerebras(
  context: InferenceContext
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
    max_completion_tokens: 4000,
    stream: true,
  };

  console.log(`  ├─ Provider: Cerebras Cloud (WSE-3)`);
  console.log(`  ├─ Model: ${config.cerebras.model}`);
  console.log(`  ├─ Sending prompt to api.cerebras.ai...`);

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
  let lastProgressUpdate = Date.now();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let ttftReported = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Cerebras returns OpenAI SSE format: "data: {...}\n\n"
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
            console.log(`  ├─ TTFT (Time to First Token): ${ttft}s`);
            ttftReported = true;
          }
          fullContent += content;
        }
      } catch (e) {
        continue;
      }
    }

    const now = Date.now();
    if (now - lastProgressUpdate > 100) {
      process.stdout.write(`\r  │  🧠 Generating stream... ${fullContent.length} chars received`);
      lastProgressUpdate = now;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  process.stdout.write("\n");
  console.log(`  ├─ Inference complete in ${elapsed}s`);
  console.log(`  ├─ Raw output: ${fullContent.length} chars`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(fullContent);
  } catch {
    console.log(`  ├─ ✗ JSON parse failed.`);
    throw Errors.inferenceFailure(
      "Cerebras returned invalid JSON: " + fullContent.slice(0, 200)
    );
  }

  console.log(`  ├─ ✓ JSON parsed successfully`);

  const result = GitloreOutputSchema.safeParse(parsed);
  if (!result.success) {
    console.log(`  ├─ ✗ Schema validation failed`);
    throw Errors.validationFailure(
      "Model output failed schema validation: " + result.error.message
    );
  }

  console.log(`  └─ ✓ Schema validation passed`);
  return result.data;
}

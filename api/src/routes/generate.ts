import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { GenerateRequestSchema } from "../schemas/request";
import { ingestRepository } from "../modules/ingestion/packer";
import { analyzeWithCerebras } from "../modules/inference/cerebras";
import { validateOutput } from "../modules/validation/schema";
import { GitloreError, Errors } from "../lib/errors";
import { getConfig, type Bindings } from "../lib/config";
import { noopProgress, type ProgressCallback } from "../lib/progress";

type Env = { Bindings: Bindings };

export const generateRoute = new Hono<Env>();

/** Shared pipeline logic used by both the regular and SSE endpoints */
async function runPipeline(
  env: Bindings,
  body: unknown,
  onProgress: ProgressCallback = noopProgress
) {
  const requestStart = Date.now();
  const config = getConfig(env);

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw Errors.invalidInput(
      `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { url, title, contributions, context, gallery, links } = parsed.data;

  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw Errors.invalidInput(
      "URL must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)"
    );
  }
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  console.log(`⚡ POST /api/generate — ${owner}/${repo}`);

  // Step 1: Ingest
  onProgress({ phase: "ingestion", message: `Starting ingestion for ${owner}/${repo}` });
  const repoContext = await ingestRepository(owner, repo, config, onProgress);

  const inferenceContext = { ...repoContext, title, contributions, context, gallery, links };

  // Step 2: Inference
  onProgress({ phase: "inference", message: "Sending to Cerebras Cloud..." });
  const output = await analyzeWithCerebras(inferenceContext, config, onProgress);

  // Step 3: Validation
  onProgress({ phase: "validation", message: "Running schema validation..." });
  const validation = validateOutput(output);
  if (!validation.success) {
    throw Errors.validationFailure(validation.error);
  }
  onProgress({ phase: "validation", message: "Schema + Mermaid validation passed" });

  validation.data.gallery = gallery;

  // Merge custom user-supplied links into output links
  if (links && links.length > 0) {
    const existingUrls = new Set(validation.data.links.map((l) => l.url.toLowerCase().trim()));
    const mergedLinks = [...validation.data.links];
    for (const link of links) {
      const trimmedUrl = link.url.trim();
      if (!existingUrls.has(trimmedUrl.toLowerCase())) {
        const isGithub = trimmedUrl.includes("github.com");
        mergedLinks.push({
          icon: isGithub ? "github" : "link",
          label: link.label.trim(),
          url: trimmedUrl,
        });
      }
    }
    validation.data.links = mergedLinks;
  }

  const totalElapsed = ((Date.now() - requestStart) / 1000).toFixed(1);
  console.log(`✅ Generated in ${totalElapsed}s`);

  return validation.data;
}

/** Original JSON endpoint (backwards compatible) */
generateRoute.post("/generate", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw Errors.invalidInput("Request body must be valid JSON");
  }

  const data = await runPipeline(c.env, body);
  return c.json({ data });
});

/** SSE streaming endpoint with progress events */
generateRoute.post("/generate/stream", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw Errors.invalidInput("Request body must be valid JSON");
  }

  // Prevent Wrangler/CF buffering
  c.header("Content-Encoding", "Identity");

  return streamSSE(c, async (stream) => {
    let eventId = 0;

    const onProgress: ProgressCallback = (event) => {
      stream.writeSSE({
        event: "progress",
        data: JSON.stringify(event),
        id: String(++eventId),
      });
    };

    try {
      const data = await runPipeline(c.env, body, onProgress);

      await stream.writeSSE({
        event: "result",
        data: JSON.stringify({ data }),
        id: String(++eventId),
      });
    } catch (err) {
      // Console log on server with stack trace for detailed tracking
      console.error("[Pipeline Streaming Error]", err);

      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      const code = err instanceof GitloreError ? err.code : "INTERNAL_ERROR";
      const details = err instanceof GitloreError ? err.details : (err instanceof Error ? err.stack : undefined);

      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          error: {
            code,
            message,
            ...(details ? { details } : {}),
          },
        }),
        id: String(++eventId),
      });
    }
  });
});

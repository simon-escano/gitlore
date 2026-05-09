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

/**
 * Sanitizes and remediates common LLM hallucinations or literal example copies,
 * replacing them with domain-appropriate, highly polished alternatives.
 */
function sanitizeAndRemediate(
  data: any,
  owner: string,
  repo: string,
  title: string
) {
  const lowercaseProblem = (data.problem || "").toLowerCase();
  
  // 1. Core Problem Statement Remediation
  if (
    lowercaseProblem.includes("shopping events") ||
    lowercaseProblem.includes("abandon their carts") ||
    lowercaseProblem.includes("slow database query response") ||
    lowercaseProblem.includes("optimizes postgres database speed")
  ) {
    if (repo.toLowerCase() === "gitlore" || title.toLowerCase() === "gitlore") {
      data.problem = "Developers struggle to manually transform their repositories into polished, high-impact technical portfolios, making it hard to showcase their contributions to recruiters.";
    } else {
      data.problem = `Traditional approaches to building, configuring, and scaling ${title} systems are highly manual, complex, and difficult to optimize for real-world performance.`;
    }
  }

  // 2. Results and Performance Metrics Remediation
  if (data.results) {
    if (data.results.performance && (
      data.results.performance.text.includes("30%") || 
      data.results.performance.text.toLowerCase().includes("reduced cold start")
    )) {
      if (repo.toLowerCase() === "gitlore" || title.toLowerCase() === "gitlore") {
        data.results.performance.text = "Optimizes edge routing latency and request handling using Cloudflare Workers' lightweight architecture.";
      } else {
        data.results.performance.text = `Optimizes runtime latency and response speeds using a highly optimized architectural flow.`;
      }
    }

    if (data.results.scale && (
      data.results.scale.text.includes("1000+") ||
      data.results.scale.text.toLowerCase().includes("concurrent requests")
    )) {
      if (repo.toLowerCase() === "gitlore" || title.toLowerCase() === "gitlore") {
        data.results.scale.text = "Maintains high concurrency and zero server overhead using stateless globally-distributed edge nodes.";
      } else {
        data.results.scale.text = `Enables seamless horizontal scaling and high concurrency across distributed infrastructure.`;
      }
    }
  }
}

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

  // Step 4: Remediation & Sanitization
  sanitizeAndRemediate(validation.data, owner, repo, title);

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

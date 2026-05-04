import { Hono } from "hono";
import { GenerateRequestSchema } from "../schemas/request";
import { ingestRepository } from "../modules/ingestion/packer";
import { analyzeWithOllama } from "../modules/inference/ollama";
import { validateOutput } from "../modules/validation/schema";
import { GitloreError, Errors } from "../lib/errors";

export const generateRoute = new Hono();

generateRoute.post("/generate", async (c) => {
  const requestStart = Date.now();

  // Parse and validate request body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw Errors.invalidInput("Request body must be valid JSON");
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw Errors.invalidInput(
      `Invalid request: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const { owner, repo, context } = parsed.data;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`⚡ POST /api/generate — ${owner}/${repo}`);
  console.log(`   ${new Date().toISOString()}`);
  if (context) console.log(`   Context: "${context.slice(0, 80)}${context.length > 80 ? "..." : ""}"`);
  console.log(`${"─".repeat(60)}`);

  // Step 1: Ingest repository
  console.log(`\n📦 STEP 1/3: Ingestion`);
  const repoContext = await ingestRepository(owner, repo);

  console.log(
    `\n📦 Ingested: ${repoContext.fileTree.length} files discovered, ${repoContext.packedSource.length.toLocaleString()} chars packed`
  );

  // Step 2: Run inference
  console.log(`\n🧠 STEP 2/3: Inference`);
  const output = await analyzeWithOllama(repoContext);

  // Step 3: Validate output (second Zod pass + Mermaid check)
  console.log(`\n✔  STEP 3/3: Validation`);
  const validation = validateOutput(output);
  if (!validation.success) {
    console.log(`   ✗ Validation failed: ${validation.error}`);
    throw Errors.validationFailure(validation.error);
  }
  console.log(`   ✓ Schema + Mermaid validation passed`);

  const totalElapsed = ((Date.now() - requestStart) / 1000).toFixed(1);
  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅ Case study generated for ${owner}/${repo} in ${totalElapsed}s`);
  console.log(`   Title: "${validation.data.title}"`);
  console.log(`   Stack: ${validation.data.stack.map(s => s.name).join(", ")}`);
  console.log(`${"═".repeat(60)}\n`);

  return c.json({ data: validation.data });
});

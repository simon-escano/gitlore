import { Hono } from "hono";
import { GenerateRequestSchema } from "../schemas/request";
import { ingestRepository } from "../modules/ingestion/packer";
import { analyzeWithOllama } from "../modules/inference/ollama";
import { validateOutput } from "../modules/validation/schema";
import { GitloreError, Errors } from "../lib/errors";

export const generateRoute = new Hono();

generateRoute.post("/generate", async (c) => {
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

  const { owner, repo } = parsed.data;

  console.log(`📦 Ingesting ${owner}/${repo}...`);

  // Step 1: Ingest repository
  const context = await ingestRepository(owner, repo);

  console.log(
    `📦 Ingested: ${context.fileTree.length} files, ${context.packedSource.length} chars packed`
  );
  console.log(`🧠 Sending to Ollama...`);

  // Step 2: Run inference
  const output = await analyzeWithOllama(context);

  // Step 3: Validate output (second Zod pass + Mermaid check)
  const validation = validateOutput(output);
  if (!validation.success) {
    throw Errors.validationFailure(validation.error);
  }

  console.log(`✅ Generated case study for ${owner}/${repo}`);

  return c.json({ data: validation.data });
});

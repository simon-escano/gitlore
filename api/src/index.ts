import { Hono } from "hono";
import { generateRoute } from "./routes/generate";
import { GitloreError } from "./lib/errors";
import type { Bindings } from "./lib/config";

type Env = { Bindings: Bindings };

const app = new Hono<Env>();

// Health check / info endpoint
app.get("/", (c) => {
  const model = c.env.CEREBRAS_MODEL ?? "llama3.1-8b";
  return c.json({
    name: "gitlore",
    version: "1.0.0",
    status: "running",
    model,
    provider: "cerebras",
    runtime: "cloudflare-workers",
  });
});

// Mount API routes
app.route("/api", generateRoute);

// Global error handler
app.onError((err, c) => {
  if (err instanceof GitloreError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      err.status as 400 | 404 | 403 | 422 | 502 | 503
    );
  }

  // Unknown errors
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "An unexpected error occurred",
      },
    },
    500
  );
});

export default app;

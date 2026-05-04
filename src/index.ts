import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { generateRoute } from "./routes/generate";
import { GitloreError } from "./lib/errors";
import { config } from "./lib/config";

const app = new Hono();

// Health check / info endpoint
app.get("/", (c) =>
  c.json({
    name: "gitlore",
    version: "1.0.0",
    status: "running",
    model: config.cerebras.model,
    provider: "cerebras",
  })
);

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

// Start server
console.log(`⚡ Gitlore running on http://localhost:${config.server.port}`);
console.log(`🧠 Model: ${config.cerebras.model} @ Cerebras Cloud`);

serve({
  fetch: app.fetch,
  port: config.server.port,
});

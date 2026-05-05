import type { GenerateRequest, ProgressEvent, GitloreOutput } from "../types/gitlore";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.gitlore.workers.dev";

interface StreamCallbacks {
  onProgress: (event: ProgressEvent) => void;
  onResult: (data: GitloreOutput) => void;
  onError: (error: string) => void;
}

/**
 * Calls the SSE streaming endpoint and dispatches progress/result/error events.
 * Returns an AbortController so the caller can cancel the request.
 */
export function streamGenerate(
  request: GenerateRequest,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_URL}/api/generate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
        callbacks.onError(body.error?.message ?? `Request failed with status ${res.status}`);
        return;
      }

      if (!res.body) {
        callbacks.onError("No response body received");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (currentEvent === "progress") {
                callbacks.onProgress(parsed as ProgressEvent);
              } else if (currentEvent === "result") {
                callbacks.onResult(parsed.data as GitloreOutput);
              } else if (currentEvent === "error") {
                callbacks.onError(parsed.error?.message ?? "Unknown error");
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        callbacks.onError((err as Error).message ?? "Network error");
      }
    }
  })();

  return controller;
}

/** Simple non-streaming fetch for the health endpoint */
export async function fetchHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/`);
  return res.json();
}

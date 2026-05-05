import type { GenerateRequest, ProgressEvent, GitloreOutput } from "../types/gitlore";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.gitlore.workers.dev";

interface StreamCallbacks {
  onProgress: (event: ProgressEvent) => void;
  onResult: (data: GitloreOutput) => void;
  onError: (error: string, details?: string) => void;
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
        const msg = body.error?.message ?? `Request failed with status ${res.status}`;
        
        // Extract details (object or string) and stringify elegantly if object
        const detailsObj = body.error?.details;
        const details = detailsObj 
          ? (typeof detailsObj === "object" ? JSON.stringify(detailsObj, null, 2) : String(detailsObj)) 
          : undefined;

        console.error("[API Error HTTP Response]", { status: res.status, message: msg, details });
        callbacks.onError(msg, details);
        return;
      }

      if (!res.body) {
        console.error("[API Error]", "No response body received");
        callbacks.onError("No response body received");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

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
                const msg = parsed.error?.message ?? "Unknown error";
                const detailsObj = parsed.error?.details;
                const details = detailsObj 
                  ? (typeof detailsObj === "object" ? JSON.stringify(detailsObj, null, 2) : String(detailsObj)) 
                  : undefined;

                console.error("[SSE Error Event Received]", { message: msg, details });
                callbacks.onError(msg, details);
              }
            } catch (jsonErr) {
              console.warn("[SSE JSON Parse Warning]", jsonErr, data);
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errObj = err as Error;
        console.error("[Network/Runtime Stream Error]", errObj);
        callbacks.onError(errObj.message ?? "Network error", errObj.stack);
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

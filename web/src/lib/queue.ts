import { useState, useCallback, useRef } from "react";
import { streamGenerate } from "./api";
import type { QueueItem, GenerateRequest, ProgressEvent, GitloreOutput } from "../types/gitlore";

let nextId = 0;
function genId() {
  return `q-${++nextId}-${Date.now()}`;
}

export function useQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);

  const addItem = useCallback((request: GenerateRequest) => {
    const item: QueueItem = {
      id: genId(),
      request,
      status: "pending",
      progress: [],
    };
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status !== "done" && i.status !== "error"));
  }, []);

  const updateItem = useCallback((id: string, update: Partial<QueueItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...update } : i))
    );
  }, []);

  const processNext = useCallback(() => {
    if (processingRef.current) return;

    setItems((prev) => {
      const next = prev.find((i) => i.status === "pending");
      if (!next) return prev;

      processingRef.current = true;
      setActiveId(next.id);

      const updated = prev.map((i) =>
        i.id === next.id ? { ...i, status: "processing" as const, progress: [] } : i
      );

      // Start streaming in a microtask to avoid setState-in-setState
      queueMicrotask(() => {
        controllerRef.current = streamGenerate(next.request, {
          onProgress: (event: ProgressEvent) => {
            updateItem(next.id, {
              progress: [], // Will be appended below
            });
            setItems((p) =>
              p.map((i) =>
                i.id === next.id
                  ? { ...i, progress: [...i.progress, event] }
                  : i
              )
            );
          },
          onResult: (data: GitloreOutput) => {
            updateItem(next.id, { status: "done", result: data });
            processingRef.current = false;
            controllerRef.current = null;
            // Auto-process next
            queueMicrotask(() => processNext());
          },
          onError: (error: string, details?: string) => {
            updateItem(next.id, { status: "error", error, errorDetails: details });
            processingRef.current = false;
            controllerRef.current = null;
            queueMicrotask(() => processNext());
          },
        });
      });

      return updated;
    });
  }, [updateItem]);

  const startQueue = useCallback(() => {
    processNext();
  }, [processNext]);

  const cancelCurrent = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (activeId) {
      updateItem(activeId, { status: "error", error: "Cancelled by user" });
    }
    processingRef.current = false;
  }, [activeId, updateItem]);

  return {
    items,
    activeId,
    addItem,
    removeItem,
    clearDone,
    startQueue,
    cancelCurrent,
    isProcessing: processingRef.current,
  };
}

import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GenerateForm } from "./components/input/GenerateForm";
import { BulkQueue } from "./components/input/BulkQueue";
import { ProgressFeed } from "./components/progress/ProgressFeed";
import { OutputTabs } from "./components/output/OutputTabs";
import { useQueue } from "./lib/queue";
import { streamGenerate } from "./lib/api";
import type { GenerateRequest, ProgressEvent, GitloreOutput, QueueItem } from "./types/gitlore";

export default function App() {
  const queue = useQueue();

  // Direct (non-queue) generation state
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GitloreOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (req: GenerateRequest) => {
    setProgress([]);
    setResult(null);
    setError(null);
    setIsGenerating(true);

    streamGenerate(req, {
      onProgress: (event) => {
        setProgress((prev) => [...prev, event]);
      },
      onResult: (data) => {
        setResult(data);
        setIsGenerating(false);
      },
      onError: (msg) => {
        setError(msg);
        setIsGenerating(false);
      },
    });
  };

  const handleAddToQueue = (req: GenerateRequest) => {
    queue.addItem(req);
  };

  const handleSelectQueueItem = (item: QueueItem) => {
    if (item.result) {
      setResult(item.result);
      setProgress(item.progress);
      setError(null);
      setIsGenerating(false);
    } else if (item.error) {
      setError(item.error);
      setProgress(item.progress);
      setResult(null);
      setIsGenerating(false);
    }
  };

  // Show progress from the active queue item while processing
  const activeQueueItem = queue.items.find((i) => i.id === queue.activeId);
  const displayProgress = activeQueueItem?.status === "processing" ? activeQueueItem.progress : progress;
  const displayIsActive = isGenerating || activeQueueItem?.status === "processing";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="space-y-6">
          {/* Hero text */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-(--color-text)">
              Portfolio Intelligence
            </h2>
            <p className="mt-2 text-(--color-text-secondary)">
              Transform any GitHub repository into a structured portfolio case study
            </p>
          </div>

          {/* Input Form */}
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
            <GenerateForm
              onSubmit={handleSubmit}
              onAddToQueue={handleAddToQueue}
              disabled={isGenerating}
            />
          </div>

          {/* Bulk Queue */}
          <BulkQueue
            items={queue.items}
            activeId={queue.activeId}
            onStart={queue.startQueue}
            onRemove={queue.removeItem}
            onClearDone={queue.clearDone}
            onCancel={queue.cancelCurrent}
            onSelect={handleSelectQueueItem}
          />

          {/* Progress Feed */}
          <ProgressFeed events={displayProgress} isActive={!!displayIsActive} />

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-(--color-error)/30 bg-(--color-error-subtle) p-4">
              <p className="text-sm font-medium text-(--color-error)">{error}</p>
            </div>
          )}

          {/* Output */}
          {result && <OutputTabs data={result} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

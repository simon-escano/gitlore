import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GenerateForm } from "./components/input/GenerateForm";
import { BulkQueue } from "./components/input/BulkQueue";
import { ProgressFeed } from "./components/progress/ProgressFeed";
import { OutputTabs } from "./components/output/OutputTabs";
import { useQueue } from "./lib/queue";
import { streamGenerate } from "./lib/api";
import { Zap, ArrowDown } from "lucide-react";
import type { GenerateRequest, ProgressEvent, GitloreOutput, QueueItem } from "./types/gitlore";

export default function App() {
  const queue = useQueue();

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
      onProgress: (event) => setProgress((prev) => [...prev, event]),
      onResult: (data) => { setResult(data); setIsGenerating(false); },
      onError: (msg) => { setError(msg); setIsGenerating(false); },
    });
  };

  const handleAddToQueue = (req: GenerateRequest) => queue.addItem(req);

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

  const activeQueueItem = queue.items.find((i) => i.id === queue.activeId);
  const displayProgress = activeQueueItem?.status === "processing" ? activeQueueItem.progress : progress;
  const displayIsActive = isGenerating || activeQueueItem?.status === "processing";

  const hasOutput = result || error || displayProgress.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-(--color-border)">
          <div className="absolute inset-0 bg-gradient-to-b from-(--color-accent)/[0.03] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="flex items-center gap-2 text-(--color-accent)">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-widest">Portfolio Intelligence</span>
            </div>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-(--color-text) sm:text-5xl">
              Turn repos into case studies
            </h2>
            <p className="mt-3 max-w-lg text-base text-(--color-text-secondary)">
              Analyze any GitHub repository and generate a structured, high-impact portfolio piece — powered by Cerebras inference on Cloudflare's edge.
            </p>
            <div className="mt-6">
              <a href="#workspace" className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-accent) transition-colors hover:text-(--color-accent-hover)">
                Get started
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Workspace — side-by-side on desktop */}
        <section id="workspace" className="mx-auto max-w-7xl px-6 py-8">
          <div className={`grid gap-6 ${hasOutput ? "lg:grid-cols-[380px_1fr]" : "max-w-lg mx-auto"}`}>
            {/* Left: Input panel */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
                <GenerateForm
                  onSubmit={handleSubmit}
                  onAddToQueue={handleAddToQueue}
                  disabled={isGenerating}
                />
              </div>

              <BulkQueue
                items={queue.items}
                activeId={queue.activeId}
                onStart={queue.startQueue}
                onRemove={queue.removeItem}
                onClearDone={queue.clearDone}
                onCancel={queue.cancelCurrent}
                onSelect={handleSelectQueueItem}
              />

              {/* Progress feed — in sidebar on desktop */}
              {(displayProgress.length > 0 || displayIsActive) && (
                <ProgressFeed events={displayProgress} isActive={!!displayIsActive} />
              )}
            </div>

            {/* Right: Output panel */}
            {hasOutput && (
              <div className="space-y-4 animate-fade-up min-w-0">
                {error && (
                  <div className="rounded-2xl border border-(--color-error)/20 bg-(--color-error-subtle) p-4">
                    <p className="text-sm font-medium text-(--color-error)">{error}</p>
                  </div>
                )}

                {result && <OutputTabs data={result} />}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

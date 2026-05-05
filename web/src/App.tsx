import { useState, useRef } from "react";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { GenerateForm } from "./components/input/GenerateForm";
import { BulkQueue } from "./components/input/BulkQueue";
import { ProgressFeed } from "./components/progress/ProgressFeed";
import { OutputTabs } from "./components/output/OutputTabs";
import { useQueue } from "./lib/queue";
import { streamGenerate } from "./lib/api";
import { ArrowDown, Sparkles } from "lucide-react";
import type { GenerateRequest, ProgressEvent, GitloreOutput, QueueItem } from "./types/gitlore";

export default function App() {
  const queue = useQueue();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GitloreOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const handleSubmit = (req: GenerateRequest) => {
    setProgress([]);
    setResult(null);
    setError(null);
    setErrorDetails(null);
    setShowErrorDetails(false);
    setIsGenerating(true);

    // Smooth scroll down to workspace
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });

    const controller = streamGenerate(req, {
      onProgress: (event) => setProgress((prev) => [...prev, event]),
      onResult: (data) => {
        setResult(data);
        setIsGenerating(false);
        abortControllerRef.current = null;
      },
      onError: (msg, details) => {
        setError(msg);
        setErrorDetails(details || null);
        setShowErrorDetails(false);
        setIsGenerating(false);
        abortControllerRef.current = null;
      },
    });

    abortControllerRef.current = controller;
  };

  const handleCancelDirect = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setProgress((prev) => [
      ...prev,
      { phase: "validation", message: "Generation cancelled by user", detail: "Active stream aborted." }
    ]);
  };

  const handleAddToQueue = (req: GenerateRequest) => queue.addItem(req);

  const handleSelectQueueItem = (item: QueueItem) => {
    if (item.result) {
      setResult(item.result);
      setProgress(item.progress);
      setError(null);
      setErrorDetails(null);
      setShowErrorDetails(false);
      setIsGenerating(false);
    } else if (item.error) {
      setError(item.error);
      setErrorDetails(item.errorDetails || null);
      setShowErrorDetails(false);
      setProgress(item.progress);
      setResult(null);
      setIsGenerating(false);
    }
  };

  const activeQueueItem = queue.items.find((i) => i.id === queue.activeId);
  const displayProgress = activeQueueItem?.status === "processing" ? activeQueueItem.progress : progress;
  const displayIsActive = isGenerating || activeQueueItem?.status === "processing";

  // The split screen is active only when we have a completed, readable output (either success or failed run)
  const hasCompletedOutput = (result || error) && !displayIsActive;

  return (
    <div className="flex min-h-screen flex-col bg-grid-pattern bg-(--color-bg)">
      <Header />

      <main className="flex-1 relative">
        {/* Soft Ambient Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-full max-w-7xl rounded-full bg-indigo-500/[0.03] dark:bg-indigo-500/[0.015] blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="mx-auto max-w-5xl px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 px-3 py-1 text-xs text-zinc-500 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span className="font-medium uppercase tracking-wider text-[10px]">Portfolio Intelligence Engine</span>
            </div>
            
            <h1 className="max-w-3xl mx-auto text-5xl sm:text-6xl font-light tracking-tight text-(--color-text) leading-[1.1]">
              Transform source code into <br className="hidden sm:inline" />
              <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500 dark:from-violet-400 dark:via-indigo-400 dark:to-emerald-400">
                stunning portfolio pieces
              </span>
            </h1>
            
            <p className="max-w-xl mx-auto text-base sm:text-lg text-(--color-text-secondary) font-light leading-relaxed">
              Analyze any GitHub repository and craft high-impact case studies, structural flow diagrams, and grouped tech stacks instantly.
            </p>

            <div className="pt-4">
              <a
                href="#workspace"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 px-6 py-3 text-sm font-medium text-white dark:text-zinc-900 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                Launch Workspace
                <ArrowDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </a>
            </div>
          </div>
        </section>

        {/* Horizontal dividing separator spanning the full width of the page */}
        <div className="w-full border-t border-(--color-border)/60">
          {/* Workspace Grid Area */}
          <section id="workspace" className="mx-auto max-w-7xl px-6 py-12">
            <div className={`grid gap-8 transition-all duration-500 ${hasCompletedOutput ? "lg:grid-cols-[380px_1fr]" : "max-w-xl mx-auto"}`}>
              
              {/* Left Side: Inputs, Queue & Progress Log */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none">
                  <div className="mb-4 pb-4 border-b border-(--color-border)/60">
                    <h3 className="text-sm font-medium text-(--color-text)">New Pipeline</h3>
                    <p className="text-xs text-zinc-400">Ingest, analyze and format your case study.</p>
                  </div>
                  <GenerateForm
                    onSubmit={handleSubmit}
                    onAddToQueue={handleAddToQueue}
                    disabled={displayIsActive}
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

                {/* Docked post-generation logs shown in the left sidebar once loaded */}
                {!displayIsActive && displayProgress.length > 0 && (
                  <ProgressFeed events={displayProgress} isActive={false} />
                )}
              </div>

              {/* Right Side: Tabbed Layout Output (Preview vs JSON) */}
              {hasCompletedOutput && (
                <div className="space-y-4 animate-fade-up min-w-0">
                  {error && (
                    <div className="rounded-2xl border border-red-200 dark:border-red-900/10 bg-red-50/30 dark:bg-red-950/5 p-5 space-y-3 animate-fade-in">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Pipeline Execution Interrupted</p>
                          <p className="mt-1 text-xs text-red-500/90 dark:text-red-400/80 leading-relaxed font-mono">{error}</p>
                        </div>
                        
                        {errorDetails && (
                          <button
                            type="button"
                            onClick={() => setShowErrorDetails(!showErrorDetails)}
                            className="text-xs font-semibold text-red-600/80 hover:text-red-600 dark:text-red-400/80 dark:hover:text-red-400 hover:underline shrink-0 pt-0.5"
                          >
                            {showErrorDetails ? "Hide details" : "See more details"}
                          </button>
                        )}
                      </div>

                      {errorDetails && showErrorDetails && (
                        <pre className="text-[10px] leading-relaxed font-mono p-4 bg-red-950/[0.04] dark:bg-red-950/20 rounded-xl border border-red-200/50 dark:border-red-900/10 text-red-700 dark:text-red-400 overflow-auto max-h-64 whitespace-pre-wrap break-all shadow-inner animate-fade-up">
                          {errorDetails}
                        </pre>
                      )}
                    </div>
                  )}

                  {result && <OutputTabs data={result} onChange={setResult} />}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Real-time Streaming Generation Modal Popup */}
        {displayIsActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg animate-fade-up">
              <ProgressFeed
                events={displayProgress}
                isActive={true}
                onCancel={activeQueueItem?.status === "processing" ? queue.cancelCurrent : handleCancelDirect}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

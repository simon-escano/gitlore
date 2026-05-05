import { useEffect, useRef } from "react";
import { Package, Brain, CheckCircle, Loader2, type LucideIcon } from "lucide-react";
import type { ProgressEvent } from "../../types/gitlore";

interface Props {
  events: ProgressEvent[];
  isActive: boolean;
  onCancel?: () => void;
}

interface PhaseConfigItem {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
}

const phaseConfig: Record<string, PhaseConfigItem> = {
  ingestion: {
    icon: Package,
    label: "Ingestion Stage",
    color: "text-(--color-ingestion)",
    bg: "bg-(--color-ingestion-subtle)",
  },
  inference: {
    icon: Brain,
    label: "Inference Stage",
    color: "text-(--color-inference)",
    bg: "bg-(--color-inference-subtle)",
  },
  validation: {
    icon: CheckCircle,
    label: "Validation Stage",
    color: "text-(--color-validation)",
    bg: "bg-(--color-validation-subtle)",
  },
};

export function ProgressFeed({ events, isActive, onCancel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (events.length === 0 && !isActive) return null;

  const currentPhase = events[events.length - 1]?.phase || "ingestion";
  const phases = ["ingestion", "inference", "validation"];

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden shadow-lg animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-(--color-border) px-5 py-4">
        {isActive && <Loader2 className="h-4 w-4 animate-spin text-(--color-accent) shrink-0" />}
        <h3 className="text-sm font-medium text-(--color-text) flex-1">
          {isActive ? "Generating Portfolio Case Study..." : "Generation Log"}
        </h3>
        {isActive && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Grouped Logs Body */}
      <div className="max-h-[380px] overflow-y-auto p-4 space-y-4">
        {phases.map((phaseKey) => {
          const phaseEvents = events.filter((e) => e.phase === phaseKey);
          const isPhaseActive = isActive && currentPhase === phaseKey;
          
          // Only show a container if there are events in it, or if it is currently active
          if (phaseEvents.length === 0 && !isPhaseActive) return null;
          
          const cfg = phaseConfig[phaseKey];
          const Icon = cfg.icon;

          return (
            <div
              key={phaseKey}
              className={`rounded-xl border border-(--color-border)/60 bg-zinc-50/40 dark:bg-zinc-900/10 overflow-hidden transition-all duration-300 ${
                isPhaseActive ? "ring-1 ring-(--color-accent)/30 border-(--color-accent)/30" : ""
              }`}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-2.5 border-b border-(--color-border)/40 px-4 py-2.5 bg-zinc-50/90 dark:bg-zinc-900/30">
                <Icon className={`h-4 w-4 ${cfg.color}`} />
                <span className="text-xs font-semibold text-(--color-text) tracking-wide uppercase">
                  {cfg.label}
                </span>
                {isPhaseActive && (
                  <Loader2 className="ml-auto h-3 w-3 animate-spin text-(--color-accent)" />
                )}
              </div>

              {/* Phase Log Lines */}
              <div className="p-3.5 space-y-2.5">
                {phaseEvents.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-(--color-text) font-normal leading-normal">
                        {event.message}
                      </p>
                      {event.detail && (
                        <p className="mt-1 text-[10px] text-(--color-text-muted) font-mono leading-normal pl-2.5 border-l border-(--color-border)">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {phaseEvents.length === 0 && isPhaseActive && (
                  <div className="flex items-center gap-2 text-xs text-(--color-text-muted) italic animate-pulse">
                    <span>Awaiting task execution...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

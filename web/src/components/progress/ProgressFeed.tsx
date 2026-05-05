import { useEffect, useRef } from "react";
import { Package, Brain, CheckCircle, Loader2 } from "lucide-react";
import type { ProgressEvent } from "../../types/gitlore";

interface Props {
  events: ProgressEvent[];
  isActive: boolean;
  onCancel?: () => void;
}

const phaseConfig = {
  ingestion: {
    icon: Package,
    label: "Ingestion",
    color: "text-(--color-ingestion)",
    bg: "bg-(--color-ingestion-subtle)",
    dot: "bg-(--color-ingestion)",
  },
  inference: {
    icon: Brain,
    label: "Inference",
    color: "text-(--color-inference)",
    bg: "bg-(--color-inference-subtle)",
    dot: "bg-(--color-inference)",
  },
  validation: {
    icon: CheckCircle,
    label: "Validation",
    color: "text-(--color-validation)",
    bg: "bg-(--color-validation-subtle)",
    dot: "bg-(--color-validation)",
  },
};

export function ProgressFeed({ events, isActive, onCancel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (events.length === 0 && !isActive) return null;

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden shadow-sm">
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
      <div className="max-h-72 overflow-y-auto p-3">
        <ul className="space-y-1">
          {events.map((event, i) => {
            const cfg = phaseConfig[event.phase];
            const Icon = cfg.icon;
            const isLast = i === events.length - 1;

            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 rounded-xl px-3 py-2 transition-colors ${
                  isLast && isActive ? cfg.bg : "hover:bg-(--color-bg-secondary)"
                }`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-(--color-text) font-normal">
                    {event.message}
                  </p>
                  {event.detail && (
                    <p className="mt-0.5 text-xs text-(--color-text-muted) font-mono leading-normal">
                      {event.detail}
                    </p>
                  )}
                </div>
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>
              </li>
            );
          })}
        </ul>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

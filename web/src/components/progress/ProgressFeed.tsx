import { useEffect, useRef } from "react";
import { Package, Brain, CheckCircle, Loader2 } from "lucide-react";
import type { ProgressEvent } from "../../types/gitlore";

interface Props {
  events: ProgressEvent[];
  isActive: boolean;
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

export function ProgressFeed({ events, isActive }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (events.length === 0 && !isActive) return null;

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
      <div className="flex items-center gap-2 border-b border-(--color-border) px-4 py-3">
        {isActive && <Loader2 className="h-4 w-4 animate-spin text-(--color-accent)" />}
        <h3 className="text-sm font-semibold text-(--color-text)">
          {isActive ? "Generating..." : "Generation Log"}
        </h3>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        <ul className="space-y-1">
          {events.map((event, i) => {
            const cfg = phaseConfig[event.phase];
            const Icon = cfg.icon;
            const isLast = i === events.length - 1;

            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                  isLast && isActive ? cfg.bg : "hover:bg-(--color-bg-secondary)"
                }`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-(--color-text)">
                    {event.message}
                  </p>
                  {event.detail && (
                    <p className="mt-0.5 text-xs text-(--color-text-muted) font-mono">
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

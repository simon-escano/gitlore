import { Play, Trash2, X, CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react";
import type { QueueItem } from "../../types/gitlore";

interface Props {
  items: QueueItem[];
  activeId: string | null;
  onStart: () => void;
  onRemove: (id: string) => void;
  onClearDone: () => void;
  onCancel: () => void;
  onSelect: (item: QueueItem) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: "text-(--color-text-muted)", bg: "bg-(--color-bg-secondary)", label: "Pending" },
  processing: { icon: Loader2, color: "text-(--color-accent)", bg: "bg-(--color-accent-subtle)", label: "Processing" },
  done: { icon: CheckCircle, color: "text-(--color-success)", bg: "bg-(--color-success-subtle)", label: "Done" },
  error: { icon: AlertCircle, color: "text-(--color-error)", bg: "bg-(--color-error-subtle)", label: "Error" },
};

export function BulkQueue({ items, activeId, onStart, onRemove, onClearDone, onCancel, onSelect }: Props) {
  if (items.length === 0) return null;

  const hasPending = items.some((i) => i.status === "pending");
  const hasProcessing = items.some((i) => i.status === "processing");
  const hasDone = items.some((i) => i.status === "done" || i.status === "error");

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
      <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-3">
        <h3 className="text-sm font-semibold text-(--color-text)">
          Queue ({items.length})
        </h3>
        <div className="flex gap-2">
          {hasDone && (
            <button
              onClick={onClearDone}
              className="text-xs text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            >
              Clear done
            </button>
          )}
          {hasProcessing && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded-md bg-(--color-error-subtle) px-2.5 py-1 text-xs font-medium text-(--color-error) transition-colors hover:bg-(--color-error)/10"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
          {hasPending && !hasProcessing && (
            <button
              onClick={onStart}
              className="inline-flex items-center gap-1 rounded-md bg-(--color-accent) px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-(--color-accent-hover)"
            >
              <Play className="h-3 w-3" />
              Start
            </button>
          )}
        </div>
      </div>
      <ul className="divide-y divide-(--color-border)">
        {items.map((item) => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          const isActive = item.id === activeId;

          return (
            <li
              key={item.id}
              onClick={() => (item.status === "done" || item.status === "error") && onSelect(item)}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                item.status === "done" || item.status === "error"
                  ? "cursor-pointer hover:bg-(--color-surface-hover)"
                  : ""
              } ${isActive ? "bg-(--color-accent-subtle)" : ""}`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${cfg.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${cfg.color} ${item.status === "processing" ? "animate-spin" : ""}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-(--color-text)">
                  {item.request.url.replace("https://github.com/", "")}
                </p>
                {item.error && (
                  <p className="truncate text-xs text-(--color-error)">{item.error}</p>
                )}
              </div>
              {item.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded text-(--color-text-muted) transition-colors hover:bg-(--color-error-subtle) hover:text-(--color-error)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

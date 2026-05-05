import { useState } from "react";
import { Code, Eye } from "lucide-react";
import { JsonView } from "./JsonView";
import { PreviewCard } from "./PreviewCard";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
  onChange?: (updated: GitloreOutput) => void;
}

type Tab = "json" | "preview";

export function OutputTabs({ data, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("preview");

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-(--color-border) bg-zinc-50/50 dark:bg-zinc-900/10">
        <button
          onClick={() => setTab("preview")}
          className={`inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-r border-(--color-border)/60 ${
            tab === "preview"
              ? "border-b-2 border-b-(--color-accent) text-(--color-accent) bg-(--color-surface)"
              : "text-(--color-text-muted) hover:text-(--color-text)"
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview Space
        </button>
        <button
          onClick={() => setTab("json")}
          className={`inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-r border-(--color-border)/60 ${
            tab === "json"
              ? "border-b-2 border-b-(--color-accent) text-(--color-accent) bg-(--color-surface)"
              : "text-(--color-text-muted) hover:text-(--color-text)"
          }`}
        >
          <Code className="h-4 w-4" />
          Interactive JSON
        </button>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {tab === "json" ? (
          <JsonView data={data} onChange={onChange} />
        ) : (
          <PreviewCard data={data} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

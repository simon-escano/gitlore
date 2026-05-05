import { useState } from "react";
import { Code, Eye } from "lucide-react";
import { JsonView } from "./JsonView";
import { PreviewCard } from "./PreviewCard";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
}

type Tab = "json" | "preview";

export function OutputTabs({ data }: Props) {
  const [tab, setTab] = useState<Tab>("preview");

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-(--color-border)">
        <button
          onClick={() => setTab("preview")}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
            tab === "preview"
              ? "border-b-2 border-(--color-accent) text-(--color-accent)"
              : "text-(--color-text-muted) hover:text-(--color-text)"
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          onClick={() => setTab("json")}
          className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
            tab === "json"
              ? "border-b-2 border-(--color-accent) text-(--color-accent)"
              : "text-(--color-text-muted) hover:text-(--color-text)"
          }`}
        >
          <Code className="h-4 w-4" />
          JSON
        </button>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {tab === "json" ? <JsonView data={data} /> : <PreviewCard data={data} />}
      </div>
    </div>
  );
}

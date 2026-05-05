import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
}

export function JsonView({ data }: Props) {
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-(--color-border) bg-(--color-surface) px-2.5 py-1.5 text-xs font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-secondary) hover:text-(--color-text)"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-(--color-success)" />
            Copied!
          </>
        ) : (
          <>
            <Clipboard className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
      <pre className="max-h-[600px] overflow-auto rounded-lg bg-(--color-bg-secondary) p-4 text-xs leading-relaxed text-(--color-text) font-mono">
        {json}
      </pre>
    </div>
  );
}

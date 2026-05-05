import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
          // Remove the colon from the match for the span, then add it back
          return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export function JsonView({ data }: Props) {
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(data, null, 2);
  const highlighted = syntaxHighlight(json);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-surface) px-2.5 py-1.5 text-xs font-medium text-(--color-text-secondary) transition-all hover:bg-(--color-bg-secondary) hover:text-(--color-text)"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-(--color-success)" />
            Copied
          </>
        ) : (
          <>
            <Clipboard className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
      <pre
        className="max-h-[600px] overflow-auto rounded-xl bg-(--color-bg-secondary) p-4 pr-20 text-xs leading-relaxed font-mono"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
}

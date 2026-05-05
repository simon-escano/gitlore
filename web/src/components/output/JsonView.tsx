import { useState, useEffect, useRef } from "react";
import { Clipboard, Check, ShieldAlert } from "lucide-react";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
  onChange?: (updated: GitloreOutput) => void;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
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

export function JsonView({ data, onChange }: Props) {
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);
  
  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edits made from the layout side (e.g. Mermaid diagram edits)
  useEffect(() => {
    setJsonText(JSON.stringify(data, null, 2));
    setError(null);
  }, [data]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (value: string) => {
    setJsonText(value);
    
    try {
      const parsed = JSON.parse(value) as GitloreOutput;
      setError(null);
      
      if (onChange) {
        onChange(parsed);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Sync the scrolling position of the syntax highlighting <pre> background
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const escaped = escapeHtml(jsonText);
  const highlighted = syntaxHighlight(escaped);

  return (
    <div className="relative group/json select-none">
      {/* Editor Box containing both overlapping layers */}
      <div className="relative h-[500px] rounded-2xl border border-(--color-border) bg-zinc-950 overflow-hidden shadow-inner">
        
        {/* Copy Code Button absolutely positioned in the upper right, shown on hover */}
        <div className="absolute top-3.5 right-3.5 z-25 opacity-0 group-hover/json:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-all hover:bg-zinc-800/95 shadow-md"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="h-3 w-3" />
                Copy code
              </>
            )}
          </button>
        </div>

        {/* Layer 1: Syntax Highlighted Display (Static Render, Ignored by Mouse) */}
        <pre
          ref={preRef}
          className="absolute inset-0 p-5 pointer-events-none select-none font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all overflow-hidden bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />

        {/* Layer 2: Transparent Interactive Input Textarea */}
        <textarea
          ref={textareaRef}
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          onScroll={handleScroll}
          className={`absolute inset-0 p-5 bg-transparent text-transparent caret-zinc-200 focus:outline-none ${
            error ? "focus:ring-1 focus:ring-red-500/30" : "focus:ring-1 focus:ring-(--color-accent)/30"
          } resize-none font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all overflow-y-auto select-text`}
          spellCheck={false}
        />
      </div>

      {/* Validation Error Banner (Overlay on error) */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-950/95 backdrop-blur-md p-3.5 shadow-lg animate-fade-up">
          <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 select-text">
            <p className="text-xs font-semibold text-red-200">JSON Syntax Parsing Error</p>
            <p className="text-[10px] font-mono text-red-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

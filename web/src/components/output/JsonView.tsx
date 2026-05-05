import { useState, useEffect } from "react";
import { Clipboard, Check, Edit3, ShieldAlert } from "lucide-react";
import type { GitloreOutput } from "../../types/gitlore";

interface Props {
  data: GitloreOutput;
  onChange?: (updated: GitloreOutput) => void;
}

export function JsonView({ data, onChange }: Props) {
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between border-b border-(--color-border)/60 pb-3">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">
            Live Workspace Editor
          </span>
        </div>
        
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-xs font-medium text-(--color-text-secondary) transition-all hover:bg-(--color-bg-secondary) hover:text-(--color-text) shadow-sm"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Clipboard className="h-3.5 w-3.5" />
              Copy Code
            </>
          )}
        </button>
      </div>

      {/* Code Editor Workspace */}
      <div className="relative">
        <textarea
          value={jsonText}
          onChange={(e) => handleTextChange(e.target.value)}
          className={`w-full h-[520px] font-mono text-[11px] leading-relaxed p-5 bg-zinc-950 text-zinc-100 rounded-2xl border ${
            error ? "border-red-500/50 focus:ring-red-500/20" : "border-(--color-border) focus:ring-(--color-accent)/30"
          } focus:outline-none focus:ring-2 resize-y shadow-inner`}
          spellCheck={false}
        />

        {/* Validation Error Banner */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-950/90 backdrop-blur-md p-3.5 shadow-lg animate-fade-up">
            <ShieldAlert className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-red-200">JSON Syntax Parsing Error</p>
              <p className="text-[10px] font-mono text-red-300/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

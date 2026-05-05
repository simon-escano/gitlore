import { useEffect, useRef, useState } from "react";
import {
  Zap, Layers, Shield, ExternalLink, Github, Clipboard, Check, ArrowRight, ArrowDown,
  type LucideIcon,
} from "lucide-react";
import type { GitloreOutput } from "../types/gitlore";

interface Props {
  data: GitloreOutput;
}

const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  layers: Layers,
  shield: Shield,
  github: Github,
  link: ExternalLink,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name.toLowerCase()] ?? Zap;
}

const roleColors: Record<string, { text: string; bg: string; dot: string }> = {
  Primary: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30", dot: "bg-emerald-500" },
  Supporting: { text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/30", dot: "bg-violet-500" },
  Infrastructure: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30", dot: "bg-blue-500" },
};

function getRoleColor(role: string) {
  return roleColors[role] ?? roleColors.Supporting;
}

/**
 * Robust lexical scanner that normalizes and sanitizes Mermaid syntax.
 * Correctly matches matching outer brackets and replaces any nested double-quotes
 * with the standard Mermaid HTML entity `&quot;`.
 */
function cleanMermaidCode(code: string): string {
  const lines = code.split("\n");
  const cleanedLines = lines.map((line) => {
    let result = "";
    let i = 0;
    while (i < line.length) {
      // Look for a node definition: identifier followed by [ or (
      const match = line.slice(i).match(/^([a-zA-Z0-9_-]+)\s*(\[|\()/);
      if (match) {
        const id = match[1];
        const openChar = match[2];
        const closeChar = openChar === "[" ? "]" : ")";
        
        // Find matching closing bracket with depth counting
        const startBracketIdx = i + match[0].length - 1;
        let depth = 1;
        let endBracketIdx = -1;
        for (let j = startBracketIdx + 1; j < line.length; j++) {
          if (line[j] === openChar) depth++;
          else if (line[j] === closeChar) depth--;
          
          if (depth === 0) {
            endBracketIdx = j;
            break;
          }
        }
        
        if (endBracketIdx !== -1) {
          // Extract the content inside the brackets
          const rawLabel = line.slice(startBracketIdx + 1, endBracketIdx).trim();
          let label = rawLabel;
          
          // Strip outer quotes if present
          if (label.startsWith('"') && label.endsWith('"') && label.length >= 2) {
            label = label.slice(1, -1);
          }
          
          // Replace any inner double quotes with the HTML entity &quot;
          label = label.replace(/"/g, "&quot;");
          
          // Re-wrap in double-quoted brackets
          result += `${id}["${label}"]`;
          
          // Move index past the closing bracket
          i = endBracketIdx + 1;
          continue;
        }
      }
      
      // If no node match, just copy character and advance
      result += line[i];
      i++;
    }
    return result;
  });
  
  return cleanedLines.join("\n");
}

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;
    let cancelled = false;

    // Helper to purge any stray elements Mermaid appends to document.body
    const purgeLeakedElements = () => {
      document.querySelectorAll('body > [id^="dmermaid"]').forEach((el) => el.remove());
      document.querySelectorAll('body > [id^="mermaid-"]').forEach((el) => el.remove());
    };

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        
        // Setup with suppressErrorRendering to prevent appending error boxes below footer
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
          securityLevel: "loose",
          suppressErrorRendering: true,
        });

        purgeLeakedElements();
        if (cancelled) return;

        const sanitizedCode = cleanMermaidCode(code);
        const renderId = `mermaid-render-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, sanitizedCode);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        purgeLeakedElements();
        if (!cancelled) {
          setError((err as Error).message || "Mermaid rendering failed");
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="rounded-lg bg-red-50/50 dark:bg-red-950/10 p-3 border border-red-100 dark:border-red-900/20">
                <p class="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">${code}</p>
              </div>
            `;
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      purgeLeakedElements();
    };
  }, [code]);

  return (
    <div className="relative">
      <div ref={containerRef} className="flex justify-center overflow-x-auto py-2" />
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 px-3.5 py-2.5">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Mermaid Parsing Error</p>
          <p className="mt-1 text-[11px] text-red-500/90 dark:text-red-400/80 font-mono leading-normal">{error}</p>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-xs font-medium text-(--color-text-secondary) transition-all hover:bg-(--color-bg-secondary) hover:text-(--color-text)"
    >
      {copied ? <><Check className="h-3 w-3 text-emerald-500" />Copied</> : <><Clipboard className="h-3 w-3" />{label}</>}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
      {children}
    </span>
  );
}

export function DefaultLayout({ data }: Props) {
  // Group stack by role
  const stackGroups = data.stack.reduce<Record<string, typeof data.stack>>((acc, item) => {
    const role = item.role || "Supporting";
    if (!acc[role]) acc[role] = [];
    acc[role].push(item);
    return acc;
  }, {});

  const roleOrder = ["Primary", "Supporting", "Infrastructure"];
  const sortedGroups = roleOrder.filter((r) => stackGroups[r]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Case Study Identity */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Case Study
        </span>
        <h2 className="text-3xl font-light tracking-tight text-(--color-text) sm:text-4xl">
          {data.title}
        </h2>
        <p className="text-lg text-(--color-text-secondary) font-light leading-relaxed">
          {data.one_liner}
        </p>
        
        {data.contributions && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-(--color-text-secondary)">Roles:</span>
            {data.contributions.split(",").map((role, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                {role.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Balanced Bento Grid */}
      <div className="space-y-4">
        
        {/* Row 1: Problem/Goal (2/3 width) and Tech Stack (1/3 width) */}
        <div className="grid gap-4 md:grid-cols-3">
          {(data.problem || data.goal) && (
            <div className="md:col-span-2 flex flex-col md:flex-row items-stretch rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800">
              {data.problem && (
                <div className="flex-1 p-6 bg-gradient-to-br from-red-500/[0.03] via-transparent to-transparent">
                  <SectionLabel>Problem Space</SectionLabel>
                  <p className="mt-3 text-sm text-(--color-text-secondary) font-normal leading-relaxed">
                    {data.problem}
                  </p>
                </div>
              )}
              
              {data.problem && data.goal && (
                <div className="flex md:flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/20 px-4 py-2 border-y md:border-y-0 md:border-x border-(--color-border)">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-bg) border border-(--color-border) shadow-sm">
                    <ArrowRight className="hidden md:block h-4 w-4 text-zinc-400" />
                    <ArrowDown className="block md:hidden h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              )}
              
              {data.goal && (
                <div className="flex-1 p-6 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-transparent">
                  <SectionLabel>Target Outcome</SectionLabel>
                  <p className="mt-3 text-sm text-(--color-text-secondary) font-normal leading-relaxed">
                    {data.goal}
                  </p>
                </div>
              )}
            </div>
          )}

          {data.stack.length > 0 && (
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-4 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800">
              <SectionLabel>Technology Blueprint</SectionLabel>
              <div className="space-y-4">
                {sortedGroups.map((role) => {
                  const items = stackGroups[role];
                  const rc = getRoleColor(role);
                  return (
                    <div key={role} className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`} />
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{role}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((s, i) => (
                          <span
                            key={i}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${rc.bg} ${rc.text}`}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {data.stack_reason && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic leading-relaxed pt-2 border-t border-(--color-border)">
                  {data.stack_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Architecture Diagram (Full Width - Spans all 3 columns) */}
        {data.architecture_diagram_code && (
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-4 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800">
            <div className="flex items-center justify-between">
              <SectionLabel>System Architecture</SectionLabel>
              <CopyButton text={data.architecture_diagram_code} label="Mermaid Code" />
            </div>
            <div className="rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900/40 p-4">
              <MermaidDiagram code={data.architecture_diagram_code} />
            </div>
          </div>
        )}

        {/* Row 3: Core Metrics (Horizontal 3-column row) */}
        {data.results && (
          <div className="grid gap-4 sm:grid-cols-3">
            {(["performance", "scale", "utility"] as const).map((key) => {
              const metric = data.results[key];
              if (!metric?.text) return null;
              const Icon = getIcon(metric.icon);
              return (
                <div key={key} className="flex items-start gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                    <Icon className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-0.5">
                    <SectionLabel>{key}</SectionLabel>
                    <p className="text-sm text-(--color-text) font-normal leading-relaxed">{metric.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Row 4: Key Features (Horizontal 3-column row) */}
        {data.key_features.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {data.key_features.map((f, i) => {
              const Icon = getIcon(f.icon);
              return (
                <div key={i} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-3 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800 hover:shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800/60">
                    <Icon className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Feature 0{i + 1}</span>
                    <p className="text-sm text-(--color-text-secondary) leading-relaxed">{f.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Links & Repository References */}
      {data.links.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {data.links.map((link, i) => {
            const Icon = getIcon(link.icon);
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-all hover:border-zinc-400 dark:hover:border-zinc-700 hover:text-(--color-accent) hover:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

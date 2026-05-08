import { useEffect, useRef, useState } from "react";
import {
  Zap, Layers, Shield, ExternalLink, Github, Clipboard, Check, ArrowRight, ArrowDown,
  type LucideIcon,
} from "lucide-react";
import type { GitloreOutput } from "../types/gitlore";

interface Props {
  data: GitloreOutput;
  onChange?: (updated: GitloreOutput) => void;
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

export function DefaultLayout({ data, onChange }: Props) {
  const [editedDiagramCode, setEditedDiagramCode] = useState(data.architecture_diagram_code);
  const [inputText, setInputText] = useState(data.architecture_diagram_code);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync edits from other sources (like the JSON editor)
  useEffect(() => {
    setInputText(data.architecture_diagram_code);
  }, [data.architecture_diagram_code]);

  // Debounce the compiled render and state updates to eliminate typing lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setEditedDiagramCode(inputText);
      if (onChange) {
        onChange({
          ...data,
          architecture_diagram_code: inputText,
        });
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [inputText]);

  // Handle native Wheel events to lock scrolling on zoom motions
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault(); // Stop page scrolling
      const zoomFactor = 0.08;
      const direction = e.deltaY < 0 ? 1 : -1;
      setScale((prev) => Math.min(Math.max(prev + direction * zoomFactor, 0.4), 3));
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelNative);
    };
  }, []);

  // Diagram dragging / pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.15, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.4));
  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setScale(1);
  };

  const techStack = data.tech_stack || { Primary: [], Supporting: [], Infrastructure: [] };
  const hasTechStack =
    (techStack.Primary?.length ?? 0) > 0 ||
    (techStack.Supporting?.length ?? 0) > 0 ||
    (techStack.Infrastructure?.length ?? 0) > 0;

  const roleOrder = ["Primary", "Supporting", "Infrastructure"] as const;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header Case Study Identity */}
      <div className="space-y-2">
        {/* Case Study Badge on Top */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 shrink-0">
            Case Study
          </span>
        </div>

        {/* Title and Links Side-by-Side inline */}
        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          <h2 className="text-3xl font-light tracking-tight text-(--color-text) sm:text-4xl">
            {data.title}
          </h2>

          {/* Link Buttons beside the title directly */}
          {data.links && data.links.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1.5 sm:pt-0 shrink-0">
              {data.links.map((link, i) => {
                const Icon = getIcon(link.icon);
                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.label}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface) text-zinc-400 hover:text-(--color-accent) hover:border-zinc-300 dark:hover:border-zinc-800 transition-all hover:scale-105 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-lg text-(--color-text-secondary) font-light leading-relaxed">
          {data.one_liner}
        </p>
        
        {data.contributions && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
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

      {/* Main Structural Bento Layout */}
      <div className="space-y-4">
        
        {/* Section 1: Problem ➔ Goal Flow Panel (Standalone Area) */}
        {(data.problem || data.goal) && (
          <div className="flex flex-col md:flex-row items-stretch rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800 shadow-sm">
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

        {/* Section 2: Visual Gallery (Appears AFTER problem and goal) */}
        {data.gallery && data.gallery.length > 0 && (
          <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-4 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800 shadow-sm">
            <SectionLabel>Visual Gallery</SectionLabel>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {data.gallery.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-(--color-border) overflow-hidden group/gal">
                  <img
                    src={img}
                    alt={`Gallery item ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/gal:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add("flex", "items-center", "justify-center", "bg-gradient-to-tr", "from-indigo-500/[0.04]", "to-violet-500/[0.04]");
                      const label = document.createElement("span");
                      label.className = "text-[11px] font-mono text-zinc-400 dark:text-zinc-500";
                      label.innerText = `[Mock View ${i + 1}]`;
                      e.currentTarget.parentElement?.appendChild(label);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Key Features Row */}
        {data.key_features && data.key_features.length > 0 && (
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

        {/* Section 4: Architecture Diagram (2/3 width) and Tech Stack (1/3 width) beside each other */}
        <div className="grid gap-4 md:grid-cols-3">
          
          {/* System Architecture Card - Glued Seamless container */}
          <div className="md:col-span-2 rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden shadow-sm flex flex-col transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800">
            {/* Header bar of System Architecture box */}
            <div className="px-5 py-3.5 border-b border-(--color-border)/50 bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-between shrink-0">
              <SectionLabel>System Architecture</SectionLabel>
            </div>

            {/* Diagram View Canvas (Rounded Top boundaries, glued) */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/10 h-[320px] select-none cursor-grab active:cursor-grabbing group/canvas border-b border-(--color-border)/50 shrink-0"
            >
              {/* Dot blueprint mesh background */}
              <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

              {/* Floating controls toolbar */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-lg border border-(--color-border) p-1 shadow-sm opacity-60 group-hover/canvas:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={zoomIn}
                  className="h-6 w-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-sm font-semibold text-zinc-600 dark:text-zinc-400"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={zoomOut}
                  className="h-6 w-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-sm font-semibold text-zinc-600 dark:text-zinc-400"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="px-2 h-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
                  title="Reset Workspace"
                >
                  Reset
                </button>
              </div>

              {/* Interactive Canvas container */}
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: "center center",
                }}
                className="w-full h-full flex items-center justify-center transition-transform duration-75"
              >
                <MermaidDiagram code={editedDiagramCode} />
              </div>
            </div>

            {/* Code View (Bottom Part) - Glued seamless text editor, no spacing, Copy button inside */}
            <div className="relative group/code flex-1 min-h-0">
              {/* Copy Code Button inside the textarea box */}
              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                <CopyButton text={inputText} label="Copy code" />
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 font-mono text-[11px] leading-relaxed p-4 bg-zinc-950 text-zinc-100 rounded-b-2xl border-none focus:outline-none focus:ring-1 focus:ring-(--color-accent)/30 resize-none shadow-inner block"
                spellCheck={false}
                placeholder="Mermaid source syntax..."
              />
            </div>
          </div>

          {/* Tech Stack Card (Spans 1 column on desktop) */}
          {/* Tech Stack Card (Spans 1 column on desktop) */}
          {hasTechStack && (
            <div className="md:col-span-1 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 space-y-4 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <SectionLabel>Technology Blueprint</SectionLabel>
                <div className="space-y-4">
                  {roleOrder.map((role) => {
                    const items = techStack[role] || [];
                    if (items.length === 0) return null;
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
              </div>
              
              {data.stack_reason && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic leading-relaxed pt-2 border-t border-(--color-border)">
                  {data.stack_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Section 5: Performance Metrics (Maintained last at the very bottom as a 3-column row) */}
        {data.results && (
          <div className="grid gap-4 sm:grid-cols-3">
            {(["performance", "scale", "utility"] as const).map((key) => {
              const metric = data.results[key];
              if (!metric?.text) return null;
              const Icon = getIcon(metric.icon);
              return (
                <div key={key} className="flex items-start gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-800 shadow-sm">
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
      </div>
    </div>
  );
}

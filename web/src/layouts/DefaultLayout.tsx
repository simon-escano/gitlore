import { useEffect, useRef, useState } from "react";
import {
  Zap, Layers, Shield, ExternalLink, Github, Clipboard, Check, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { GitloreOutput } from "../types/gitlore";

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  DEFAULT LAYOUT — Edit this file to customize how the       │
 * │  portfolio output is rendered in the Preview tab.           │
 * │  This component receives the full GitloreOutput as props.   │
 * └──────────────────────────────────────────────────────────────┘
 */

interface Props {
  data: GitloreOutput;
}

const iconMap: Record<string, LucideIcon> = {
  zap: Zap, layers: Layers, shield: Shield, github: Github, link: ExternalLink,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name.toLowerCase()] ?? Zap;
}

const roleColors: Record<string, { text: string; bg: string; dot: string }> = {
  Primary: { text: "text-(--color-role-primary)", bg: "bg-(--color-role-primary-subtle)", dot: "bg-(--color-role-primary)" },
  Supporting: { text: "text-(--color-role-supporting)", bg: "bg-(--color-role-supporting-subtle)", dot: "bg-(--color-role-supporting)" },
  Infrastructure: { text: "text-(--color-role-infra)", bg: "bg-(--color-role-infra-subtle)", dot: "bg-(--color-role-infra)" },
};

function getRoleColor(role: string) {
  return roleColors[role] ?? roleColors.Supporting;
}

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
          securityLevel: "loose",
        });
        if (cancelled) return;
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        setError((err as Error).message);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-xs text-(--color-text-muted) font-mono whitespace-pre-wrap">${code}</pre>`;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <>
      <div ref={containerRef} className="flex justify-center overflow-x-auto" />
      {error && (
        <p className="mt-2 rounded-lg bg-(--color-error-subtle) px-3 py-2 text-xs text-(--color-error) font-mono">
          Mermaid syntax error: {error}
        </p>
      )}
    </>
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
      {copied ? <><Check className="h-3 w-3 text-(--color-success)" />Copied</> : <><Clipboard className="h-3 w-3" />{label}</>}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-medium uppercase tracking-widest text-(--color-text-muted)">
      {children}
    </h4>
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
    <div className="space-y-5 animate-fade-up">
      {/* Hero */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-(--color-text)">{data.title}</h2>
        <p className="mt-1 text-base text-(--color-text-secondary)">{data.one_liner}</p>
        {data.contributions && (
          <p className="mt-2 text-sm text-(--color-text-muted)">{data.contributions}</p>
        )}
      </div>

      {/* Problem → Goal */}
      {(data.problem || data.goal) && (
        <div className="flex items-stretch gap-0 overflow-hidden rounded-2xl border border-(--color-border)">
          {data.problem && (
            <div className="flex-1 border-r border-(--color-border) bg-gradient-to-br from-(--color-problem-subtle) to-(--color-surface) p-4">
              <SectionLabel>Problem</SectionLabel>
              <p className="mt-2 text-sm text-(--color-text)">{data.problem}</p>
            </div>
          )}
          {data.problem && data.goal && (
            <div className="flex items-center bg-(--color-bg-secondary) px-3">
              <ArrowRight className="h-4 w-4 text-(--color-text-muted)" />
            </div>
          )}
          {data.goal && (
            <div className="flex-1 bg-gradient-to-br from-(--color-goal-subtle) to-(--color-surface) p-4">
              <SectionLabel>Goal</SectionLabel>
              <p className="mt-2 text-sm text-(--color-text)">{data.goal}</p>
            </div>
          )}
        </div>
      )}

      {/* Bento: Results + Stack */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Results trio */}
        {data.results && (["performance", "scale", "utility"] as const).map((key) => {
          const metric = data.results[key];
          if (!metric?.text) return null;
          const Icon = getIcon(metric.icon);
          return (
            <div key={key} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-accent)/30 hover:shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--color-accent-subtle)">
                <Icon className="h-4 w-4 text-(--color-accent)" />
              </div>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-widest text-(--color-text-muted) capitalize">{key}</p>
              <p className="mt-1 text-sm text-(--color-text)">{metric.text}</p>
            </div>
          );
        })}
      </div>

      {/* Stack — grouped by role */}
      {data.stack.length > 0 && (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 space-y-3">
          <SectionLabel>Tech Stack</SectionLabel>
          {sortedGroups.map((role) => {
            const items = stackGroups[role];
            const rc = getRoleColor(role);
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`} />
                  <span className={`text-xs font-medium ${rc.text}`}>{role}</span>
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
          {data.stack_reason && (
            <p className="text-xs text-(--color-text-muted) pt-1">{data.stack_reason}</p>
          )}
        </div>
      )}

      {/* Architecture Diagram */}
      {data.architecture_diagram_code && (
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Architecture</SectionLabel>
            <CopyButton text={data.architecture_diagram_code} label="Copy Mermaid" />
          </div>
          <div className="rounded-xl bg-(--color-bg-secondary) p-4">
            <MermaidDiagram code={data.architecture_diagram_code} />
          </div>
        </div>
      )}

      {/* Bento: Features + Links */}
      {data.key_features.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {data.key_features.map((f, i) => {
            const Icon = getIcon(f.icon);
            return (
              <div key={i} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-accent)/30 hover:shadow-sm">
                <Icon className="h-4 w-4 text-(--color-accent)" />
                <p className="mt-2 text-sm text-(--color-text)">{f.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Links */}
      {data.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.links.map((link, i) => {
            const Icon = getIcon(link.icon);
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) transition-all hover:border-(--color-accent)/30 hover:text-(--color-accent) hover:shadow-sm"
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

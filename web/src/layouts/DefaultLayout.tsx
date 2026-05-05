import { useEffect, useRef } from "react";
import {
  Zap, Layers, Shield, ExternalLink, Github,
  type LucideIcon,
} from "lucide-react";
import type { GitloreOutput } from "../types/gitlore";

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  DEFAULT LAYOUT — Edit this file to customize how the       │
 * │  portfolio output is rendered in the Preview tab.            │
 * │  This component receives the full GitloreOutput as props.   │
 * └──────────────────────────────────────────────────────────────┘
 */

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

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

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
        }
      } catch {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-xs text-(--color-text-muted) font-mono whitespace-pre-wrap">${code}</pre>`;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [code]);

  return <div ref={containerRef} className="flex justify-center overflow-x-auto" />;
}

export function DefaultLayout({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <h2 className="text-2xl font-bold text-(--color-text)">{data.title}</h2>
        <p className="mt-1 text-(--color-text-secondary)">{data.one_liner}</p>
        {data.contributions && (
          <p className="mt-2 text-sm text-(--color-text-muted)">{data.contributions}</p>
        )}
      </div>

      {/* Problem + Goal */}
      {(data.problem || data.goal) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.problem && (
            <div className="rounded-lg bg-(--color-bg-secondary) p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Problem</h4>
              <p className="mt-1.5 text-sm text-(--color-text)">{data.problem}</p>
            </div>
          )}
          {data.goal && (
            <div className="rounded-lg bg-(--color-bg-secondary) p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Goal</h4>
              <p className="mt-1.5 text-sm text-(--color-text)">{data.goal}</p>
            </div>
          )}
        </div>
      )}

      {/* Results trio */}
      {data.results && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(["performance", "scale", "utility"] as const).map((key) => {
            const metric = data.results[key];
            if (!metric?.text) return null;
            const Icon = getIcon(metric.icon);
            return (
              <div key={key} className="flex items-start gap-3 rounded-lg border border-(--color-border) p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--color-accent-subtle)">
                  <Icon className="h-4 w-4 text-(--color-accent)" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted) capitalize">{key}</h4>
                  <p className="mt-0.5 text-sm text-(--color-text)">{metric.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stack */}
      {data.stack.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {data.stack.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-xs font-medium text-(--color-text)"
              >
                {s.name}
                <span className="rounded-full bg-(--color-accent-subtle) px-1.5 py-0.5 text-[10px] text-(--color-accent)">
                  {s.role}
                </span>
              </span>
            ))}
          </div>
          {data.stack_reason && (
            <p className="mt-2 text-xs text-(--color-text-muted)">{data.stack_reason}</p>
          )}
        </div>
      )}

      {/* Architecture Diagram */}
      {data.architecture_diagram_code && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Architecture</h4>
          <div className="rounded-lg border border-(--color-border) bg-(--color-bg-secondary) p-4">
            <MermaidDiagram code={data.architecture_diagram_code} />
          </div>
        </div>
      )}

      {/* Key Features */}
      {data.key_features.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">Key Features</h4>
          <ul className="space-y-2">
            {data.key_features.map((f, i) => {
              const Icon = getIcon(f.icon);
              return (
                <li key={i} className="flex items-start gap-3 rounded-lg bg-(--color-bg-secondary) px-4 py-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
                  <span className="text-sm text-(--color-text)">{f.text}</span>
                </li>
              );
            })}
          </ul>
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
                className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-bg-secondary) hover:text-(--color-accent)"
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

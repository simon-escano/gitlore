import { useState } from "react";
import { Send, Plus, Github, Trash2 } from "lucide-react";
import type { GenerateRequest } from "../../types/gitlore";

interface Props {
  onSubmit: (req: GenerateRequest) => void;
  onAddToQueue: (req: GenerateRequest) => void;
  disabled?: boolean;
}

export function GenerateForm({ onSubmit, onAddToQueue, disabled }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [contributions, setContributions] = useState("");
  const [context, setContext] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);

  const isValid =
    url.includes("github.com/") &&
    title.trim() &&
    contributions.trim() &&
    links.every((l) => l.label.trim() && l.url.trim().startsWith("http"));

  const handleAddLink = () => {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: "label" | "url", value: string) => {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const buildRequest = (): GenerateRequest => ({
    url: url.trim(),
    title: title.trim(),
    contributions: contributions.trim(),
    context: context.trim() || undefined,
    links: links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(buildRequest());
  };

  const handleAddToQueue = () => {
    if (!isValid) return;
    onAddToQueue(buildRequest());
  };

  const inputClass = "w-full rounded-xl border border-(--color-border) bg-(--color-bg) px-4 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-all focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/15";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repo-url" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
          Repository
        </label>
        <div className="relative">
          <Github className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            id="repo-url"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="project-title" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
          Project Title
        </label>
        <input
          id="project-title"
          type="text"
          placeholder="My Awesome Project"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contributions" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
          Contributions
        </label>
        <textarea
          id="contributions"
          placeholder="Built the database layer, managed frontend state, integrated third-party APIs..."
          value={contributions}
          onChange={(e) => setContributions(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-(--color-text-muted)">
          Describe what you did — Gitlore will synthesize this into professional role titles.
        </p>
      </div>

      <div>
        <label htmlFor="context" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
          Context <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="context"
          placeholder="Any additional context for the case study..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium uppercase tracking-wider text-(--color-text-muted)">
            Custom Links <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <button
            type="button"
            onClick={handleAddLink}
            className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-accent) hover:text-(--color-accent-hover) transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Link
          </button>
        </div>

        {links.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {links.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-center animate-fade-in">
                <input
                  type="text"
                  placeholder="e.g. Live Demo"
                  value={link.label}
                  onChange={(e) => handleLinkChange(idx, "label", e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={link.url}
                  onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                  className={`${inputClass} flex-[2]`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="p-2.5 text-(--color-text-muted) hover:text-(--color-error) rounded-xl hover:bg-(--color-bg-secondary) transition-colors shrink-0"
                  title="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="submit"
          disabled={!isValid || disabled}
          className="inline-flex items-center gap-2 rounded-xl bg-(--color-accent) px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-(--color-accent-hover) hover:shadow-lg hover:shadow-(--color-accent)/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Generate
        </button>
        <button
          type="button"
          onClick={handleAddToQueue}
          disabled={!isValid}
          className="inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 py-2.5 text-sm font-medium text-(--color-text-secondary) transition-all hover:bg-(--color-bg-secondary) hover:text-(--color-text) disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Queue
        </button>
      </div>
    </form>
  );
}

import { useState } from "react";
import { Send, Plus, Github } from "lucide-react";
import type { GenerateRequest } from "../../types/gitlore";

interface Props {
  onSubmit: (req: GenerateRequest) => void;
  onAddToQueue: (req: GenerateRequest) => void;
  disabled?: boolean;
}

export function GenerateForm({ onSubmit, onAddToQueue, disabled }: Props) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [context, setContext] = useState("");

  const isValid = url.includes("github.com/") && title.trim() && role.trim();

  const buildRequest = (): GenerateRequest => ({
    url: url.trim(),
    title: title.trim(),
    role: role.trim(),
    context: context.trim() || undefined,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Repository URL */}
      <div>
        <label htmlFor="repo-url" className="mb-1.5 block text-sm font-medium text-(--color-text)">
          Repository URL
        </label>
        <div className="relative">
          <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            id="repo-url"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) py-2.5 pl-10 pr-4 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-colors focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20"
          />
        </div>
      </div>

      {/* Title + Role row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project-title" className="mb-1.5 block text-sm font-medium text-(--color-text)">
            Project Title
          </label>
          <input
            id="project-title"
            type="text"
            placeholder="My Awesome Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-colors focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20"
          />
        </div>
        <div>
          <label htmlFor="your-role" className="mb-1.5 block text-sm font-medium text-(--color-text)">
            Your Role
          </label>
          <input
            id="your-role"
            type="text"
            placeholder="Lead Developer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-colors focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20"
          />
        </div>
      </div>

      {/* Context */}
      <div>
        <label htmlFor="context" className="mb-1.5 block text-sm font-medium text-(--color-text)">
          Context <span className="text-(--color-text-muted)">(optional)</span>
        </label>
        <textarea
          id="context"
          placeholder="Additional context about your contributions..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted) transition-colors focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!isValid || disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--color-accent-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Generate
        </button>
        <button
          type="button"
          onClick={handleAddToQueue}
          disabled={!isValid}
          className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-5 py-2.5 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-bg-secondary) disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add to Queue
        </button>
      </div>
    </form>
  );
}

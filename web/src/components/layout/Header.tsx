import { Sun, Moon, Monitor, Zap } from "lucide-react";
import { useTheme } from "../../lib/theme";

export function Header() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-50 border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-accent) text-white">
            <Zap className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-(--color-text)">
            Gitlore
          </h1>
        </div>
        <button
          onClick={cycleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-secondary) hover:text-(--color-text)"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

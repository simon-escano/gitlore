export const ALLOWED_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs",
  ".java", ".rb", ".vue", ".svelte", ".prisma",
];

export const IGNORED_PATHS = [
  "node_modules/", "dist/", ".git/", ".next/", "__pycache__/",
  "vendor/", "target/", "build/", ".vscode/", ".idea/",
  "coverage/", ".turbo/", "pnpm-lock.yaml", "package-lock.json",
  "yarn.lock", ".env", ".DS_Store", "drizzle/", "migrations/",
  "tests/", "spec/", "__tests__/", ".github/", ".config.",
  "jest.config.", "tailwind.config.", "postcss.config.",
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico",
  ".css", ".scss", ".less",
];

/** Files that are always included if they exist, regardless of budget */
export const PRIORITY_FILES = [
  "README.md",
  "package.json",
  "go.mod",
  "Cargo.toml",
  "pyproject.toml",
  "requirements.txt",
  "Makefile",
  "Dockerfile",
];

/** Entry point files — included at high priority after PRIORITY_FILES */
export const ENTRY_POINTS = [
  "src/index.ts", "src/index.js", "src/main.ts", "src/main.js",
  "src/app.ts", "src/app.js", "index.ts", "index.js",
  "main.go", "cmd/main.go", "app.py", "main.py",
  "src/lib.rs", "src/main.rs",
];

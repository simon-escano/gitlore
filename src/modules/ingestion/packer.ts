import { config } from "../../lib/config";
import {
  ALLOWED_EXTENSIONS,
  IGNORED_PATHS,
  PRIORITY_FILES,
  ENTRY_POINTS,
} from "../../lib/constants";
import {
  fetchRepoMeta,
  fetchReadme,
  fetchFileTree,
  fetchFileContent,
} from "./github";
import type { RepoContext } from "./types";

function isIgnored(path: string): boolean {
  return IGNORED_PATHS.some((p) => path.includes(p));
}

function hasAllowedExtension(path: string): boolean {
  return ALLOWED_EXTENSIONS.some((ext) => path.endsWith(ext));
}

function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export async function ingestRepository(
  owner: string,
  repo: string
): Promise<RepoContext> {
  // Fetch metadata and README in parallel
  const [meta, readme] = await Promise.all([
    fetchRepoMeta(owner, repo),
    fetchReadme(owner, repo),
  ]);

  // Fetch file tree
  const tree = await fetchFileTree(owner, repo, meta.default_branch);

  // Filter to blobs only, exclude ignored paths
  const blobs = tree.tree
    .filter((e) => e.type === "blob" && !isIgnored(e.path))
    .map((e) => ({ path: e.path, size: e.size ?? 0 }));

  const fileTree = blobs.map((b) => b.path);

  // Tier 1: Priority files (package.json, go.mod, etc.)
  const priorityPaths = blobs
    .filter((b) => PRIORITY_FILES.includes(getFileName(b.path)))
    .map((b) => b.path);

  // Tier 2: Entry points
  const entryPaths = blobs
    .filter((b) => ENTRY_POINTS.some((ep) => b.path.endsWith(ep)))
    .filter((b) => !priorityPaths.includes(b.path))
    .map((b) => b.path);

  // Tier 3: Other source files (by allowed extension)
  const sourcePaths = blobs
    .filter((b) => hasAllowedExtension(b.path))
    .filter((b) => !priorityPaths.includes(b.path) && !entryPaths.includes(b.path))
    .sort((a, b) => a.size - b.size) // Smaller files first — more files in budget
    .map((b) => b.path);

  // Pack files in priority order within the character budget
  const budget = config.inference.maxContextChars;
  let packed = "";
  let packageInfo = "";

  const orderedPaths = [...priorityPaths, ...entryPaths, ...sourcePaths];

  for (const filePath of orderedPaths) {
    if (packed.length >= budget) break;

    const content = await fetchFileContent(owner, repo, filePath);
    if (!content) continue;

    const block = `\n--- ${filePath} ---\n${content}\n`;

    // Capture package info separately
    const name = getFileName(filePath);
    if (
      name === "package.json" ||
      name === "go.mod" ||
      name === "Cargo.toml" ||
      name === "pyproject.toml"
    ) {
      packageInfo += block;
    }

    if (packed.length + block.length <= budget) {
      packed += block;
    }
  }

  return {
    owner,
    repo,
    description: meta.description,
    readme,
    packageInfo: packageInfo || "No package/module file found.",
    fileTree,
    packedSource: packed || "No source files found within budget.",
  };
}

import type { AppConfig } from "../../lib/config";
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
  repo: string,
  config: AppConfig
): Promise<RepoContext> {
  const startTime = Date.now();

  // Fetch metadata and README in parallel
  console.log(`  ├─ Fetching repo metadata and README...`);
  const [meta, readme] = await Promise.all([
    fetchRepoMeta(owner, repo, config),
    fetchReadme(owner, repo, config),
  ]);
  console.log(`  ├─ Repo: ${meta.full_name} (${meta.language ?? "unknown lang"}, ⭐ ${meta.stargazers_count})`);
  console.log(`  ├─ Branch: ${meta.default_branch}`);
  console.log(`  ├─ README: ${readme.length} chars`);

  // Fetch file tree
  console.log(`  ├─ Fetching file tree...`);
  const tree = await fetchFileTree(owner, repo, meta.default_branch, config);

  // Filter to blobs only, exclude ignored paths
  const blobs = tree.tree
    .filter((e) => e.type === "blob" && !isIgnored(e.path))
    .map((e) => ({ path: e.path, size: e.size ?? 0 }));

  const fileTree = blobs.map((b) => b.path);
  console.log(`  ├─ File tree: ${tree.tree.length} total → ${blobs.length} after filtering`);

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
    .sort((a, b) => {
      // 1. Prioritize shallower files (closer to root)
      const depthA = a.path.split("/").length;
      const depthB = b.path.split("/").length;
      if (depthA !== depthB) return depthA - depthB;

      // 2. Secondary: Smaller files first
      return a.size - b.size;
    })
    .map((b) => b.path);

  console.log(`  ├─ Tier 1 (priority): ${priorityPaths.length} files ${priorityPaths.length > 0 ? `[${priorityPaths.join(", ")}]` : ""}`);
  console.log(`  ├─ Tier 2 (entry pts): ${entryPaths.length} files ${entryPaths.length > 0 ? `[${entryPaths.join(", ")}]` : ""}`);
  console.log(`  ├─ Tier 3 (source):    ${sourcePaths.length} files`);

  // Pack files in priority order within the character budget
  const budget = config.inference.maxContextChars;
  let packed = "";
  let packageInfo = "";
  let packedCount = 0;

  const orderedPaths = [...priorityPaths, ...entryPaths, ...sourcePaths];

  console.log(`  ├─ Packing files (budget: ${budget.toLocaleString()} chars)...`);

  for (const filePath of orderedPaths) {
    if (packed.length >= budget) {
      console.log(`  │  ⚠ Budget reached, stopping.`);
      break;
    }

    const content = await fetchFileContent(owner, repo, filePath, config);
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
      packedCount++;
      const pct = ((packed.length / budget) * 100).toFixed(0);
      console.log(`  │  ✓ ${filePath} (+${content.length} chars, ${pct}% budget used)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  └─ Ingestion complete: ${packedCount} files packed, ${packed.length.toLocaleString()} chars in ${elapsed}s`);

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

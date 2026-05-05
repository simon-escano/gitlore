import type { AppConfig } from "../../lib/config";
import { noopProgress, type ProgressCallback } from "../../lib/progress";
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

/**
 * Maximum number of individual file content fetch requests allowed.
 * Keeps outbound subrequests safely below Cloudflare's limit (50 on Free).
 */
const MAX_FILE_SUBREQUESTS = 12;

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
  config: AppConfig,
  onProgress: ProgressCallback = noopProgress
): Promise<RepoContext> {
  const startTime = Date.now();

  // Fetch metadata and README in parallel
  onProgress({ phase: "ingestion", message: "Fetching repo metadata and README..." });
  const [meta, readme] = await Promise.all([
    fetchRepoMeta(owner, repo, config),
    fetchReadme(owner, repo, config),
  ]);
  onProgress({
    phase: "ingestion",
    message: `Repo: ${meta.full_name}`,
    detail: `${meta.language ?? "unknown"}, ⭐ ${meta.stargazers_count}, branch: ${meta.default_branch}`,
  });

  // Fetch file tree
  onProgress({ phase: "ingestion", message: "Fetching file tree..." });
  const tree = await fetchFileTree(owner, repo, meta.default_branch, config);

  const blobs = tree.tree
    .filter((e) => e.type === "blob" && !isIgnored(e.path))
    .map((e) => ({ path: e.path, size: e.size ?? 0 }));

  const fileTree = blobs.map((b) => b.path);
  onProgress({
    phase: "ingestion",
    message: `File tree: ${tree.tree.length} total → ${blobs.length} after filtering`,
  });

  // Tier 1: Priority files (excluding README, which we've already loaded)
  const priorityPaths = blobs
    .filter((b) => {
      const name = getFileName(b.path);
      return PRIORITY_FILES.includes(name) && name.toLowerCase() !== "readme.md";
    })
    .map((b) => b.path);

  // Tier 2: Entry points
  const entryPaths = blobs
    .filter((b) => ENTRY_POINTS.some((ep) => b.path.endsWith(ep)))
    .filter((b) => !priorityPaths.includes(b.path))
    .map((b) => b.path);

  // Tier 3: Source files
  const sourcePaths = blobs
    .filter((b) => hasAllowedExtension(b.path))
    .filter((b) => !priorityPaths.includes(b.path) && !entryPaths.includes(b.path))
    .sort((a, b) => {
      const depthA = a.path.split("/").length;
      const depthB = b.path.split("/").length;
      if (depthA !== depthB) return depthA - depthB;
      return a.size - b.size;
    })
    .map((b) => b.path);

  // Pack files within budget limits
  const budget = config.inference.maxContextChars;
  let packed = "";
  let packageInfo = "";
  let packedCount = 0;

  // Merge lists and strictly slice to subrequest budget
  const allCandidatePaths = [...priorityPaths, ...entryPaths, ...sourcePaths];
  const orderedPaths = allCandidatePaths.slice(0, MAX_FILE_SUBREQUESTS);

  onProgress({ 
    phase: "ingestion", 
    message: `Packing files (budget: ${budget.toLocaleString()} chars, max files: ${MAX_FILE_SUBREQUESTS})...` 
  });

  for (const filePath of orderedPaths) {
    if (packed.length >= budget) break;

    const content = await fetchFileContent(owner, repo, filePath, config);
    if (!content) continue;

    const block = `\n--- ${filePath} ---\n${content}\n`;
    const name = getFileName(filePath);

    if (["package.json", "go.mod", "Cargo.toml", "pyproject.toml"].includes(name)) {
      packageInfo += block;
    }

    if (packed.length + block.length <= budget) {
      packed += block;
      packedCount++;
      const pct = ((packed.length / budget) * 100).toFixed(0);
      onProgress({
        phase: "ingestion",
        message: `Reading ${filePath}`,
        detail: `[File ${packedCount}/${orderedPaths.length}] +${content.length} chars, ${pct}% budget used`,
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  onProgress({
    phase: "ingestion",
    message: `Ingestion complete: ${packedCount} files packed in ${elapsed}s`,
    detail: `${packed.length.toLocaleString()} chars total`,
  });

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

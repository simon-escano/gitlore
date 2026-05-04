import { config } from "../../lib/config";
import { Errors } from "../../lib/errors";
import type { GitHubRepoResponse, GitHubTreeResponse } from "./types";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "gitlore/1.0",
  };
  if (config.github.pat) {
    h["Authorization"] = `Bearer ${config.github.pat}`;
  }
  return h;
}

export async function fetchRepoMeta(
  owner: string,
  repo: string
): Promise<GitHubRepoResponse> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) throw Errors.repoNotFound(owner, repo);
  if (!res.ok) throw Errors.inferenceFailure(`GitHub API error: ${res.status}`);

  return res.json() as Promise<GitHubRepoResponse>;
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}/readme`;
  const res = await fetch(url, {
    headers: { ...headers(), Accept: "application/vnd.github.v3.raw" },
  });

  if (res.status === 404) return "No README found.";
  if (!res.ok) return "Failed to fetch README.";

  return res.text();
}

export async function fetchFileTree(
  owner: string,
  repo: string,
  branch: string
): Promise<GitHubTreeResponse> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const res = await fetch(url, { headers: headers() });

  if (!res.ok) throw Errors.inferenceFailure(`Failed to fetch file tree: ${res.status}`);

  return res.json() as Promise<GitHubTreeResponse>;
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { ...headers(), Accept: "application/vnd.github.v3.raw" },
  });

  if (!res.ok) return "";
  return res.text();
}

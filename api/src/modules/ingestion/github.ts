import { Errors } from "../../lib/errors";
import type { AppConfig } from "../../lib/config";
import type { GitHubRepoResponse, GitHubTreeResponse } from "./types";

function headers(config: AppConfig): Record<string, string> {
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
  repo: string,
  config: AppConfig
): Promise<GitHubRepoResponse> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}`;
  const res = await fetch(url, { headers: headers(config) });

  if (res.status === 404) throw Errors.repoNotFound(owner, repo);
  if (res.status === 403) throw Errors.inferenceFailure("GitHub API Rate Limit Exceeded (403). Add a GITHUB_PAT to your secrets.");
  if (!res.ok) throw Errors.inferenceFailure(`GitHub API error: ${res.status}`);

  return res.json() as Promise<GitHubRepoResponse>;
}

export async function fetchReadme(owner: string, repo: string, config: AppConfig): Promise<string> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}/readme`;
  const res = await fetch(url, {
    headers: { ...headers(config), Accept: "application/vnd.github.v3.raw" },
  });

  if (res.status === 404) return "No README found.";
  if (!res.ok) return "Failed to fetch README.";

  return res.text();
}

export async function fetchFileTree(
  owner: string,
  repo: string,
  branch: string,
  config: AppConfig
): Promise<GitHubTreeResponse> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const res = await fetch(url, { headers: headers(config) });

  if (res.status === 403) throw Errors.inferenceFailure("GitHub API Rate Limit Exceeded (403) while fetching file tree. Add a GITHUB_PAT.");
  if (!res.ok) throw Errors.inferenceFailure(`Failed to fetch file tree: ${res.status}`);

  return res.json() as Promise<GitHubTreeResponse>;
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  config: AppConfig
): Promise<string> {
  const url = `${config.github.apiBase}/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { ...headers(config), Accept: "application/vnd.github.v3.raw" },
  });

  if (!res.ok) return "";
  return res.text();
}

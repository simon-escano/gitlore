export interface FileEntry {
  path: string;
  size: number;
  type: "blob" | "tree";
}

export interface RepoContext {
  owner: string;
  repo: string;
  description: string | null;
  readme: string;
  packageInfo: string;
  fileTree: string[];
  packedSource: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: Array<{
    path: string;
    mode: string;
    type: "blob" | "tree";
    sha: string;
    size?: number;
    url: string;
  }>;
  truncated: boolean;
}

export interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
}

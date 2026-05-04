export class GitloreError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(code: string, status: number, message: string, details?: unknown) {
    super(message);
    this.name = "GitloreError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const Errors = {
  ollamaDown: () =>
    new GitloreError(
      "OLLAMA_UNREACHABLE",
      503,
      "Ollama is not running. Start it with: ollama serve"
    ),
  repoNotFound: (owner: string, repo: string) =>
    new GitloreError("REPO_NOT_FOUND", 404, `Repository ${owner}/${repo} not found or is private`),
  invalidInput: (msg: string) =>
    new GitloreError("INVALID_INPUT", 400, msg),
  inferenceFailure: (msg: string) =>
    new GitloreError("INFERENCE_FAILED", 502, msg),
  validationFailure: (msg: string) =>
    new GitloreError("VALIDATION_FAILED", 422, msg),
  blockedEndpoint: (host: string) =>
    new GitloreError("BLOCKED_ENDPOINT", 403, `Attempted call to non-local host: ${host}`),
} as const;

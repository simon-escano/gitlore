# Gitlore: Local-First Portfolio Intelligence API

## 1. Project Vision
Gitlore is a headless, local-first API designed to transform raw GitHub repositories and developer context into high-impact, professional portfolio entries. 

## 2. Technical Philosophy
- **Local-First & Forever Free:** LLM inference must be handled 100% locally via Ollama. No cloud fallbacks. No token limits. No subscription costs.
- **Privacy-Native:** No code leaves the user's machine during analysis.

## 3. Hard Economic Constraints (The "No Shenanigans" Clause)
- **Zero Cloud Spend:** The system must function fully without any paid API keys (OpenAI, Anthropic, etc.).
- **Local Inference:** All generative tasks must target `localhost:11434` (Ollama).
- **FOSS Tooling:** Only use open-source libraries that do not require account registration or "Free Tier" limits that eventually expire.

## 4. The "Solution" Data Contract
Every generated entry must strictly follow this JSON schema:
- **Identity:** `title`, `one_liner`, `contributions` (Single string).
- **The "Bucks" Trio:** `problem`, `goal`, `results` (Object containing `performance`, `scale`, `utility` with Lucide icon keys).
- **Tech Strategy:** `stack` (Array of {name, role: Primary|Supporting|Infrastructure}), `stack_reason` (Text).
- **Visualization:** `architecture_diagram_code` (Mermaid.js syntax), `gallery` (Array of URLs).
- **Execution:** `links` (Array of {icon, label, url}), `key_features` (Max 5, with Lucide icon keys).

## 5. Functional Requirements
### A. Ingestion Module
- Fetch repository metadata and core files (README.md, package.json/go.mod, etc.) via GitHub REST API (Public access).
- Pre-process codebase: "Pack" essential logic files into a context-optimized string using a custom lightweight packer.

### B. Local Inference Module
- Interface with Ollama using OpenAI-compatible endpoints.
- Must support JSON-mode for structured output.
- Default to lightweight models (e.g., Llama 3 8B or Gemma 2 9B) to ensure speed on average dev hardware.

### C. Validation Module
- Validate Mermaid.js syntax before final output.

## 6. Development Constraints
- **Environment:** Arch Linux native.
- **Package Manager:** `pnpm`.
- **Node Versioning:** `fnm`.
- **Git Strategy:** Atomic, frequent commits following Conventional Commits (feat:, fix:, chore:).
import type { InferenceContext } from "../ingestion/types";

const JSON_TEMPLATE = `{
  "title": "Gitlore Portfolio Generator",
  "one_liner": "A local AI tool to generate case studies.",
  "contributions": "Lead Developer",
  "problem": "Manual portfolio creation takes too long.",
  "goal": "Automate case study generation using local LLMs.",
  "results": {
    "performance": { "icon": "zap", "text": "Reduced cold start from 2.4s to 180ms" },
    "scale": { "icon": "layers", "text": "Processes 10k files efficiently" },
    "utility": { "icon": "shield", "text": "Zero cloud costs and full privacy" }
  },
  "stack": [
    { "name": "TypeScript", "role": "Primary" },
    { "name": "Node.js", "role": "Infrastructure" }
  ],
  "stack_reason": "TypeScript provides type safety and Node.js offers a fast runtime for local API orchestration.",
  "architecture_diagram_code": "graph TD\\n  A[API Request] --> B[Ingestion]\\n  B --> C[Ollama LLM]\\n  C --> D[Zod Validation]",
  "gallery": [],
  "links": [
    { "icon": "github", "label": "GitHub Repo", "url": "https://github.com/simon-escano/gitlore" }
  ],
  "key_features": [
    { "icon": "zap", "text": "Blazing fast local inference" },
    { "icon": "lock", "text": "100% private architecture" }
  ]
}`;

export function buildSystemPrompt(): string {
  return `You are a Senior Technical Writer and Software Architect.

Your task: analyze a GitHub repository and produce a structured portfolio case study.

RULES:
1. Be specific and quantitative. Never say "improved performance" — say "reduced cold start from 2.4s to 180ms".
2. The architecture_diagram_code field MUST contain valid Mermaid.js syntax (graph TD or graph LR).
3. The stack array must ONLY contain technologies that are actually evidenced in the codebase files provided.
4. key_features must have between 1 and 5 items. Each must have a Lucide icon name (e.g. "zap", "shield", "layers").
5. If you cannot determine a value with confidence, use a reasonable inference from the codebase — never leave a field empty.
6. The results object must contain performance, scale, and utility — each with an icon (Lucide name) and descriptive text.
7. All URLs in the links array must be real, absolute URLs starting with "https://" (e.g. "https://github.com/owner/repo"). If you are unsure, default to the GitHub repository URL.
8. The output must strictly adopt the provided Title and Role/Contributions. Write the case study from the perspective of someone in that Role.
9. You MUST copy the exact URLs provided in the Gallery section directly into the output JSON's gallery array. Do not invent gallery URLs.
10. Write as if presenting to a hiring manager at a top-tier tech company.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not add markdown fences, explanations, or preambles.
The JSON must strictly follow this exact structure and field names (replace the example values with your generated content):
${JSON_TEMPLATE}`;
}

export function buildUserPrompt(context: InferenceContext): string {
  const fileTreeSample = context.fileTree.slice(0, 50).join("\n");

  return `Analyze this repository and generate a portfolio case study.

## Target Output Identity
Title: ${context.title}
My Role / Contributions: ${context.role}
Additional Context: ${context.context ?? "None provided"}
Gallery URLs to include: ${context.gallery.length ? context.gallery.join(", ") : "[]"}

## Repository: ${context.owner}/${context.repo}
## Description: ${context.description ?? "No description provided"}

## File Tree (first 50 files):
${fileTreeSample}

## README:
${context.readme}

## Package/Module Info:
${context.packageInfo}

## Source Files (packed):
${context.packedSource}

Generate the structured case study JSON now.`;
}

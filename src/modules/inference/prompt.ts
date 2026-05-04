import type { InferenceContext } from "../ingestion/types";

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

OUTPUT: Return ONLY the JSON object. No markdown fences. No explanation. No preamble.`;
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

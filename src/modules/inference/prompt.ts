import type { InferenceContext } from "../ingestion/types";

const TS_INTERFACE = `interface Portfolio {
  title: string; // A short, catchy title
  one_liner: string; // A single sentence summary
  contributions: string; // The role and contributions
  problem: string; // The problem being solved
  goal: string; // The goal of the project
  results: {
    performance: { icon: "zap"; text: string }; // e.g., "Reduced cold start..."
    scale: { icon: "layers"; text: string };
    utility: { icon: "shield"; text: string };
  };
  stack: Array<{
    name: string;
    role: "Primary" | "Supporting" | "Infrastructure";
  }>;
  stack_reason: string; // Explain why this stack was chosen in 1-2 sentences
  architecture_diagram_code: string; // A valid Mermaid.js graph TD diagram
  links: Array<{
    icon: "github" | "link";
    label: string;
    url: string;
  }>;
  key_features: Array<{
    icon: string; // A lucide icon name like "zap", "shield", "lock"
    text: string; // Feature description
  }>;
}`;

export function buildSystemPrompt(): string {
  return `You are a Senior Technical Writer and Software Architect.

Your task: analyze a GitHub repository and produce a structured portfolio case study.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not add markdown fences, explanations, or preambles.
The JSON MUST strictly satisfy this TypeScript interface:

${TS_INTERFACE}

RULES:
1. Be specific and quantitative. Never say "improved performance" — say "reduced cold start from 2.4s to 180ms".
2. The architecture_diagram_code field MUST contain valid Mermaid.js syntax (graph TD or graph LR).
3. The stack array must ONLY contain technologies that are actually evidenced in the codebase files provided.
4. DO NOT output an empty template. You MUST generate actual content based on the repository code provided.
5. If you cannot determine a value with confidence, use a reasonable inference from the codebase — never leave a field empty.
6. The results object must contain performance, scale, and utility — each with an icon (Lucide name) and descriptive text.
7. All URLs in the links array must be real, absolute URLs starting with "https://".
8. The output must strictly adopt the provided Title and Role/Contributions. Write the case study from the perspective of someone in that Role.
9. Write as if presenting to a hiring manager at a top-tier tech company.`;
}

export function buildUserPrompt(context: InferenceContext): string {
  const fileTreeSample = context.fileTree.slice(0, 50).join("\\n");

  return `Analyze this repository and generate a portfolio case study.

## Target Output Identity
Title: ${context.title}
My Role / Contributions: ${context.role}
Additional Context: ${context.context ?? "None provided"}

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

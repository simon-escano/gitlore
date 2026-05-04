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
  return `You are a Senior Technical Writer and Software Architect analyzing a GitHub repository.`;
}

export function buildUserPrompt(context: InferenceContext): string {
  const fileTreeSample = context.fileTree.slice(0, 50).join("\\n");

  return `## Target Output Identity
Title: ${context.title}
My Role / Contributions: ${context.role}
Repository URL: https://github.com/${context.owner}/${context.repo}
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

================================================================================
CRITICAL INSTRUCTIONS & OUTPUT FORMAT
================================================================================

Based on the repository code above, generate the structured case study JSON now.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not add markdown fences, explanations, or preambles.
The JSON MUST strictly satisfy this TypeScript interface:

${TS_INTERFACE}

RULES (CRITICAL):
1. NO EMPTY FIELDS: You MUST generate actual, detailed content for \`stack_reason\`, \`architecture_diagram_code\`, and \`key_features\`. Do not leave them empty.
2. NO PLACEHOLDERS: Do NOT use fake URLs like "yourusername" or "docs.example.com". Use the exact Repository URL provided in the prompt.
3. MERMAID DIAGRAM: \`architecture_diagram_code\` MUST contain a valid Mermaid.js graph TD diagram representing the codebase architecture.
4. LINKS: Provide actual absolute URLs to the repository.
5. Be specific and quantitative in the \`results\` object.
6. The \`stack\` array must ONLY contain technologies that are actually evidenced in the codebase files provided.
7. Write as if presenting to a hiring manager at a top-tier tech company.`;
}

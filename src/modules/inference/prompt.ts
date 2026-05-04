import type { InferenceContext } from "../ingestion/types";

const TS_INTERFACE = `interface Portfolio {
  _thinking: string; // REQUIRED: Analyze the codebase and plan your architectural diagram and stack here BEFORE filling out the rest.
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
  architecture_diagram_code: string; // A valid Mermaid.js graph TD diagram (e.g. "graph TD\\n A-->B")
  links: [
    { icon: "github"; label: string; url: string }
  ]; // MUST include at least one link
  key_features: [
    { icon: string; text: string },
    { icon: string; text: string },
    { icon: string; text: string }
  ]; // MUST generate exactly 3 features
}`;

export function buildSystemPrompt(): string {
  return `You are a Senior Technical Writer and Software Architect analyzing a GitHub repository.

Your task: analyze the provided GitHub repository and produce a structured portfolio case study.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not add markdown fences, explanations, or preambles.
The JSON MUST strictly satisfy this TypeScript interface:

${TS_INTERFACE}

RULES (CRITICAL):
1. THINK FIRST: You MUST write a multi-sentence architectural and system analysis in the \`_thinking\` field FIRST.
2. NO EMPTY FIELDS: You MUST generate actual, detailed content for \`stack_reason\`, \`architecture_diagram_code\`, and \`key_features\`. Do not leave them empty.
3. NO PLACEHOLDERS: Do NOT use fake URLs like "yourusername" or "docs.example.com". Use the exact Repository URL provided in the prompt.
4. MERMAID DIAGRAM: \`architecture_diagram_code\` MUST contain a valid Mermaid.js graph TD diagram representing the codebase architecture.
5. LINKS: Provide actual absolute URLs to the repository.
6. Be specific and quantitative in the \`results\` object.
7. The \`stack\` array must ONLY contain technologies that are actually evidenced in the codebase files provided.
8. Write as if presenting to a hiring manager at a top-tier tech company.`;
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
${context.packedSource}`;
}

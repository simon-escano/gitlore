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
  stack: [
    { name: string; role: "Primary" | "Supporting" | "Infrastructure" }
  ]; // MUST generate between 1 and 6 items MAX. Only include the most critical technologies.
  stack_reason: string; // Explain why this stack was chosen in 1-2 sentences
  architecture_diagram_code: string; // A valid Mermaid.js graph TD diagram
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
2. STACK LIMIT: You MUST limit the \`stack\` array to a maximum of 6 items. Select only the most important technologies.
3. ROLE-BASED ARCHITECTURE: The \`architecture_diagram_code\` MUST focus primarily on the components where the user made contributions (based on their "Role" and "Context"). If the user was not involved in a specific area (e.g., AI or Devops), do not emphasize it in the diagram. Focus on the structures they managed (e.g., Database schema, Frontend flow, API integration).
4. COMPLEX DIAGRAM: \`architecture_diagram_code\` MUST be a HIGHLY DETAILED Mermaid.js graph TD diagram. It MUST map the actual internal implementation files and data structures (e.g., organizations, samples, DB tables). CRITICAL SYNTAX RULE: Use simple alphanumeric node IDs (A, B, C) and attach bracketed labels. Example: \`A["src/db/schema.ts"] -->|Defines| B["Organizations Table"]\`. NEVER use spaces in node IDs. NEVER use \`-->|Text|>\`.
5. NO HALLUCINATION: If specific quantitative data is NOT present, describe qualitative architectural benefits instead. Do NOT invent fake numbers.
6. NO PLACEHOLDERS: Use the exact Repository URL provided.
7. Write as if presenting to a hiring manager at a top-tier tech company.`;
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

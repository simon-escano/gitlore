import type { InferenceContext } from "../ingestion/types";

const TS_INTERFACE = `interface Portfolio {
  _thinking: string; // REQUIRED: Analyze the codebase and plan your architectural diagram and stack here BEFORE filling out the rest.
  title: string; // A short, catchy title
  one_liner: string; // A single sentence summary
  contributions: string; // Synthesize the user's raw contribution notes into polished, professional role titles separated by commas. Example: "Database Architect, Frontend Lead, QA Engineer". Do NOT just copy the raw input — transform it.
  links: [
    { icon: "github"; label: string; url: string }
  ]; // MUST include at least one link
  problem: string; // The problem being solved
  goal: string; // The goal of the project
  gallery: string[]; // List of mock gallery screenshots or visual nodes, keep empty default [] if none.
  key_features: [
    { icon: string; text: string },
    { icon: string; text: string },
    { icon: string; text: string }
  ]; // MUST generate exactly 3 features
  architecture_diagram_code: string; // A valid Mermaid.js graph TD diagram
  tech_stack: [
    { name: string; role: "Primary" | "Supporting" | "Infrastructure" }
  ]; // MUST generate between 1 and 6 items MAX. Only include the most critical technologies.
  stack_reason: string; // Explain why this stack was chosen in 1-2 sentences
  results: {
    performance: { icon: "zap"; text: string }; // e.g., "Reduced cold start..."
    scale: { icon: "layers"; text: string };
    utility: { icon: "shield"; text: string };
  };
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
2. STACK LIMIT: You MUST limit the \`tech_stack\` array to a maximum of 6 items. Select only the most important technologies.
3. CONTRIBUTIONS: The user provides raw notes about what they did. You MUST synthesize these into polished, professional role titles in the \`contributions\` field. For example, if they write "made the database, helped with frontend, fixed bugs", you output "Database Architect, Frontend Developer, QA Engineer". Be concise and professional.
4. ROLE-BASED ARCHITECTURE: The \`architecture_diagram_code\` MUST focus primarily on the components where the user made contributions (based on their contributions and context). Focus on the structures they managed (e.g., Database schema, Frontend flow, API integration).
5. DYNAMIC DIAGRAM: \`architecture_diagram_code\` MUST be a dynamic, non-linear Mermaid.js graph TD diagram. Use branching and parallel paths (e.g., A --> B and A --> C) to show how data flows between different systems. LIMIT the diagram to 10 nodes MAX. CRITICAL SYNTAX RULES: Use simple alphanumeric node IDs (A, B, C) and attach labels with square brackets like A["My Label"]. ALWAYS quote labels containing special characters with double quotes inside square brackets. NEVER use bare parentheses in labels. NEVER use spaces in node IDs.
6. NO HALLUCINATION: If specific quantitative data is NOT present, describe qualitative architectural benefits instead. Do NOT invent fake numbers.
7. NO PLACEHOLDERS: Use the exact Repository URL provided.
8. Write as if presenting to a hiring manager at a top-tier tech company.`;
}

export function buildUserPrompt(context: InferenceContext): string {
  const fileTreeSample = context.fileTree.slice(0, 50).join("\\n");

  return `## Target Output Identity
Title: ${context.title}
My Contributions: ${context.contributions}
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

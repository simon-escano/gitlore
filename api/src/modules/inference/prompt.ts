import type { InferenceContext } from "../ingestion/types";

const TS_INTERFACE = `interface Portfolio {
  _thinking: string; // REQUIRED: Keep your architectural planning and code analysis extremely brief and concise (under 150 words total). Plan your diagram nodes and stack here BEFORE filling out the rest of the JSON.
  title: string; // A short, catchy title
  one_liner: string; // A single sentence summary
  contributions: string; // Synthesize the user's raw contribution notes into polished, professional role titles separated by commas. Example: "Database Architect, Frontend Lead, QA Engineer". Do NOT just copy the raw input — transform it.
  links: [
    { icon: "github"; label: string; url: string }
  ]; // MUST include at least one link
  problem: string; // The core real-world pain point or deep technical challenge that this specific repository exists to solve. NEVER copy any examples verbatim. Make it sound like a real, relatable human pain point or technical bottleneck specific to this project's actual domain. Do NOT write e-commerce database speed problems unless this is actually an e-commerce database project.
  goal: string; // The goal of the project
  gallery: string[]; // List of mock gallery screenshots or visual nodes, keep empty default [] if none.
  key_features: [
    { icon: string; text: string },
    { icon: string; text: string },
    { icon: string; text: string }
  ]; // MUST generate exactly 3 features
  architecture_diagram_code: string; // A valid Mermaid.js graph TD diagram
  tech_stack: {
    Primary: { name: string }[];
    Supporting: { name: string }[];
    Infrastructure: { name: string }[];
  }; // Group the most critical technologies by their role. Limit the total number of items across all groups to 8 MAX.
  stack_reason: string; // Explain why this stack was chosen in 1-2 sentences
  results: {
    performance: { icon: "zap"; text: string }; // High-impact architectural or performance benefit. Focus on qualitative technical strengths (e.g., "Optimizes request routing latency using Cloudflare's global edge network") instead of inventing fake statistics or percentages unless explicitly documented in the repo context.
    scale: { icon: "layers"; text: string }; // High-impact scale or resource efficiency benefit (e.g., "Maintains sub-second processing and zero server overhead using stateless microservices"). DO NOT invent fake numbers.
    utility: { icon: "shield"; text: string }; // Core architectural utility, security, or safety benefit (e.g., "Guarantees data correctness and API type-safety by enforcing runtime Zod schema boundaries").
  };
}`;

export function buildSystemPrompt(): string {
  return `You are a Senior Technical Writer and Software Architect analyzing a GitHub repository.

Your task: analyze the provided GitHub repository and produce a structured portfolio case study.

OUTPUT FORMAT:
Return ONLY a valid JSON object. Do not add markdown fences, explanations, or preambles.
The JSON MUST strictly satisfy this TypeScript interface:

${TS_INTERFACE}

CRITICAL STRUCTURAL RULES (COMPLIANCE MANDATORY):
- Your response MUST start directly with the actual JSON instance object, beginning with the \`_thinking\` key: \`{"_thinking": "..."\`.
- NEVER include JSON Schema metadata elements like \`"type": "object"\`, \`"properties"\`, or \`"required"\` at the root of your JSON.
- DO NOT wrap the output in any other object or add any markdown wrappers (do NOT use \`\`\`json).

RULES (CRITICAL):
1. THINK FIRST: You MUST write a brief, highly concise architectural planning and system analysis under 150 words total in the \`_thinking\` field FIRST. Keep this planning phase very short to preserve token space.
2. STACK LIMIT: You MUST limit the total number of items across all \`tech_stack\` groups to a maximum of 8 items. Select only the most important technologies.
3. CONTRIBUTIONS: The user provides raw notes about what they did. You MUST synthesize these into polished, professional role titles in the \`contributions\` field. For example, if they write "made the database, helped with frontend, fixed bugs", you output "Database Architect, Frontend Developer, QA Engineer". Be concise and professional.
4. PROBLEM STATEMENT: The \`problem\` field MUST describe a real-world, user-facing pain-point, operational friction, or deep technical constraint that the codebase is designed to tackle. NEVER use marketing slogans or simply write a positive description of what the project does. DO NOT copy examples verbatim. Instead, analyze the actual repository domain and write a specific, unique problem.
   - For example, if the project is a developer/portfolio tool: "Developers struggle to manually transform their repositories into polished, high-impact technical portfolios, making it hard to showcase their contributions to recruiters."
   - For a real-time system: "High-frequency state updates overwhelm standard REST API endpoints, causing lag and synchronization issues in collaborative environments."
   You must formulate a problem statement tailored to the actual purpose and domain of the repository being analyzed.
5. ROLE-BASED ARCHITECTURE: The \`architecture_diagram_code\` MUST focus primarily on the components where the user made contributions (based on their contributions and context). Focus on the structures they managed (e.g., Database schema, Frontend flow, API integration).
6. DYNAMIC DIAGRAM: \`architecture_diagram_code\` MUST be a dynamic, non-linear Mermaid.js graph TD diagram. Use branching and parallel paths (e.g., A --> B and A --> C) to show how data flows between different systems. LIMIT the diagram to 10 nodes MAX. CRITICAL SYNTAX RULES: Use simple alphanumeric node IDs (A, B, C) and attach labels with square brackets like A["My Label"]. ALWAYS quote labels containing special characters with double quotes inside square brackets. NEVER use bare parentheses in labels. NEVER use spaces in node IDs.
7. NO HALLUCINATION: Do NOT invent fake numbers, statistics, percentages, or performance benchmarks (e.g., "Reduced response times by 40%" or "Handles 10,000+ requests"). If specific quantitative data is NOT present in the codebase or README, describe qualitative architectural benefits instead (e.g., "Enforces predictable state management", "Eliminates server-side cold starts").
8. NO PLACEHOLDERS: Use the exact Repository URL provided.
9. Write as if presenting to a hiring manager at a top-tier tech company.`;
}

export function buildUserPrompt(context: InferenceContext): string {
  const fileTreeSample = context.fileTree.slice(0, 30).join("\\n");

  let identitySection = `## Target Output Identity
Title: ${context.title}
My Contributions: ${context.contributions}
Repository URL: https://github.com/${context.owner}/${context.repo}`;

  if (context.links && context.links.length > 0) {
    const linksList = context.links.map((l) => `- ${l.label}: ${l.url}`).join("\n");
    identitySection += `\nAdditional Custom Links:\n${linksList}`;
  }

  if (context.context) {
    identitySection += `\nAdditional Context: ${context.context}`;
  } else {
    identitySection += `\nAdditional Context: None provided`;
  }

  return `${identitySection}

## Repository: ${context.owner}/${context.repo}
## Description: ${context.description ?? "No description provided"}

## File Tree (first 30 files):
${fileTreeSample}

## README:
${context.readme}

## Package/Module Info:
${context.packageInfo}

## Source Files (packed):
${context.packedSource}`;
}

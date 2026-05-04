import { GitloreOutputSchema } from "../../schemas/response";
import { validateMermaidSyntax } from "./mermaid";
import type { GitloreOutput } from "../../schemas/response";

interface ValidationSuccess {
  success: true;
  data: GitloreOutput;
}

interface ValidationFailure {
  success: false;
  error: string;
}

export function validateOutput(
  raw: unknown
): ValidationSuccess | ValidationFailure {
  // Step 1: Zod schema validation
  const result = GitloreOutputSchema.safeParse(raw);

  if (!result.success) {
    return {
      success: false,
      error: `Schema validation failed: ${result.error.message}`,
    };
  }

  // Step 2: Mermaid syntax validation
  const mermaid = validateMermaidSyntax(result.data.architecture_diagram_code);
  if (!mermaid.valid) {
    return {
      success: false,
      error: `Mermaid validation failed: ${mermaid.error}`,
    };
  }

  return { success: true, data: result.data };
}

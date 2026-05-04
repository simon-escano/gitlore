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

  // Step 2: Mermaid syntax validation (Graceful Degradation)
  if (result.data.architecture_diagram_code) {
    const mermaid = validateMermaidSyntax(result.data.architecture_diagram_code);
    if (!mermaid.valid) {
      console.warn(`  ├─ ⚠ Mermaid Validation Error: ${mermaid.error}`);
      // If the model hallucinated or output invalid mermaid, clear it rather than failing the whole API.
      result.data.architecture_diagram_code = "";
    }
  }

  return { success: true, data: result.data };
}

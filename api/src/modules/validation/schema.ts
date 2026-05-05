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

/**
 * Normalizes and sanitizes Mermaid syntax to prevent rendering errors.
 * Ensures inner quotes are escaped as single quotes and bracket labels are quoted properly.
 */
function cleanMermaidCode(code: string): string {
  let cleaned = code.trim();

  // Replace unquoted square bracket labels with quoted labels
  // e.g. A[Browser (React SPA)] -> A["Browser (React SPA)"]
  cleaned = cleaned.replace(/\b([a-zA-Z0-9_-]+)\s*\[([^"\]\n]+?)\]/g, (match, id, label) => {
    if (!label.startsWith('"') || !label.endsWith('"')) {
      return `${id}["${label.replace(/"/g, '\\"')}"]`;
    }
    return match;
  });

  // Handle nested/improper quotes inside square brackets: ID["Browser["React SPA"]"] -> ID["Browser['React SPA']"]
  cleaned = cleaned.replace(/\b([a-zA-Z0-9_-]+)\s*\[(.*?)\]/g, (_match, id, label) => {
    let inner = label.trim();
    if (inner.startsWith('"') && inner.endsWith('"')) {
      inner = inner.slice(1, -1);
    }
    inner = inner.replace(/"/g, "'");
    return `${id}["${inner}"]`;
  });

  // Handle nested/improper quotes inside parentheses: ID(Browser (React SPA)) -> ID["Browser (React SPA)"]
  cleaned = cleaned.replace(/\b([a-zA-Z0-9_-]+)\s*\((.*?)\)/g, (_match, id, label) => {
    let inner = label.trim();
    const upperLabel = inner.toUpperCase();
    
    if (upperLabel === "LR" || upperLabel === "TD" || upperLabel === "TB" || upperLabel === "RL" || upperLabel === "BT") {
      return _match;
    }
    
    if (inner.startsWith('"') && inner.endsWith('"')) {
      inner = inner.slice(1, -1);
    }
    inner = inner.replace(/"/g, "'");
    return `${id}["${inner}"]`;
  });

  return cleaned;
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
    const cleaned = cleanMermaidCode(result.data.architecture_diagram_code);
    result.data.architecture_diagram_code = cleaned;
    
    const mermaid = validateMermaidSyntax(cleaned);
    if (!mermaid.valid) {
      console.warn(`  ├─ ⚠ Mermaid Validation Error: ${mermaid.error}`);
      // If the model hallucinated or output invalid mermaid, clear it rather than failing the whole API.
      result.data.architecture_diagram_code = "";
    }
  }

  return { success: true, data: result.data };
}

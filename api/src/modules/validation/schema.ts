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
 * Robust lexical scanner that normalizes and sanitizes Mermaid syntax.
 * Correctly matches matching outer brackets and replaces any nested double-quotes
 * with the standard Mermaid HTML entity `&quot;`.
 */
function cleanMermaidCode(code: string): string {
  const lines = code.split("\n");
  const cleanedLines = lines.map((line) => {
    let result = "";
    let i = 0;
    while (i < line.length) {
      // Look for a node definition: identifier followed by [ or (
      const match = line.slice(i).match(/^([a-zA-Z0-9_-]+)\s*(\[|\()/);
      if (match) {
        const id = match[1];
        const openChar = match[2];
        const closeChar = openChar === "[" ? "]" : ")";
        
        // Find matching closing bracket with depth counting
        const startBracketIdx = i + match[0].length - 1;
        let depth = 1;
        let endBracketIdx = -1;
        for (let j = startBracketIdx + 1; j < line.length; j++) {
          if (line[j] === openChar) depth++;
          else if (line[j] === closeChar) depth--;
          
          if (depth === 0) {
            endBracketIdx = j;
            break;
          }
        }
        
        if (endBracketIdx !== -1) {
          // Extract the content inside the brackets
          const rawLabel = line.slice(startBracketIdx + 1, endBracketIdx).trim();
          let label = rawLabel;
          
          // Strip outer quotes if present
          if (label.startsWith('"') && label.endsWith('"') && label.length >= 2) {
            label = label.slice(1, -1);
          }
          
          // Replace any inner double quotes with the HTML entity &quot;
          label = label.replace(/"/g, "&quot;");
          
          // Re-wrap in double-quoted brackets
          result += `${id}["${label}"]`;
          
          // Move index past the closing bracket
          i = endBracketIdx + 1;
          continue;
        }
      }
      
      // If no node match, just copy character and advance
      result += line[i];
      i++;
    }
    return result;
  });
  
  return cleanedLines.join("\n");
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

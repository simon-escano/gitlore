/**
 * Lightweight Mermaid syntax validator.
 * Regex-based — no headless browser, no mermaid-cli dependency.
 */
export function validateMermaidSyntax(
  code: string
): { valid: boolean; error?: string } {
  const trimmed = code.trim();

  if (!trimmed) {
    return { valid: false, error: "Empty diagram code" };
  }

  // Must start with a valid diagram type
  const validStarts =
    /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|mindmap)/;
  if (!validStarts.test(trimmed)) {
    return {
      valid: false,
      error:
        "Diagram must start with a valid Mermaid diagram type (graph, flowchart, sequenceDiagram, etc.)",
    };
  }

  // Check for balanced brackets
  const open = (trimmed.match(/[\[{(]/g) || []).length;
  const close = (trimmed.match(/[\]})]/g) || []).length;
  if (open !== close) {
    return {
      valid: false,
      error: `Unbalanced brackets: ${open} open vs ${close} close`,
    };
  }

  // Must have at least one connection (-->  or --- or ==> or -.-> etc.)
  if (!/-->|---|==>|-\.->|-->/m.test(trimmed)) {
    return {
      valid: false,
      error: "Diagram must contain at least one connection (-->, ---,  ==>)",
    };
  }

  return { valid: true };
}

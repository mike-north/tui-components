/**
 * Internal module for agent detection and instructions.
 * @internal
 */

import { isAgenticTui, whichAgenticTui } from "is-agentic-tui";

/**
 * Number of blank lines to prepend to diagram output when running in an agentic TUI.
 * @internal
 */
export const AGENT_DIAGRAM_PADDING_LINES = 5;

/**
 * Instructions for AI agents on how to present TUI component output.
 * @internal
 */
export const AGENT_INSTRUCTIONS = `
═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS FOR AI AGENTS
═══════════════════════════════════════════════════════════════════════════════

You are an AI agent using the TUI Components CLI. Follow these guidelines when
presenting output to users:

RENDERING DIAGRAMS:
• NEVER wrap diagram output in markdown code blocks (\`\`\` or \`\`\`text)
• Display the raw output directly in your response - the Unicode characters
  will render correctly in most chat interfaces
• The output is already formatted for display and code blocks will break it

OUTPUT FORMATTING:
• Diagram output includes 5 leading blank lines - preserve these as they
  improve readability in chat interfaces
• Do not trim or modify whitespace in the output
• If showing multiple diagrams, keep them separated

RENDER MODES:
• Use --render-mode=markdown for chat/markdown contexts (default for agents)
• Use --render-mode=ansi only when outputting to a real terminal

EXAMPLE USAGE:
  echo '{"type":"bar","series":[{"data":[10,20,30]}]}' | tui render chart

For component schemas and examples, use:
  tui schema <component>    # Get JSON schema
  tui examples <component>  # See example inputs

═══════════════════════════════════════════════════════════════════════════════
`;

/**
 * Check if running in an agentic TUI environment.
 * @internal
 */
export function isAgentEnvironment(): boolean {
  return isAgenticTui();
}

/**
 * Get information about the current agentic TUI environment.
 * @internal
 */
export function getAgentInfo() {
  return whichAgenticTui();
}

/**
 * Get the padding to prepend to diagram output when in agent mode.
 * @internal
 */
export function getAgentDiagramPadding(): string {
  if (isAgentEnvironment()) {
    return "\n".repeat(AGENT_DIAGRAM_PADDING_LINES);
  }
  return "";
}

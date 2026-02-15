import type { AssistantConfig } from "../types.js";

/**
 * Configuration for Claude Code assistant.
 * - Strips ANSI codes in both contexts
 * - Truncates command output to 3 lines
 * - Full markdown support (backticks and bold)
 * @public
 */
export const claudeCodeConfig: AssistantConfig = {
  id: "claude-code",
  displayName: "Claude Code",
  contexts: {
    command: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 3 },
    },
    chat: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
  },
};

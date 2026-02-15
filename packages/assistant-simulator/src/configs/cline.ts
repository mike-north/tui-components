import type { AssistantConfig } from "../types.js";

/**
 * Configuration for Cline assistant.
 * - Strips ANSI codes in both contexts
 * - No backtick highlighting (shows literal backticks)
 * - Bold rendering supported
 * @public
 */
export const clineConfig: AssistantConfig = {
  id: "cline",
  displayName: "Cline",
  contexts: {
    command: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: false, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
    chat: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: false, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
  },
};

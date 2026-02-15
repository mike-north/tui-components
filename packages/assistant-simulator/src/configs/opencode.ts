import type { AssistantConfig } from "../types.js";

/**
 * Configuration for OpenCode assistant.
 * - Strips ANSI codes in both contexts
 * - Full markdown support
 * @public
 */
export const opencodeConfig: AssistantConfig = {
  id: "opencode",
  displayName: "OpenCode",
  contexts: {
    command: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
    chat: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
  },
};

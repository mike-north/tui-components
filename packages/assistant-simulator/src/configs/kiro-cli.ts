import type { AssistantConfig } from "../types.js";

/**
 * Configuration for Kiro CLI assistant.
 * - 256 color ANSI support
 * - Full markdown support
 * @public
 */
export const kiroCliConfig: AssistantConfig = {
  id: "kiro-cli",
  displayName: "Kiro CLI",
  contexts: {
    command: {
      ansi: { support: "256" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
    chat: {
      ansi: { support: "256" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
  },
};

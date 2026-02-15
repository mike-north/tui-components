import type { AssistantConfig } from "../types.js";

/**
 * Configuration for Codex assistant.
 * - Full truecolor ANSI support in both contexts
 * - Full markdown support
 * @public
 */
export const codexConfig: AssistantConfig = {
  id: "codex",
  displayName: "Codex",
  contexts: {
    command: {
      ansi: { support: "truecolor" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
    chat: {
      ansi: { support: "truecolor" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
  },
};

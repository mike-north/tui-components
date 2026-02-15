import type { AssistantConfig } from "../types.js";

/**
 * Configuration for Gemini CLI assistant.
 * - Basic ANSI color support (16 colors)
 * - Full markdown support
 * @public
 */
export const geminiCliConfig: AssistantConfig = {
  id: "gemini-cli",
  displayName: "Gemini CLI",
  contexts: {
    command: {
      ansi: { support: "basic" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
    chat: {
      ansi: { support: "basic" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "full", truncationLines: 0 },
    },
  },
};

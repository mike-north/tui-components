import type { AssistantConfig } from "../types.js";

/**
 * Configuration for GitHub Copilot assistant.
 * - Strips ANSI codes in both contexts
 * - Collapses newlines into single spaces
 * - Full markdown support
 * @public
 */
export const githubCopilotConfig: AssistantConfig = {
  id: "github-copilot",
  displayName: "GitHub Copilot",
  contexts: {
    command: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "collapsed", truncationLines: 0 },
    },
    chat: {
      ansi: { support: "none" },
      markdown: { backtickHighlight: true, boldRendering: true },
      structure: { newlineHandling: "collapsed", truncationLines: 0 },
    },
  },
};

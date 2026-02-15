export { claudeCodeConfig } from "./claude-code.js";
export { githubCopilotConfig } from "./github-copilot.js";
export { clineConfig } from "./cline.js";
export { codexConfig } from "./codex.js";
export { geminiCliConfig } from "./gemini-cli.js";
export { kiroCliConfig } from "./kiro-cli.js";
export { opencodeConfig } from "./opencode.js";

import type { AssistantConfig } from "../types.js";
import { claudeCodeConfig } from "./claude-code.js";
import { githubCopilotConfig } from "./github-copilot.js";
import { clineConfig } from "./cline.js";
import { codexConfig } from "./codex.js";
import { geminiCliConfig } from "./gemini-cli.js";
import { kiroCliConfig } from "./kiro-cli.js";
import { opencodeConfig } from "./opencode.js";

const configs: Record<string, AssistantConfig> = {
  "claude-code": claudeCodeConfig,
  "github-copilot": githubCopilotConfig,
  cline: clineConfig,
  codex: codexConfig,
  "gemini-cli": geminiCliConfig,
  "kiro-cli": kiroCliConfig,
  opencode: opencodeConfig,
};

/**
 * Retrieves configuration for a specific assistant.
 *
 * @param assistantId - ID of the assistant (e.g., "claude-code", "github-copilot")
 * @returns Configuration for the specified assistant
 * @throws Error if the assistant ID is not recognized
 *
 * @example
 * ```typescript
 * const config = getConfig("claude-code");
 * console.log(config.displayName); // "Claude Code"
 * ```
 *
 * @public
 */
export function getConfig(assistantId: string): AssistantConfig {
  const config = configs[assistantId];
  if (!config) {
    const available = Object.keys(configs).join(", ");
    throw new Error(
      `Unknown assistant: ${assistantId}. Available: ${available}`
    );
  }
  return config;
}

/**
 * Returns all available assistant configurations.
 *
 * @returns Array of all assistant configurations
 *
 * @example
 * ```typescript
 * const allConfigs = getAllConfigs();
 * console.log(allConfigs.length); // 7
 * ```
 *
 * @public
 */
export function getAllConfigs(): readonly AssistantConfig[] {
  return Object.values(configs);
}

/**
 * Returns all available assistant IDs.
 *
 * @returns Array of assistant IDs
 *
 * @example
 * ```typescript
 * const ids = getAssistantIds();
 * console.log(ids); // ["claude-code", "github-copilot", ...]
 * ```
 *
 * @public
 */
export function getAssistantIds(): readonly string[] {
  return Object.keys(configs);
}

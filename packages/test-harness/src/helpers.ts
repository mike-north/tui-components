/**
 * Helper functions for TUI component testing.
 */

import {
  simulateRendering,
  getConfig,
  getAssistantIds,
  type AssistantContext,
} from "@tuicomponents/assistant-simulator";

/**
 * Test that output renders consistently across all assistants that share
 * the same rendering characteristics.
 *
 * @param output - The raw output to test
 * @param context - The context to test
 * @returns Array of [assistantId, rendered] pairs
 * @public
 */
export function renderForAllAssistants(
  output: string,
  context: AssistantContext = "chat"
): [string, string][] {
  return getAssistantIds().map((id) => {
    const config = getConfig(id);
    const result = simulateRendering(output, config, context);
    return [id, result.rendered];
  });
}

/**
 * Find assistants that would display the output differently.
 *
 * @param output - The raw output to check
 * @param context - The context to check
 * @returns Object with groups of assistants by their rendered output
 * @public
 */
export function findRenderingDifferences(
  output: string,
  context: AssistantContext = "chat"
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const id of getAssistantIds()) {
    const config = getConfig(id);
    const result = simulateRendering(output, config, context);

    const rendered = result.rendered;
    groups[rendered] ??= [];
    groups[rendered].push(id);
  }

  return groups;
}

/**
 * Check if output will be truncated by any assistant.
 *
 * @param output - The raw output to check
 * @returns Array of assistant IDs that would truncate the output
 * @public
 */
export function findTruncatingAssistants(output: string): string[] {
  const truncating: string[] = [];

  for (const id of getAssistantIds()) {
    const config = getConfig(id);
    const commandResult = simulateRendering(output, config, "command");
    const chatResult = simulateRendering(output, config, "chat");

    if (commandResult.metadata.wasTruncated || chatResult.metadata.wasTruncated) {
      truncating.push(id);
    }
  }

  return truncating;
}

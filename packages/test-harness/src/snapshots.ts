/**
 * Snapshot utilities for testing across multiple assistants.
 */

import {
  simulateRendering,
  getAllConfigs,
  type AssistantContext,
} from "@tuicomponents/assistant-simulator";

/**
 * Result of simulating rendering across all assistants.
 * @public
 */
export type AllAssistantsSnapshot = Record<
  string,
  {
    readonly command: string;
    readonly chat: string;
  }
>;

/**
 * Generate snapshots of how all assistants render the given output.
 * Useful for snapshot testing and documentation generation.
 *
 * @param output - The raw output to simulate
 * @returns Object mapping assistant IDs to their rendered outputs
 * @public
 */
export function generateAllAssistantsSnapshot(
  output: string
): AllAssistantsSnapshot {
  const configs = getAllConfigs();
  const result: Record<string, { command: string; chat: string }> = {};

  for (const config of configs) {
    result[config.id] = {
      command: simulateRendering(output, config, "command").rendered,
      chat: simulateRendering(output, config, "chat").rendered,
    };
  }

  return result;
}

/**
 * Options for snapshot comparison.
 * @public
 */
export interface SnapshotComparisonOptions {
  /** Specific assistants to include (default: all) */
  readonly assistants?: readonly string[];
  /** Contexts to include (default: both) */
  readonly contexts?: readonly AssistantContext[];
}

/**
 * Compare how different assistants render the same output.
 * Returns grouped results for easy comparison.
 *
 * @param output - The raw output to compare
 * @param options - Comparison options
 * @returns Comparison results grouped by similarity
 * @public
 */
export function compareAssistantRenderings(
  output: string,
  options: SnapshotComparisonOptions = {}
): Map<string, string[]> {
  const configs = getAllConfigs();
  const contexts: AssistantContext[] = options.contexts
    ? [...options.contexts]
    : ["command", "chat"];

  // Group assistants by their rendered output
  const groups = new Map<string, string[]>();

  for (const config of configs) {
    if (options.assistants && !options.assistants.includes(config.id)) {
      continue;
    }

    for (const context of contexts) {
      const result = simulateRendering(output, config, context);
      const key = result.rendered;
      const label = `${config.id}:${context}`;

      const existing = groups.get(key);
      if (existing) {
        existing.push(label);
      } else {
        groups.set(key, [label]);
      }
    }
  }

  return groups;
}

/**
 * Generate a markdown table comparing assistant renderings.
 * Useful for documentation.
 *
 * @param output - The raw output to compare
 * @param context - The context to compare
 * @returns Markdown table string
 * @public
 */
export function generateComparisonTable(
  output: string,
  context: AssistantContext = "chat"
): string {
  const configs = getAllConfigs();
  const lines: string[] = [];

  lines.push("| Assistant | Rendered Output |");
  lines.push("|-----------|-----------------|");

  for (const config of configs) {
    const result = simulateRendering(output, config, context);
    // Escape pipes and newlines for markdown
    const escaped = result.rendered
      .replace(/\|/g, "\\|")
      .replace(/\n/g, "<br>");
    lines.push(`| ${config.displayName} | ${escaped} |`);
  }

  return lines.join("\n");
}

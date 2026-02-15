/**
 * Test harness utilities for TUI components.
 */

// Re-export from assistant-simulator for convenience
export {
  simulateRendering,
  getConfig,
  getAllConfigs,
  getAssistantIds,
  stripAnsi,
  collapseNewlines,
  truncateLines,
  type AssistantConfig,
  type AssistantContext,
  type SimulatedOutput,
} from "@tuicomponents/assistant-simulator";

// Matchers
export { createAssistantMatchers, type AssistantMatchers } from "./matchers.js";

// Snapshots
export {
  generateAllAssistantsSnapshot,
  compareAssistantRenderings,
  generateComparisonTable,
  type AllAssistantsSnapshot,
  type SnapshotComparisonOptions,
} from "./snapshots.js";

// Helpers
export {
  renderForAllAssistants,
  findRenderingDifferences,
  findTruncatingAssistants,
} from "./helpers.js";

/* eslint-disable-next-line @api-extractor-tools/package-documentation */
/**
 * Simulate how AI coding assistants render terminal output.
 * @packageDocumentation
 */

export type {
  AssistantContext,
  AnsiSupport,
  NewlineHandling,
  AnsiConfig,
  MarkdownConfig,
  StructureConfig,
  ContextConfig,
  AssistantConfig,
  TransformFn,
  SimulationMetadata,
  SimulatedOutput,
  SimulateOptions,
} from "./types.js";

export {
  stripAnsi,
  collapseNewlines,
  truncateLines,
  createTruncateTransform,
  stripBackticks,
  stripBoldMarkers,
  addSpaceAfterBoxChars,
  identity,
  composeTransforms,
} from "./transforms.js";

export {
  claudeCodeConfig,
  githubCopilotConfig,
  clineConfig,
  codexConfig,
  geminiCliConfig,
  kiroCliConfig,
  opencodeConfig,
  getConfig,
  getAllConfigs,
  getAssistantIds,
} from "./configs/index.js";

export { simulateRendering } from "./simulator.js";

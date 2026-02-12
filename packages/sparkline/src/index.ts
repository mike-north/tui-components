// Component exports
export { createSparkline, SparklineComponent } from "./sparkline.js";

// Schema exports
export {
  sparklineInputSchema,
  type SparklineInput,
  type SparklineInputWithDefaults,
} from "./schema.js";

// Layout exports (for advanced usage)
export {
  HEIGHT_BLOCKS,
  computeSparklineLayout,
  type SparklineLayout,
} from "./layout.js";

// Renderer exports (for advanced usage)
export { renderSparklineAnsi, renderSparklineMarkdown } from "./renderers.js";

import type {
  AssistantConfig,
  AssistantContext,
  ContextConfig,
  SimulatedOutput,
  SimulateOptions,
  TransformFn,
} from "./types.js";
import {
  stripAnsi,
  collapseNewlines,
  truncateLines,
  stripBackticks,
  stripBoldMarkers,
} from "./transforms.js";

/**
 * Builds a transform pipeline based on context configuration.
 * Returns an array of named transforms to apply in order.
 */
function buildPipeline(
  config: ContextConfig
): { name: string; fn: TransformFn }[] {
  const pipeline: { name: string; fn: TransformFn }[] = [];

  // Strip ANSI if no support
  if (config.ansi.support === "none") {
    pipeline.push({ name: "stripAnsi", fn: stripAnsi });
  }

  // Handle markdown rendering
  if (!config.markdown.backtickHighlight) {
    pipeline.push({ name: "stripBackticks", fn: stripBackticks });
  }
  if (!config.markdown.boldRendering) {
    pipeline.push({ name: "stripBoldMarkers", fn: stripBoldMarkers });
  }

  // Handle structure
  if (config.structure.newlineHandling === "collapsed") {
    pipeline.push({ name: "collapseNewlines", fn: collapseNewlines });
  }

  return pipeline;
}

/**
 * Simulates how an AI assistant would render terminal output.
 *
 * @param output - Raw terminal output string
 * @param config - Assistant configuration
 * @param context - Context in which output is displayed ("command" or "chat")
 * @param options - Optional simulation options
 * @returns Simulated output with metadata
 *
 * @example
 * ```typescript
 * import { simulateRendering, claudeCodeConfig } from "@tuicomponents/assistant-simulator";
 *
 * const rawOutput = "\x1b[31mError\x1b[0m\nLine 2\nLine 3\nLine 4";
 * const result = simulateRendering(rawOutput, claudeCodeConfig, "command");
 *
 * console.log(result.rendered);
 * // => "Error\nLine 2\nLine 3\n... (1 more line)"
 *
 * console.log(result.metadata.wasTruncated); // true
 * console.log(result.metadata.transformsApplied);
 * // => ["stripAnsi", "truncateLines(3)"]
 * ```
 *
 * @public
 */
export function simulateRendering(
  output: string,
  config: AssistantConfig,
  context: AssistantContext,
  options: SimulateOptions = {}
): SimulatedOutput {
  const contextConfig = config.contexts[context];
  const pipeline = buildPipeline(contextConfig);
  const originalLineCount = output.split("\n").length;

  let rendered = output;
  const transformsApplied: string[] = [];

  // Apply pipeline transforms
  for (const { name, fn } of pipeline) {
    rendered = fn(rendered);
    transformsApplied.push(name);
  }

  // Apply truncation
  let wasTruncated = false;
  if (contextConfig.structure.truncationLines > 0) {
    const before = rendered;
    rendered = truncateLines(rendered, contextConfig.structure.truncationLines);
    wasTruncated = before !== rendered;
    if (wasTruncated) {
      transformsApplied.push(
        `truncateLines(${String(contextConfig.structure.truncationLines)})`
      );
    }
  }

  // Apply additional transforms
  if (options.additionalTransforms) {
    for (const transform of options.additionalTransforms) {
      rendered = transform(rendered);
      transformsApplied.push("custom");
    }
  }

  return {
    rendered,
    metadata: {
      assistantId: config.id,
      context,
      wasTruncated,
      originalLineCount,
      transformsApplied,
    },
  };
}

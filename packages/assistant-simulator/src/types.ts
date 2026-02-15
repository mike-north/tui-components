/**
 * Context in which component output is displayed by an AI assistant.
 * - "command": Output shown in a bash/terminal command result block
 * - "chat": Output shown directly in the chat/conversation
 * @public
 */
export type AssistantContext = "command" | "chat";

/**
 * Level of ANSI escape code support.
 * - "none": All ANSI codes are stripped
 * - "basic": 16 basic colors supported
 * - "256": 256 color palette supported
 * - "truecolor": Full 24-bit RGB color supported
 * @public
 */
export type AnsiSupport = "none" | "basic" | "256" | "truecolor";

/**
 * How newlines are handled in the output.
 * - "full": Newlines are preserved as-is
 * - "collapsed": Multiple newlines collapsed to spaces
 * @public
 */
export type NewlineHandling = "full" | "collapsed";

/**
 * Configuration for ANSI escape code handling.
 * @public
 */
export interface AnsiConfig {
  readonly support: AnsiSupport;
}

/**
 * Configuration for markdown rendering behavior.
 * @public
 */
export interface MarkdownConfig {
  /**
   * Whether backticks trigger code highlighting.
   * false = backticks appear as literal characters (e.g., Cline)
   */
  readonly backtickHighlight: boolean;

  /**
   * Whether bold markers are rendered as bold.
   */
  readonly boldRendering: boolean;
}

/**
 * Configuration for structural transformations.
 * @public
 */
export interface StructureConfig {
  readonly newlineHandling: NewlineHandling;
  /** Max lines before truncation. 0 = no limit. */
  readonly truncationLines: number;
}

/**
 * Configuration for a specific rendering context.
 * @public
 */
export interface ContextConfig {
  readonly ansi: AnsiConfig;
  readonly markdown: MarkdownConfig;
  readonly structure: StructureConfig;
}

/**
 * Complete configuration for an AI assistant's rendering behavior.
 * @public
 */
export interface AssistantConfig {
  readonly id: string;
  readonly displayName: string;
  readonly contexts: {
    readonly command: ContextConfig;
    readonly chat: ContextConfig;
  };
}

/**
 * A transform function that modifies rendered output.
 * @public
 */
export type TransformFn = (input: string) => string;

/**
 * Metadata about a simulated rendering.
 * @public
 */
export interface SimulationMetadata {
  readonly assistantId: string;
  readonly context: AssistantContext;
  readonly wasTruncated: boolean;
  readonly originalLineCount: number;
  readonly transformsApplied: readonly string[];
}

/**
 * Result of simulating assistant rendering.
 * @public
 */
export interface SimulatedOutput {
  readonly rendered: string;
  readonly metadata: SimulationMetadata;
}

/**
 * Options for simulation.
 * @public
 */
export interface SimulateOptions {
  readonly additionalTransforms?: readonly TransformFn[];
}

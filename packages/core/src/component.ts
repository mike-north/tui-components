import type { ZodType, ZodTypeDef } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { StyleFunctions } from "./styling.js";
import type { TuiTheme } from "./theme.js";

/**
 * Render mode for component output.
 */
export type RenderMode = "ansi" | "markdown";

/**
 * Example input/output pair for a component.
 */
export interface ComponentExample<TInput> {
  /** Human-readable name for this example */
  name: string;
  /** Description of what this example demonstrates */
  description?: string;
  /** The input data for this example */
  input: TInput;
}

/**
 * Metadata describing a TUI component.
 */
export interface ComponentMetadata<TInput> {
  /** Unique name for this component (e.g., "table", "tree") */
  name: string;
  /** Human-readable description */
  description: string;
  /** Semantic version */
  version: string;
  /** Usage examples */
  examples: ComponentExample<TInput>[];
  /**
   * Render modes this component supports.
   * If not specified, defaults to ["ansi"].
   */
  supportedModes?: RenderMode[];
}

/**
 * Context provided to components during rendering.
 */
export interface RenderContext {
  /** Available terminal width in columns */
  width: number;
  /** Whether output is going to a TTY */
  isTTY: boolean;
  /** Color support level: 0=none, 1=basic, 2=256, 3=truecolor */
  colorLevel: 0 | 1 | 2 | 3;
  /** Optional theme for styled output. If not provided, components render without colors. */
  theme?: TuiTheme;
  /**
   * Render mode for output.
   * - "ansi": Full ANSI escape codes for rich terminals
   * - "markdown": Markdown-friendly output for AI assistants
   * @default "ansi"
   */
  renderMode: RenderMode;
  /**
   * Semantic styling functions.
   *
   * Use these to apply consistent styling across render modes:
   * - ANSI mode: Applies theme colors (or passthrough if no theme)
   * - Markdown mode: Applies markdown formatting (backticks, bold, etc.)
   *
   * @example
   * ```ts
   * const styledBlocks = context.style.secondary(sparklineBlocks);
   * // ANSI: muted color
   * // Markdown: `sparklineBlocks`
   * ```
   */
  style: StyleFunctions;
}

/**
 * Result of rendering a component.
 */
export interface RenderResult {
  /** ANSI-formatted output string */
  output: string;
  /** Actual width of the widest line */
  actualWidth: number;
  /** Number of lines in the output */
  lineCount: number;
}

/**
 * A TUI component that renders structured data to terminal output.
 */
export interface TuiComponent<
  TInput,
  TSchema extends ZodType<TInput, ZodTypeDef, unknown> = ZodType<
    TInput,
    ZodTypeDef,
    unknown
  >,
> {
  /** Component metadata */
  readonly metadata: ComponentMetadata<TInput>;
  /** Zod schema for input validation */
  readonly schema: TSchema;
  /**
   * Render the component with the given input and context.
   * @param input - Validated input data
   * @param context - Rendering context
   * @returns Rendered output with metadata
   */
  render(input: TInput, context: RenderContext): RenderResult;
  /**
   * Get JSON Schema representation of the input schema.
   * Used for CLI discovery and AI assistant integration.
   */
  getJsonSchema(): object;
}

/**
 * Factory function type for creating TUI components.
 */
export type ComponentFactory<
  TInput,
  TSchema extends ZodType<TInput, ZodTypeDef, unknown>,
> = () => TuiComponent<TInput, TSchema>;

/**
 * Base class helper for creating TUI components.
 * Provides default implementations for common functionality.
 */
export abstract class BaseTuiComponent<
  TInput,
  TSchema extends ZodType<TInput, ZodTypeDef, unknown>,
> implements TuiComponent<TInput, TSchema> {
  abstract readonly metadata: ComponentMetadata<TInput>;
  abstract readonly schema: TSchema;

  abstract render(input: TInput, context: RenderContext): RenderResult;

  getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }
}

import { z } from "zod";

/**
 * Schema for theme preset names.
 * These presets are defined in chromaterm and mapped to TUI themes.
 *
 * @public
 */
export const themePresetSchema = z.enum([
  "default",
  "monokai",
  "solarized-dark",
  "solarized-light",
  "nord",
]);

/**
 * Schema for overriding semantic colors.
 * Allows partial overrides of semantic color mappings.
 *
 * @public
 */
export const semanticColorsOverrideSchema = z
  .object({
    success: z.string().optional(),
    error: z.string().optional(),
    warning: z.string().optional(),
    info: z.string().optional(),
    muted: z.string().optional(),
  })
  .optional();

/**
 * Schema for theme configuration.
 *
 * @public
 */
export const themeConfigSchema = z
  .object({
    /** Theme preset name */
    preset: themePresetSchema.optional(),
    /** Override specific semantic colors */
    semantic: semanticColorsOverrideSchema,
  })
  .optional();

/**
 * Schema for markdown multiline mode.
 *
 * @public
 */
export const multilineModeSchema = z.enum(["default", "inline"]);

/**
 * Schema for markdown spacing mode.
 *
 * @public
 */
export const spacingModeSchema = z.enum(["default", "relaxed"]);

/**
 * Schema for markdown renderer options.
 *
 * @public
 */
export const markdownOptionsSchema = z
  .object({
    /** How to handle multiline content */
    multilineMode: multilineModeSchema.optional(),
    /** Spacing mode for markdown formatting */
    spacingMode: spacingModeSchema.optional(),
  })
  .optional();

/**
 * Schema for render mode.
 *
 * @public
 */
export const renderModeSchema = z.enum(["ansi", "markdown", "grayscale"]);

/**
 * Schema for agent-specific render overrides.
 *
 * @public
 */
export const agentOverrideSchema = z.object({
  /** Render mode for this agent */
  mode: renderModeSchema.optional(),
  /** Markdown-specific options (only applies when mode is "markdown") */
  markdownOptions: markdownOptionsSchema,
});

/**
 * Schema for render configuration.
 *
 * @public
 */
export const renderConfigSchema = z
  .object({
    /** Default render mode when not auto-detected */
    defaultMode: renderModeSchema.optional(),
    /** Whether to auto-detect render mode based on environment */
    autoDetect: z.boolean().optional(),
    /** Agent-specific configuration overrides (keyed by agent identifier) */
    agents: z.record(z.string(), agentOverrideSchema).optional(),
  })
  .optional();

/**
 * Schema for terminal configuration.
 *
 * @public
 */
export const terminalConfigSchema = z
  .object({
    /** Color level: 0=none, 1=basic (16), 2=256, 3=truecolor */
    colorLevel: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
      .optional(),
    /** Terminal width override (in columns) */
    width: z.number().int().positive().optional(),
  })
  .optional();

/**
 * Root schema for TUI components configuration.
 *
 * @public
 */
export const tuiConfigSchema = z.object({
  /** Theme configuration */
  theme: themeConfigSchema,
  /** Render mode configuration */
  render: renderConfigSchema,
  /** Terminal environment configuration */
  terminal: terminalConfigSchema,
});

/**
 * TypeScript type for TUI configuration.
 *
 * @public
 */
export type TuiConfig = z.infer<typeof tuiConfigSchema>;

/**
 * TypeScript type for theme configuration.
 *
 * @public
 */
export type ThemeConfig = z.infer<typeof themeConfigSchema>;

/**
 * TypeScript type for render configuration.
 *
 * @public
 */
export type RenderConfig = z.infer<typeof renderConfigSchema>;

/**
 * TypeScript type for terminal configuration.
 *
 * @public
 */
export type TerminalConfig = z.infer<typeof terminalConfigSchema>;

/**
 * TypeScript type for agent override configuration.
 *
 * @public
 */
export type AgentOverride = z.infer<typeof agentOverrideSchema>;

/**
 * TypeScript type for markdown options.
 *
 * @public
 */
export type MarkdownOptions = z.infer<typeof markdownOptionsSchema>;

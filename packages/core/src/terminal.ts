import terminalSize from "terminal-size";
import type { RenderContext, RenderMode } from "./component.js";
import { loadConfig } from "./config.js";
import type { TuiConfig } from "./config.schema.js";
import { isRunningInAIAssistant } from "./detection.js";
import type { MarkdownRendererOptions } from "./markdown.js";
import { createStyleFunctions } from "./styling.js";
import {
  defaultTheme,
  getThemePreset,
  applySemanticOverrides,
  type SemanticColors,
  type TuiTheme,
} from "./theme.js";

/**
 * Default terminal dimensions when size cannot be determined.
 */
export const DEFAULT_TERMINAL_WIDTH = 80;
export const DEFAULT_TERMINAL_HEIGHT = 24;

/**
 * Get the current terminal size.
 *
 * @returns Object with columns and rows
 *
 * @example
 * ```ts
 * const { columns, rows } = getTerminalSize();
 * console.log(`Terminal is ${columns}x${rows}`);
 * ```
 */
export function getTerminalSize(): { columns: number; rows: number } {
  const size = terminalSize();
  return {
    columns: size.columns || DEFAULT_TERMINAL_WIDTH,
    rows: size.rows || DEFAULT_TERMINAL_HEIGHT,
  };
}

/**
 * Get the current terminal width.
 *
 * @returns Width in columns
 */
export function getTerminalWidth(): number {
  return getTerminalSize().columns;
}

/**
 * Check if stdout is a TTY.
 *
 * @returns true if running in a TTY
 */
export function isTTY(): boolean {
  // Access isTTY dynamically to handle both TTY and non-TTY streams
  const stdout = process.stdout as { isTTY?: boolean };
  return stdout.isTTY === true;
}

/**
 * Detect the color support level of the terminal.
 *
 * @returns Color level: 0=none, 1=basic (16), 2=256, 3=truecolor (16m)
 */
export function detectColorLevel(): 0 | 1 | 2 | 3 {
  // Respect NO_COLOR environment variable
  if (process.env["NO_COLOR"] !== undefined) {
    return 0;
  }

  // Respect FORCE_COLOR environment variable
  const forceColor = process.env["FORCE_COLOR"];
  if (forceColor !== undefined) {
    if (forceColor === "0" || forceColor === "false") {
      return 0;
    }
    if (forceColor === "1" || forceColor === "true" || forceColor === "") {
      return 1;
    }
    if (forceColor === "2") {
      return 2;
    }
    if (forceColor === "3") {
      return 3;
    }
  }

  // Not a TTY means no colors
  if (!isTTY()) {
    return 0;
  }

  // Check COLORTERM for truecolor support
  const colorTerm = process.env["COLORTERM"];
  if (colorTerm === "truecolor" || colorTerm === "24bit") {
    return 3;
  }

  // Check TERM for 256 color support
  const term = process.env["TERM"] ?? "";
  if (term.includes("256color") || term.includes("256")) {
    return 2;
  }

  // Check for basic color support
  if (
    term.includes("color") ||
    term.includes("ansi") ||
    term === "xterm" ||
    term === "linux"
  ) {
    return 1;
  }

  // Default to basic colors on TTY
  return 1;
}

/**
 * Options for creating a render context.
 */
export interface CreateRenderContextOptions {
  /** Override the detected terminal width */
  width?: number;
  /** Provide a custom theme (default: defaultTheme if colors enabled) */
  theme?: TuiTheme;
  /** Disable colors even if terminal supports them */
  noColor?: boolean;
  /**
   * Explicit render mode override.
   * If set, disables auto-detection.
   */
  renderMode?: RenderMode;
  /**
   * Whether to auto-detect render mode based on environment.
   * When true (default), uses markdown mode in AI assistants.
   * @default true
   */
  autoDetectMode?: boolean;
  /**
   * Markdown-specific renderer options.
   * Only applies when renderMode is "markdown".
   */
  markdownOptions?: MarkdownRendererOptions;
  /**
   * Agent identifier for automatic configuration.
   * If set, auto-configures renderer options for that agent.
   *
   * Supported agents:
   * - "github-copilot": Uses markdown with inline mode (collapses newlines)
   * - "cline": Uses grayscale mode (no backtick support)
   * - "kiro-cli": Uses markdown with relaxed spacing
   * - Others default to markdown mode
   *
   * Can also be set via the TUI_AGENT environment variable.
   */
  agent?: string;
  /**
   * Whether to load user configuration from dotfiles.
   * When true (default), loads config from .tui-components.yaml or ~/.config/tui-components/config.yaml.
   * @default true
   */
  loadUserConfig?: boolean;
  /**
   * Explicit user configuration override.
   * If provided, this config is used instead of loading from files.
   */
  userConfig?: TuiConfig | null;
}

/**
 * Agent-specific configuration presets.
 *
 * These configs are based on terminal diagnostic testing across
 * different AI coding assistants.
 */
interface AgentConfig {
  renderMode: RenderMode;
  markdownOptions?: MarkdownRendererOptions;
}

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  // GitHub Copilot collapses all newlines in chat - needs inline mode
  "github-copilot": {
    renderMode: "markdown",
    markdownOptions: { multilineMode: "inline" },
  },
  // Cline has no backtick highlighting - needs grayscale renderer
  cline: {
    renderMode: "grayscale",
  },
  // Kiro CLI edge case: │**text** fails without space after anchor
  "kiro-cli": {
    renderMode: "markdown",
    markdownOptions: { spacingMode: "relaxed" },
  },
  // Claude Code, Codex, Gemini CLI, OpenCode - standard markdown
  "claude-code": {
    renderMode: "markdown",
  },
  codex: {
    renderMode: "markdown",
  },
  "gemini-cli": {
    renderMode: "markdown",
  },
  opencode: {
    renderMode: "markdown",
  },
};

/**
 * Load user config based on options.
 */
function loadUserConfig(options: CreateRenderContextOptions): TuiConfig | null {
  // Explicit config takes precedence
  if (options.userConfig !== undefined) {
    return options.userConfig;
  }

  // If loading is disabled, return null
  if (options.loadUserConfig === false) {
    return null;
  }

  // Load from dotfiles
  return loadConfig();
}

/**
 * Get the agent identifier from options or environment.
 */
function getAgentIdentifier(
  options: CreateRenderContextOptions
): string | undefined {
  // Explicit option takes precedence
  if (options.agent !== undefined) {
    return options.agent;
  }

  // Check environment variable
  const envAgent = process.env["TUI_AGENT"];
  if (envAgent !== undefined) {
    return envAgent;
  }

  return undefined;
}

/**
 * Determine the render mode based on options, config, and environment.
 */
function determineRenderMode(
  options: CreateRenderContextOptions,
  userConfig: TuiConfig | null
): RenderMode {
  // Explicit override takes precedence
  if (options.renderMode !== undefined) {
    return options.renderMode;
  }

  // Check for agent-specific configuration
  const agent = getAgentIdentifier(options);
  if (agent) {
    // Check user config for agent override first
    const configAgentOverride = userConfig?.render?.agents?.[agent];
    if (configAgentOverride?.mode) {
      return configAgentOverride.mode;
    }

    // Fall back to built-in agent config
    const agentConfig = AGENT_CONFIGS[agent];
    if (agentConfig) {
      return agentConfig.renderMode;
    }
  }

  // Check user config default mode
  if (userConfig?.render?.defaultMode) {
    return userConfig.render.defaultMode;
  }

  // Check auto-detection setting from config
  const autoDetect = options.autoDetectMode ?? userConfig?.render?.autoDetect;
  if (autoDetect === false) {
    return "ansi";
  }

  // Auto-detect: use markdown in AI assistant environments
  if (isRunningInAIAssistant()) {
    return "markdown";
  }

  return "ansi";
}

/**
 * Convert config markdown options to MarkdownRendererOptions.
 * Handles translation from config schema values ("default") to actual defaults (undefined).
 */
function convertMarkdownOptions(
  configOptions:
    | {
        multilineMode?: "default" | "inline" | undefined;
        spacingMode?: "default" | "relaxed" | undefined;
      }
    | undefined
): MarkdownRendererOptions | undefined {
  if (!configOptions) {
    return undefined;
  }

  const result: MarkdownRendererOptions = {};

  // Convert multilineMode: "default" means "full" in MarkdownRendererOptions
  if (configOptions.multilineMode === "inline") {
    result.multilineMode = "inline";
  } else if (configOptions.multilineMode === "default") {
    result.multilineMode = "full";
  }

  // Convert spacingMode: "default" means "tight" in MarkdownRendererOptions
  if (configOptions.spacingMode === "relaxed") {
    result.spacingMode = "relaxed";
  } else if (configOptions.spacingMode === "default") {
    result.spacingMode = "tight";
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Determine markdown options based on options, config, and agent config.
 */
function determineMarkdownOptions(
  options: CreateRenderContextOptions,
  userConfig: TuiConfig | null
): MarkdownRendererOptions | undefined {
  // Explicit options take precedence
  if (options.markdownOptions) {
    return options.markdownOptions;
  }

  // Check for agent-specific configuration
  const agent = getAgentIdentifier(options);
  if (agent) {
    // Check user config for agent override first
    const configAgentOverride = userConfig?.render?.agents?.[agent];
    if (configAgentOverride?.markdownOptions) {
      return convertMarkdownOptions(configAgentOverride.markdownOptions);
    }

    // Fall back to built-in agent config
    const agentConfig = AGENT_CONFIGS[agent];
    if (agentConfig?.markdownOptions) {
      return agentConfig.markdownOptions;
    }
  }

  return undefined;
}

/**
 * Resolve theme from options and user config.
 */
function resolveTheme(
  options: CreateRenderContextOptions,
  userConfig: TuiConfig | null
): TuiTheme {
  // Explicit theme option takes precedence
  if (options.theme !== undefined) {
    return options.theme;
  }

  // Start with default theme
  let theme = defaultTheme;

  // Apply user config theme preset
  if (userConfig?.theme?.preset) {
    theme = getThemePreset(userConfig.theme.preset);
  }

  // Apply semantic color overrides from config (currently a no-op)
  if (userConfig?.theme?.semantic) {
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const semanticOverrides: Partial<Record<keyof SemanticColors, string>> = {};
    for (const [key, value] of Object.entries(userConfig.theme.semantic)) {
      if (value !== undefined) {
        semanticOverrides[key as keyof SemanticColors] = value;
      }
    }
    if (Object.keys(semanticOverrides).length > 0) {
      theme = applySemanticOverrides(theme, semanticOverrides);
    }
  }

  return theme;
}

/**
 * Create a render context from current terminal state.
 *
 * This function automatically loads user configuration from dotfiles
 * and applies theme presets, render mode settings, and agent-specific
 * configurations.
 *
 * @param options - Optional overrides for the context
 * @returns A RenderContext ready for component rendering
 *
 * @example
 * ```ts
 * // Auto-detect everything with theme and user config
 * const ctx = createRenderContext();
 *
 * // Force a specific width
 * const ctx = createRenderContext({ width: 120 });
 *
 * // Disable colors
 * const ctx = createRenderContext({ noColor: true });
 *
 * // Force markdown mode
 * const ctx = createRenderContext({ renderMode: "markdown" });
 *
 * // Disable config loading
 * const ctx = createRenderContext({ loadUserConfig: false });
 * ```
 */
export function createRenderContext(
  options: CreateRenderContextOptions = {}
): RenderContext {
  // Load user config first
  const userConfig = loadUserConfig(options);

  // Determine render mode and markdown options
  const renderMode = determineRenderMode(options, userConfig);
  const markdownOptions = determineMarkdownOptions(options, userConfig);

  // Determine color level (config can override)
  let colorLevel: 0 | 1 | 2 | 3;
  if (options.noColor) {
    colorLevel = 0;
  } else if (userConfig?.terminal?.colorLevel !== undefined) {
    colorLevel = userConfig.terminal.colorLevel;
  } else {
    colorLevel = detectColorLevel();
  }

  const tty = isTTY();

  // Resolve theme from config and options
  const resolvedTheme = resolveTheme(options, userConfig);

  // Determine theme: only apply in ANSI mode with color support
  const theme =
    colorLevel > 0 && renderMode === "ansi" ? resolvedTheme : undefined;

  // Determine width (config can override)
  const width =
    options.width ?? userConfig?.terminal?.width ?? getTerminalWidth();

  const context: RenderContext = {
    width,
    isTTY: tty,
    colorLevel,
    renderMode,
    style: createStyleFunctions(renderMode, theme, markdownOptions),
  };

  // Include theme only if colors are supported and in ANSI mode
  if (theme) {
    context.theme = theme;
  }

  // Include markdown options when in markdown mode
  if (renderMode === "markdown" && markdownOptions) {
    context.markdownOptions = markdownOptions;
  }

  return context;
}

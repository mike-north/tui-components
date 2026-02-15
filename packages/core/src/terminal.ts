import terminalSize from "terminal-size";
import type { RenderContext, RenderMode } from "./component.js";
import { isRunningInAIAssistant } from "./detection.js";
import type { MarkdownRendererOptions } from "./markdown.js";
import { createStyleFunctions } from "./styling.js";
import { defaultTheme, type TuiTheme } from "./theme.js";

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
 * Get the agent identifier from options or environment.
 */
function getAgentIdentifier(
  options: CreateRenderContextOptions
): string | undefined {
  return options.agent ?? process.env["TUI_AGENT"];
}

/**
 * Determine the render mode based on options and environment.
 */
function determineRenderMode(options: CreateRenderContextOptions): RenderMode {
  // Explicit override takes precedence
  if (options.renderMode !== undefined) {
    return options.renderMode;
  }

  // Check for agent-specific configuration
  const agent = getAgentIdentifier(options);
  if (agent) {
    const agentConfig = AGENT_CONFIGS[agent];
    if (agentConfig) {
      return agentConfig.renderMode;
    }
  }

  // If auto-detection is disabled, default to ansi
  if (options.autoDetectMode === false) {
    return "ansi";
  }

  // Auto-detect: use markdown in AI assistant environments
  if (isRunningInAIAssistant()) {
    return "markdown";
  }

  return "ansi";
}

/**
 * Determine markdown options based on options and agent config.
 */
function determineMarkdownOptions(
  options: CreateRenderContextOptions
): MarkdownRendererOptions | undefined {
  // Explicit options take precedence
  if (options.markdownOptions) {
    return options.markdownOptions;
  }

  // Check for agent-specific configuration
  const agent = getAgentIdentifier(options);
  if (agent) {
    const agentConfig = AGENT_CONFIGS[agent];
    if (agentConfig?.markdownOptions) {
      return agentConfig.markdownOptions;
    }
  }

  return undefined;
}

/**
 * Create a render context from current terminal state.
 *
 * @param options - Optional overrides for the context
 * @returns A RenderContext ready for component rendering
 *
 * @example
 * ```ts
 * // Auto-detect everything with theme
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
 * ```
 */
export function createRenderContext(
  options: CreateRenderContextOptions = {}
): RenderContext {
  const renderMode = determineRenderMode(options);
  const markdownOptions = determineMarkdownOptions(options);
  const colorLevel = options.noColor ? 0 : detectColorLevel();
  const tty = isTTY();

  // Determine theme: only apply in ANSI mode with color support
  const theme =
    colorLevel > 0 && renderMode === "ansi"
      ? (options.theme ?? defaultTheme)
      : undefined;

  const context: RenderContext = {
    width: options.width ?? getTerminalWidth(),
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

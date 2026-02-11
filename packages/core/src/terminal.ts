import terminalSize from "terminal-size";
import type { RenderContext, RenderMode } from "./component.js";
import { isRunningInAIAssistant } from "./detection.js";
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
}

/**
 * Determine the render mode based on options and environment.
 */
function determineRenderMode(options: CreateRenderContextOptions): RenderMode {
  // Explicit override takes precedence
  if (options.renderMode !== undefined) {
    return options.renderMode;
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
    style: createStyleFunctions(renderMode, theme),
  };

  // Include theme only if colors are supported and in ANSI mode
  if (theme) {
    context.theme = theme;
  }

  return context;
}

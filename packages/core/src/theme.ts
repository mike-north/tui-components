import {
  createT1Theme,
  detectTheme as detectChromatermTheme,
  type Theme as ChromatermTheme,
  type Color as ChromatermColor,
  type ThemeOptions,
} from "chromaterm";

// Re-export chromaterm types for consumers
export type { ChromatermTheme, ChromatermColor, ThemeOptions };

/**
 * Semantic color mappings for TUI components.
 * Maps component-level semantic names to chromaterm theme colors.
 */
export interface SemanticColors {
  /** Primary content color */
  primary: ChromatermColor;
  /** Secondary/muted content */
  secondary: ChromatermColor;
  /** Borders and separators */
  border: ChromatermColor;
  /** Headers and titles */
  header: ChromatermColor;
  /** Success state */
  success: ChromatermColor;
  /** Warning state */
  warning: ChromatermColor;
  /** Error state */
  error: ChromatermColor;
  /** Informational text */
  info: ChromatermColor;
  /** Added content (diffs) */
  added: ChromatermColor;
  /** Removed content (diffs) */
  removed: ChromatermColor;
  /** Modified content (diffs) */
  modified: ChromatermColor;
  /** Background for added content (diffs) */
  addedBackground: ChromatermColor;
  /** Background for removed content (diffs) */
  removedBackground: ChromatermColor;
}

/**
 * TUI component theme combining chromaterm's theme with semantic mappings.
 */
export interface TuiTheme {
  /** Underlying chromaterm theme with ANSI colors */
  chromaterm: ChromatermTheme;
  /** Semantic color mappings for components */
  semantic: SemanticColors;
}

/**
 * Create semantic color mappings from a chromaterm theme.
 *
 * @param theme - The chromaterm theme
 * @returns Semantic color mappings
 */
function createSemanticColors(theme: ChromatermTheme): SemanticColors {
  return {
    primary: theme.foreground,
    secondary: theme.muted,
    border: theme.muted,
    header: theme.brightWhite,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    info: theme.info,
    added: theme.green,
    removed: theme.red,
    modified: theme.yellow,
    addedBackground: theme.green.darken(0.6),
    removedBackground: theme.red.darken(0.6),
  };
}

/**
 * Create a synchronous T1 (ANSI-16) theme.
 * Use this when you need a theme immediately without probing.
 *
 * @returns TUI theme with ANSI-16 colors
 *
 * @example
 * ```ts
 * const theme = createThemeSync();
 * console.log(theme.semantic.error("Error message"));
 * ```
 */
export function createThemeSync(): TuiTheme {
  const chromaterm = createT1Theme();
  return {
    chromaterm,
    semantic: createSemanticColors(chromaterm),
  };
}

/**
 * Detect terminal capabilities and create an optimized theme.
 * Uses OSC probing to detect the terminal's actual color palette.
 *
 * @param options - Theme detection options
 * @returns Promise resolving to TUI theme with detected colors
 *
 * @example
 * ```ts
 * const theme = await detectTheme();
 * console.log(theme.semantic.success("Success!"));
 * ```
 */
export async function detectTheme(options?: ThemeOptions): Promise<TuiTheme> {
  const chromaterm = await detectChromatermTheme(options);
  return {
    chromaterm,
    semantic: createSemanticColors(chromaterm),
  };
}

/**
 * Global default theme instance (T1 baseline).
 * For full capability detection, use `detectTheme()` instead.
 */
export const defaultTheme: TuiTheme = createThemeSync();

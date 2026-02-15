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

/**
 * Theme preset identifier.
 *
 * @public
 */
export type ThemePreset =
  | "default"
  | "monokai"
  | "solarized-dark"
  | "solarized-light"
  | "nord";

/**
 * Create a baseline TUI theme (T1 level).
 *
 * At T1 level, chromaterm uses ANSI color indices without RGB resolution.
 * All theme presets use the same T1 baseline theme structure.
 *
 * Theme customization would require terminal probing (detectTheme) or
 * VS Code config integration, which is beyond the scope of basic presets.
 *
 * @returns TUI theme with T1 baseline colors
 */
function createBaselineTheme(): TuiTheme {
  const chromaterm = createT1Theme();
  return {
    chromaterm,
    semantic: createSemanticColors(chromaterm),
  };
}

/**
 * Preset theme definitions.
 *
 * Note: All presets currently use the same T1 baseline theme structure
 * because chromaterm's createT1Theme doesn't support custom color palettes.
 * To get actual color differences, use detectTheme() which probes the terminal,
 * or configure VS Code terminal colors.
 *
 * These preset names are provided for future extensibility and configuration
 * compatibility, but the actual color palettes are determined by the terminal
 * environment, not the preset selection.
 *
 * @public
 */
export const themePresets: Record<ThemePreset, TuiTheme> = {
  default: defaultTheme,
  monokai: createBaselineTheme(),
  "solarized-dark": createBaselineTheme(),
  "solarized-light": createBaselineTheme(),
  nord: createBaselineTheme(),
};

/**
 * Get a theme by preset name.
 *
 * @param preset - Theme preset identifier
 * @returns TUI theme matching the preset
 *
 * @example
 * ```ts
 * const theme = getThemePreset("monokai");
 * console.log(theme.semantic.success("Success!"));
 * ```
 *
 * @public
 */
export function getThemePreset(preset: ThemePreset): TuiTheme {
  return themePresets[preset];
}

/**
 * Apply semantic color overrides to a theme.
 *
 * **Not currently implemented.** This function exists for API forward
 * compatibility but returns the theme unchanged. The limitation exists
 * because chromaterm does not provide a runtime API for converting hex
 * strings to Color objects.
 *
 * For color customization, use one of these alternatives:
 * - Configure your terminal emulator's color palette
 * - Use `detectTheme()` for terminal capability probing
 * - Use VS Code terminal color customization
 *
 * @param theme - Base theme (returned unchanged)
 * @param overrides - Semantic color overrides (currently ignored)
 * @returns The original theme unchanged
 *
 * @remarks
 * This function will be implemented when chromaterm adds runtime
 * hex-to-Color conversion. Until then, color customization must be
 * done at the terminal level.
 *
 * @public
 */
export function applySemanticOverrides(
  theme: TuiTheme,
  overrides: Partial<Record<keyof SemanticColors, string>>
): TuiTheme {
  // Not implemented - chromaterm doesn't support runtime hex-to-Color conversion.
  // This function exists for forward compatibility with the config schema.
  void overrides;
  return theme;
}

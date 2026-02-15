// Component system
export {
  type RenderMode,
  type ComponentExample,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiComponent,
  type ComponentFactory,
  BaseTuiComponent,
} from "./component.js";

// Component registry
export { type ComponentInfo, ComponentRegistry, registry } from "./registry.js";

// Width utilities
export {
  getStringWidth,
  padToWidth,
  truncateToWidth,
  measureLines,
  type PadOptions,
  type TruncateOptions,
} from "./width.js";

// Terminal utilities
export {
  getTerminalSize,
  getTerminalWidth,
  isTTY,
  detectColorLevel,
  createRenderContext,
  type CreateRenderContextOptions,
  DEFAULT_TERMINAL_WIDTH,
  DEFAULT_TERMINAL_HEIGHT,
} from "./terminal.js";

// Theme and styling
export {
  type ChromatermTheme,
  type ChromatermColor,
  type ThemeOptions,
  type SemanticColors,
  type TuiTheme,
  createThemeSync,
  detectTheme,
  defaultTheme,
} from "./theme.js";

// Semantic styling
export { type StyleFunctions, createStyleFunctions } from "./styling.js";

// Text wrapping
export { wrapText, wrapTextWithInfo, type WrapOptions } from "./wrap.js";

// Environment detection
export {
  type ProcessAncestor,
  type EnvironmentDetection,
  getProcessTree,
  detectEnvironment,
  isRunningInAIAssistant,
} from "./detection.js";

// Markdown rendering utilities
export {
  type MarkdownStyle,
  type MarkdownRendererOptions,
  DEFAULT_ANCHOR,
  inlineCode,
  anchorLine,
  applyMarkdownStyle,
  joinAnchoredLines,
  stripMarkdownFormatting,
  getMarkdownRenderedWidth,
} from "./markdown.js";

// Grayscale rendering utilities
export {
  type GrayscaleShade,
  type GrayscaleStyleFunctions,
  GRAYSCALE_CHARS,
  createGrayscaleStyleFunctions,
  getShadeForValue,
} from "./grayscale.js";

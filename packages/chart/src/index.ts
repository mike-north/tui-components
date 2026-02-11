/**
 * @tuicomponents/chart - Unified charting system for TUI
 *
 * Provides multiple chart types with ANSI and markdown rendering:
 * - Bar charts (horizontal, vertical, stacked)
 * - Line charts
 * - Area charts (standard, stacked)
 */

// Main component
export { createChart, ChartComponent } from "./chart.js";

// Schemas
export {
  chartTypeSchema,
  barStyleSchema,
  lineStyleSchema,
  valueFormatSchema,
  legendPositionSchema,
  dataPointSchema,
  dataSeriesSchema,
  axisConfigSchema,
  legendConfigSchema,
  gridConfigSchema,
  chartInputSchema,
} from "./schema.js";

// Types
export type {
  ChartType,
  BarStyle,
  LineStyle,
  ValueFormat,
  DataPoint,
  DataSeries,
  AxisConfig,
  LegendConfig,
  GridConfig,
  ChartInput,
  ChartInputWithDefaults,
  BarLayout,
  StackedBarLayout,
  LineRowLayout,
  ChartLayout,
} from "./types.js";

// Core utilities
export {
  computeNiceTicks,
  formatTickValue,
  scaleValue,
  unscaleValue,
  type NiceTicksOptions,
  type NiceTicksResult,
} from "./core/scaling.js";

export {
  computeAxisLayout,
  computeDualAxisLayout,
  type AxisOrientation,
  type AxisPosition,
  type AxisLayoutOptions,
  type AxisTick,
  type AxisLayout,
  type DualAxisLayoutOptions,
  type DualAxisLayout,
} from "./core/axis.js";

export {
  AXIS_CHARS,
  HEIGHT_BLOCKS,
  BAR_CHARS,
  BRAILLE_BASE,
  BRAILLE_DOTS,
  SERIES_STYLES,
  LINE_CHARS,
  BrailleCanvas,
  valueToBlock,
  getBarChar,
  toBrailleChar,
} from "./core/chars.js";

export {
  computeGridLayout,
  createGridBuffer,
  DEFAULT_GRID_CHAR,
  type GridOptions,
  type GridLine,
  type GridLayout,
} from "./core/grid.js";

export {
  computeLegendLayout,
  formatLegendItem,
  getLegendItemWidth,
  renderLegendRow,
  type LegendPosition,
  type LegendItem,
  type LegendOptions,
  type LegendRow,
  type LegendLayout,
} from "./core/legend.js";

export {
  computeYAxisRow,
  renderXAxis,
  buildChartRow,
  type YAxisScale,
  type YAxisConfig,
  type YAxisRowResult,
  type XAxisConfig,
  type XAxisResult,
  type ChartAreaConfig,
} from "./core/axis-renderer.js";

// Layout functions
export {
  computeBarLayout,
  groupBarsByCategory,
  type BarChartLayout,
} from "./layout/bar.js";

export {
  computeStackedBarLayout,
  type StackedBarChartLayout,
} from "./layout/stacked-bar.js";

export {
  computeLineLayout,
  type LinePoint,
  type LineRow,
  type LineChartLayout,
} from "./layout/line.js";

export {
  computeAreaLayout,
  type AreaColumn,
  type AreaRow,
  type AreaChartLayout,
} from "./layout/area.js";

// Renderers
export {
  renderBarChartAnsi,
  renderVerticalBarChartAnsi,
  renderStackedBarChartAnsi,
  renderLineChartAnsi,
  renderAreaChartAnsi,
  type AnsiRenderOptions,
} from "./renderers/ansi.js";

export {
  renderBarChartMarkdown,
  renderVerticalBarChartMarkdown,
  renderStackedBarChartMarkdown,
  renderLineChartMarkdown,
  renderAreaChartMarkdown,
  type MarkdownRenderOptions,
} from "./renderers/markdown.js";

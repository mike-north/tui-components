/**
 * @tuicomponents/chart - Unified charting system for TUI
 *
 * Provides multiple chart types with ANSI and markdown rendering:
 * - Bar charts (horizontal, vertical, stacked)
 * - Line charts
 * - Area charts (standard, stacked)
 * - Scatter plots (dots, braille)
 * - Pie and donut charts
 * - Heatmaps (blocks, ascii, numeric)
 */

// Main component
export { createChart, ChartComponent } from "./chart.js";

// Schemas
export {
  chartTypeSchema,
  barStyleSchema,
  lineStyleSchema,
  scatterStyleSchema,
  scatterMarkerSchema,
  heatmapStyleSchema,
  valueFormatSchema,
  legendPositionSchema,
  dataPointSchema,
  dataSeriesSchema,
  axisConfigSchema,
  legendConfigSchema,
  gridConfigSchema,
  chartInputSchema,
  // Future: Gradient support (see docs/adr/001-gradient-support.md)
  gradientStopSchema,
  gradientConfigSchema,
} from "./schema.js";

// Types
export type {
  ChartType,
  BarStyle,
  LineStyle,
  ScatterStyle,
  ScatterMarker,
  HeatmapStyle,
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
  // Future: Gradient support (see docs/adr/001-gradient-support.md)
  GradientStop,
  GradientConfig,
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
  SCATTER_MARKERS,
  SCATTER_MARKER_SEQUENCE,
  HEATMAP_BLOCKS,
  HEATMAP_ASCII,
  BrailleCanvas,
  valueToBlock,
  getBarChar,
  toBrailleChar,
  valueToHeatmapChar,
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

export {
  computeScatterLayout,
  type ScatterPoint,
  type ScatterChartLayout,
} from "./layout/scatter.js";

export {
  computePieLayout,
  type PieSlice,
  type PieChartLayout,
} from "./layout/pie.js";

export {
  computeHeatmapLayout,
  type HeatmapCell,
  type HeatmapChartLayout,
} from "./layout/heatmap.js";

// Renderers
export {
  renderBarChartAnsi,
  renderVerticalBarChartAnsi,
  renderStackedBarChartAnsi,
  renderLineChartAnsi,
  renderAreaChartAnsi,
  renderScatterChartAnsi,
  renderPieChartAnsi,
  renderHeatmapAnsi,
  type AnsiRenderOptions,
} from "./renderers/ansi.js";

export {
  renderBarChartMarkdown,
  renderVerticalBarChartMarkdown,
  renderStackedBarChartMarkdown,
  renderLineChartMarkdown,
  renderAreaChartMarkdown,
  renderScatterChartMarkdown,
  renderPieChartMarkdown,
  renderHeatmapMarkdown,
  type MarkdownRenderOptions,
} from "./renderers/markdown.js";

// Inline renderers for newline-collapsing environments (e.g., GitHub Copilot)
export {
  renderBarChartInline,
  renderStackedBarChartInline,
  renderChartSummaryInline,
} from "./renderers/markdown-inline.js";

/**
 * TUI Components - Terminal UI components for beautiful CLI output
 *
 * This umbrella package re-exports all TUI components for convenience.
 * You can also import individual packages for smaller bundle sizes:
 *
 * @example
 * // Import everything
 * import { createTable, createBox } from 'tui-components';
 *
 * // Or import specific packages
 * import { createTable } from 'tui-components/table';
 * import { createBox } from 'tui-components/box';
 */

// Re-export component factory functions (no conflicts)
export { createBox, BoxComponent } from "@tuicomponents/box";
export { createChart, ChartComponent } from "@tuicomponents/chart";
export { createDiff, DiffComponent } from "@tuicomponents/diff";
export { createGauge, GaugeComponent } from "@tuicomponents/gauge";
export { createGraph, GraphComponent } from "@tuicomponents/graph";
export { createKeyValue, KeyValueComponent } from "@tuicomponents/keyvalue";
export { createList, ListComponent } from "@tuicomponents/list";
export { createProgress, ProgressComponent } from "@tuicomponents/progress";
export { createSparkline, SparklineComponent } from "@tuicomponents/sparkline";
export { createTable, TableComponent } from "@tuicomponents/table";
export { createTree, TreeComponent } from "@tuicomponents/tree";

// Re-export core utilities
export {
  registry,
  BaseTuiComponent,
  getStringWidth,
  padToWidth,
  truncateToWidth,
  wrapText,
  measureLines,
} from "@tuicomponents/core";

// Re-export core types
export type {
  TuiComponent,
  ComponentMetadata,
  RenderContext,
  RenderResult,
} from "@tuicomponents/core";

// Re-export input types with namespacing to avoid conflicts
export type { BoxInput, Padding } from "@tuicomponents/box";
export type {
  ChartInput,
  ChartType,
  DataPoint,
  DataSeries,
  AxisConfig,
  BarStyle,
  LineStyle,
} from "@tuicomponents/chart";
export type { DiffInput, DiffLine, Hunk, LineType } from "@tuicomponents/diff";
export type { GaugeInput, GaugeZone, GaugeZoneColor, GaugeStyle } from "@tuicomponents/gauge";
export type { GraphInput, GraphNode, GraphStyle } from "@tuicomponents/graph";
export type { KeyValueInput, KeyValuePair } from "@tuicomponents/keyvalue";
export type { ListInput, ListItem, ListStyle } from "@tuicomponents/list";
export type { ProgressInput, ProgressStyle } from "@tuicomponents/progress";
export type { SparklineInput } from "@tuicomponents/sparkline";
export type { TableInput, Column } from "@tuicomponents/table";
export type { TreeInput, TreeNode, TreeStyle } from "@tuicomponents/tree";

// Re-export schemas for validation
export { boxInputSchema } from "@tuicomponents/box";
export { chartInputSchema } from "@tuicomponents/chart";
export { diffInputSchema } from "@tuicomponents/diff";
export { gaugeInputSchema } from "@tuicomponents/gauge";
export { graphInputSchema } from "@tuicomponents/graph";
export { keyValueInputSchema } from "@tuicomponents/keyvalue";
export { listInputSchema } from "@tuicomponents/list";
export { progressInputSchema } from "@tuicomponents/progress";
export { sparklineInputSchema } from "@tuicomponents/sparkline";
export { tableInputSchema } from "@tuicomponents/table";
export { treeInputSchema } from "@tuicomponents/tree";

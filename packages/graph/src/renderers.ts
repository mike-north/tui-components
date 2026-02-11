import {
  type TuiTheme,
  truncateToWidth,
  anchorLine,
  DEFAULT_ANCHOR,
} from "@tuicomponents/core";
import type { GraphLayout, NodeLayout } from "./layout.js";
import type { GraphInputWithDefaults } from "./schema.js";

/**
 * Format refs (branch/tag names) for display.
 */
function formatRefs(refs: string[] | undefined, theme?: TuiTheme): string {
  if (!refs || refs.length === 0) {
    return "";
  }

  const refStr = `(${refs.join(", ")})`;
  if (theme) {
    return theme.semantic.secondary(refStr) + " ";
  }
  return refStr + " ";
}

/**
 * Render a node line in ANSI mode.
 */
function renderNodeLineAnsi(
  nodeLayout: NodeLayout,
  input: GraphInputWithDefaults,
  graphWidth: number,
  theme?: TuiTheme
): string {
  const { node, graphLine } = nodeLayout;

  // Color the graph portion
  const coloredGraph = theme ? theme.semantic.border(graphLine) : graphLine;

  // Format refs if enabled
  const refsStr = input.showRefs ? formatRefs(node.refs, theme) : "";

  // Truncate label if needed (accounting for refs)
  const availableWidth = input.labelWidth - (refsStr ? refsStr.length : 0);
  let label = truncateToWidth(node.label, Math.max(10, availableWidth));

  // Apply highlighting if enabled
  if (node.highlight && theme) {
    label = theme.semantic.primary(label);
  } else if (theme) {
    label = theme.semantic.header(label);
  }

  // Build the full line
  const gap = " ".repeat(input.labelGap);
  const paddedGraph = graphLine.padEnd(graphWidth);
  const coloredPaddedGraph = theme ? theme.semantic.border(paddedGraph) : paddedGraph;

  return `${coloredPaddedGraph}${gap}${refsStr}${label}`;
}

/**
 * Render a continuation line in ANSI mode.
 */
function renderContinuationLineAnsi(
  line: string,
  graphWidth: number,
  theme?: TuiTheme
): string {
  const paddedLine = line.padEnd(graphWidth);
  return theme ? theme.semantic.border(paddedLine) : paddedLine;
}

/**
 * Render a graph using ANSI escape codes for rich terminal output.
 *
 * @param layout - Pre-computed graph layout
 * @param input - Original input with defaults
 * @param theme - Optional theme for colors
 * @returns ANSI-formatted graph string
 */
export function renderGraphAnsi(
  layout: GraphLayout,
  input: GraphInputWithDefaults,
  theme?: TuiTheme
): string {
  if (layout.nodes.length === 0) {
    return "";
  }

  const lines: string[] = [];

  for (const nodeLayout of layout.nodes) {
    // Render the node line
    lines.push(
      renderNodeLineAnsi(nodeLayout, input, layout.graphWidth, theme)
    );

    // Render continuation lines
    for (const contLine of nodeLayout.continuationLines) {
      lines.push(renderContinuationLineAnsi(contLine, layout.graphWidth, theme));
    }
  }

  return lines.join("\n");
}

/**
 * Render a node line in markdown mode.
 */
function renderNodeLineMarkdown(
  nodeLayout: NodeLayout,
  input: GraphInputWithDefaults,
  graphWidth: number
): string {
  const { node, graphLine } = nodeLayout;

  // Format refs if enabled (no colors in markdown)
  const refsStr = input.showRefs && node.refs?.length
    ? `(${node.refs.join(", ")}) `
    : "";

  // Truncate label if needed
  const availableWidth = input.labelWidth - refsStr.length;
  const label = truncateToWidth(node.label, Math.max(10, availableWidth));

  // Build the line
  const gap = " ".repeat(input.labelGap);
  const paddedGraph = graphLine.padEnd(graphWidth);
  const line = `${paddedGraph}${gap}${refsStr}${label}`;

  // Highlight with inline code backticks in markdown
  if (node.highlight) {
    return anchorLine(`\`${line}\``, DEFAULT_ANCHOR);
  }

  return anchorLine(line, DEFAULT_ANCHOR);
}

/**
 * Render a continuation line in markdown mode.
 */
function renderContinuationLineMarkdown(
  line: string,
  graphWidth: number
): string {
  const paddedLine = line.padEnd(graphWidth);
  return anchorLine(paddedLine, DEFAULT_ANCHOR);
}

/**
 * Render a graph using markdown-friendly output.
 *
 * Uses anchored lines to prevent whitespace collapse in markdown renderers.
 *
 * @param layout - Pre-computed graph layout
 * @param input - Original input with defaults
 * @returns Markdown-friendly graph string
 */
export function renderGraphMarkdown(
  layout: GraphLayout,
  input: GraphInputWithDefaults
): string {
  if (layout.nodes.length === 0) {
    return "";
  }

  const lines: string[] = [];

  for (const nodeLayout of layout.nodes) {
    // Render the node line
    lines.push(renderNodeLineMarkdown(nodeLayout, input, layout.graphWidth));

    // Render continuation lines
    for (const contLine of nodeLayout.continuationLines) {
      lines.push(renderContinuationLineMarkdown(contLine, layout.graphWidth));
    }
  }

  return lines.join("\n");
}

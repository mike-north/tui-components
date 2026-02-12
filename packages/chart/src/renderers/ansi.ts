/**
 * ANSI renderer for charts.
 *
 * Produces ANSI escape code output for rich terminal rendering.
 */

import { padToWidth, type TuiTheme } from "@tuicomponents/core";
import { AXIS_CHARS } from "../core/chars.js";
import { formatTickValue } from "../core/scaling.js";
import {
  computeLegendLayout,
  type LegendItem,
  type LegendRow,
} from "../core/legend.js";
import {
  computeYAxisRow,
  renderXAxis,
  type YAxisConfig,
} from "../core/axis-renderer.js";
import type { BarChartLayout } from "../layout/bar.js";
import type { StackedBarChartLayout } from "../layout/stacked-bar.js";
import type { LineChartLayout } from "../layout/line.js";
import type { AreaChartLayout } from "../layout/area.js";
import type { ScatterChartLayout } from "../layout/scatter.js";
import type { PieChartLayout } from "../layout/pie.js";
import type { HeatmapChartLayout } from "../layout/heatmap.js";
import type { ChartInputWithDefaults } from "../types.js";

/**
 * Render a legend row with ANSI colors.
 * Uses secondary color for items that would use backticks in markdown mode.
 */
function renderLegendRowAnsi(row: LegendRow, theme?: TuiTheme): string {
  return row.items
    .map((item) => {
      const symbol =
        item.useBackticks && theme
          ? theme.semantic.secondary(item.symbol)
          : theme
            ? theme.semantic.primary(item.symbol)
            : item.symbol;
      return `${symbol} ${item.name}`;
    })
    .join("  ");
}

/**
 * Render options for ANSI output.
 */
export interface AnsiRenderOptions {
  /** Theme for colors */
  theme?: TuiTheme | undefined;
  /** Chart input for configuration */
  input: ChartInputWithDefaults;
}

/**
 * Render a horizontal bar chart to ANSI.
 */
export function renderBarChartAnsi(
  layout: BarChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme } = options;
  const lines: string[] = [];

  for (const bar of layout.bars) {
    // Build label
    const label = padToWidth(bar.label, layout.maxLabelWidth);
    const coloredLabel = theme ? theme.semantic.header(label) : label;

    // Build bar
    const barStr = bar.barChar.repeat(bar.length);
    const coloredBar = theme ? theme.semantic.primary(barStr) : barStr;

    // Build value
    const coloredValue = theme
      ? theme.semantic.secondary(bar.formattedValue)
      : bar.formattedValue;

    if (layout.showValues) {
      lines.push(`${coloredLabel} ${coloredBar} ${coloredValue}`);
    } else {
      lines.push(`${coloredLabel} ${coloredBar}`);
    }
  }

  return lines.join("\n");
}

/**
 * Render a vertical bar chart to ANSI.
 */
export function renderVerticalBarChartAnsi(
  layout: BarChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme, input } = options;
  const lines: string[] = [];

  const chartHeight = layout.barAreaSize;
  const numBars = layout.bars.length;
  const barWidth = Math.max(1, Math.floor((layout.width - 2) / numBars) - 1);

  // Build Y-axis labels
  const yAxisWidth = layout.maxValueWidth + 2;
  const format = input.yAxis?.format ?? "number";
  const decimals = input.yAxis?.decimals;

  // Render rows from top to bottom
  for (let row = chartHeight - 1; row >= 0; row--) {
    const rowThreshold = (row + 1) / chartHeight;

    // Y-axis label
    let yLabel = " ".repeat(yAxisWidth);
    for (const tick of layout.yScale.ticks) {
      const tickNorm =
        (tick - layout.yScale.min) / (layout.yScale.max - layout.yScale.min);
      if (Math.abs(tickNorm - rowThreshold) < 0.5 / chartHeight) {
        yLabel =
          padToWidth(formatTickValue(tick, format, decimals), yAxisWidth - 1) +
          " ";
        break;
      }
    }

    // Axis line
    const axisChar = row === 0 ? AXIS_CHARS.origin : AXIS_CHARS.vertical;

    // Build bar segments
    const segments: string[] = [];
    for (const bar of layout.bars) {
      const barNorm = bar.length / layout.barAreaSize;
      if (barNorm >= rowThreshold) {
        const barSegment = bar.barChar.repeat(barWidth);
        segments.push(theme ? theme.semantic.primary(barSegment) : barSegment);
      } else {
        segments.push(" ".repeat(barWidth));
      }
    }

    lines.push(`${yLabel}${axisChar}${segments.join(" ")}`);
  }

  // X-axis line
  const xAxisLine = AXIS_CHARS.horizontal.repeat(layout.width - yAxisWidth - 1);
  lines.push(" ".repeat(yAxisWidth) + AXIS_CHARS.origin + xAxisLine);

  // X-axis labels
  const xLabels: string[] = [];
  for (const bar of layout.bars) {
    xLabels.push(padToWidth(bar.label, barWidth));
  }
  lines.push(" ".repeat(yAxisWidth + 1) + xLabels.join(" "));

  return lines.join("\n");
}

/**
 * Render a stacked bar chart to ANSI.
 */
export function renderStackedBarChartAnsi(
  layout: StackedBarChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme, input } = options;
  const lines: string[] = [];

  const isVertical = layout.type === "bar-stacked-vertical";

  if (isVertical) {
    const chartHeight = layout.barAreaSize;
    const numStacks = layout.stacks.length;
    const barWidth = Math.max(
      1,
      Math.floor((layout.width - 2) / numStacks) - 1
    );
    const yAxisWidth = layout.maxValueWidth + 2;
    const format = input.yAxis?.format ?? "number";
    const decimals = input.yAxis?.decimals;

    // Configure Y-axis
    const yAxisConfig: YAxisConfig = {
      scale: layout.yScale,
      chartHeight,
      labelWidth: yAxisWidth,
      format,
      decimals,
    };

    // Render rows from top to bottom
    for (let row = chartHeight - 1; row >= 0; row--) {
      const rowBottom = row / chartHeight;
      const rowTop = (row + 1) / chartHeight;

      // Get Y-axis label and tick mark using shared abstraction
      const { label: yLabel, axisChar } = computeYAxisRow(row, yAxisConfig);
      const segments: string[] = [];

      for (const stack of layout.stacks) {
        // Find which segment is active at this row
        let activeSegment = null;
        let cumHeight = 0;

        for (const segment of stack.segments) {
          const segmentHeight = segment.length / layout.barAreaSize;
          // Check if row overlaps with this segment's range
          if (rowBottom < cumHeight + segmentHeight && rowTop > cumHeight) {
            activeSegment = segment;
            break;
          }
          cumHeight += segmentHeight;
        }

        if (activeSegment) {
          const barSegment = activeSegment.barChar.repeat(barWidth);
          segments.push(
            theme ? theme.semantic.primary(barSegment) : barSegment
          );
        } else {
          segments.push(" ".repeat(barWidth));
        }
      }

      lines.push(`${yLabel}${axisChar}${segments.join(" ")}`);
    }

    // Render X-axis using shared abstraction
    const xAxis = renderXAxis({
      categories: layout.stacks.map((s) => s.label),
      barWidth,
      yAxisWidth,
      chartWidth: layout.width,
      minValue: layout.yScale.min,
      format,
      decimals,
    });
    lines.push(xAxis.axisLine);
    lines.push(xAxis.labelLine);
  } else {
    // Horizontal stacked bars
    for (const stack of layout.stacks) {
      const label = padToWidth(stack.label, layout.maxLabelWidth);
      const coloredLabel = theme ? theme.semantic.header(label) : label;

      // Build stacked bar
      let barStr = "";
      for (const segment of stack.segments) {
        const segmentStr = segment.barChar.repeat(segment.length);
        barStr += theme ? theme.semantic.primary(segmentStr) : segmentStr;
      }

      lines.push(`${coloredLabel} ${barStr}`);
    }
  }

  // Add legend
  const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
    const style = layout.seriesStyles[i];
    if (!style) {
      throw new Error(`Missing series style at index ${String(i)}`);
    }
    return {
      name,
      symbol: style.char,
      useBackticks: style.useBackticks,
    };
  });

  const legendLayout = computeLegendLayout({
    items: legendItems,
    position: input.legend?.position ?? "bottom",
    maxWidth: layout.width,
  });

  if (legendLayout.rows.length > 0) {
    lines.push("");
    for (const row of legendLayout.rows) {
      lines.push(renderLegendRowAnsi(row, theme));
    }
  }

  return lines.join("\n");
}

/**
 * Render a line chart to ANSI.
 */
export function renderLineChartAnsi(
  layout: LineChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme, input } = options;
  const lines: string[] = [];

  // Chart width is based on the number of character columns in the rendered rows
  const chartWidth = layout.rows[0]?.chars.length ?? layout.categories.length;

  // Render rows
  for (const row of layout.rows) {
    // Y-axis label
    const yLabel = row.yLabel
      ? padToWidth(row.yLabel, layout.yAxisWidth - 1) + " "
      : " ".repeat(layout.yAxisWidth);

    // Build line content with series-based coloring
    let content = "";
    for (let i = 0; i < row.chars.length; i++) {
      const char = row.chars[i];
      if (char === undefined) {
        continue;
      }
      const seriesIdx = row.seriesIndices[i];
      if (char !== " " && theme) {
        // Use secondary color for odd-indexed series
        if (
          seriesIdx !== null &&
          seriesIdx !== undefined &&
          seriesIdx % 2 === 1
        ) {
          content += theme.semantic.secondary(char);
        } else {
          content += theme.semantic.primary(char);
        }
      } else {
        content += char;
      }
    }

    lines.push(`${yLabel}${AXIS_CHARS.vertical}${content}`);
  }

  // X-axis
  const xAxisLine = AXIS_CHARS.horizontal.repeat(chartWidth);
  lines.push(" ".repeat(layout.yAxisWidth) + AXIS_CHARS.origin + xAxisLine);

  // X-axis labels - position depends on layout style
  const labelLine: string[] = Array<string>(chartWidth).fill(" ");
  const isBraille = layout.lineStyle === "braille";
  const spacing = isBraille ? 3 : 2; // chars per category
  for (let i = 0; i < layout.categories.length; i++) {
    const label = layout.categories[i];
    if (label === undefined) {
      continue;
    }
    const pos = isBraille
      ? i * spacing + Math.floor(spacing / 2) // center for braille
      : i * spacing; // even positions for blocks
    if (pos < chartWidth) {
      labelLine[pos] = label.charAt(0) || " ";
    }
  }
  lines.push(" ".repeat(layout.yAxisWidth + 1) + labelLine.join(""));

  // Legend for multi-series
  if (layout.seriesNames.length > 1) {
    const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
      return {
        name,
        symbol: "⣿", // Use braille full block for line chart legend
        useBackticks: i % 2 === 1,
      };
    });

    const legendLayout = computeLegendLayout({
      items: legendItems,
      position: input.legend?.position ?? "bottom",
      maxWidth: layout.width,
    });

    if (legendLayout.rows.length > 0) {
      lines.push("");
      for (const row of legendLayout.rows) {
        lines.push(renderLegendRowAnsi(row, theme));
      }
    }
  }

  return lines.join("\n");
}

/**
 * Render an area chart to ANSI.
 */
export function renderAreaChartAnsi(
  layout: AreaChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme, input } = options;
  const lines: string[] = [];

  // Render rows
  for (const row of layout.rows) {
    const yLabel = row.yLabel
      ? padToWidth(row.yLabel, layout.yAxisWidth - 1) + " "
      : " ".repeat(layout.yAxisWidth);

    let content = "";
    for (const char of row.chars) {
      if (char !== " " && theme) {
        content += theme.semantic.primary(char);
      } else {
        content += char;
      }
    }

    lines.push(`${yLabel}${AXIS_CHARS.vertical}${content}`);
  }

  // X-axis
  const xAxisLine = AXIS_CHARS.horizontal.repeat(layout.categories.length);
  lines.push(" ".repeat(layout.yAxisWidth) + AXIS_CHARS.origin + xAxisLine);

  // X-axis labels
  const xLabels = layout.categories.map((c) => c.charAt(0) || " ").join("");
  lines.push(" ".repeat(layout.yAxisWidth + 1) + xLabels);

  // Legend
  const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
    const style = layout.seriesStyles[i];
    if (!style) {
      throw new Error(`Missing series style at index ${String(i)}`);
    }
    return {
      name,
      symbol: style.char,
      useBackticks: style.useBackticks,
    };
  });

  const legendLayout = computeLegendLayout({
    items: legendItems,
    position: input.legend?.position ?? "bottom",
    maxWidth: layout.width,
  });

  if (legendLayout.rows.length > 0) {
    lines.push("");
    for (const row of legendLayout.rows) {
      lines.push(renderLegendRowAnsi(row, theme));
    }
  }

  return lines.join("\n");
}

/**
 * Render a scatter chart to ANSI.
 */
export function renderScatterChartAnsi(
  layout: ScatterChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme, input } = options;
  const lines: string[] = [];

  const format = input.yAxis?.format ?? "number";
  const decimals = input.yAxis?.decimals;

  // Render rows from top to bottom
  for (let rowIndex = 0; rowIndex < layout.chartHeight; rowIndex++) {
    // Y-axis label
    let yLabel = " ".repeat(layout.yAxisWidth);
    const rowTop = 1 - rowIndex / layout.chartHeight;
    const rowBottom = 1 - (rowIndex + 1) / layout.chartHeight;

    for (const tick of layout.yScale.ticks) {
      const tickNorm =
        (tick - layout.yScale.min) / (layout.yScale.max - layout.yScale.min);
      if (tickNorm > rowBottom && tickNorm <= rowTop) {
        yLabel =
          padToWidth(
            formatTickValue(tick, format, decimals),
            layout.yAxisWidth - 1
          ) + " ";
        break;
      }
    }

    // Build row content
    let content = "";
    if (layout.scatterStyle === "braille" && layout.brailleChars) {
      const rowChars = layout.brailleChars[rowIndex] ?? [];
      const rowIndices = layout.brailleSeriesIndices?.[rowIndex] ?? [];
      for (let i = 0; i < rowChars.length; i++) {
        const char = rowChars[i];
        if (char === undefined) {
          continue;
        }
        const seriesIdx = rowIndices[i];
        if (char !== " " && theme) {
          if (
            seriesIdx !== null &&
            seriesIdx !== undefined &&
            seriesIdx % 2 === 1
          ) {
            content += theme.semantic.secondary(char);
          } else {
            content += theme.semantic.primary(char);
          }
        } else {
          content += char;
        }
      }
    } else if (layout.grid) {
      const rowChars = layout.grid[rowIndex] ?? [];
      const rowIndices = layout.seriesIndices?.[rowIndex] ?? [];
      for (let i = 0; i < rowChars.length; i++) {
        const char = rowChars[i];
        if (char === undefined) {
          continue;
        }
        const seriesIdx = rowIndices[i];
        if (char !== " " && theme) {
          if (
            seriesIdx !== null &&
            seriesIdx !== undefined &&
            seriesIdx % 2 === 1
          ) {
            content += theme.semantic.secondary(char);
          } else {
            content += theme.semantic.primary(char);
          }
        } else {
          content += char;
        }
      }
    }

    lines.push(`${yLabel}${AXIS_CHARS.vertical}${content}`);
  }

  // X-axis
  const xAxisLine = AXIS_CHARS.horizontal.repeat(layout.chartWidth);
  lines.push(" ".repeat(layout.yAxisWidth) + AXIS_CHARS.origin + xAxisLine);

  // X-axis labels
  const xFormat = input.xAxis?.format ?? "number";
  const xDecimals = input.xAxis?.decimals;
  const labelPositions: { pos: number; label: string }[] = [];

  for (const tick of layout.xScale.ticks) {
    const norm =
      (tick - layout.xScale.min) / (layout.xScale.max - layout.xScale.min);
    const pos = Math.round(norm * (layout.chartWidth - 1));
    const label = formatTickValue(tick, xFormat, xDecimals);
    labelPositions.push({ pos, label });
  }

  // Build X-axis label line
  const labelLine: string[] = Array<string>(layout.chartWidth).fill(" ");
  for (const { pos, label } of labelPositions) {
    // Try to center label around position
    const halfLen = Math.floor(label.length / 2);
    const startPos = Math.max(
      0,
      Math.min(layout.chartWidth - label.length, pos - halfLen)
    );
    for (let i = 0; i < label.length && startPos + i < layout.chartWidth; i++) {
      const char = label[i];
      if (char !== undefined) {
        labelLine[startPos + i] = char;
      }
    }
  }
  lines.push(" ".repeat(layout.yAxisWidth + 1) + labelLine.join(""));

  // Legend for multi-series
  if (layout.seriesNames.length > 1) {
    const symbolArray = ["●", "■", "▲", "◆", "+"] as const;
    const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
      const symbol =
        layout.scatterStyle === "braille" ? "⣿" : symbolArray[i % 5];
      if (!symbol) {
        throw new Error(`Missing symbol at index ${String(i % 5)}`);
      }
      return {
        name,
        symbol,
        useBackticks: i % 2 === 1,
      };
    });

    const legendLayout = computeLegendLayout({
      items: legendItems,
      position: input.legend?.position ?? "bottom",
      maxWidth: layout.width,
    });

    if (legendLayout.rows.length > 0) {
      lines.push("");
      for (const row of legendLayout.rows) {
        lines.push(renderLegendRowAnsi(row, theme));
      }
    }
  }

  return lines.join("\n");
}

/**
 * Render a pie or donut chart to ANSI.
 */
export function renderPieChartAnsi(
  layout: PieChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme, input } = options;
  const lines: string[] = [];

  // Handle empty chart
  if (layout.slices.length === 0) {
    lines.push("No data");
    return lines.join("\n");
  }

  // Render the braille canvas rows
  for (let rowIndex = 0; rowIndex < layout.brailleChars.length; rowIndex++) {
    const rowChars = layout.brailleChars[rowIndex] ?? [];
    const rowIndices = layout.brailleSeriesIndices[rowIndex] ?? [];

    let content = "";
    for (let i = 0; i < rowChars.length; i++) {
      const char = rowChars[i];
      if (char === undefined) {
        continue;
      }
      const seriesIdx = rowIndices[i];
      if (char !== " " && theme) {
        if (
          seriesIdx !== null &&
          seriesIdx !== undefined &&
          seriesIdx % 2 === 1
        ) {
          content += theme.semantic.secondary(char);
        } else {
          content += theme.semantic.primary(char);
        }
      } else {
        content += char;
      }
    }

    // Add center label for donut if this is the center row
    if (
      layout.type === "donut" &&
      layout.centerLabel &&
      rowIndex === Math.floor(layout.brailleChars.length / 2)
    ) {
      // Try to overlay center label
      const labelLen = layout.centerLabel.length;
      const startPos = Math.floor((layout.width - labelLen) / 2);
      if (startPos >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentionally decomposing string into chars for overlay
        const contentArray = [...content];
        for (
          let i = 0;
          i < labelLen && startPos + i < contentArray.length;
          i++
        ) {
          const char = layout.centerLabel[i];
          if (char !== undefined) {
            contentArray[startPos + i] = char;
          }
        }
        content = contentArray.join("");
      }
    }

    lines.push(content);
  }

  // Add legend
  const legendItems: LegendItem[] = layout.slices.map((slice) => ({
    name: `${slice.label} ${slice.percentage.toFixed(0)}%`,
    symbol: slice.barChar,
    useBackticks: slice.useBackticks,
  }));

  const legendLayout = computeLegendLayout({
    items: legendItems,
    position: input.legend?.position ?? "bottom",
    maxWidth: layout.width,
  });

  if (legendLayout.rows.length > 0) {
    lines.push("");
    for (const row of legendLayout.rows) {
      lines.push(renderLegendRowAnsi(row, theme));
    }
  }

  return lines.join("\n");
}

/**
 * Render a heatmap chart to ANSI.
 */
export function renderHeatmapAnsi(
  layout: HeatmapChartLayout,
  options: AnsiRenderOptions
): string {
  const { theme } = options;
  const lines: string[] = [];

  // Header row with column labels
  const colLabelRow =
    " ".repeat(layout.rowLabelWidth) +
    layout.colLabels
      .map((label) =>
        padToWidth(label.substring(0, layout.cellWidth), layout.cellWidth)
      )
      .join(" ");
  lines.push(colLabelRow);

  // Data rows
  for (let rowIdx = 0; rowIdx < layout.rowLabels.length; rowIdx++) {
    const rowLabel = layout.rowLabels[rowIdx];
    if (rowLabel === undefined) {
      continue;
    }
    const rowCells = layout.cells[rowIdx] ?? [];

    let row = padToWidth(rowLabel, layout.rowLabelWidth);

    for (const cell of rowCells) {
      let cellStr: string;
      if (layout.heatmapStyle === "numeric") {
        cellStr = padToWidth(cell.displayChar, layout.cellWidth);
      } else {
        cellStr = cell.displayChar;
      }

      // Apply color based on intensity
      if (theme) {
        if (cell.normalizedValue > 0.5) {
          cellStr = theme.semantic.primary(cellStr);
        } else if (cell.normalizedValue > 0.25) {
          cellStr = theme.semantic.secondary(cellStr);
        }
      }

      row += cellStr + " ";
    }

    lines.push(row.trimEnd());
  }

  // Add scale legend
  if (layout.heatmapStyle !== "numeric") {
    lines.push("");
    const scaleLabel =
      layout.heatmapStyle === "blocks"
        ? `Scale: ░ ${String(layout.valueRange.min)} ▒ ▓ █ ${String(layout.valueRange.max)}`
        : `Scale: . ${String(layout.valueRange.min)} : * # ${String(layout.valueRange.max)}`;
    lines.push(theme ? theme.semantic.secondary(scaleLabel) : scaleLabel);
  }

  return lines.join("\n");
}

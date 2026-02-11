/**
 * Markdown renderer for charts.
 *
 * Produces markdown-friendly output using a two-color system:
 * - Primary: Plain text
 * - Secondary: Inline code (backticks)
 */

import { padToWidth, anchorLine, DEFAULT_ANCHOR } from "@tuicomponents/core";
import { AXIS_CHARS } from "../core/chars.js";
import { formatTickValue } from "../core/scaling.js";
import {
  renderLegendRow,
  computeLegendLayout,
  type LegendItem,
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
import type { HeatmapChartLayout as _HeatmapChartLayout } from "../layout/heatmap.js";
import type { ChartInputWithDefaults } from "../types.js";

/**
 * Render options for markdown output.
 */
export interface MarkdownRenderOptions {
  /** Chart input for configuration */
  input: ChartInputWithDefaults;
}

/**
 * Wrap text in inline code if needed.
 */
function wrapInlineCode(text: string, useBackticks: boolean): string {
  if (useBackticks) {
    return ` \`${text}\``;
  }
  return text;
}

/**
 * Render a horizontal bar chart to markdown.
 */
export function renderBarChartMarkdown(
  layout: BarChartLayout,
  _options: MarkdownRenderOptions
): string {
  const lines: string[] = [];

  for (const bar of layout.bars) {
    const label = padToWidth(bar.label, layout.maxLabelWidth);
    const barStr = bar.barChar.repeat(bar.length);
    const styledBar = wrapInlineCode(barStr, bar.useBackticks);

    let content: string;
    if (layout.showValues) {
      content = `${label} ${styledBar} ${bar.formattedValue}`;
    } else {
      content = `${label} ${styledBar}`;
    }

    // Add compensation for backticks
    if (bar.useBackticks) {
      content += "  ";
    }

    lines.push(anchorLine(content, DEFAULT_ANCHOR));
  }

  return lines.join("\n");
}

/**
 * Render a vertical bar chart to markdown.
 */
export function renderVerticalBarChartMarkdown(
  layout: BarChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
  const lines: string[] = [];

  const chartHeight = layout.barAreaSize;
  const numBars = layout.bars.length;
  const barWidth = Math.max(1, Math.floor((layout.width - 2) / numBars) - 1);
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

    const axisChar = row === 0 ? AXIS_CHARS.origin : AXIS_CHARS.vertical;

    // Build bar segments
    const segments: string[] = [];
    for (const bar of layout.bars) {
      const barNorm = bar.length / layout.barAreaSize;
      if (barNorm >= rowThreshold) {
        const barSegment = bar.barChar.repeat(barWidth);
        segments.push(wrapInlineCode(barSegment, bar.useBackticks));
      } else {
        segments.push(" ".repeat(barWidth));
      }
    }

    lines.push(
      anchorLine(`${yLabel}${axisChar}${segments.join(" ")}`, DEFAULT_ANCHOR)
    );
  }

  // X-axis line
  const xAxisLine = AXIS_CHARS.horizontal.repeat(layout.width - yAxisWidth - 1);
  lines.push(
    anchorLine(
      " ".repeat(yAxisWidth) + AXIS_CHARS.origin + xAxisLine,
      DEFAULT_ANCHOR
    )
  );

  // X-axis labels
  const xLabels: string[] = [];
  for (const bar of layout.bars) {
    xLabels.push(padToWidth(bar.label, barWidth));
  }
  lines.push(
    anchorLine(" ".repeat(yAxisWidth + 1) + xLabels.join(" "), DEFAULT_ANCHOR)
  );

  return lines.join("\n");
}

/**
 * Render a stacked bar chart to markdown.
 */
export function renderStackedBarChartMarkdown(
  layout: StackedBarChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
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

    for (let row = chartHeight - 1; row >= 0; row--) {
      const rowBottom = row / chartHeight;
      const rowTop = (row + 1) / chartHeight;

      // Get Y-axis label and tick mark using shared abstraction
      const { label: yLabel, axisChar } = computeYAxisRow(row, yAxisConfig);
      const segments: string[] = [];

      for (const stack of layout.stacks) {
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
          // Don't use wrapInlineCode to avoid leading space in bar segments
          if (activeSegment.useBackticks) {
            segments.push(`\`${barSegment}\``);
          } else {
            segments.push(barSegment);
          }
        } else {
          segments.push(" ".repeat(barWidth));
        }
      }

      lines.push(
        anchorLine(`${yLabel}${axisChar}${segments.join(" ")}`, DEFAULT_ANCHOR)
      );
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
    lines.push(anchorLine(xAxis.axisLine, DEFAULT_ANCHOR));
    lines.push(anchorLine(xAxis.labelLine, DEFAULT_ANCHOR));
  } else {
    // Horizontal stacked bars
    for (const stack of layout.stacks) {
      const label = padToWidth(stack.label, layout.maxLabelWidth);

      // Build stacked bar with alternating styles
      // Don't use wrapInlineCode here as segments should be continuous without gaps
      let barStr = "";
      for (const segment of stack.segments) {
        const segmentStr = segment.barChar.repeat(segment.length);
        if (segment.useBackticks) {
          barStr += `\`${segmentStr}\``;
        } else {
          barStr += segmentStr;
        }
      }

      lines.push(anchorLine(`${label} ${barStr}`, DEFAULT_ANCHOR));
    }
  }

  // Add legend
  const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
    const style = layout.seriesStyles[i];
    if (!style) {
      throw new Error(`Missing style for series ${String(i)}`);
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
    lines.push(anchorLine("", DEFAULT_ANCHOR));
    for (const row of legendLayout.rows) {
      lines.push(anchorLine(renderLegendRow(row, true), DEFAULT_ANCHOR));
    }
  }

  return lines.join("\n");
}

/**
 * Render a line chart to markdown.
 */
export function renderLineChartMarkdown(
  layout: LineChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
  const lines: string[] = [];

  // Chart width is based on the number of character columns in the rendered rows
  const chartWidth = layout.rows[0]?.chars.length ?? layout.categories.length;

  // Render rows
  for (const row of layout.rows) {
    const yLabel = row.yLabel
      ? padToWidth(row.yLabel, layout.yAxisWidth - 1) + " "
      : " ".repeat(layout.yAxisWidth);

    let content = "";
    for (let i = 0; i < row.chars.length; i++) {
      const char = row.chars[i];
      const useBackticks = row.useBackticks[i];
      if (char === undefined || useBackticks === undefined) {
        throw new Error(`Missing char or useBackticks at index ${String(i)}`);
      }
      content += wrapInlineCode(char, useBackticks && char !== " ");
    }

    lines.push(
      anchorLine(`${yLabel}${AXIS_CHARS.vertical}${content}`, DEFAULT_ANCHOR)
    );
  }

  // X-axis
  const xAxisLine = AXIS_CHARS.horizontal.repeat(chartWidth);
  lines.push(
    anchorLine(
      " ".repeat(layout.yAxisWidth) + AXIS_CHARS.origin + xAxisLine,
      DEFAULT_ANCHOR
    )
  );

  // X-axis labels - position depends on layout style
  const labelLine = Array<string>(chartWidth).fill(" ");
  const isBraille = layout.lineStyle === "braille";
  const spacing = isBraille ? 3 : 2; // chars per category
  for (let i = 0; i < layout.categories.length; i++) {
    const label = layout.categories[i];
    if (label === undefined) {
      throw new Error(`Missing category at index ${String(i)}`);
    }
    const pos = isBraille
      ? i * spacing + Math.floor(spacing / 2) // center for braille
      : i * spacing; // even positions for blocks
    if (pos < chartWidth) {
      labelLine[pos] = label.charAt(0) || " ";
    }
  }
  lines.push(
    anchorLine(
      " ".repeat(layout.yAxisWidth + 1) + labelLine.join(""),
      DEFAULT_ANCHOR
    )
  );

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
      lines.push(anchorLine("", DEFAULT_ANCHOR));
      for (const row of legendLayout.rows) {
        lines.push(anchorLine(renderLegendRow(row, true), DEFAULT_ANCHOR));
      }
    }
  }

  return lines.join("\n");
}

/**
 * Render an area chart to markdown.
 */
export function renderAreaChartMarkdown(
  layout: AreaChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
  const lines: string[] = [];

  // Render rows
  for (const row of layout.rows) {
    const yLabel = row.yLabel
      ? padToWidth(row.yLabel, layout.yAxisWidth - 1) + " "
      : " ".repeat(layout.yAxisWidth);

    let content = "";
    for (let i = 0; i < row.chars.length; i++) {
      const char = row.chars[i];
      const useBackticks = row.useBackticks[i];
      if (char === undefined || useBackticks === undefined) {
        throw new Error(`Missing char or useBackticks at index ${String(i)}`);
      }
      content += wrapInlineCode(char, useBackticks && char !== " ");
    }

    lines.push(
      anchorLine(`${yLabel}${AXIS_CHARS.vertical}${content}`, DEFAULT_ANCHOR)
    );
  }

  // X-axis
  const xAxisLine = AXIS_CHARS.horizontal.repeat(layout.categories.length);
  lines.push(
    anchorLine(
      " ".repeat(layout.yAxisWidth) + AXIS_CHARS.origin + xAxisLine,
      DEFAULT_ANCHOR
    )
  );

  // X-axis labels
  const xLabels = layout.categories.map((c) => c.charAt(0) || " ").join("");
  lines.push(
    anchorLine(" ".repeat(layout.yAxisWidth + 1) + xLabels, DEFAULT_ANCHOR)
  );

  // Legend
  const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
    const style = layout.seriesStyles[i];
    if (!style) {
      throw new Error(`Missing style for series ${String(i)}`);
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
    lines.push(anchorLine("", DEFAULT_ANCHOR));
    for (const row of legendLayout.rows) {
      lines.push(anchorLine(renderLegendRow(row, true), DEFAULT_ANCHOR));
    }
  }

  return lines.join("\n");
}

/**
 * Render a scatter chart to markdown.
 */
export function renderScatterChartMarkdown(
  layout: ScatterChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
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
          throw new Error(`Missing char at index ${String(i)}`);
        }
        const seriesIdx = rowIndices[i];
        const useBackticks =
          seriesIdx !== null && seriesIdx !== undefined && seriesIdx % 2 === 1;
        content += wrapInlineCode(char, useBackticks && char !== " ");
      }
    } else if (layout.grid) {
      const rowChars = layout.grid[rowIndex] ?? [];
      const rowIndices = layout.seriesIndices?.[rowIndex] ?? [];
      for (let i = 0; i < rowChars.length; i++) {
        const char = rowChars[i];
        if (char === undefined) {
          throw new Error(`Missing char at index ${String(i)}`);
        }
        const seriesIdx = rowIndices[i];
        const useBackticks =
          seriesIdx !== null && seriesIdx !== undefined && seriesIdx % 2 === 1;
        content += wrapInlineCode(char, useBackticks && char !== " ");
      }
    }

    lines.push(
      anchorLine(`${yLabel}${AXIS_CHARS.vertical}${content}`, DEFAULT_ANCHOR)
    );
  }

  // X-axis
  const xAxisLine = AXIS_CHARS.horizontal.repeat(layout.chartWidth);
  lines.push(
    anchorLine(
      " ".repeat(layout.yAxisWidth) + AXIS_CHARS.origin + xAxisLine,
      DEFAULT_ANCHOR
    )
  );

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
  const labelLine = Array<string>(layout.chartWidth).fill(" ");
  for (const { pos, label } of labelPositions) {
    const halfLen = Math.floor(label.length / 2);
    const startPos = Math.max(
      0,
      Math.min(layout.chartWidth - label.length, pos - halfLen)
    );
    for (let i = 0; i < label.length && startPos + i < layout.chartWidth; i++) {
      const char = label[i];
      if (char === undefined) {
        throw new Error(`Missing char at index ${String(i)}`);
      }
      labelLine[startPos + i] = char;
    }
  }
  lines.push(
    anchorLine(
      " ".repeat(layout.yAxisWidth + 1) + labelLine.join(""),
      DEFAULT_ANCHOR
    )
  );

  // Legend for multi-series
  if (layout.seriesNames.length > 1) {
    const legendItems: LegendItem[] = layout.seriesNames.map((name, i) => {
      const symbols = ["●", "■", "▲", "◆", "+"];
      const symbol = layout.scatterStyle === "braille" ? "⣿" : symbols[i % 5];
      if (!symbol) {
        throw new Error(`Missing symbol for series ${String(i)}`);
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
      lines.push(anchorLine("", DEFAULT_ANCHOR));
      for (const row of legendLayout.rows) {
        lines.push(anchorLine(renderLegendRow(row, true), DEFAULT_ANCHOR));
      }
    }
  }

  return lines.join("\n");
}

/**
 * Render a pie or donut chart to markdown.
 */
export function renderPieChartMarkdown(
  layout: PieChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
  const lines: string[] = [];

  // Handle empty chart
  if (layout.slices.length === 0) {
    lines.push(anchorLine("No data", DEFAULT_ANCHOR));
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
        throw new Error(`Missing char at index ${String(i)}`);
      }
      const seriesIdx = rowIndices[i];
      const useBackticks =
        seriesIdx !== null && seriesIdx !== undefined && seriesIdx % 2 === 1;
      content += wrapInlineCode(char, useBackticks && char !== " ");
    }

    // Add center label for donut if this is the center row
    if (
      layout.type === "donut" &&
      layout.centerLabel &&
      rowIndex === Math.floor(layout.brailleChars.length / 2)
    ) {
      const labelLen = layout.centerLabel.length;
      const startPos = Math.floor((layout.width - labelLen) / 2);
      if (startPos >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-misused-spread -- intentional string spread for character manipulation
        const contentArray = [...content];
        for (
          let i = 0;
          i < labelLen && startPos + i < contentArray.length;
          i++
        ) {
          const char = layout.centerLabel[i];
          if (char === undefined) {
            throw new Error(`Missing centerLabel char at index ${String(i)}`);
          }
          contentArray[startPos + i] = char;
        }
        content = contentArray.join("");
      }
    }

    lines.push(anchorLine(content, DEFAULT_ANCHOR));
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
    lines.push(anchorLine("", DEFAULT_ANCHOR));
    for (const row of legendLayout.rows) {
      lines.push(anchorLine(renderLegendRow(row, true), DEFAULT_ANCHOR));
    }
  }

  return lines.join("\n");
}

/**
 * Render a heatmap chart to markdown.
 */
export function renderHeatmapMarkdown(
  layout: HeatmapChartLayout,
  options: MarkdownRenderOptions
): string {
  const { input } = options;
  const lines: string[] = [];

  // Handle empty chart
  if (layout.cells.length === 0 || layout.cells[0]!.length === 0) {
    lines.push(anchorLine("No data", DEFAULT_ANCHOR));
    return lines.join("\n");
  }

  // Column header row
  const colHeaderPadding = " ".repeat(layout.rowLabelWidth);
  const colHeaders = layout.colLabels
    .map((label) => padToWidth(label, layout.colLabelWidth))
    .join("");
  lines.push(anchorLine(`${colHeaderPadding}${colHeaders}`, DEFAULT_ANCHOR));

  // Data rows
  for (let rowIdx = 0; rowIdx < layout.rowLabels.length; rowIdx++) {
    const rowLabel = padToWidth(layout.rowLabels[rowIdx]!, layout.rowLabelWidth);
    const rowCells = layout.cells[rowIdx]!;

    let rowContent = "";
    for (const cell of rowCells) {
      // For numeric style, don't use backticks; for blocks/ascii, use intensity-based styling
      if (layout.heatmapStyle === "numeric") {
        rowContent += padToWidth(cell.displayChar, layout.colLabelWidth);
      } else {
        // Alternate backticks for visual distinction, pad to align with column headers
        const useBackticks = cell.normalizedValue > 0.5;
        const paddedChar = padToWidth(cell.displayChar, layout.colLabelWidth);
        const styled = wrapInlineCode(paddedChar, useBackticks);
        rowContent += styled;
      }
    }

    lines.push(anchorLine(`${rowLabel}${rowContent}`, DEFAULT_ANCHOR));
  }

  // Add scale legend for non-numeric styles
  if (layout.heatmapStyle !== "numeric") {
    lines.push(anchorLine("", DEFAULT_ANCHOR));
    const scaleChars =
      layout.heatmapStyle === "blocks"
        ? ["░", "▒", "▓", "█"]
        : [".", ":", "*", "#"];
    const scaleLabels = ["Low", "", "", "High"];
    let scaleLine = "Scale: ";
    for (let i = 0; i < scaleChars.length; i++) {
      scaleLine += `${scaleChars[i]} ${scaleLabels[i]}`;
      if (i < scaleChars.length - 1) scaleLine += " ";
    }
    lines.push(anchorLine(scaleLine, DEFAULT_ANCHOR));
  }

  return lines.join("\n");
}

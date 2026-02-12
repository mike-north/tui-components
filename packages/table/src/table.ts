import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiTheme,
  type RenderMode,
  getStringWidth,
  getMarkdownRenderedWidth,
  truncateToWidth,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  tableInputSchema,
  type TableInput,
  type TableInputWithDefaults,
  type ColumnWithDefaults,
  type Alignment,
  type HeaderStyle,
} from "./schema.js";
import { getBorderChars, type BorderChars } from "./borders.js";

/**
 * Computed column widths and data.
 */
interface ComputedColumn {
  column: ColumnWithDefaults;
  width: number;
}

/**
 * Apply border color to text.
 */
function colorBorder(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.border(text);
}

/**
 * Apply header color to text (ANSI mode).
 */
function colorHeader(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.header(text);
}

/**
 * Markdown formatting markers for each header style.
 * These characters will be consumed (invisible) when rendered.
 */
const MARKDOWN_HEADER_FORMATS: Record<HeaderStyle, { prefix: string; suffix: string }> = {
  normal: { prefix: "", suffix: "" },
  bold: { prefix: "**", suffix: "**" },
  italic: { prefix: "_", suffix: "_" },
  "bold-italic": { prefix: "***", suffix: "***" },
};

/**
 * Apply markdown formatting to header text.
 */
function formatHeaderMarkdown(text: string, style: HeaderStyle): string {
  const format = MARKDOWN_HEADER_FORMATS[style];
  return `${format.prefix}${text}${format.suffix}`;
}

/**
 * Table component for rendering tabular data.
 */
class TableComponent extends BaseTuiComponent<
  TableInput,
  typeof tableInputSchema
> {
  readonly metadata: ComponentMetadata<TableInput> = {
    name: "table",
    description: "Renders tabular data with customizable borders and alignment",
    version: "0.1.0",
    examples: [
      {
        name: "basic",
        description: "Simple table with two columns",
        input: {
          columns: [
            { header: "Name", key: "name" },
            { header: "Age", key: "age", align: "right" },
          ],
          rows: [
            { name: "Alice", age: 30 },
            { name: "Bob", age: 25 },
          ],
        },
      },
      {
        name: "bordered",
        description: "Table with rounded borders",
        input: {
          columns: [
            { header: "Status", key: "status" },
            { header: "Count", key: "count", align: "right" },
          ],
          rows: [
            { status: "Active", count: 42 },
            { status: "Inactive", count: 8 },
          ],
          borderStyle: "rounded",
        },
      },
    ],
  };

  readonly schema = tableInputSchema;

  /**
   * Override getJsonSchema to use a more direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: TableInput, context: RenderContext): RenderResult {
    // Parse and apply defaults
    const parsed: TableInputWithDefaults = this.schema.parse(input);
    const maxTableWidth = parsed.maxWidth ?? context.width;
    const theme = context.theme;
    const renderMode = context.renderMode;
    const headerStyle = parsed.headerStyle;

    const borders = getBorderChars(parsed.borderStyle);
    const hasBorders = parsed.borderStyle !== "none";

    // Compute column widths based on visual content (formatting chars are invisible)
    const computedColumns = this.computeColumnWidths(
      parsed.columns,
      parsed.rows,
      maxTableWidth,
      hasBorders,
      renderMode
    );

    // Build the table
    const lines: string[] = [];

    // Top border
    if (hasBorders) {
      lines.push(this.buildHorizontalLine(computedColumns, borders, "top", theme));
    }

    // Header row
    if (parsed.showHeader) {
      lines.push(
        this.buildHeaderRow(computedColumns, borders, hasBorders, theme, renderMode, headerStyle)
      );

      // Header separator
      if (hasBorders) {
        lines.push(
          this.buildHorizontalLine(computedColumns, borders, "middle", theme)
        );
      }
    }

    // Data rows
    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      if (!row) continue;
      lines.push(this.buildDataRow(row, computedColumns, borders, hasBorders, theme, renderMode));

      // Row separator (except after last row)
      if (parsed.rowSeparators && hasBorders && i < parsed.rows.length - 1) {
        lines.push(
          this.buildHorizontalLine(computedColumns, borders, "middle", theme)
        );
      }
    }

    // Bottom border
    if (hasBorders) {
      lines.push(this.buildHorizontalLine(computedColumns, borders, "bottom", theme));
    }

    const output = lines.join("\n");
    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }

  /**
   * Get the visual width of content, accounting for render mode.
   * In markdown mode, formatting characters (backticks, asterisks) are invisible.
   */
  private getContentWidth(value: string, renderMode: RenderMode): number {
    if (renderMode === "markdown") {
      return getMarkdownRenderedWidth(value);
    }
    return getStringWidth(value);
  }

  /**
   * Compute column widths based on content and constraints.
   */
  private computeColumnWidths(
    columns: ColumnWithDefaults[],
    rows: Record<string, unknown>[],
    maxTableWidth: number,
    hasBorders: boolean,
    renderMode: RenderMode
  ): ComputedColumn[] {
    // Calculate overhead from borders
    // With borders: │ col1 │ col2 │ = (n+1) vertical bars + 2*n spaces
    // Without: col1  col2 = (n-1) gaps of 2 spaces
    const borderOverhead = hasBorders
      ? columns.length + 1 + columns.length * 2 // n+1 verticals + 2 spaces per column
      : (columns.length - 1) * 2; // gaps between columns

    const availableWidth = maxTableWidth - borderOverhead;

    // Calculate natural widths for each column
    // Column widths are based on VISUAL width (what you see after markdown renders)
    // Formatting characters like ** or `` are invisible - they style text but don't take space
    const naturalWidths: number[] = columns.map((col, _idx) => {
      // Header visual width (formatting chars don't count - they're invisible when rendered)
      let maxWidth = getStringWidth(col.header);

      // Check all row values
      for (const row of rows) {
        const value = this.formatValue(row[col.key]);
        // Use mode-aware width: markdown mode accounts for backticks, etc.
        const valueWidth = this.getContentWidth(value, renderMode);
        if (valueWidth > maxWidth) {
          maxWidth = valueWidth;
        }
      }

      // Apply constraints
      if (col.minWidth && maxWidth < col.minWidth) {
        maxWidth = col.minWidth;
      }
      if (col.maxWidth && maxWidth > col.maxWidth) {
        maxWidth = col.maxWidth;
      }
      if (col.width) {
        maxWidth = col.width;
      }

      return maxWidth;
    });

    // Calculate total natural width
    const totalNatural = naturalWidths.reduce((sum, w) => sum + w, 0);

    // If we fit, use natural widths
    if (totalNatural <= availableWidth) {
      return columns.map((col, idx) => {
        const width = naturalWidths[idx];
        return {
          column: col,
          width: width ?? 0,
        };
      });
    }

    // Otherwise, proportionally shrink columns
    const scaleFactor = availableWidth / totalNatural;
    const scaledWidths = naturalWidths.map((w) =>
      Math.max(1, Math.floor(w * scaleFactor))
    );

    // Distribute any remaining width to the first columns
    let totalScaled = scaledWidths.reduce((sum, w) => sum + w, 0);
    let widthIdx = 0;
    while (totalScaled < availableWidth && widthIdx < scaledWidths.length) {
      const currentWidth = scaledWidths[widthIdx];
      if (currentWidth !== undefined) {
        scaledWidths[widthIdx] = currentWidth + 1;
        totalScaled++;
      }
      widthIdx++;
    }

    return columns.map((col, colIdx) => {
      const width = scaledWidths[colIdx];
      return {
        column: col,
        width: width ?? 0,
      };
    });
  }

  /**
   * Build a horizontal line (top, middle, or bottom).
   */
  private buildHorizontalLine(
    columns: ComputedColumn[],
    borders: BorderChars,
    position: "top" | "middle" | "bottom",
    theme: TuiTheme | undefined
  ): string {
    const left =
      position === "top"
        ? borders.topLeft
        : position === "bottom"
          ? borders.bottomLeft
          : borders.leftJoin;
    const right =
      position === "top"
        ? borders.topRight
        : position === "bottom"
          ? borders.bottomRight
          : borders.rightJoin;
    const join =
      position === "top"
        ? borders.topJoin
        : position === "bottom"
          ? borders.bottomJoin
          : borders.cross;

    const segments = columns.map((c) =>
      borders.horizontal.repeat(c.width + 2)
    );

    const line = left + segments.join(join) + right;
    return colorBorder(line, theme);
  }

  /**
   * Build the header row.
   */
  private buildHeaderRow(
    columns: ComputedColumn[],
    borders: BorderChars,
    hasBorders: boolean,
    theme: TuiTheme | undefined,
    renderMode: RenderMode,
    headerStyle: HeaderStyle
  ): string {
    const cells = columns.map((c) => {
      if (renderMode === "markdown") {
        // Format header text with markdown styling
        const formatted = formatHeaderMarkdown(c.column.header, headerStyle);
        // Visual width is the header text WITHOUT formatting chars (they're invisible when rendered)
        const visualWidth = getStringWidth(c.column.header);

        // Pad based on visual width to match column width
        const paddingNeeded = Math.max(0, c.width - visualWidth);

        // Apply alignment - padding goes OUTSIDE the formatting markers
        let cell: string;
        switch (c.column.align) {
          case "right":
            cell = " ".repeat(paddingNeeded) + formatted;
            break;
          case "center": {
            const leftPad = " ".repeat(Math.floor(paddingNeeded / 2));
            const rightPad = " ".repeat(Math.ceil(paddingNeeded / 2));
            cell = `${leftPad}${formatted}${rightPad}`;
            break;
          }
          case "left":
          default:
            cell = formatted + " ".repeat(paddingNeeded);
            break;
        }

        // No compensation needed - visual width matches column width
        // The invisible markdown chars don't affect table structure
        return ` ${cell} `;
      }

      // ANSI mode: use standard cell formatting with theme color
      const text = this.formatCell(c.column.header, c.width, c.column.align, renderMode);
      return colorHeader(` ${text} `, theme);
    });

    if (hasBorders) {
      const v = colorBorder(borders.vertical, theme);
      return v + cells.join(v) + v;
    }

    return cells.map((c) => c.trim()).join("  ");
  }

  /**
   * Build a data row.
   */
  private buildDataRow(
    row: Record<string, unknown>,
    columns: ComputedColumn[],
    borders: BorderChars,
    hasBorders: boolean,
    theme: TuiTheme | undefined,
    renderMode: RenderMode
  ): string {
    const cells = columns.map((c) => {
      const value = this.formatValue(row[c.column.key]);
      const text = this.formatCell(value, c.width, c.column.align, renderMode);
      return ` ${text} `;
    });

    if (hasBorders) {
      const v = colorBorder(borders.vertical, theme);
      return v + cells.join(v) + v;
    }

    return cells.map((c) => c.trim()).join("  ");
  }

  /**
   * Format a cell value to fit within a width with alignment.
   * In markdown mode, accounts for invisible formatting characters (backticks, etc.)
   */
  private formatCell(
    text: string,
    width: number,
    align: Alignment,
    renderMode: RenderMode
  ): string {
    // Get the visual width (accounting for invisible chars in markdown mode)
    const visualWidth = this.getContentWidth(text, renderMode);

    if (visualWidth > width) {
      // Truncation is tricky with styled content - for now use standard truncation
      // This may cut into styling chars, which could be improved later
      return truncateToWidth(text, width);
    }

    // Calculate padding needed for visual alignment
    const paddingNeeded = Math.max(0, width - visualWidth);

    // Apply alignment
    switch (align) {
      case "right":
        return " ".repeat(paddingNeeded) + text;
      case "center": {
        const leftPad = " ".repeat(Math.floor(paddingNeeded / 2));
        const rightPad = " ".repeat(Math.ceil(paddingNeeded / 2));
        return `${leftPad}${text}${rightPad}`;
      }
      case "left":
      default:
        return text + " ".repeat(paddingNeeded);
    }
  }

  /**
   * Format a value as a string.
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    // For other types (symbol, bigint, function), convert to string
    if (typeof value === "bigint") {
      return value.toString();
    }
    // Fallback: serialize value as JSON to avoid default toString
    return JSON.stringify(value);
  }
}

/**
 * Factory function to create a table component.
 */
export function createTable(): TableComponent {
  return new TableComponent();
}

// Register with global registry
registry.register(createTable);

export { TableComponent };

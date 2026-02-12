import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiTheme,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  diffInputSchema,
  type DiffInput,
  type DiffInputWithDefaults,
  type DiffLine,
  type Hunk,
  type MarkerStyle,
} from "./schema.js";

/**
 * Get the marker for a line type.
 */
function getMarker(type: DiffLine["type"], style: MarkerStyle): string {
  if (style === "none") {
    return "";
  }

  if (style === "word") {
    switch (type) {
      case "addition":
        return "ADD ";
      case "deletion":
        return "DEL ";
      case "context":
        return "    ";
    }
  }

  // symbol style
  switch (type) {
    case "addition":
      return "+";
    case "deletion":
      return "-";
    case "context":
      return " ";
  }
}

/**
 * Format line numbers for display.
 */
function formatLineNumbers(
  line: DiffLine,
  maxOldWidth: number,
  maxNewWidth: number
): string {
  const oldNum =
    line.oldLineNumber !== undefined
      ? String(line.oldLineNumber).padStart(maxOldWidth, " ")
      : " ".repeat(maxOldWidth);

  const newNum =
    line.newLineNumber !== undefined
      ? String(line.newLineNumber).padStart(maxNewWidth, " ")
      : " ".repeat(maxNewWidth);

  return `${oldNum} ${newNum}`;
}

/**
 * Apply color to a diff line based on its type.
 */
function colorLine(
  text: string,
  type: DiffLine["type"],
  theme: TuiTheme | undefined
): string {
  if (!theme) {
    return text;
  }

  switch (type) {
    case "addition":
      return theme.semantic.added(text);
    case "deletion":
      return theme.semantic.removed(text);
    case "context":
      return text; // Context lines keep default color
  }
}

/**
 * Apply color to header text.
 */
function colorHeader(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.secondary(text);
}

/**
 * Diff component for rendering unified diff output.
 */
class DiffComponent extends BaseTuiComponent<
  DiffInput,
  typeof diffInputSchema
> {
  readonly metadata: ComponentMetadata<DiffInput> = {
    name: "diff",
    description: "Renders unified diff format with additions and deletions",
    version: "0.1.0",
    examples: [
      {
        name: "basic",
        description: "Simple diff with additions and deletions",
        input: {
          hunks: [
            {
              lines: [
                { type: "context", content: "function greet() {" },
                { type: "deletion", content: '  console.log("Hello");' },
                {
                  type: "addition",
                  content: '  console.log("Hello, World!");',
                },
                { type: "context", content: "}" },
              ],
            },
          ],
        },
      },
      {
        name: "with-file-headers",
        description: "Diff with file name headers",
        input: {
          oldFile: "a/src/main.ts",
          newFile: "b/src/main.ts",
          hunks: [
            {
              header: { oldStart: 1, oldCount: 4, newStart: 1, newCount: 5 },
              lines: [
                { type: "context", content: "import { foo } from './foo';" },
                { type: "addition", content: "import { bar } from './bar';" },
                { type: "context", content: "" },
                { type: "context", content: "export function main() {" },
                { type: "deletion", content: "  foo();" },
                { type: "addition", content: "  foo();" },
                { type: "addition", content: "  bar();" },
                { type: "context", content: "}" },
              ],
            },
          ],
        },
      },
      {
        name: "with-line-numbers",
        description: "Diff with line numbers shown",
        input: {
          showLineNumbers: true,
          hunks: [
            {
              lines: [
                {
                  type: "context",
                  content: "const x = 1;",
                  oldLineNumber: 10,
                  newLineNumber: 10,
                },
                {
                  type: "deletion",
                  content: "const y = 2;",
                  oldLineNumber: 11,
                },
                {
                  type: "addition",
                  content: "const y = 3;",
                  newLineNumber: 11,
                },
                {
                  type: "context",
                  content: "const z = x + y;",
                  oldLineNumber: 12,
                  newLineNumber: 12,
                },
              ],
            },
          ],
        },
      },
      {
        name: "word-markers",
        description: "Using word markers instead of symbols",
        input: {
          markerStyle: "word",
          hunks: [
            {
              lines: [
                { type: "context", content: "First line" },
                { type: "deletion", content: "Old line" },
                { type: "addition", content: "New line" },
                { type: "context", content: "Last line" },
              ],
            },
          ],
        },
      },
      {
        name: "multiple-hunks",
        description: "Diff with multiple hunks",
        input: {
          oldFile: "config.json",
          newFile: "config.json",
          hunks: [
            {
              header: { oldStart: 2, oldCount: 3, newStart: 2, newCount: 3 },
              lines: [
                { type: "context", content: '  "name": "my-app",' },
                { type: "deletion", content: '  "version": "1.0.0",' },
                { type: "addition", content: '  "version": "1.1.0",' },
                { type: "context", content: '  "description": "...",' },
              ],
            },
            {
              header: { oldStart: 10, oldCount: 2, newStart: 10, newCount: 3 },
              lines: [
                { type: "context", content: '  "dependencies": {' },
                { type: "addition", content: '    "lodash": "^4.17.21",' },
                { type: "context", content: '    "express": "^4.18.0"' },
              ],
            },
          ],
        },
      },
    ],
  };

  readonly schema = diffInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: DiffInput, context: RenderContext): RenderResult {
    const parsed: DiffInputWithDefaults = this.schema.parse(input);
    const theme = context.theme;

    if (parsed.hunks.length === 0) {
      return { output: "", actualWidth: 0, lineCount: 0 };
    }

    const lines: string[] = [];

    // Render file headers if provided (with muted color)
    if (parsed.oldFile) {
      lines.push(colorHeader(`--- ${parsed.oldFile}`, theme));
    }
    if (parsed.newFile) {
      lines.push(colorHeader(`+++ ${parsed.newFile}`, theme));
    }

    // Calculate max line number widths for padding
    const { maxOldWidth, maxNewWidth } = this.calculateLineNumberWidths(
      parsed.hunks
    );

    // Render each hunk
    for (const hunk of parsed.hunks) {
      this.renderHunk(hunk, parsed, maxOldWidth, maxNewWidth, lines, theme);
    }

    const output = lines.join("\n");
    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }

  private calculateLineNumberWidths(hunks: Hunk[]): {
    maxOldWidth: number;
    maxNewWidth: number;
  } {
    let maxOld = 0;
    let maxNew = 0;

    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.oldLineNumber !== undefined && line.oldLineNumber > maxOld) {
          maxOld = line.oldLineNumber;
        }
        if (line.newLineNumber !== undefined && line.newLineNumber > maxNew) {
          maxNew = line.newLineNumber;
        }
      }
    }

    return {
      maxOldWidth: Math.max(1, String(maxOld).length),
      maxNewWidth: Math.max(1, String(maxNew).length),
    };
  }

  private renderHunk(
    hunk: Hunk,
    config: DiffInputWithDefaults,
    maxOldWidth: number,
    maxNewWidth: number,
    lines: string[],
    theme: TuiTheme | undefined
  ): void {
    // Render hunk header if enabled and header data provided (with muted color)
    if (config.showHunkHeaders && hunk.header) {
      const { oldStart, oldCount, newStart, newCount } = hunk.header;
      const header = `@@ -${String(oldStart)},${String(oldCount)} +${String(newStart)},${String(newCount)} @@`;
      lines.push(colorHeader(header, theme));
    }

    // Render each line
    for (const line of hunk.lines) {
      const renderedLine = this.renderLine(
        line,
        config,
        maxOldWidth,
        maxNewWidth,
        theme
      );
      lines.push(renderedLine);
    }
  }

  private renderLine(
    line: DiffLine,
    config: DiffInputWithDefaults,
    maxOldWidth: number,
    maxNewWidth: number,
    theme: TuiTheme | undefined
  ): string {
    const parts: string[] = [];

    // Add line numbers if enabled
    if (config.showLineNumbers) {
      parts.push(formatLineNumbers(line, maxOldWidth, maxNewWidth));
    }

    // Add marker
    const marker = getMarker(line.type, config.markerStyle);
    if (marker) {
      parts.push(marker);
    }

    // Add content
    parts.push(line.content);

    // Join with appropriate separators
    const rawLine = config.showLineNumbers ? parts.join(" ") : parts.join("");

    // Apply color based on line type
    return colorLine(rawLine, line.type, theme);
  }
}

/**
 * Factory function to create a diff component.
 */
export function createDiff(): DiffComponent {
  return new DiffComponent();
}

// Register with global registry
registry.register(createDiff);

export { DiffComponent };

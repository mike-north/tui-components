import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiTheme,
  measureLines,
  registry,
  getStringWidth,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  listInputSchema,
  isTaskItem,
  isDefinitionItem,
  isStandardItem,
  type ListInput,
  type ListInputWithDefaults,
  type ListItem,
  type ListStyle,
} from "./schema.js";
import { getMarker, getMaxMarkerWidth, getTaskMarker } from "./markers.js";

/**
 * Apply color to list markers.
 */
function colorMarker(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.secondary(text);
}

/**
 * List component for rendering bulleted and numbered lists.
 */
class ListComponent extends BaseTuiComponent<
  ListInput,
  typeof listInputSchema
> {
  readonly metadata: ComponentMetadata<ListInput> = {
    name: "list",
    description: "Renders bulleted or numbered lists with nesting support",
    version: "0.1.0",
    examples: [
      {
        name: "basic-bullet",
        description: "Simple bulleted list",
        input: {
          items: [
            { text: "First item" },
            { text: "Second item" },
            { text: "Third item" },
          ],
        },
      },
      {
        name: "numbered",
        description: "Numbered list",
        input: {
          items: [
            { text: "Step one" },
            { text: "Step two" },
            { text: "Step three" },
          ],
          style: "numbered",
        },
      },
      {
        name: "nested",
        description: "Nested list with sub-items",
        input: {
          items: [
            {
              text: "Parent item",
              items: [{ text: "Child item 1" }, { text: "Child item 2" }],
            },
            { text: "Another parent" },
          ],
        },
      },
      {
        name: "arrow-style",
        description: "List with arrow markers",
        input: {
          items: [
            { text: "Feature A" },
            { text: "Feature B" },
            { text: "Feature C" },
          ],
          style: "arrow",
        },
      },
      {
        name: "lettered",
        description: "Alphabetically lettered list",
        input: {
          items: [
            { text: "Option A" },
            { text: "Option B" },
            { text: "Option C" },
          ],
          style: "lettered",
        },
      },
      {
        name: "task-list",
        description: "Task list with checkboxes",
        input: {
          items: [
            { text: "Complete documentation", checked: true },
            { text: "Write tests", checked: false },
            { text: "Review PR", checked: "partial" },
          ],
          style: "task",
        },
      },
      {
        name: "definition-list",
        description: "Definition list with terms and definitions",
        input: {
          items: [
            { term: "API", definition: "Application Programming Interface" },
            { term: "CLI", definition: "Command Line Interface" },
            { term: "TUI", definition: "Terminal User Interface" },
          ],
          style: "definition",
        },
      },
    ],
  };

  readonly schema = listInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: ListInput, context: RenderContext): RenderResult {
    // Parse and apply defaults
    const parsed: ListInputWithDefaults = this.schema.parse(input);
    const theme = context.theme;
    const lines: string[] = [];

    // Handle definition lists separately
    if (parsed.style === "definition") {
      this.renderDefinitionList(
        parsed.items as ListItem[],
        lines,
        parsed.termWidth,
        theme
      );
    } else {
      // Render standard, task, or other list styles
      this.renderItems(
        parsed.items as ListItem[],
        lines,
        "",
        parsed.style,
        parsed.indent,
        parsed.start,
        theme
      );
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
   * Render a definition list.
   */
  private renderDefinitionList(
    items: ListItem[],
    lines: string[],
    termWidth: number | undefined,
    theme: TuiTheme | undefined
  ): void {
    // Filter to only definition items
    const definitionItems = items.filter(isDefinitionItem);

    // Calculate term width if not provided
    const effectiveTermWidth =
      termWidth ??
      Math.max(...definitionItems.map((item) => getStringWidth(item.term)));

    // Render each definition
    for (const item of definitionItems) {
      const termPadded = item.term.padEnd(effectiveTermWidth);
      const coloredTerm = theme
        ? theme.semantic.secondary(termPadded)
        : termPadded;
      lines.push(`${coloredTerm}  ${item.definition}`);
    }
  }

  /**
   * Render a list of items at a given nesting level.
   */
  private renderItems(
    items: ListItem[],
    lines: string[],
    prefix: string,
    style: ListStyle,
    indent: number,
    startNumber: number,
    theme: TuiTheme | undefined
  ): void {
    const maxMarkerWidth = getMaxMarkerWidth(style, items.length, startNumber);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;

      // Handle task items
      if (style === "task" && isTaskItem(item)) {
        const marker = getTaskMarker(item.checked);
        const paddedMarker = colorMarker(
          marker.padEnd(maxMarkerWidth + 1),
          theme
        );
        lines.push(`${prefix}${paddedMarker}${item.text}`);
        continue;
      }

      // Handle standard items
      if (isStandardItem(item)) {
        const marker = getMarker(style, i, startNumber);
        const paddedMarker =
          style === "none"
            ? ""
            : colorMarker(marker.padEnd(maxMarkerWidth + 1), theme);

        lines.push(`${prefix}${paddedMarker}${item.text}`);

        // Render nested items if present
        if (item.items && item.items.length > 0) {
          const nestedPrefix = prefix + " ".repeat(maxMarkerWidth + 1 + indent);
          // Nested lists use bullet style by default
          this.renderItems(
            item.items,
            lines,
            nestedPrefix,
            style === "none" ? "none" : "bullet",
            indent,
            1,
            theme
          );
        }
      }
    }
  }
}

/**
 * Factory function to create a list component.
 *
 * @public
 */
export function createList(): ListComponent {
  return new ListComponent();
}

// Register with global registry
registry.register(createList);

export { ListComponent };

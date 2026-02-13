import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  horizontalLayoutInputSchema,
  type HorizontalLayoutInput,
} from "./horizontal-schema.js";
import {
  computeHorizontalLayout,
  measureHorizontalOutput,
} from "./horizontal-layout.js";
import {
  renderHorizontalLayoutAnsi,
  renderHorizontalLayoutMarkdown,
} from "./horizontal-renderers.js";

/**
 * Horizontal layout component for arranging rendered components side by side.
 */
class HorizontalLayoutComponent extends BaseTuiComponent<
  HorizontalLayoutInput,
  typeof horizontalLayoutInputSchema
> {
  readonly metadata: ComponentMetadata<HorizontalLayoutInput> = {
    name: "horizontal-layout",
    description: "Arrange multiple rendered components or text side by side",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "basic",
        description: "Two items side by side",
        input: {
          items: ["Left column", "Right column"],
        },
      },
      {
        name: "three-columns",
        description: "Three columns with gap",
        input: {
          items: ["One", "Two", "Three"],
          gap: 2,
        },
      },
      {
        name: "equal-width",
        description: "Equal width columns",
        input: {
          items: ["Short", "A longer item here", "Medium length"],
          widthMode: "equal",
          width: 60,
        },
      },
      {
        name: "manual-widths",
        description: "Manual width specifications",
        input: {
          items: ["Fixed", "Fills remaining space", "Also fixed"],
          widthMode: "manual",
          widths: [10, "fill", 15],
          width: 60,
        },
      },
      {
        name: "vertical-align-middle",
        description: "Different height items, middle aligned",
        input: {
          items: ["Single line", "Line 1\nLine 2\nLine 3", "Two\nlines"],
          verticalAlign: "middle",
        },
      },
      {
        name: "vertical-align-bottom",
        description: "Different height items, bottom aligned",
        input: {
          items: ["Single line", "Line 1\nLine 2\nLine 3", "Two\nlines"],
          verticalAlign: "bottom",
        },
      },
      {
        name: "overflow-stack",
        description: "Stack items when they don't fit",
        input: {
          items: [
            "This is a very long first item",
            "This is a very long second item",
          ],
          width: 30,
          overflow: "stack",
        },
      },
    ],
  };

  readonly schema = horizontalLayoutInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: HorizontalLayoutInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    // Compute layout once, share between renderers
    const layout = computeHorizontalLayout(parsed, context.width);

    // Choose renderer based on render mode
    const output =
      context.renderMode === "markdown"
        ? renderHorizontalLayoutMarkdown(layout)
        : renderHorizontalLayoutAnsi(layout);

    const measured = measureHorizontalOutput(layout);

    return {
      output,
      actualWidth: measured.width,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a horizontal layout component.
 */
export function createHorizontalLayout(): HorizontalLayoutComponent {
  return new HorizontalLayoutComponent();
}

// Register with global registry
registry.register(createHorizontalLayout);

export { HorizontalLayoutComponent };

import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  verticalLayoutInputSchema,
  type VerticalLayoutInput,
} from "./schema.js";
import { computeVerticalLayout, measureVerticalOutput } from "./layout.js";
import {
  renderVerticalLayoutAnsi,
  renderVerticalLayoutMarkdown,
} from "./renderers.js";

/**
 * Vertical layout component for stacking rendered components vertically.
 */
class VerticalLayoutComponent extends BaseTuiComponent<
  VerticalLayoutInput,
  typeof verticalLayoutInputSchema
> {
  readonly metadata: ComponentMetadata<VerticalLayoutInput> = {
    name: "vertical-layout",
    description: "Stack multiple rendered components or text vertically",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "basic",
        description: "Two items stacked vertically",
        input: {
          items: ["First item", "Second item"],
        },
      },
      {
        name: "with-gap",
        description: "Items with a gap between them",
        input: {
          items: ["Header", "Content goes here", "Footer"],
          gap: 1,
        },
      },
      {
        name: "centered",
        description: "Center-aligned items",
        input: {
          items: ["Short", "A longer item", "Medium"],
          align: "center",
        },
      },
      {
        name: "right-aligned",
        description: "Right-aligned items",
        input: {
          items: ["First", "Second item", "Third"],
          align: "right",
          width: 20,
        },
      },
      {
        name: "multi-line-items",
        description: "Items that span multiple lines",
        input: {
          items: ["Line 1\nLine 2", "Single line", "Another\nmulti-line\nitem"],
          gap: 1,
        },
      },
    ],
  };

  readonly schema = verticalLayoutInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: VerticalLayoutInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    // Compute layout once, share between renderers
    const layout = computeVerticalLayout(parsed);

    // Choose renderer based on render mode
    const output =
      context.renderMode === "markdown"
        ? renderVerticalLayoutMarkdown(layout)
        : renderVerticalLayoutAnsi(layout);

    const measured = measureVerticalOutput(layout);

    return {
      output,
      actualWidth: measured.width,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a vertical layout component.
 */
export function createVerticalLayout(): VerticalLayoutComponent {
  return new VerticalLayoutComponent();
}

// Register with global registry
registry.register(createVerticalLayout);

export { VerticalLayoutComponent };

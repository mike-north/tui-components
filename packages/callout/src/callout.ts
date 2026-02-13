import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import { calloutInputSchema, type CalloutInput } from "./schema.js";
import { computeCalloutLayout } from "./layout.js";
import { getBorderChars } from "./chars.js";
import { renderCalloutAnsi, renderCalloutMarkdown } from "./renderers.js";

/**
 * Callout component for rendering semantic alert boxes.
 */
class CalloutComponent extends BaseTuiComponent<
  CalloutInput,
  typeof calloutInputSchema
> {
  readonly metadata: ComponentMetadata<CalloutInput> = {
    name: "callout",
    description: "Semantic callout/alert box for tips, warnings, errors, etc.",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "tip",
        description: "A helpful tip",
        input: {
          type: "tip",
          message: "Use keyboard shortcuts to work faster.",
        },
      },
      {
        name: "note",
        description: "An informational note",
        input: {
          type: "note",
          message: "This feature is available in version 2.0 and later.",
        },
      },
      {
        name: "info",
        description: "General information",
        input: {
          type: "info",
          message: "The system will restart in 5 minutes.",
        },
      },
      {
        name: "warning",
        description: "A warning message",
        input: {
          type: "warning",
          message: "This action cannot be undone. Please proceed with caution.",
        },
      },
      {
        name: "error",
        description: "An error message",
        input: {
          type: "error",
          message:
            "Failed to connect to the database. Please check your credentials.",
        },
      },
      {
        name: "success",
        description: "A success message",
        input: {
          type: "success",
          message: "Your changes have been saved successfully!",
        },
      },
      {
        name: "custom-title",
        description: "Callout with custom title",
        input: {
          type: "info",
          title: "Did you know?",
          message: "You can customize the title of any callout type.",
        },
      },
      {
        name: "no-icon",
        description: "Callout without icon",
        input: {
          type: "note",
          icon: "",
          message: "This callout has no icon.",
        },
      },
      {
        name: "custom-icon",
        description: "Callout with custom icon",
        input: {
          type: "info",
          icon: "🚀",
          title: "New Feature",
          message: "Check out our latest feature release!",
        },
      },
      {
        name: "fixed-width",
        description: "Callout with fixed width",
        input: {
          type: "tip",
          message: "This callout has a fixed width of 60 characters.",
          width: 60,
        },
      },
    ],
  };

  readonly schema = calloutInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: CalloutInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    // Get border characters
    const chars = getBorderChars(parsed.borderStyle);

    // Compute layout
    const layout = computeCalloutLayout(parsed);

    // Choose renderer based on render mode
    const output =
      context.renderMode === "markdown"
        ? renderCalloutMarkdown(layout, parsed, chars)
        : renderCalloutAnsi(layout, parsed, chars, context.theme);

    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a callout component.
 */
export function createCallout(): CalloutComponent {
  return new CalloutComponent();
}

// Register with global registry
registry.register(createCallout);

export { CalloutComponent };

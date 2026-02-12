import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiTheme,
  type RenderMode,
  getStringWidth,
  getMarkdownRenderedWidth,
  padToWidth,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  boxInputSchema,
  type BoxInput,
  type BoxInputWithDefaults,
  type NormalizedPadding,
  type Padding,
  type Alignment,
} from "./schema.js";
import { getBorderChars, type BorderChars } from "./chars.js";

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
 * Apply header/title color to text.
 */
function colorTitle(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.header(text);
}

/**
 * Box component for rendering content in bordered panels.
 */
class BoxComponent extends BaseTuiComponent<BoxInput, typeof boxInputSchema> {
  readonly metadata: ComponentMetadata<BoxInput> = {
    name: "box",
    description: "Renders content in a bordered box/panel",
    version: "0.1.0",
    examples: [
      {
        name: "basic",
        description: "Simple box with content",
        input: {
          content: "Hello, World!",
        },
      },
      {
        name: "with-title",
        description: "Box with a title",
        input: {
          content: "This is the content inside the box.",
          title: "My Title",
        },
      },
      {
        name: "rounded",
        description: "Box with rounded corners",
        input: {
          content: "Rounded corners look nice!",
          borderStyle: "round",
          padding: 1,
        },
      },
      {
        name: "double-border",
        description: "Box with double-line border",
        input: {
          content: "Double border style",
          borderStyle: "double",
          title: "Important",
          titleAlignment: "center",
        },
      },
      {
        name: "centered-text",
        description: "Box with centered content",
        input: {
          content: "Centered\nMultiple lines\nAll centered",
          textAlignment: "center",
          width: 30,
          padding: { top: 1, bottom: 1, left: 2, right: 2 },
        },
      },
    ],
  };

  readonly schema = boxInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: BoxInput, context: RenderContext): RenderResult {
    // Parse and apply defaults
    const parsed: BoxInputWithDefaults = this.schema.parse(input);
    const chars = getBorderChars(parsed.borderStyle);
    const padding = this.normalizePadding(parsed.padding);
    const theme = context.theme;

    // Split content into lines
    const contentMeasured = measureLines(parsed.content);
    const contentLines = contentMeasured.lines;

    // Calculate title width requirement (title + surrounding spaces)
    // In markdown mode, use visual width (formatting chars like ** and _ are invisible)
    const titleWidth = parsed.title
      ? context.renderMode === "markdown"
        ? getMarkdownRenderedWidth(` ${parsed.title} `)
        : getStringWidth(` ${parsed.title} `)
      : 0;

    // Determine content width - must fit both content and title
    let contentWidth: number;
    if (parsed.width) {
      contentWidth = parsed.width - 2 - padding.left - padding.right; // Account for borders and padding
    } else {
      // Use the larger of content width or title width (minus padding)
      const minWidthForTitle = Math.max(
        0,
        titleWidth - padding.left - padding.right
      );
      contentWidth = Math.max(contentMeasured.maxWidth, minWidthForTitle);
    }

    // Calculate total inner width (content + horizontal padding)
    const innerWidth = contentWidth + padding.left + padding.right;

    // Build output lines
    const outputLines: string[] = [];

    // Top border with optional title
    outputLines.push(
      this.buildTopBorder(
        chars,
        innerWidth,
        parsed.title,
        parsed.titleAlignment,
        theme,
        context.renderMode
      )
    );

    // Top padding
    for (let i = 0; i < padding.top; i++) {
      outputLines.push(this.buildEmptyLine(chars, innerWidth, theme));
    }

    // Content lines
    for (const line of contentLines) {
      outputLines.push(
        this.buildContentLine(
          chars,
          line,
          contentWidth,
          padding,
          parsed.textAlignment,
          theme
        )
      );
    }

    // Bottom padding
    for (let i = 0; i < padding.bottom; i++) {
      outputLines.push(this.buildEmptyLine(chars, innerWidth, theme));
    }

    // Bottom border
    outputLines.push(this.buildBottomBorder(chars, innerWidth, theme));

    const output = outputLines.join("\n");
    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }

  /**
   * Normalize padding to object with all sides.
   */
  private normalizePadding(padding: Padding): NormalizedPadding {
    if (typeof padding === "number") {
      return { top: padding, right: padding, bottom: padding, left: padding };
    }
    // After schema parsing with .default(0), all fields are guaranteed to be numbers
    return {
      top: padding.top,
      right: padding.right,
      bottom: padding.bottom,
      left: padding.left,
    };
  }

  /**
   * Build the top border with optional title.
   */
  private buildTopBorder(
    chars: BorderChars,
    innerWidth: number,
    title: string | undefined,
    titleAlignment: Alignment,
    theme: TuiTheme | undefined,
    renderMode: RenderMode
  ): string {
    if (!title) {
      const border =
        chars.topLeft + chars.top.repeat(innerWidth) + chars.topRight;
      return colorBorder(border, theme);
    }

    const titleWithSpace = ` ${title} `;
    // In markdown mode, use visual width (formatting chars like ** and _ are invisible when rendered)
    const titleWidth =
      renderMode === "markdown"
        ? getMarkdownRenderedWidth(titleWithSpace)
        : getStringWidth(titleWithSpace);

    // If title is too long, truncate
    if (titleWidth > innerWidth) {
      const truncatedTitle = titleWithSpace.slice(0, innerWidth - 1) + "…";
      return (
        colorBorder(chars.topLeft, theme) +
        colorTitle(truncatedTitle, theme) +
        colorBorder(chars.topRight, theme)
      );
    }

    const remainingWidth = innerWidth - titleWidth;

    switch (titleAlignment) {
      case "center": {
        const leftPad = Math.floor(remainingWidth / 2);
        const rightPad = remainingWidth - leftPad;
        return (
          colorBorder(chars.topLeft + chars.top.repeat(leftPad), theme) +
          colorTitle(titleWithSpace, theme) +
          colorBorder(chars.top.repeat(rightPad) + chars.topRight, theme)
        );
      }
      case "right": {
        return (
          colorBorder(chars.topLeft + chars.top.repeat(remainingWidth), theme) +
          colorTitle(titleWithSpace, theme) +
          colorBorder(chars.topRight, theme)
        );
      }
      case "left":
      default: {
        return (
          colorBorder(chars.topLeft, theme) +
          colorTitle(titleWithSpace, theme) +
          colorBorder(chars.top.repeat(remainingWidth) + chars.topRight, theme)
        );
      }
    }
  }

  /**
   * Build an empty line (for padding).
   */
  private buildEmptyLine(
    chars: BorderChars,
    innerWidth: number,
    theme: TuiTheme | undefined
  ): string {
    return (
      colorBorder(chars.left, theme) +
      " ".repeat(innerWidth) +
      colorBorder(chars.right, theme)
    );
  }

  /**
   * Build a content line with padding and alignment.
   */
  private buildContentLine(
    chars: BorderChars,
    content: string,
    contentWidth: number,
    padding: NormalizedPadding,
    textAlignment: Alignment,
    theme: TuiTheme | undefined
  ): string {
    // Pad/align content within content area
    const alignedContent = padToWidth(content, contentWidth, {
      align: textAlignment,
    });

    // Add horizontal padding
    const leftPad = " ".repeat(padding.left);
    const rightPad = " ".repeat(padding.right);

    return (
      colorBorder(chars.left, theme) +
      leftPad +
      alignedContent +
      rightPad +
      colorBorder(chars.right, theme)
    );
  }

  /**
   * Build the bottom border.
   */
  private buildBottomBorder(
    chars: BorderChars,
    innerWidth: number,
    theme: TuiTheme | undefined
  ): string {
    const border =
      chars.bottomLeft + chars.bottom.repeat(innerWidth) + chars.bottomRight;
    return colorBorder(border, theme);
  }
}

/**
 * Factory function to create a box component.
 */
export function createBox(): BoxComponent {
  return new BoxComponent();
}

// Register with global registry
registry.register(createBox);

export { BoxComponent };

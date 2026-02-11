import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiTheme,
  getStringWidth,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  keyValueInputSchema,
  type KeyValueInput,
  type KeyValueInputWithDefaults,
  type SeparatorStyle,
} from "./schema.js";

/**
 * Get separator string for the given style.
 */
function getSeparator(style: SeparatorStyle): string {
  switch (style) {
    case "colon":
      return ":";
    case "equals":
      return "=";
    case "arrow":
      return "→";
    case "dots":
      return "...";
    case "none":
      return "";
  }
}

/**
 * Apply color to keys.
 */
function colorKey(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.header(text);
}

/**
 * Apply color to separators.
 */
function colorSeparator(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.secondary(text);
}

/**
 * KeyValue component for rendering labeled data pairs.
 */
class KeyValueComponent extends BaseTuiComponent<
  KeyValueInput,
  typeof keyValueInputSchema
> {
  readonly metadata: ComponentMetadata<KeyValueInput> = {
    name: "keyvalue",
    description: "Renders key-value pairs in an aligned format",
    version: "0.1.0",
    examples: [
      {
        name: "basic",
        description: "Simple key-value pairs",
        input: {
          pairs: [
            { key: "Name", value: "John Doe" },
            { key: "Email", value: "john@example.com" },
            { key: "Age", value: 30 },
          ],
        },
      },
      {
        name: "equals-separator",
        description: "Using equals sign as separator",
        input: {
          pairs: [
            { key: "HOST", value: "localhost" },
            { key: "PORT", value: 8080 },
            { key: "DEBUG", value: true },
          ],
          separator: "equals",
        },
      },
      {
        name: "arrow-separator",
        description: "Using arrow as separator",
        input: {
          pairs: [
            { key: "Input", value: "data.json" },
            { key: "Output", value: "results.csv" },
          ],
          separator: "arrow",
        },
      },
      {
        name: "dots-separator",
        description: "Using dots as separator (config file style)",
        input: {
          pairs: [
            { key: "Version", value: "1.0.0" },
            { key: "Build", value: 12345 },
            { key: "Status", value: "stable" },
          ],
          separator: "dots",
        },
      },
      {
        name: "no-alignment",
        description: "Without key alignment",
        input: {
          pairs: [
            { key: "Short", value: "value" },
            { key: "A much longer key", value: "another value" },
          ],
          alignKeys: false,
        },
      },
    ],
  };

  readonly schema = keyValueInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: KeyValueInput, context: RenderContext): RenderResult {
    // Parse and apply defaults
    const parsed: KeyValueInputWithDefaults = this.schema.parse(input);
    const separator = getSeparator(parsed.separator);
    const gap = " ".repeat(parsed.gap);
    const theme = context.theme;

    // Calculate max key width for alignment
    let maxKeyWidth = parsed.minKeyWidth ?? 0;
    if (parsed.alignKeys) {
      for (const pair of parsed.pairs) {
        const keyWidth = getStringWidth(pair.key);
        if (keyWidth > maxKeyWidth) {
          maxKeyWidth = keyWidth;
        }
      }
    }

    const lines: string[] = [];

    for (const pair of parsed.pairs) {
      const keyWidth = getStringWidth(pair.key);
      const padding = parsed.alignKeys
        ? " ".repeat(Math.max(0, maxKeyWidth - keyWidth))
        : "";

      // Format value as string
      const valueStr = String(pair.value);

      // Build the line with colored key and separator
      const coloredKey = colorKey(pair.key, theme);
      if (separator) {
        const coloredSep = colorSeparator(separator, theme);
        lines.push(`${coloredKey}${padding}${coloredSep}${gap}${valueStr}`);
      } else {
        lines.push(`${coloredKey}${padding}${gap}${valueStr}`);
      }
    }

    const output = lines.join("\n");
    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a keyvalue component.
 */
export function createKeyValue(): KeyValueComponent {
  return new KeyValueComponent();
}

// Register with global registry
registry.register(createKeyValue);

export { KeyValueComponent };

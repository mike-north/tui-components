import { describe, it, expect, beforeAll } from "vitest";
import {
  createSparkline,
  HEIGHT_BLOCKS,
  type SparklineInput,
} from "../src/index.js";
import {
  getMarkdownRenderedWidth,
  DEFAULT_ANCHOR,
  createStyleFunctions,
  type RenderContext,
} from "@tuicomponents/core";

describe("SparklineComponent", () => {
  let sparkline: ReturnType<typeof createSparkline>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  const markdownContext: RenderContext = {
    ...defaultContext,
    renderMode: "markdown",
    style: createStyleFunctions("markdown"),
  };

  beforeAll(() => {
    sparkline = createSparkline();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(sparkline.metadata.name).toBe("sparkline");
    });

    it("should have examples", () => {
      expect(sparkline.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support both ansi and markdown modes", () => {
      expect(sparkline.metadata.supportedModes).toContain("ansi");
      expect(sparkline.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("basic functionality", () => {
    it("should render ascending values with increasing blocks", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5, 6, 7, 8],
      };

      const result = sparkline.render(input, defaultContext);

      // Should have increasing blocks from lowest to highest
      expect(result.output).toBe("▁▂▃▄▅▆▇█");
      expect(result.lineCount).toBe(1);
    });

    it("should render descending values with decreasing blocks", () => {
      const input: SparklineInput = {
        values: [8, 7, 6, 5, 4, 3, 2, 1],
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.output).toBe("█▇▆▅▄▃▂▁");
    });

    it("should render label prefix correctly", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5],
        label: "CPU: ",
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.output).toContain("CPU: ");
      expect(result.output).toMatch(/^CPU: /);
    });

    it("should render single value as middle block", () => {
      const input: SparklineInput = {
        values: [42],
      };

      const result = sparkline.render(input, defaultContext);

      // Single value should use middle block (index 4)
      expect(result.output).toBe(HEIGHT_BLOCKS[4]);
    });

    it("should render all same values as same block", () => {
      const input: SparklineInput = {
        values: [5, 5, 5, 5, 5],
      };

      const result = sparkline.render(input, defaultContext);

      // All values equal should produce identical middle blocks
      const middleBlock = HEIGHT_BLOCKS[4];
      expect(result.output).toBe(middleBlock.repeat(5));
    });
  });

  describe("edge cases", () => {
    it("should handle negative values", () => {
      const input: SparklineInput = {
        values: [-10, -5, 0, 5, 10],
      };

      const result = sparkline.render(input, defaultContext);

      // Should scale from -10 to 10, producing increasing blocks
      expect(result.output).toContain(HEIGHT_BLOCKS[0]); // -10 (min)
      expect(result.output).toContain(HEIGHT_BLOCKS[7]); // 10 (max)
      expect(result.lineCount).toBe(1);
    });

    it("should handle very large numbers", () => {
      const input: SparklineInput = {
        values: [1e9, 2e9, 3e9, 4e9, 5e9],
      };

      const result = sparkline.render(input, defaultContext);

      // Should produce increasing blocks regardless of magnitude
      expect(result.output.length).toBe(5);
      expect(result.lineCount).toBe(1);
    });

    it("should handle decimal values", () => {
      const input: SparklineInput = {
        values: [0.1, 0.3, 0.5, 0.7, 0.9],
      };

      const result = sparkline.render(input, defaultContext);

      // Should produce increasing blocks
      expect(result.output.length).toBe(5);
    });

    it("should handle very small differences", () => {
      const input: SparklineInput = {
        values: [1.001, 1.002, 1.003, 1.004, 1.005],
      };

      const result = sparkline.render(input, defaultContext);

      // Should still show variation despite tiny differences
      expect(result.output.length).toBe(5);
    });

    it("should handle mixed positive and negative values", () => {
      const input: SparklineInput = {
        values: [-100, -50, 0, 50, 100],
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.output.length).toBe(5);
      expect(result.lineCount).toBe(1);
    });

    it("should handle zero values", () => {
      const input: SparklineInput = {
        values: [0, 0, 0, 1, 0],
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.output.length).toBe(5);
    });
  });

  describe("width compression", () => {
    it("should compress data when width < values.length", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        width: 6,
      };

      const result = sparkline.render(input, defaultContext);

      // Output should be exactly 6 blocks (no label)
      expect(result.output.length).toBe(6);
    });

    it("should not pad when width > values.length", () => {
      const input: SparklineInput = {
        values: [1, 2, 3],
        width: 10,
      };

      const result = sparkline.render(input, defaultContext);

      // Should not pad, just use original values
      expect(result.output.length).toBe(3);
    });

    it("should bucket values correctly during compression", () => {
      // 8 values compressed to 4 should average pairs
      const input: SparklineInput = {
        values: [1, 1, 3, 3, 5, 5, 7, 7], // pairs that should average
        width: 4,
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.output.length).toBe(4);
    });
  });

  describe("explicit min/max", () => {
    it("should scale values to explicit range", () => {
      const input: SparklineInput = {
        values: [50, 60, 70, 80, 90],
        min: 0,
        max: 100,
      };

      const result = sparkline.render(input, defaultContext);

      // 50 is halfway, should be around middle block
      // 90 is 90% of the way, should be near max
      expect(result.output.length).toBe(5);
    });

    it("should clamp values outside explicit range", () => {
      const input: SparklineInput = {
        values: [-10, 50, 150], // -10 and 150 are outside 0-100
        min: 0,
        max: 100,
      };

      const result = sparkline.render(input, defaultContext);

      // First value should be clamped to min (lowest block)
      // Last value should be clamped to max (highest block)
      expect(result.output[0]).toBe(HEIGHT_BLOCKS[0]);
      expect(result.output[2]).toBe(HEIGHT_BLOCKS[7]);
    });

    it("should handle explicit min only", () => {
      const input: SparklineInput = {
        values: [50, 60, 70, 80, 90],
        min: 0,
      };

      const result = sparkline.render(input, defaultContext);

      // Should scale from 0 to 90 (actual max)
      expect(result.output.length).toBe(5);
    });

    it("should handle explicit max only", () => {
      const input: SparklineInput = {
        values: [50, 60, 70, 80, 90],
        max: 100,
      };

      const result = sparkline.render(input, defaultContext);

      // Should scale from 50 (actual min) to 100
      expect(result.output.length).toBe(5);
    });
  });

  describe("markdown mode", () => {
    it("should prepend anchor character in markdown mode", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5],
      };

      const result = sparkline.render(input, markdownContext);

      expect(result.output.startsWith(DEFAULT_ANCHOR)).toBe(true);
    });

    it("should apply secondary styling to blocks in markdown mode", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5],
      };

      const ansiResult = sparkline.render(input, defaultContext);
      const markdownResult = sparkline.render(input, markdownContext);

      // ANSI mode should have plain blocks without backticks
      expect(ansiResult.output).not.toContain("`");

      // Markdown mode should have blocks wrapped in backticks via style.secondary()
      expect(markdownResult.output).toContain("`");

      // Both should contain the same underlying block characters
      const blocks = "▁▃▅▇█";
      expect(ansiResult.output).toContain(blocks);
      expect(markdownResult.output).toContain(blocks);
    });

    it("should report correct visual width using getMarkdownRenderedWidth", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5],
        label: "Test: ",
      };

      const result = sparkline.render(input, markdownContext);

      // Visual width should be anchor + label + styled blocks
      // inlineCode() adds a leading space for alignment compensation,
      // so visual width = anchor (1) + label (6) + space (1) + blocks (5) = 13
      const expectedWidth = DEFAULT_ANCHOR.length + "Test: ".length + 1 + 5;
      expect(getMarkdownRenderedWidth(result.output)).toBe(expectedWidth);
    });

    it("should render label correctly in markdown mode", () => {
      const input: SparklineInput = {
        values: [1, 2, 3],
        label: "CPU: ",
      };

      const result = sparkline.render(input, markdownContext);

      expect(result.output).toContain("CPU: ");
      expect(result.output.startsWith(DEFAULT_ANCHOR)).toBe(true);
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: SparklineInput = {
        values: [1, 2, 3],
      };

      expect(() => sparkline.schema.parse(input)).not.toThrow();
    });

    it("should accept all optional fields", () => {
      const input: SparklineInput = {
        values: [1, 2, 3],
        width: 2,
        min: 0,
        max: 10,
        label: "Test: ",
      };

      expect(() => sparkline.schema.parse(input)).not.toThrow();
    });

    it("should reject empty values array", () => {
      const input = {
        values: [],
      };

      expect(() => sparkline.schema.parse(input)).toThrow();
    });

    it("should reject missing values", () => {
      const input = {};

      expect(() => sparkline.schema.parse(input)).toThrow();
    });

    it("should reject non-numeric values", () => {
      const input = {
        values: ["a", "b", "c"],
      };

      expect(() => sparkline.schema.parse(input)).toThrow();
    });

    it("should reject negative width", () => {
      const input = {
        values: [1, 2, 3],
        width: -5,
      };

      expect(() => sparkline.schema.parse(input)).toThrow();
    });

    it("should reject zero width", () => {
      const input = {
        values: [1, 2, 3],
        width: 0,
      };

      expect(() => sparkline.schema.parse(input)).toThrow();
    });

    it("should reject non-integer width", () => {
      const input = {
        values: [1, 2, 3],
        width: 2.5,
      };

      expect(() => sparkline.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = sparkline.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });

    it("should include values property in schema", () => {
      const schema = sparkline.getJsonSchema() as Record<string, unknown>;

      // The schema structure may vary - check for properties either at top level
      // or within definitions
      const hasValuesAtTopLevel =
        schema.properties &&
        typeof schema.properties === "object" &&
        "values" in (schema.properties as object);

      const hasValuesInDef =
        schema.$ref &&
        schema.definitions &&
        typeof schema.definitions === "object";

      expect(hasValuesAtTopLevel || hasValuesInDef).toBe(true);
    });
  });

  describe("actualWidth", () => {
    it("should report correct width without label", () => {
      const input: SparklineInput = {
        values: [1, 2, 3, 4, 5],
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.actualWidth).toBe(5);
    });

    it("should report correct width with label", () => {
      const input: SparklineInput = {
        values: [1, 2, 3],
        label: "CPU: ", // 5 characters
      };

      const result = sparkline.render(input, defaultContext);

      expect(result.actualWidth).toBe(5 + 3); // label + 3 blocks
    });

    it("should report correct width in markdown mode", () => {
      const input: SparklineInput = {
        values: [1, 2, 3],
        label: "CPU: ",
      };

      const result = sparkline.render(input, markdownContext);

      // actualWidth uses getStringWidth which counts raw characters including backticks
      // Output: anchor (1) + label (5) + space (1) + backtick (1) + blocks (3) + backtick (1) = 12
      expect(result.actualWidth).toBe(1 + 5 + 1 + 1 + 3 + 1);
    });
  });
});

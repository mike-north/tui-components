import { describe, it, expect, beforeAll } from "vitest";
import {
  createHorizontalLayout,
  type HorizontalLayoutInput,
} from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("HorizontalLayoutComponent", () => {
  let layout: ReturnType<typeof createHorizontalLayout>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    layout = createHorizontalLayout();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(layout.metadata.name).toBe("horizontal-layout");
    });

    it("should have examples", () => {
      expect(layout.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support ansi and markdown modes", () => {
      expect(layout.metadata.supportedModes).toContain("ansi");
      expect(layout.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("render - basic side by side", () => {
    it("should arrange two items side by side", () => {
      const input: HorizontalLayoutInput = {
        items: ["Left", "Right"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("Left Right");
      expect(result.lineCount).toBe(1);
    });

    it("should arrange three items side by side", () => {
      const input: HorizontalLayoutInput = {
        items: ["One", "Two", "Three"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("One Two Three");
      expect(result.lineCount).toBe(1);
    });

    it("should handle single item", () => {
      const input: HorizontalLayoutInput = {
        items: ["Single"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("Single");
      expect(result.lineCount).toBe(1);
    });
  });

  describe("render - gaps", () => {
    it("should use default gap of 1", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B"],
        minItemWidth: 1, // Use minimum to see natural widths
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("A B");
    });

    it("should respect custom gap", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B"],
        gap: 3,
        minItemWidth: 1,
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("A   B");
    });

    it("should handle zero gap", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B"],
        gap: 0,
        minItemWidth: 1,
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("AB");
    });

    it("should pad items to minItemWidth", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B"],
        gap: 1,
        minItemWidth: 3, // Default
      };

      const result = layout.render(input, defaultContext);

      // "A" padded to 3, gap 1, "B" padded to 3 = "A   B  " (7 chars)
      expect(result.output).toBe("A   B  ");
    });
  });

  describe("render - width modes", () => {
    it("should distribute equal widths", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B"],
        widthMode: "equal",
        width: 11, // 5 + 1 gap + 5
        gap: 1,
      };

      const result = layout.render(input, defaultContext);

      // Each item gets 5 columns
      expect(result.output).toBe("A     B    ");
    });

    it("should use auto widths by default", () => {
      const input: HorizontalLayoutInput = {
        items: ["Short", "Longer"],
      };

      const result = layout.render(input, defaultContext);

      // Items use their natural width
      expect(result.output).toBe("Short Longer");
    });

    it("should handle manual widths with fill", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B", "C"],
        widthMode: "manual",
        widths: [5, "fill", 5],
        width: 20, // 5 + 1 + 8 + 1 + 5 = 20 (fill gets 8)
        gap: 1,
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // First item padded to 5, middle fills to 8, last padded to 5
      expect(lines[0]?.length).toBe(20);
    });

    it("should handle manual widths with auto", () => {
      const input: HorizontalLayoutInput = {
        items: ["Hello", "X", "World"],
        widthMode: "manual",
        widths: ["auto", 10, "auto"],
        gap: 1,
      };

      const result = layout.render(input, defaultContext);

      // "Hello" (5) + gap + "X" (padded to 10) + gap + "World" (5)
      expect(result.output).toContain("Hello");
      expect(result.output).toContain("World");
    });
  });

  describe("render - vertical alignment", () => {
    it("should top-align by default", () => {
      const input: HorizontalLayoutInput = {
        items: ["Single", "Line1\nLine2\nLine3"],
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // First item should be on the first line
      expect(lines[0]).toContain("Single");
      expect(lines[0]).toContain("Line1");
      expect(result.lineCount).toBe(3);
    });

    it("should bottom-align items", () => {
      const input: HorizontalLayoutInput = {
        items: ["Single", "Line1\nLine2\nLine3"],
        verticalAlign: "bottom",
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // First item should be on the last line (bottom aligned)
      expect(lines[2]).toContain("Single");
      expect(lines[2]).toContain("Line3");
    });

    it("should middle-align items", () => {
      const input: HorizontalLayoutInput = {
        items: ["Single", "Line1\nLine2\nLine3"],
        verticalAlign: "middle",
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // First item should be in the middle line
      expect(lines[1]).toContain("Single");
      expect(lines[1]).toContain("Line2");
    });
  });

  describe("render - overflow behavior", () => {
    it("should truncate items when they overflow", () => {
      const input: HorizontalLayoutInput = {
        items: ["Very long first item", "Very long second item"],
        width: 20,
        overflow: "truncate",
      };

      const result = layout.render(input, defaultContext);

      // Should fit within width
      expect(result.actualWidth).toBe(20);
    });

    it("should stack items when overflow is stack", () => {
      const input: HorizontalLayoutInput = {
        items: ["Very long first item here", "Very long second item here"],
        width: 20,
        overflow: "stack",
      };

      const result = layout.render(input, defaultContext);

      // Should be stacked vertically
      expect(result.lineCount).toBe(2);
      expect(result.output).toContain("Very long first item here");
      expect(result.output).toContain("Very long second item here");
    });
  });

  describe("render - multi-line items", () => {
    it("should handle multi-line items side by side", () => {
      const input: HorizontalLayoutInput = {
        items: ["A\nB", "1\n2"],
        gap: 1,
        minItemWidth: 1,
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      expect(lines.length).toBe(2);
      expect(lines[0]).toBe("A 1");
      expect(lines[1]).toBe("B 2");
    });

    it("should pad shorter items", () => {
      const input: HorizontalLayoutInput = {
        items: ["Short", "Line1\nLine2"],
        gap: 1,
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      expect(lines.length).toBe(2);
      // First item should be padded on second line
      expect(lines[0]).toContain("Short");
      expect(lines[1]).toContain("Line2");
    });
  });

  describe("render - markdown mode", () => {
    it("should render in markdown mode with anchors", () => {
      const input: HorizontalLayoutInput = {
        items: ["Left", "Right"],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = layout.render(input, markdownContext);

      // Should contain anchor characters
      expect(result.output).toContain("│");
    });
  });

  describe("render - actualWidth", () => {
    it("should return correct width for side-by-side items", () => {
      const input: HorizontalLayoutInput = {
        items: ["Left", "Right"],
        gap: 1,
      };

      const result = layout.render(input, defaultContext);

      // "Left" (4) + gap (1) + "Right" (5) = 10
      expect(result.actualWidth).toBe(10);
    });

    it("should return specified width when set", () => {
      const input: HorizontalLayoutInput = {
        items: ["A", "B"],
        width: 20,
      };

      const result = layout.render(input, defaultContext);

      expect(result.actualWidth).toBe(20);
    });
  });

  describe("schema validation", () => {
    it("should validate correct input", () => {
      const input = {
        items: ["Item 1", "Item 2"],
      };

      expect(() => layout.schema.parse(input)).not.toThrow();
    });

    it("should apply defaults", () => {
      const input = {
        items: ["Item"],
      };

      const parsed = layout.schema.parse(input);

      expect(parsed.gap).toBe(1);
      expect(parsed.widthMode).toBe("auto");
      expect(parsed.verticalAlign).toBe("top");
      expect(parsed.overflow).toBe("truncate");
      expect(parsed.minItemWidth).toBe(3);
    });

    it("should reject empty items array", () => {
      const input = {
        items: [],
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });

    it("should reject negative gap", () => {
      const input = {
        items: ["Item"],
        gap: -1,
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });

    it("should reject non-positive width", () => {
      const input = {
        items: ["Item"],
        width: 0,
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });

    it("should reject invalid widthMode", () => {
      const input = {
        items: ["Item"],
        widthMode: "invalid",
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });

    it("should reject invalid verticalAlign", () => {
      const input = {
        items: ["Item"],
        verticalAlign: "invalid",
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });

    it("should reject invalid overflow", () => {
      const input = {
        items: ["Item"],
        overflow: "invalid",
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });

    it("should accept valid width specs", () => {
      const input = {
        items: ["A", "B", "C"],
        widthMode: "manual",
        widths: [10, "fill", "auto"],
      };

      expect(() => layout.schema.parse(input)).not.toThrow();
    });

    it("should reject invalid width specs", () => {
      const input = {
        items: ["A", "B"],
        widthMode: "manual",
        widths: [10, "invalid"],
      };

      expect(() => layout.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = layout.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("render - all examples", () => {
    it("should render all examples without errors", () => {
      for (const example of layout.metadata.examples) {
        expect(() => {
          layout.render(example.input, defaultContext);
        }).not.toThrow();
      }
    });
  });
});

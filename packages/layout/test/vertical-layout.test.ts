import { describe, it, expect, beforeAll } from "vitest";
import {
  createVerticalLayout,
  type VerticalLayoutInput,
} from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("VerticalLayoutComponent", () => {
  let layout: ReturnType<typeof createVerticalLayout>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    layout = createVerticalLayout();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(layout.metadata.name).toBe("vertical-layout");
    });

    it("should have examples", () => {
      expect(layout.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support ansi and markdown modes", () => {
      expect(layout.metadata.supportedModes).toContain("ansi");
      expect(layout.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("render - basic stacking", () => {
    it("should stack two items vertically", () => {
      const input: VerticalLayoutInput = {
        items: ["First", "Second"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("First\nSecond");
      expect(result.lineCount).toBe(2);
    });

    it("should stack three items vertically", () => {
      const input: VerticalLayoutInput = {
        items: ["One", "Two", "Three"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("One\nTwo\nThree");
      expect(result.lineCount).toBe(3);
    });

    it("should handle single item", () => {
      const input: VerticalLayoutInput = {
        items: ["Single item"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("Single item");
      expect(result.lineCount).toBe(1);
    });
  });

  describe("render - gaps", () => {
    it("should add gap between items", () => {
      const input: VerticalLayoutInput = {
        items: ["First", "Second"],
        gap: 1,
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("First\n\nSecond");
      expect(result.lineCount).toBe(3);
    });

    it("should add multiple gap lines", () => {
      const input: VerticalLayoutInput = {
        items: ["First", "Second"],
        gap: 2,
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("First\n\n\nSecond");
      expect(result.lineCount).toBe(4);
    });

    it("should not add gap after last item", () => {
      const input: VerticalLayoutInput = {
        items: ["First", "Second", "Third"],
        gap: 1,
      };

      const result = layout.render(input, defaultContext);

      const lines = result.output.split("\n");
      expect(lines[lines.length - 1]).toBe("Third");
    });
  });

  describe("render - alignment", () => {
    it("should left-align by default", () => {
      const input: VerticalLayoutInput = {
        items: ["Short", "Longer item"],
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // Shorter item should not have padding
      expect(lines[0]).toBe("Short");
    });

    it("should center-align items", () => {
      const input: VerticalLayoutInput = {
        items: ["A", "BBB"],
        align: "center",
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // "A" should be centered within width of "BBB" (3)
      // Padding: 2 chars, left pad = 1
      expect(lines[0]).toBe(" A");
      expect(lines[1]).toBe("BBB");
    });

    it("should right-align items", () => {
      const input: VerticalLayoutInput = {
        items: ["A", "BBB"],
        align: "right",
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // "A" should be right-aligned within width of "BBB" (3)
      expect(lines[0]).toBe("  A");
      expect(lines[1]).toBe("BBB");
    });

    it("should align to specified width", () => {
      const input: VerticalLayoutInput = {
        items: ["A", "BB"],
        align: "right",
        width: 5,
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      expect(lines[0]).toBe("    A");
      expect(lines[1]).toBe("   BB");
    });
  });

  describe("render - multi-line items", () => {
    it("should handle items with multiple lines", () => {
      const input: VerticalLayoutInput = {
        items: ["Line1\nLine2", "Single"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("Line1\nLine2\nSingle");
      expect(result.lineCount).toBe(3);
    });

    it("should handle gap with multi-line items", () => {
      const input: VerticalLayoutInput = {
        items: ["A\nB", "C\nD"],
        gap: 1,
      };

      const result = layout.render(input, defaultContext);

      expect(result.output).toBe("A\nB\n\nC\nD");
      expect(result.lineCount).toBe(5);
    });

    it("should align multi-line items correctly", () => {
      const input: VerticalLayoutInput = {
        items: ["AB\nA", "CCC"],
        align: "center",
      };

      const result = layout.render(input, defaultContext);
      const lines = result.output.split("\n");

      // Width is 3 (from "CCC")
      // "AB" (width 2) should have 0.5 left pad, floored = 0
      // "A" (width 1) should have 1 left pad
      expect(lines[0]).toBe("AB");
      expect(lines[1]).toBe(" A");
      expect(lines[2]).toBe("CCC");
    });
  });

  describe("render - markdown mode", () => {
    it("should render in markdown mode with anchors", () => {
      const input: VerticalLayoutInput = {
        items: ["First", "Second"],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = layout.render(input, markdownContext);

      // Should contain anchor characters
      expect(result.output).toContain("│");
    });

    it("should anchor gap lines in markdown mode", () => {
      const input: VerticalLayoutInput = {
        items: ["First", "Second"],
        gap: 1,
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = layout.render(input, markdownContext);
      const lines = result.output.split("\n");

      // Gap line should also have anchor
      expect(lines[1]).toContain("│");
    });
  });

  describe("render - actualWidth", () => {
    it("should return width of widest item", () => {
      const input: VerticalLayoutInput = {
        items: ["Short", "Longer item", "Mid"],
      };

      const result = layout.render(input, defaultContext);

      expect(result.actualWidth).toBe(11); // "Longer item".length
    });

    it("should return specified width when larger", () => {
      const input: VerticalLayoutInput = {
        items: ["A", "BB"],
        width: 10,
      };

      const result = layout.render(input, defaultContext);

      expect(result.actualWidth).toBe(10);
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

      expect(parsed.gap).toBe(0);
      expect(parsed.align).toBe("left");
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

    it("should reject invalid align value", () => {
      const input = {
        items: ["Item"],
        align: "invalid",
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

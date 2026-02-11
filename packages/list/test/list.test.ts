import { describe, it, expect, beforeAll } from "vitest";
import { createList, type ListInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("ListComponent", () => {
  let list: ReturnType<typeof createList>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    list = createList();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(list.metadata.name).toBe("list");
    });

    it("should have examples", () => {
      expect(list.metadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe("render", () => {
    it("should render a simple bullet list", () => {
      const input: ListInput = {
        items: [{ text: "First" }, { text: "Second" }, { text: "Third" }],
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("• First");
      expect(result.output).toContain("• Second");
      expect(result.output).toContain("• Third");
      expect(result.lineCount).toBe(3);
    });

    it("should render with dash style", () => {
      const input: ListInput = {
        items: [{ text: "Item 1" }, { text: "Item 2" }],
        style: "dash",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("- Item 1");
      expect(result.output).toContain("- Item 2");
    });

    it("should render with arrow style", () => {
      const input: ListInput = {
        items: [{ text: "Feature A" }, { text: "Feature B" }],
        style: "arrow",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("→ Feature A");
      expect(result.output).toContain("→ Feature B");
    });

    it("should render with star style", () => {
      const input: ListInput = {
        items: [{ text: "Important" }],
        style: "star",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("★ Important");
    });

    it("should render numbered list", () => {
      const input: ListInput = {
        items: [{ text: "Step one" }, { text: "Step two" }, { text: "Step three" }],
        style: "numbered",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("1. Step one");
      expect(result.output).toContain("2. Step two");
      expect(result.output).toContain("3. Step three");
    });

    it("should render numbered list with custom start", () => {
      const input: ListInput = {
        items: [{ text: "Item" }, { text: "Item" }],
        style: "numbered",
        start: 5,
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("5. Item");
      expect(result.output).toContain("6. Item");
    });

    it("should render lettered list", () => {
      const input: ListInput = {
        items: [{ text: "Option A" }, { text: "Option B" }, { text: "Option C" }],
        style: "lettered",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("a. Option A");
      expect(result.output).toContain("b. Option B");
      expect(result.output).toContain("c. Option C");
    });

    it("should render roman numeral list", () => {
      const input: ListInput = {
        items: [
          { text: "Chapter One" },
          { text: "Chapter Two" },
          { text: "Chapter Three" },
        ],
        style: "roman",
      };

      const result = list.render(input, defaultContext);

      // Markers are padded to align with the longest (iii.)
      expect(result.output).toContain("i.");
      expect(result.output).toContain("Chapter One");
      expect(result.output).toContain("ii.");
      expect(result.output).toContain("Chapter Two");
      expect(result.output).toContain("iii.");
      expect(result.output).toContain("Chapter Three");
    });

    it("should render nested lists", () => {
      const input: ListInput = {
        items: [
          {
            text: "Parent",
            items: [{ text: "Child 1" }, { text: "Child 2" }],
          },
          { text: "Another parent" },
        ],
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("• Parent");
      expect(result.output).toContain("• Child 1");
      expect(result.output).toContain("• Child 2");
      expect(result.output).toContain("• Another parent");
      expect(result.lineCount).toBe(4);
    });

    it("should render deeply nested lists", () => {
      const input: ListInput = {
        items: [
          {
            text: "Level 1",
            items: [
              {
                text: "Level 2",
                items: [{ text: "Level 3" }],
              },
            ],
          },
        ],
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("Level 1");
      expect(result.output).toContain("Level 2");
      expect(result.output).toContain("Level 3");
      expect(result.lineCount).toBe(3);
    });

    it("should render with none style (no markers)", () => {
      const input: ListInput = {
        items: [{ text: "Item 1" }, { text: "Item 2" }],
        style: "none",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toBe("Item 1\nItem 2");
    });

    it("should handle empty items array", () => {
      const input: ListInput = {
        items: [],
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toBe("");
      expect(result.lineCount).toBe(1); // Empty string splits to one empty line
    });

    it("should align numbered list items", () => {
      const input: ListInput = {
        items: Array.from({ length: 12 }, (_, i) => ({ text: `Item ${i + 1}` })),
        style: "numbered",
      };

      const result = list.render(input, defaultContext);
      const lines = result.output.split("\n");

      // Single digit numbers should be padded to align with double digits
      expect(lines[0]).toMatch(/^1\.\s+Item 1$/);
      expect(lines[9]).toMatch(/^10\.\s*Item 10$/);
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: ListInput = {
        items: [{ text: "test" }],
      };

      expect(() => list.schema.parse(input)).not.toThrow();
    });

    it("should apply default values", () => {
      const input: ListInput = {
        items: [{ text: "test" }],
      };

      const parsed = list.schema.parse(input);

      expect(parsed.style).toBe("bullet");
      expect(parsed.indent).toBe(2);
      expect(parsed.start).toBe(1);
    });

    it("should reject invalid style", () => {
      const input = {
        items: [{ text: "test" }],
        style: "invalid",
      };

      expect(() => list.schema.parse(input)).toThrow();
    });

    it("should reject missing items", () => {
      const input = {};

      expect(() => list.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = list.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });
});

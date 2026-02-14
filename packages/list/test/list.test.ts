import { describe, it, expect, beforeAll } from "vitest";
import {
  createList,
  isTaskItem,
  isDefinitionItem,
  isStandardItem,
  type ListInput,
} from "../src/index.js";
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
        items: [
          { text: "Step one" },
          { text: "Step two" },
          { text: "Step three" },
        ],
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
        items: [
          { text: "Option A" },
          { text: "Option B" },
          { text: "Option C" },
        ],
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
        items: Array.from({ length: 12 }, (_, i) => ({
          text: `Item ${i + 1}`,
        })),
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

  describe("task lists", () => {
    it("should render task list with checked items", () => {
      const input: ListInput = {
        items: [
          { text: "Complete task", checked: true },
          { text: "Pending task", checked: false },
        ],
        style: "task",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("[x]");
      expect(result.output).toContain("Complete task");
      expect(result.output).toContain("[ ]");
      expect(result.output).toContain("Pending task");
      expect(result.lineCount).toBe(2);
    });

    it("should render task list with partial items", () => {
      const input: ListInput = {
        items: [{ text: "Partial task", checked: "partial" }],
        style: "task",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("[~]");
      expect(result.output).toContain("Partial task");
    });

    it("should render mixed checked states", () => {
      const input: ListInput = {
        items: [
          { text: "Done", checked: true },
          { text: "In progress", checked: "partial" },
          { text: "Not started", checked: false },
        ],
        style: "task",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("[x]");
      expect(result.output).toContain("[~]");
      expect(result.output).toContain("[ ]");
      expect(result.lineCount).toBe(3);
    });

    it("should handle empty task list", () => {
      const input: ListInput = {
        items: [],
        style: "task",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toBe("");
    });
  });

  describe("definition lists", () => {
    it("should render definition list with aligned terms", () => {
      const input: ListInput = {
        items: [
          { term: "API", definition: "Application Programming Interface" },
          { term: "CLI", definition: "Command Line Interface" },
        ],
        style: "definition",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("API");
      expect(result.output).toContain("Application Programming Interface");
      expect(result.output).toContain("CLI");
      expect(result.output).toContain("Command Line Interface");
      expect(result.lineCount).toBe(2);
    });

    it("should auto-calculate term width from longest term", () => {
      const input: ListInput = {
        items: [
          { term: "A", definition: "Short term" },
          { term: "Longer", definition: "Longer term" },
        ],
        style: "definition",
      };

      const result = list.render(input, defaultContext);

      // Terms should be padded to align definitions
      // The definition of "A" should start at the same column as "Longer"
      const lines = result.output.split("\n");
      // Both lines should have definitions starting after the term width + separator
      expect(lines[0]).toMatch(/A\s+Short term/);
      expect(lines[1]).toMatch(/Longer\s+Longer term/);
    });

    it("should use explicit termWidth when provided", () => {
      const input: ListInput = {
        items: [
          { term: "API", definition: "Application Programming Interface" },
        ],
        style: "definition",
        termWidth: 10,
      };

      const result = list.render(input, defaultContext);

      // Term should be padded to 10 characters
      expect(result.output).toContain("API");
    });

    it("should handle empty definition list", () => {
      const input: ListInput = {
        items: [],
        style: "definition",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toBe("");
    });

    it("should filter non-definition items in definition style", () => {
      const input: ListInput = {
        items: [
          { term: "Term1", definition: "Definition1" },
          { text: "This is not a definition" } as unknown as {
            term: string;
            definition: string;
          },
          { term: "Term2", definition: "Definition2" },
        ],
        style: "definition",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("Term1");
      expect(result.output).toContain("Term2");
      expect(result.output).not.toContain("This is not a definition");
      expect(result.lineCount).toBe(2);
    });
  });

  describe("type guards", () => {
    it("should correctly identify task items", () => {
      expect(isTaskItem({ text: "Task", checked: true })).toBe(true);
      expect(isTaskItem({ text: "Task", checked: false })).toBe(true);
      expect(isTaskItem({ text: "Task", checked: "partial" })).toBe(true);
      expect(isTaskItem({ text: "Not a task" })).toBe(false);
      expect(isTaskItem({ term: "Term", definition: "Def" })).toBe(false);
    });

    it("should correctly identify definition items", () => {
      expect(isDefinitionItem({ term: "Term", definition: "Def" })).toBe(true);
      expect(isDefinitionItem({ text: "Not a definition" })).toBe(false);
      expect(isDefinitionItem({ text: "Task", checked: true })).toBe(false);
    });

    it("should correctly identify standard items", () => {
      expect(isStandardItem({ text: "Standard item" })).toBe(true);
      expect(isStandardItem({ text: "With nested", items: [] })).toBe(true);
      expect(isStandardItem({ text: "Task", checked: true })).toBe(false);
      expect(isStandardItem({ term: "Term", definition: "Def" })).toBe(false);
    });
  });

  describe("fallback rendering for mismatched item types", () => {
    it("should render TaskItem with bullet style using item.text", () => {
      const input: ListInput = {
        items: [
          { text: "Task item in bullet list", checked: true },
          { text: "Standard item" },
        ],
        style: "bullet",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("•");
      expect(result.output).toContain("Task item in bullet list");
      expect(result.output).toContain("Standard item");
      expect(result.output).not.toContain("[x]");
      expect(result.lineCount).toBe(2);
    });

    it("should render DefinitionItem with bullet style as term: definition", () => {
      const input: ListInput = {
        items: [
          { term: "API", definition: "Application Programming Interface" },
          { text: "Standard item" },
        ],
        style: "bullet",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("•");
      expect(result.output).toContain("API: Application Programming Interface");
      expect(result.output).toContain("Standard item");
      expect(result.lineCount).toBe(2);
    });

    it("should render TaskItem with numbered style", () => {
      const input: ListInput = {
        items: [
          { text: "First task", checked: false },
          { text: "Second task", checked: true },
        ],
        style: "numbered",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("1.");
      expect(result.output).toContain("2.");
      expect(result.output).toContain("First task");
      expect(result.output).toContain("Second task");
      expect(result.output).not.toContain("[");
      expect(result.lineCount).toBe(2);
    });

    it("should render standard items as unchecked when task style", () => {
      const input: ListInput = {
        items: [{ text: "Standard item treated as task" }],
        style: "task",
      };

      const result = list.render(input, defaultContext);

      expect(result.output).toContain("[ ]");
      expect(result.output).toContain("Standard item treated as task");
    });
  });
});

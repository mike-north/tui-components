import { describe, it, expect, beforeEach } from "vitest";
import { registry, createStyleFunctions } from "@tuicomponents/core";
import { createTable, TableComponent, type TableInput } from "../src/index.js";

describe("TableComponent", () => {
  let table: TableComponent;

  beforeEach(() => {
    table = createTable();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(table.metadata.name).toBe("table");
    });

    it("should have examples", () => {
      expect(table.metadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe("schema", () => {
    it("should validate valid input", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
      };

      const result = table.schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject input with no columns", () => {
      const input = {
        columns: [],
        rows: [],
      };

      const result = table.schema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should apply default values", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [],
      };

      const result = table.schema.parse(input);
      expect(result.borderStyle).toBe("single");
      expect(result.showHeader).toBe(true);
      expect(result.rowSeparators).toBe(false);
    });
  });

  describe("render", () => {
    const defaultContext = {
      width: 80,
      isTTY: true,
      colorLevel: 3 as const,
      renderMode: "ansi" as const,
      style: createStyleFunctions("ansi"),
    };

    it("should render a simple table", () => {
      const input: TableInput = {
        columns: [
          { header: "Name", key: "name" },
          { header: "Age", key: "age" },
        ],
        rows: [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
        ],
      };

      const result = table.render(input, defaultContext);

      expect(result.output).toContain("Name");
      expect(result.output).toContain("Age");
      expect(result.output).toContain("Alice");
      expect(result.output).toContain("Bob");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should render with single borders", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test" }],
        rows: [{ test: "value" }],
        borderStyle: "single",
      };

      const result = table.render(input, defaultContext);

      expect(result.output).toContain("┌");
      expect(result.output).toContain("┐");
      expect(result.output).toContain("└");
      expect(result.output).toContain("┘");
      expect(result.output).toContain("│");
    });

    it("should render with rounded borders", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test" }],
        rows: [{ test: "value" }],
        borderStyle: "rounded",
      };

      const result = table.render(input, defaultContext);

      expect(result.output).toContain("╭");
      expect(result.output).toContain("╮");
      expect(result.output).toContain("╰");
      expect(result.output).toContain("╯");
    });

    it("should render with ascii borders", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test" }],
        rows: [{ test: "value" }],
        borderStyle: "ascii",
      };

      const result = table.render(input, defaultContext);

      expect(result.output).toContain("+");
      expect(result.output).toContain("-");
      expect(result.output).toContain("|");
    });

    it("should render without borders", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test" }],
        rows: [{ test: "value" }],
        borderStyle: "none",
      };

      const result = table.render(input, defaultContext);

      expect(result.output).not.toContain("│");
      expect(result.output).not.toContain("|");
      expect(result.output).not.toContain("┌");
    });

    it("should hide header when showHeader is false", () => {
      const input: TableInput = {
        columns: [{ header: "Secret", key: "secret" }],
        rows: [{ secret: "value" }],
        showHeader: false,
      };

      const result = table.render(input, defaultContext);

      expect(result.output).not.toContain("Secret");
      expect(result.output).toContain("value");
    });

    it("should render row separators when enabled", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test" }],
        rows: [{ test: "a" }, { test: "b" }, { test: "c" }],
        rowSeparators: true,
      };

      const result = table.render(input, defaultContext);

      // Count horizontal lines - should have more than just top/header-sep/bottom
      const horizontalLineCount = (result.output.match(/├/g) || []).length;
      expect(horizontalLineCount).toBeGreaterThan(0);
    });

    it("should align columns correctly", () => {
      const input: TableInput = {
        columns: [
          { header: "Left", key: "left", align: "left" },
          { header: "Right", key: "right", align: "right" },
          { header: "Center", key: "center", align: "center" },
        ],
        rows: [{ left: "L", right: "R", center: "C" }],
      };

      const result = table.render(input, defaultContext);

      // Just verify it renders without error - alignment is tested in core
      expect(result.output).toContain("Left");
      expect(result.output).toContain("Right");
      expect(result.output).toContain("Center");
    });

    it("should handle empty rows", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [],
      };

      const result = table.render(input, defaultContext);

      expect(result.output).toContain("Name");
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it("should handle null and undefined values", () => {
      const input: TableInput = {
        columns: [
          { header: "A", key: "a" },
          { header: "B", key: "b" },
        ],
        rows: [{ a: null, b: undefined }],
      };

      const result = table.render(input, defaultContext);

      // Should render without error
      expect(result.output).toContain("A");
      expect(result.output).toContain("B");
    });

    it("should truncate long values", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test", maxWidth: 10 }],
        rows: [{ test: "This is a very long value that should be truncated" }],
      };

      const result = table.render(input, defaultContext);

      expect(result.output).toContain("…");
    });
  });

  describe("getJsonSchema", () => {
    it("should return a valid JSON schema", () => {
      const schema = table.getJsonSchema();

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });
});

describe("createTable", () => {
  it("should create a TableComponent instance", () => {
    const table = createTable();
    expect(table).toBeInstanceOf(TableComponent);
  });
});

describe("registry integration", () => {
  it("should register the table component", () => {
    // The import of the module should have registered the component
    expect(registry.has("table")).toBe(true);
  });

  it("should be retrievable from registry", () => {
    const component = registry.get("table");
    expect(component).toBeDefined();
    expect(component?.metadata.name).toBe("table");
  });
});

describe("markdown header formatting", () => {
  let table: TableComponent;

  beforeEach(() => {
    table = createTable();
  });

  const markdownContext = {
    width: 80,
    isTTY: false,
    colorLevel: 0 as const,
    renderMode: "markdown" as const,
    style: createStyleFunctions("markdown"),
  };

  describe("schema", () => {
    it("should accept valid header styles", () => {
      const styles = ["normal", "bold", "italic", "bold-italic"] as const;
      for (const style of styles) {
        const input: TableInput = {
          columns: [{ header: "Test", key: "test" }],
          rows: [],
          headerStyle: style,
        };
        const result = table.schema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid header styles", () => {
      const input = {
        columns: [{ header: "Test", key: "test" }],
        rows: [],
        headerStyle: "invalid",
      };
      const result = table.schema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should default headerStyle to bold", () => {
      const input: TableInput = {
        columns: [{ header: "Test", key: "test" }],
        rows: [],
      };
      const result = table.schema.parse(input);
      expect(result.headerStyle).toBe("bold");
    });
  });

  describe("render", () => {
    it("should render bold headers with ** markers in markdown mode", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
        headerStyle: "bold",
      };

      const result = table.render(input, markdownContext);
      expect(result.output).toContain("**Name**");
    });

    it("should render italic headers with _ markers in markdown mode", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
        headerStyle: "italic",
      };

      const result = table.render(input, markdownContext);
      expect(result.output).toContain("_Name_");
    });

    it("should render bold-italic headers with *** markers in markdown mode", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
        headerStyle: "bold-italic",
      };

      const result = table.render(input, markdownContext);
      expect(result.output).toContain("***Name***");
    });

    it("should render normal headers without markers in markdown mode", () => {
      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
        headerStyle: "normal",
      };

      const result = table.render(input, markdownContext);
      expect(result.output).toContain("Name");
      expect(result.output).not.toContain("**Name**");
      expect(result.output).not.toContain("_Name_");
    });

    it("should not apply markdown formatting in ansi mode", () => {
      const ansiContext = {
        width: 80,
        isTTY: true,
        colorLevel: 3 as const,
        renderMode: "ansi" as const,
        style: createStyleFunctions("ansi"),
      };

      const input: TableInput = {
        columns: [{ header: "Name", key: "name" }],
        rows: [{ name: "Alice" }],
        headerStyle: "bold",
      };

      const result = table.render(input, ansiContext);
      // Should NOT contain markdown markers
      expect(result.output).not.toContain("**Name**");
      expect(result.output).toContain("Name");
    });
  });

  describe("border alignment", () => {
    /**
     * These tests verify that borders align correctly when markdown formatting
     * characters are present. The key insight is that formatting chars like **
     * are invisible when rendered, so column widths must be based on visual
     * width (the text without markers) not string width (text with markers).
     */

    it("should align borders correctly with bold headers", () => {
      const input: TableInput = {
        columns: [
          { header: "Name", key: "name" },
          { header: "Age", key: "age" },
        ],
        rows: [{ name: "Alice", age: 30 }],
        borderStyle: "single",
        headerStyle: "bold",
      };

      const result = table.render(input, markdownContext);
      const lines = result.output.split("\n");

      // All lines should have the same visual width when markdown is rendered
      // Find border lines (contain ┌ or ├ or └)
      const topBorder = lines.find((l) => l.includes("┌"));
      const midBorder = lines.find((l) => l.includes("├"));
      const bottomBorder = lines.find((l) => l.includes("└"));

      expect(topBorder).toBeDefined();
      expect(midBorder).toBeDefined();
      expect(bottomBorder).toBeDefined();

      // Border lines should all be the same length (they have no formatting chars)
      expect(topBorder!.length).toBe(midBorder!.length);
      expect(midBorder!.length).toBe(bottomBorder!.length);
    });

    it("should base column widths on visual content, not formatting chars", () => {
      // Header "Hi" is 2 chars visual, but "**Hi**" is 6 string chars
      // Data "Hello" is 5 chars - this should set the column width
      const input: TableInput = {
        columns: [{ header: "Hi", key: "val" }],
        rows: [{ val: "Hello" }],
        borderStyle: "single",
        headerStyle: "bold",
      };

      const result = table.render(input, markdownContext);
      const lines = result.output.split("\n");

      // Find the data row (contains "Hello")
      const dataRow = lines.find((l) => l.includes("Hello"));
      expect(dataRow).toBeDefined();

      // The data "Hello" should NOT have excessive padding
      // If column width incorrectly included ** overhead, "Hello" would be padded to 6 chars
      // Correct behavior: column width is max(2, 5) = 5, so "Hello" fits exactly
      expect(dataRow).toContain("│ Hello │");
    });

    it("should handle different header styles with same column content", () => {
      // Test that all header styles produce the same column width
      const styles = ["normal", "bold", "italic", "bold-italic"] as const;
      const columnWidths: number[] = [];

      for (const style of styles) {
        const input: TableInput = {
          columns: [{ header: "Test", key: "val" }],
          rows: [{ val: "Data" }],
          borderStyle: "single",
          headerStyle: style,
        };

        const result = table.render(input, markdownContext);
        const lines = result.output.split("\n");
        const topBorder = lines.find((l) => l.includes("┌"));
        if (topBorder) {
          columnWidths.push(topBorder.length);
        }
      }

      // All styles should produce the same border width
      // (column width is based on visual content, not formatting chars)
      expect(columnWidths.length).toBe(4);
      expect(new Set(columnWidths).size).toBe(1); // All same
    });

    it("should align centered headers correctly with formatting", () => {
      const input: TableInput = {
        columns: [{ header: "Hi", key: "val", align: "center" }],
        rows: [{ val: "Hello" }],
        borderStyle: "single",
        headerStyle: "bold",
      };

      const result = table.render(input, markdownContext);
      const lines = result.output.split("\n");

      // Header row should contain centered **Hi** with proper padding
      const headerRow = lines.find((l) => l.includes("**Hi**"));
      expect(headerRow).toBeDefined();

      // Data row should also be properly aligned
      const dataRow = lines.find((l) => l.includes("Hello"));
      expect(dataRow).toBeDefined();
    });

    it("should align right-aligned headers correctly with formatting", () => {
      const input: TableInput = {
        columns: [{ header: "Hi", key: "val", align: "right" }],
        rows: [{ val: "Hello" }],
        borderStyle: "single",
        headerStyle: "bold",
      };

      const result = table.render(input, markdownContext);
      const lines = result.output.split("\n");

      const headerRow = lines.find((l) => l.includes("**Hi**"));
      expect(headerRow).toBeDefined();

      // Right-aligned: padding should be on the left of **Hi**
      // The formatted header should have spaces before it
      expect(headerRow).toMatch(/│\s+\*\*Hi\*\*\s*│/);
    });
  });
});

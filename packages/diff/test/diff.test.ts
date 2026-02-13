import { describe, it, expect, beforeAll } from "vitest";
import { createDiff, type DiffInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("DiffComponent", () => {
  let diff: ReturnType<typeof createDiff>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    diff = createDiff();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(diff.metadata.name).toBe("diff");
    });

    it("should have examples", () => {
      expect(diff.metadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe("render", () => {
    it("should render simple diff with symbol markers", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              { type: "context", content: "line1" },
              { type: "deletion", content: "old line" },
              { type: "addition", content: "new line" },
              { type: "context", content: "line4" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain(" line1");
      expect(result.output).toContain("-old line");
      expect(result.output).toContain("+new line");
      expect(result.output).toContain(" line4");
      expect(result.lineCount).toBe(4);
    });

    it("should render file headers when provided", () => {
      const input: DiffInput = {
        oldFile: "a/file.txt",
        newFile: "b/file.txt",
        hunks: [
          {
            lines: [{ type: "context", content: "content" }],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("--- a/file.txt");
      expect(result.output).toContain("+++ b/file.txt");
    });

    it("should render hunk headers when enabled", () => {
      const input: DiffInput = {
        hunks: [
          {
            header: { oldStart: 1, oldCount: 3, newStart: 1, newCount: 4 },
            lines: [{ type: "context", content: "content" }],
          },
        ],
        showHunkHeaders: true,
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("@@ -1,3 +1,4 @@");
    });

    it("should hide hunk headers when disabled", () => {
      const input: DiffInput = {
        hunks: [
          {
            header: { oldStart: 1, oldCount: 3, newStart: 1, newCount: 4 },
            lines: [{ type: "context", content: "content" }],
          },
        ],
        showHunkHeaders: false,
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).not.toContain("@@");
    });

    it("should use word markers when specified", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              { type: "deletion", content: "old" },
              { type: "addition", content: "new" },
              { type: "context", content: "same" },
            ],
          },
        ],
        markerStyle: "word",
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("DEL old");
      expect(result.output).toContain("ADD new");
      expect(result.output).toContain("    same");
    });

    it("should omit markers when style is none", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              { type: "deletion", content: "old" },
              { type: "addition", content: "new" },
            ],
          },
        ],
        markerStyle: "none",
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).not.toContain("+");
      expect(result.output).not.toContain("-");
      expect(result.output).toContain("old");
      expect(result.output).toContain("new");
    });

    it("should show line numbers when enabled", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              {
                type: "context",
                content: "same",
                oldLineNumber: 10,
                newLineNumber: 10,
              },
              { type: "deletion", content: "old", oldLineNumber: 11 },
              { type: "addition", content: "new", newLineNumber: 11 },
            ],
          },
        ],
        showLineNumbers: true,
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("10 10");
      expect(result.output).toContain("11");
    });

    it("should render multiple hunks", () => {
      const input: DiffInput = {
        hunks: [
          {
            header: { oldStart: 1, oldCount: 2, newStart: 1, newCount: 2 },
            lines: [
              { type: "deletion", content: "hunk1-old" },
              { type: "addition", content: "hunk1-new" },
            ],
          },
          {
            header: { oldStart: 10, oldCount: 2, newStart: 10, newCount: 2 },
            lines: [
              { type: "deletion", content: "hunk2-old" },
              { type: "addition", content: "hunk2-new" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("@@ -1,2 +1,2 @@");
      expect(result.output).toContain("@@ -10,2 +10,2 @@");
      expect(result.output).toContain("hunk1-old");
      expect(result.output).toContain("hunk2-new");
    });

    it("should handle empty hunks array", () => {
      const input: DiffInput = {
        hunks: [],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toBe("");
      expect(result.lineCount).toBe(0);
    });

    it("should handle empty content lines", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              { type: "context", content: "" },
              { type: "addition", content: "" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain(" \n");
      expect(result.output).toContain("+");
      expect(result.lineCount).toBe(2);
    });

    it("should render only additions", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              { type: "addition", content: "new line 1" },
              { type: "addition", content: "new line 2" },
              { type: "addition", content: "new line 3" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("+new line 1");
      expect(result.output).toContain("+new line 2");
      expect(result.output).toContain("+new line 3");
      expect(result.output).not.toContain("-");
    });

    it("should render only deletions", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [
              { type: "deletion", content: "old line 1" },
              { type: "deletion", content: "old line 2" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("-old line 1");
      expect(result.output).toContain("-old line 2");
      expect(result.output).not.toContain("+");
    });

    it("should handle hunks without headers", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [{ type: "context", content: "no header above" }],
          },
        ],
        showHunkHeaders: true,
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).not.toContain("@@");
      expect(result.output).toContain("no header above");
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
      };

      expect(() => diff.schema.parse(input)).not.toThrow();
    });

    it("should apply default values", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
      };

      const parsed = diff.schema.parse(input);

      expect(parsed.showLineNumbers).toBe(false);
      expect(parsed.markerStyle).toBe("symbol");
      expect(parsed.showHunkHeaders).toBe(true);
    });

    it("should reject invalid line type", () => {
      const input = {
        hunks: [
          {
            lines: [{ type: "invalid", content: "test" }],
          },
        ],
      };

      expect(() => diff.schema.parse(input)).toThrow();
    });

    it("should reject invalid marker style", () => {
      const input = {
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
        markerStyle: "invalid",
      };

      expect(() => diff.schema.parse(input)).toThrow();
    });

    it("should reject missing hunks", () => {
      const input = {};

      expect(() => diff.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = diff.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("displayStyle: gutter", () => {
    it("should render with gutter style", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        showLineNumbers: true,
        hunks: [
          {
            lines: [
              {
                type: "context",
                content: "same line",
                oldLineNumber: 10,
                newLineNumber: 10,
              },
              { type: "deletion", content: "old", oldLineNumber: 11 },
              { type: "addition", content: "new", newLineNumber: 11 },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // Should contain line numbers
      expect(result.output).toContain("10");
      expect(result.output).toContain("11");
      // Should contain indicators
      expect(result.output).toContain("+");
      expect(result.output).toContain("-");
      expect(result.output).toContain("same line");
      expect(result.output).toContain("old");
      expect(result.output).toContain("new");
    });

    it("should render gutter style without line numbers", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        showLineNumbers: false,
        hunks: [
          {
            lines: [
              { type: "context", content: "same" },
              { type: "deletion", content: "removed" },
              { type: "addition", content: "added" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // Should still have indicators
      expect(result.output).toContain("-");
      expect(result.output).toContain("+");
      expect(result.output).toContain("same");
      expect(result.output).toContain("removed");
      expect(result.output).toContain("added");
    });

    it("should render gutter style with hunk headers", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        showHunkHeaders: true,
        hunks: [
          {
            header: { oldStart: 5, oldCount: 3, newStart: 5, newCount: 3 },
            lines: [{ type: "context", content: "content" }],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      expect(result.output).toContain("@@ -5,3 +5,3 @@");
    });
  });

  describe("backgroundMode: line", () => {
    it("should apply full-width background with gutter style", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        backgroundMode: "line",
        showLineNumbers: true,
        hunks: [
          {
            lines: [
              {
                type: "context",
                content: "unchanged",
                oldLineNumber: 1,
                newLineNumber: 1,
              },
              { type: "deletion", content: "removed line", oldLineNumber: 2 },
              { type: "addition", content: "added line", newLineNumber: 2 },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // Output should contain the content
      expect(result.output).toContain("unchanged");
      expect(result.output).toContain("removed line");
      expect(result.output).toContain("added line");
      // With backgroundMode: line, lines should be padded
      expect(result.lineCount).toBe(3);
    });

    it("should work with backgroundMode: none (default)", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        backgroundMode: "none",
        hunks: [
          {
            lines: [
              { type: "deletion", content: "old" },
              { type: "addition", content: "new" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // Should render without padding
      expect(result.output).toContain("old");
      expect(result.output).toContain("new");
    });

    it("should respect backgroundMode in inline style as well", () => {
      const input: DiffInput = {
        displayStyle: "inline",
        backgroundMode: "none",
        hunks: [
          {
            lines: [
              { type: "deletion", content: "old" },
              { type: "addition", content: "new" },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // Inline style should still work
      expect(result.output).toContain("-old");
      expect(result.output).toContain("+new");
    });
  });

  describe("schema defaults for new options", () => {
    it("should default displayStyle to inline", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
      };

      const parsed = diff.schema.parse(input);

      expect(parsed.displayStyle).toBe("inline");
    });

    it("should default backgroundMode to none", () => {
      const input: DiffInput = {
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
      };

      const parsed = diff.schema.parse(input);

      expect(parsed.backgroundMode).toBe("none");
    });

    it("should reject invalid displayStyle", () => {
      const input = {
        displayStyle: "invalid",
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
      };

      expect(() => diff.schema.parse(input)).toThrow();
    });

    it("should reject invalid backgroundMode", () => {
      const input = {
        backgroundMode: "invalid",
        hunks: [
          {
            lines: [{ type: "context", content: "test" }],
          },
        ],
      };

      expect(() => diff.schema.parse(input)).toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle missing theme gracefully", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        backgroundMode: "line",
        showLineNumbers: true,
        hunks: [
          {
            lines: [
              { type: "addition", content: "new line", newLineNumber: 1 },
            ],
          },
        ],
      };

      // Render without theme
      const contextWithoutTheme: RenderContext = {
        ...defaultContext,
        theme: undefined,
      };

      const result = diff.render(input, contextWithoutTheme);

      // Should render without colors, but still have content
      expect(result.output).toContain("new line");
      expect(result.output).toContain("1");
    });

    it("should handle narrow terminal width", () => {
      const narrowContext: RenderContext = {
        ...defaultContext,
        width: 20,
      };

      const input: DiffInput = {
        displayStyle: "gutter",
        backgroundMode: "line",
        showLineNumbers: true,
        hunks: [
          {
            lines: [{ type: "addition", content: "short", newLineNumber: 1 }],
          },
        ],
      };

      expect(() => diff.render(input, narrowContext)).not.toThrow();
    });

    it("should handle all features combined", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        backgroundMode: "line",
        showLineNumbers: true,
        showHunkHeaders: true,
        oldFile: "old.txt",
        newFile: "new.txt",
        hunks: [
          {
            header: { oldStart: 1, oldCount: 3, newStart: 1, newCount: 3 },
            lines: [
              {
                type: "context",
                content: "unchanged",
                oldLineNumber: 1,
                newLineNumber: 1,
              },
              { type: "deletion", content: "old", oldLineNumber: 2 },
              { type: "addition", content: "new", newLineNumber: 2 },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // Verify all features are present
      expect(result.output).toContain("--- old.txt");
      expect(result.output).toContain("+++ new.txt");
      expect(result.output).toContain("@@ -1,3 +1,3 @@");
      expect(result.output).toContain("1");
      expect(result.output).toContain("2");
      expect(result.output).toContain("unchanged");
      expect(result.output).toContain("old");
      expect(result.output).toContain("new");
    });

    it("should prefer newLineNumber over oldLineNumber in gutter mode", () => {
      const input: DiffInput = {
        displayStyle: "gutter",
        showLineNumbers: true,
        hunks: [
          {
            lines: [
              // Context has both - gutter shows the number
              {
                type: "context",
                content: "ctx",
                oldLineNumber: 5,
                newLineNumber: 10,
              },
              // Deletion has only old - shows old
              { type: "deletion", content: "del", oldLineNumber: 6 },
              // Addition has only new - shows new
              { type: "addition", content: "add", newLineNumber: 11 },
            ],
          },
        ],
      };

      const result = diff.render(input, defaultContext);

      // newLineNumber is preferred for context, so should see 10 not 5
      expect(result.output).toContain("10");
      expect(result.output).toContain("6");
      expect(result.output).toContain("11");
      // oldLineNumber 5 should NOT appear since newLineNumber 10 is preferred
      expect(result.output).not.toContain("5");
    });
  });
});

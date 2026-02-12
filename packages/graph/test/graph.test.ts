import { describe, it, expect, beforeAll } from "vitest";
import { createGraph, type GraphInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("GraphComponent", () => {
  let graph: ReturnType<typeof createGraph>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    graph = createGraph();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(graph.metadata.name).toBe("graph");
    });

    it("should have examples", () => {
      expect(graph.metadata.examples.length).toBeGreaterThan(0);
    });

    it("should support ansi and markdown modes", () => {
      expect(graph.metadata.supportedModes).toContain("ansi");
      expect(graph.metadata.supportedModes).toContain("markdown");
    });
  });

  describe("render - linear history", () => {
    it("should render a simple linear history", () => {
      const input: GraphInput = {
        nodes: [
          { id: "c", label: "third commit" },
          { id: "b", label: "second commit", parents: ["c"] },
          { id: "a", label: "first commit", parents: ["b"] },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("third commit");
      expect(result.output).toContain("second commit");
      expect(result.output).toContain("first commit");
      expect(result.output).toContain("●");
      expect(result.lineCount).toBeGreaterThanOrEqual(3);
    });

    it("should render with ASCII style", () => {
      const input: GraphInput = {
        nodes: [
          { id: "b", label: "second" },
          { id: "a", label: "first", parents: ["b"] },
        ],
        style: "ascii",
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("*");
      expect(result.output).not.toContain("●");
    });

    it("should render refs when showRefs is true", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "commit", refs: ["main", "HEAD"] }],
        showRefs: true,
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("main");
      expect(result.output).toContain("HEAD");
    });

    it("should hide refs when showRefs is false", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "commit", refs: ["main", "HEAD"] }],
        showRefs: false,
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).not.toContain("main");
      expect(result.output).not.toContain("HEAD");
    });
  });

  describe("render - branching", () => {
    it("should render a simple branch", () => {
      const input: GraphInput = {
        nodes: [
          { id: "c", label: "on main" },
          { id: "b", label: "on branch", parents: ["a"] },
          { id: "a", label: "branch point", parents: ["c"] },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("on main");
      expect(result.output).toContain("on branch");
      expect(result.output).toContain("branch point");
    });

    it("should render multiple concurrent branches", () => {
      const input: GraphInput = {
        nodes: [
          { id: "d", label: "branch 1", parents: ["a"] },
          { id: "c", label: "branch 2", parents: ["a"] },
          { id: "b", label: "branch 3", parents: ["a"] },
          { id: "a", label: "common ancestor" },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("branch 1");
      expect(result.output).toContain("branch 2");
      expect(result.output).toContain("branch 3");
      expect(result.output).toContain("common ancestor");
    });
  });

  describe("render - merging", () => {
    it("should render a merge commit (2 parents)", () => {
      const input: GraphInput = {
        nodes: [
          { id: "c", label: "Merge branch", parents: ["b", "a"] },
          { id: "b", label: "on feature" },
          { id: "a", label: "on main" },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("Merge branch");
      expect(result.output).toContain("on feature");
      expect(result.output).toContain("on main");
    });

    it("should render an octopus merge (3+ parents)", () => {
      const input: GraphInput = {
        nodes: [
          { id: "d", label: "Merge all", parents: ["c", "b", "a"] },
          { id: "c", label: "branch 1" },
          { id: "b", label: "branch 2" },
          { id: "a", label: "branch 3" },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("Merge all");
      expect(result.lineCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("render - edge cases", () => {
    it("should handle empty nodes array", () => {
      const input: GraphInput = {
        nodes: [],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toBe("");
      expect(result.lineCount).toBe(0);
    });

    it("should handle single node", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "only commit" }],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("only commit");
      expect(result.output).toContain("●");
    });

    it("should handle missing parent (treat as root)", () => {
      const input: GraphInput = {
        nodes: [
          { id: "b", label: "child", parents: ["nonexistent"] },
          { id: "a", label: "unrelated root" },
        ],
      };

      // Should not throw
      const result = graph.render(input, defaultContext);
      expect(result.output).toContain("child");
      expect(result.output).toContain("unrelated root");
    });

    it("should handle all disconnected roots", () => {
      const input: GraphInput = {
        nodes: [
          { id: "c", label: "root 1" },
          { id: "b", label: "root 2" },
          { id: "a", label: "root 3" },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("root 1");
      expect(result.output).toContain("root 2");
      expect(result.output).toContain("root 3");
    });

    it("should handle unicode in labels", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "feat: add 日本語 support 🎉" }],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("日本語");
    });

    it("should truncate long labels", () => {
      const longLabel = "a".repeat(100);
      const input: GraphInput = {
        nodes: [{ id: "a", label: longLabel }],
        labelWidth: 20,
      };

      const result = graph.render(input, defaultContext);

      // Should be truncated
      expect(result.output.length).toBeLessThan(100 + 20);
    });
  });

  describe("render - custom node characters", () => {
    it("should use global nodeChar for all nodes", () => {
      const input: GraphInput = {
        nodes: [
          { id: "b", label: "second" },
          { id: "a", label: "first", parents: ["b"] },
        ],
        nodeChar: "◆",
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("◆");
      expect(result.output).not.toContain("●");
    });

    it("should allow per-node nodeChar override", () => {
      const input: GraphInput = {
        nodes: [
          { id: "b", label: "special", nodeChar: "★" },
          { id: "a", label: "normal", parents: ["b"] },
        ],
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("★");
      expect(result.output).toContain("●");
    });

    it("should prefer per-node nodeChar over global nodeChar", () => {
      const input: GraphInput = {
        nodes: [
          { id: "b", label: "override", nodeChar: "★" },
          { id: "a", label: "global", parents: ["b"] },
        ],
        nodeChar: "◆",
      };

      const result = graph.render(input, defaultContext);

      expect(result.output).toContain("★"); // per-node override
      expect(result.output).toContain("◆"); // global default
      expect(result.output).not.toContain("●"); // not the style default
    });
  });

  describe("render - markdown mode", () => {
    it("should render in markdown mode without ANSI codes", () => {
      const input: GraphInput = {
        nodes: [
          { id: "b", label: "second" },
          { id: "a", label: "first", parents: ["b"] },
        ],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = graph.render(input, markdownContext);

      // Should contain anchor character
      expect(result.output).toContain("│");
      expect(result.output).toContain("second");
      expect(result.output).toContain("first");
    });

    it("should render highlighted nodes with inline code backticks in markdown", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "highlighted commit", highlight: true }],
      };

      const markdownContext: RenderContext = {
        ...defaultContext,
        renderMode: "markdown",
      };

      const result = graph.render(input, markdownContext);

      // Highlighted lines are wrapped in backticks for inline code styling
      expect(result.output).toContain("`");
      expect(result.output).toContain("highlighted commit");
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "test" }],
      };

      expect(() => graph.schema.parse(input)).not.toThrow();
    });

    it("should apply defaults", () => {
      const input = {
        nodes: [{ id: "a", label: "test" }],
      };

      const parsed = graph.schema.parse(input);

      expect(parsed.style).toBe("unicode");
      expect(parsed.labelWidth).toBe(50);
      expect(parsed.showRefs).toBe(true);
      expect(parsed.labelGap).toBe(1);
    });

    it("should reject invalid style", () => {
      const input = {
        nodes: [{ id: "a", label: "test" }],
        style: "invalid",
      };

      expect(() => graph.schema.parse(input)).toThrow();
    });

    it("should reject node without id", () => {
      const input = {
        nodes: [{ label: "test" }],
      };

      expect(() => graph.schema.parse(input)).toThrow();
    });

    it("should reject node without label", () => {
      const input = {
        nodes: [{ id: "a" }],
      };

      expect(() => graph.schema.parse(input)).toThrow();
    });

    it("should default parents to empty array", () => {
      const input = {
        nodes: [{ id: "a", label: "test" }],
      };

      const parsed = graph.schema.parse(input);

      expect(parsed.nodes[0]?.parents).toEqual([]);
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = graph.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("actualWidth", () => {
    it("should provide correct actualWidth for simple graph", () => {
      const input: GraphInput = {
        nodes: [{ id: "a", label: "short label" }],
      };

      const result = graph.render(input, defaultContext);

      expect(result.actualWidth).toBeGreaterThan(0);
    });
  });

  describe("regression tests", () => {
    describe("merge visualization", () => {
      it("should render horizontal connector between node and merge branch", () => {
        const input: GraphInput = {
          nodes: [
            { id: "a", label: "Merge commit", parents: ["b", "c"] },
            { id: "b", label: "Branch 1", parents: ["d"] },
            { id: "c", label: "Branch 2", parents: ["d"] },
            { id: "d", label: "Root" },
          ],
        };

        const result = graph.render(input, defaultContext);
        const lines = result.output.split("\n");

        // First line should have horizontal connector (─) between node and merge corner
        expect(lines[0]).toContain("─");
        expect(lines[0]).toContain("╮");
      });

      it("should render merge with ASCII style correctly", () => {
        const input: GraphInput = {
          nodes: [
            { id: "a", label: "Merge", parents: ["b", "c"] },
            { id: "b", label: "B", parents: ["d"] },
            { id: "c", label: "C", parents: ["d"] },
            { id: "d", label: "Root" },
          ],
          style: "ascii",
        };

        const result = graph.render(input, defaultContext);
        const lines = result.output.split("\n");

        // ASCII style uses - for horizontal and . for corner
        expect(lines[0]).toContain("-");
        expect(lines[0]).toContain(".");
      });

      it("should not show merge indicators for single-parent nodes", () => {
        const input: GraphInput = {
          nodes: [
            { id: "a", label: "Child", parents: ["b"] },
            { id: "b", label: "Parent" },
          ],
        };

        const result = graph.render(input, defaultContext);

        // Should not have merge corner or horizontal line
        expect(result.output).not.toContain("╮");
        expect(result.output).not.toContain("─");
      });
    });

    describe("highlight with inline code", () => {
      it("should wrap entire highlighted line in backticks in markdown mode", () => {
        const input: GraphInput = {
          nodes: [{ id: "a", label: "Highlighted", highlight: true }],
        };

        const markdownContext: RenderContext = {
          ...defaultContext,
          renderMode: "markdown",
        };

        const result = graph.render(input, markdownContext);

        // Should have backticks wrapping the line (format: `● Highlighted`)
        expect(result.output).toMatch(/`[^`]*Highlighted[^`]*`/);
      });

      it("should not use backticks for non-highlighted nodes in markdown mode", () => {
        const input: GraphInput = {
          nodes: [{ id: "a", label: "Normal" }],
        };

        const markdownContext: RenderContext = {
          ...defaultContext,
          renderMode: "markdown",
        };

        const result = graph.render(input, markdownContext);
        const lines = result.output.split("\n");

        // Line with "Normal" should not have backticks (except anchor)
        const normalLine = lines.find((l) => l.includes("Normal"));
        expect(normalLine).toBeDefined();
        // Count backticks - should only be anchor, not wrapping
        const backtickCount = (normalLine?.match(/`/g) || []).length;
        expect(backtickCount).toBe(0);
      });

      it("should preserve highlight with custom node characters", () => {
        const input: GraphInput = {
          nodes: [
            { id: "a", label: "Special", highlight: true, nodeChar: "★" },
          ],
        };

        const markdownContext: RenderContext = {
          ...defaultContext,
          renderMode: "markdown",
        };

        const result = graph.render(input, markdownContext);

        expect(result.output).toContain("★");
        expect(result.output).toContain("`");
      });
    });

    describe("custom node characters", () => {
      it("should validate nodeChar is exactly 1 character", () => {
        const validInput = {
          nodes: [{ id: "a", label: "test", nodeChar: "★" }],
        };
        expect(() => graph.schema.parse(validInput)).not.toThrow();

        const invalidInput = {
          nodes: [{ id: "a", label: "test", nodeChar: "**" }],
        };
        expect(() => graph.schema.parse(invalidInput)).toThrow();

        const emptyInput = {
          nodes: [{ id: "a", label: "test", nodeChar: "" }],
        };
        expect(() => graph.schema.parse(emptyInput)).toThrow();
      });

      it("should validate global nodeChar is exactly 1 character", () => {
        const validInput = {
          nodes: [{ id: "a", label: "test" }],
          nodeChar: "◆",
        };
        expect(() => graph.schema.parse(validInput)).not.toThrow();

        const invalidInput = {
          nodes: [{ id: "a", label: "test" }],
          nodeChar: "ab",
        };
        expect(() => graph.schema.parse(invalidInput)).toThrow();
      });

      it("should use custom characters in merge commits", () => {
        const input: GraphInput = {
          nodes: [
            { id: "a", label: "Merge", parents: ["b", "c"], nodeChar: "◉" },
            { id: "b", label: "B", parents: ["d"] },
            { id: "c", label: "C", parents: ["d"], nodeChar: "★" },
            { id: "d", label: "Root" },
          ],
          nodeChar: "◆",
        };

        const result = graph.render(input, defaultContext);

        expect(result.output).toContain("◉"); // merge commit
        expect(result.output).toContain("★"); // per-node override
        expect(result.output).toContain("◆"); // global default
        expect(result.output).not.toContain("●"); // not the style default
      });

      it("should work with ASCII style and custom global nodeChar", () => {
        const input: GraphInput = {
          nodes: [{ id: "a", label: "Test" }],
          style: "ascii",
          nodeChar: "#",
        };

        const result = graph.render(input, defaultContext);

        expect(result.output).toContain("#");
        expect(result.output).not.toContain("*"); // not ASCII default
      });
    });

    describe("combined features", () => {
      it("should handle highlight + custom nodeChar + merge + refs together", () => {
        const input: GraphInput = {
          nodes: [
            {
              id: "a",
              label: "Merge",
              parents: ["b", "c"],
              nodeChar: "◉",
              refs: ["main"],
            },
            {
              id: "b",
              label: "Feature",
              parents: ["d"],
              highlight: true,
              refs: ["HEAD"],
            },
            { id: "c", label: "Hotfix", parents: ["d"], nodeChar: "★" },
            { id: "d", label: "Initial" },
          ],
          nodeChar: "◆",
        };

        const markdownContext: RenderContext = {
          ...defaultContext,
          renderMode: "markdown",
        };

        const result = graph.render(input, markdownContext);

        // All custom chars present
        expect(result.output).toContain("◉");
        expect(result.output).toContain("★");
        expect(result.output).toContain("◆");

        // Refs present
        expect(result.output).toContain("main");
        expect(result.output).toContain("HEAD");

        // Merge connector present
        expect(result.output).toContain("─");
        expect(result.output).toContain("╮");

        // Highlight uses backticks
        const lines = result.output.split("\n");
        const highlightedLine = lines.find((l) => l.includes("Feature"));
        expect(highlightedLine).toContain("`");
      });
    });
  });
});

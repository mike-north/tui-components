import { describe, it, expect, beforeAll } from "vitest";
import { createTree, type TreeInput } from "../src/index.js";
import { createStyleFunctions, type RenderContext } from "@tuicomponents/core";

describe("TreeComponent", () => {
  let tree: ReturnType<typeof createTree>;
  const defaultContext: RenderContext = {
    width: 80,
    isTTY: true,
    colorLevel: 3,
    renderMode: "ansi",
    style: createStyleFunctions("ansi"),
  };

  beforeAll(() => {
    tree = createTree();
  });

  describe("metadata", () => {
    it("should have correct name", () => {
      expect(tree.metadata.name).toBe("tree");
    });

    it("should have examples", () => {
      expect(tree.metadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe("render", () => {
    it("should render a simple tree with unicode characters", () => {
      const input: TreeInput = {
        root: {
          label: "root",
          children: [{ label: "child1" }, { label: "child2" }],
        },
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("root");
      expect(result.output).toContain("├─ child1");
      expect(result.output).toContain("└─ child2");
    });

    it("should render nested children", () => {
      const input: TreeInput = {
        root: {
          label: "src",
          children: [
            {
              label: "components",
              children: [{ label: "Button.tsx" }, { label: "Input.tsx" }],
            },
            { label: "index.ts" },
          ],
        },
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("src");
      expect(result.output).toContain("components");
      expect(result.output).toContain("Button.tsx");
      expect(result.output).toContain("Input.tsx");
      expect(result.output).toContain("index.ts");
    });

    it("should render with ASCII style", () => {
      const input: TreeInput = {
        root: {
          label: "root",
          children: [{ label: "child1" }, { label: "child2" }],
        },
        style: "ascii",
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("|- child1");
      expect(result.output).toContain("`- child2");
    });

    it("should render with compact style", () => {
      const input: TreeInput = {
        root: {
          label: "root",
          children: [{ label: "child1" }, { label: "child2" }],
        },
        style: "compact",
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("+- child1");
      expect(result.output).toContain("+- child2");
    });

    it("should render multiple root nodes", () => {
      const input: TreeInput = {
        root: [
          { label: "Project A", children: [{ label: "file1.ts" }] },
          { label: "Project B", children: [{ label: "file2.ts" }] },
        ],
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("Project A");
      expect(result.output).toContain("file1.ts");
      expect(result.output).toContain("Project B");
      expect(result.output).toContain("file2.ts");
    });

    it("should hide root when showRoot is false", () => {
      const input: TreeInput = {
        root: {
          label: "hidden-root",
          children: [{ label: "visible-child" }],
        },
        showRoot: false,
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).not.toContain("hidden-root");
      expect(result.output).toContain("visible-child");
    });

    it("should handle collapsed nodes", () => {
      const input: TreeInput = {
        root: {
          label: "root",
          children: [
            {
              label: "collapsed",
              expanded: false,
              children: [{ label: "hidden" }],
            },
            { label: "visible" },
          ],
        },
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("collapsed");
      expect(result.output).not.toContain("hidden");
      expect(result.output).toContain("visible");
    });

    it("should handle empty children array", () => {
      const input: TreeInput = {
        root: {
          label: "root",
          children: [],
        },
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toBe("root");
      expect(result.lineCount).toBe(1);
    });

    it("should handle deeply nested trees", () => {
      const input: TreeInput = {
        root: {
          label: "L1",
          children: [
            {
              label: "L2",
              children: [
                {
                  label: "L3",
                  children: [
                    {
                      label: "L4",
                      children: [{ label: "L5" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const result = tree.render(input, defaultContext);

      expect(result.output).toContain("L1");
      expect(result.output).toContain("L5");
      expect(result.lineCount).toBe(5);
    });

    it("should provide correct actualWidth", () => {
      const input: TreeInput = {
        root: {
          label: "short",
          children: [{ label: "this-is-a-longer-label" }],
        },
      };

      const result = tree.render(input, defaultContext);

      // The longest line should be "└─ this-is-a-longer-label"
      expect(result.actualWidth).toBeGreaterThan(22);
    });
  });

  describe("schema", () => {
    it("should validate correct input", () => {
      const input: TreeInput = {
        root: { label: "test" },
      };

      expect(() => tree.schema.parse(input)).not.toThrow();
    });

    it("should reject input without label", () => {
      const input = {
        root: {},
      };

      expect(() => tree.schema.parse(input)).toThrow();
    });
  });

  describe("getJsonSchema", () => {
    it("should return valid JSON schema", () => {
      const schema = tree.getJsonSchema() as Record<string, unknown>;

      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });
});

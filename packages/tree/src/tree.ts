import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  type TuiTheme,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  treeInputSchema,
  type TreeInput,
  type TreeInputWithDefaults,
  type TreeNode,
} from "./schema.js";
import { getTreeChars, type TreeChars } from "./chars.js";

/**
 * Apply color to tree structure characters.
 */
function colorStructure(text: string, theme: TuiTheme | undefined): string {
  if (!theme) {
    return text;
  }
  return theme.semantic.border(text);
}

/**
 * Tree component for rendering hierarchical data.
 */
class TreeComponent extends BaseTuiComponent<
  TreeInput,
  typeof treeInputSchema
> {
  readonly metadata: ComponentMetadata<TreeInput> = {
    name: "tree",
    description: "Renders hierarchical data as an ASCII/Unicode tree",
    version: "0.1.0",
    examples: [
      {
        name: "basic",
        description: "Simple file tree",
        input: {
          root: {
            label: "src",
            children: [
              { label: "index.ts" },
              {
                label: "components",
                children: [{ label: "Button.tsx" }, { label: "Input.tsx" }],
              },
              { label: "utils.ts" },
            ],
          },
        },
      },
      {
        name: "multiple-roots",
        description: "Tree with multiple root nodes",
        input: {
          root: [
            {
              label: "Project A",
              children: [{ label: "README.md" }, { label: "package.json" }],
            },
            {
              label: "Project B",
              children: [{ label: "README.md" }, { label: "Cargo.toml" }],
            },
          ],
        },
      },
      {
        name: "ascii-style",
        description: "Tree with ASCII characters",
        input: {
          root: {
            label: "root",
            children: [
              { label: "child1" },
              { label: "child2", children: [{ label: "grandchild" }] },
            ],
          },
          style: "ascii",
        },
      },
    ],
  };

  readonly schema = treeInputSchema;

  /**
   * Override getJsonSchema to use a more direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: TreeInput, context: RenderContext): RenderResult {
    // Parse and apply defaults
    const parsed: TreeInputWithDefaults = this.schema.parse(input);
    const chars = getTreeChars(parsed.style);
    const theme = context.theme;

    const lines: string[] = [];

    // Normalize root to array and cast to TreeNode[]
    const roots: TreeNode[] = Array.isArray(parsed.root)
      ? (parsed.root as TreeNode[])
      : [parsed.root as TreeNode];

    // Render each root
    for (let i = 0; i < roots.length; i++) {
      const root: TreeNode | undefined = roots[i];
      if (!root) continue;
      const isLastRoot = i === roots.length - 1;

      if (parsed.showRoot) {
        lines.push(root.label);
        this.renderChildren(
          root.children ?? [],
          lines,
          "",
          chars,
          parsed.indent,
          theme
        );
      } else {
        // Skip root label, render children at top level
        const children: TreeNode[] = root.children ?? [];
        for (let j = 0; j < children.length; j++) {
          const child: TreeNode | undefined = children[j];
          if (!child) continue;
          const isLast = j === children.length - 1 && isLastRoot;
          this.renderNode(child, lines, "", isLast, chars, parsed.indent, theme);
        }
      }

      // Add empty line between roots (except after last)
      if (!isLastRoot && parsed.showRoot) {
        lines.push("");
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

  /**
   * Render a tree node and its children.
   */
  private renderNode(
    node: TreeNode,
    lines: string[],
    prefix: string,
    isLast: boolean,
    chars: TreeChars,
    indent: number,
    theme: TuiTheme | undefined
  ): void {
    // Choose connector based on position
    const connector = isLast
      ? chars.last + chars.horizontal.repeat(indent - 1) + " "
      : chars.branch + chars.horizontal.repeat(indent - 1) + " ";

    lines.push(prefix + colorStructure(connector, theme) + node.label);

    // Calculate prefix for children (colored structure)
    const childPrefix = isLast
      ? prefix + chars.space.repeat(indent + 1)
      : prefix + colorStructure(chars.vertical, theme) + chars.space.repeat(indent);

    // Render children if expanded
    if (node.expanded !== false && node.children) {
      this.renderChildren(node.children, lines, childPrefix, chars, indent, theme);
    }
  }

  /**
   * Render children of a node.
   */
  private renderChildren(
    children: TreeNode[],
    lines: string[],
    prefix: string,
    chars: TreeChars,
    indent: number,
    theme: TuiTheme | undefined
  ): void {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;
      const isLast = i === children.length - 1;
      this.renderNode(child, lines, prefix, isLast, chars, indent, theme);
    }
  }
}

/**
 * Factory function to create a tree component.
 */
export function createTree(): TreeComponent {
  return new TreeComponent();
}

// Register with global registry
registry.register(createTree);

export { TreeComponent };

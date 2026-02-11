import {
  BaseTuiComponent,
  type ComponentMetadata,
  type RenderContext,
  type RenderResult,
  measureLines,
  registry,
} from "@tuicomponents/core";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  graphInputSchema,
  type GraphInput,
} from "./schema.js";
import { getGraphChars } from "./chars.js";
import { computeGraphLayout } from "./layout.js";
import { renderGraphAnsi, renderGraphMarkdown } from "./renderers.js";

/**
 * Graph component for rendering DAG visualizations (git log style).
 */
class GraphComponent extends BaseTuiComponent<
  GraphInput,
  typeof graphInputSchema
> {
  readonly metadata: ComponentMetadata<GraphInput> = {
    name: "graph",
    description: "Renders DAG visualizations similar to git log --graph",
    version: "0.1.0",
    supportedModes: ["ansi", "markdown"],
    examples: [
      {
        name: "linear",
        description: "Simple linear commit history",
        input: {
          nodes: [
            { id: "c", label: "feat: add validation" },
            { id: "b", label: "fix: handle edge case", parents: ["c"] },
            { id: "a", label: "initial commit", parents: ["b"] },
          ],
        },
      },
      {
        name: "with-refs",
        description: "Commits with branch/tag refs",
        input: {
          nodes: [
            { id: "d", label: "latest changes", refs: ["main", "HEAD"] },
            { id: "c", label: "feat: new feature", parents: ["d"], refs: ["feature-branch"] },
            { id: "b", label: "fix: bug fix", parents: ["c"] },
            { id: "a", label: "initial commit", parents: ["b"], refs: ["v1.0.0"] },
          ],
        },
      },
      {
        name: "branch-and-merge",
        description: "Branch and merge visualization",
        input: {
          nodes: [
            { id: "e", label: "Merge branch 'feature'", parents: ["d", "c"], refs: ["main"] },
            { id: "d", label: "hotfix on main", parents: ["a"] },
            { id: "c", label: "add new feature", parents: ["b"], refs: ["feature"] },
            { id: "b", label: "start feature branch", parents: ["a"] },
            { id: "a", label: "initial commit" },
          ],
        },
      },
      {
        name: "multiple-branches",
        description: "Multiple concurrent branches",
        input: {
          nodes: [
            { id: "g", label: "Merge all branches", parents: ["f", "e", "d"], refs: ["main"] },
            { id: "f", label: "work on branch 1", parents: ["a"] },
            { id: "e", label: "work on branch 2", parents: ["a"] },
            { id: "d", label: "work on branch 3", parents: ["a"] },
            { id: "a", label: "initial commit" },
          ],
        },
      },
      {
        name: "ascii-style",
        description: "Using ASCII characters",
        input: {
          nodes: [
            { id: "c", label: "third commit" },
            { id: "b", label: "second commit", parents: ["c"] },
            { id: "a", label: "first commit", parents: ["b"] },
          ],
          style: "ascii",
        },
      },
      {
        name: "highlighted",
        description: "Commit with highlight",
        input: {
          nodes: [
            { id: "d", label: "current HEAD", highlight: true, refs: ["HEAD"] },
            { id: "c", label: "previous commit", parents: ["d"] },
            { id: "b", label: "earlier commit", parents: ["c"] },
            { id: "a", label: "initial commit", parents: ["b"] },
          ],
        },
      },
    ],
  };

  readonly schema = graphInputSchema;

  /**
   * Override getJsonSchema to use direct schema generation.
   */
  override getJsonSchema(): object {
    return zodToJsonSchema(this.schema, {
      name: this.metadata.name,
      $refStrategy: "none",
    });
  }

  render(input: GraphInput, context: RenderContext): RenderResult {
    const parsed = this.schema.parse(input);

    if (parsed.nodes.length === 0) {
      return { output: "", actualWidth: 0, lineCount: 0 };
    }

    // Get character set based on style
    const chars = getGraphChars(parsed.style);

    // Compute layout once, share between renderers
    const layout = computeGraphLayout(parsed, chars);

    // Choose renderer based on render mode
    const output =
      context.renderMode === "markdown"
        ? renderGraphMarkdown(layout, parsed)
        : renderGraphAnsi(layout, parsed, context.theme);

    const measured = measureLines(output);

    return {
      output,
      actualWidth: measured.maxWidth,
      lineCount: measured.lineCount,
    };
  }
}

/**
 * Factory function to create a graph component.
 */
export function createGraph(): GraphComponent {
  return new GraphComponent();
}

// Register with global registry
registry.register(createGraph);

export { GraphComponent };

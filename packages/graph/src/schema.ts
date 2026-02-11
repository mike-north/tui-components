import { z } from "zod";

/**
 * Style options for graph line characters.
 */
export const graphStyleSchema = z.enum(["ascii", "unicode"]);

export type GraphStyle = z.infer<typeof graphStyleSchema>;

/**
 * Schema for a single node in the graph.
 */
export const graphNodeSchema = z.object({
  /**
   * Unique identifier for this node.
   */
  id: z.string(),

  /**
   * Display label for the node (e.g., commit message).
   */
  label: z.string(),

  /**
   * IDs of parent nodes (empty for root nodes).
   */
  parents: z.array(z.string()).default([]),

  /**
   * Optional ref names (branch/tag names) to display.
   */
  refs: z.array(z.string()).optional(),

  /**
   * Whether this node should be highlighted.
   */
  highlight: z.boolean().optional(),

  /**
   * Custom character to represent this node (overrides global nodeChar).
   */
  nodeChar: z.string().length(1).optional(),
});

export type GraphNode = z.infer<typeof graphNodeSchema>;

/**
 * Schema for graph component input.
 */
export const graphInputSchema = z.object({
  /**
   * Array of nodes in topological order (newest/most recent first).
   */
  nodes: z.array(graphNodeSchema),

  /**
   * Style for graph characters.
   * @default "unicode"
   */
  style: graphStyleSchema.default("unicode"),

  /**
   * Maximum width for labels (truncated if longer).
   * @default 50
   */
  labelWidth: z.number().int().positive().default(50),

  /**
   * Whether to show refs (branch/tag names).
   * @default true
   */
  showRefs: z.boolean().default(true),

  /**
   * Gap between graph and label.
   * @default 1
   */
  labelGap: z.number().int().nonnegative().default(1),

  /**
   * Custom character to represent nodes (can be overridden per-node).
   * If not specified, uses the default for the style (● for unicode, * for ascii).
   */
  nodeChar: z.string().length(1).optional(),
});

export type GraphInput = z.input<typeof graphInputSchema>;
export type GraphInputWithDefaults = z.output<typeof graphInputSchema>;

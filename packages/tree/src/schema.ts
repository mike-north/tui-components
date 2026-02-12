import { z } from "zod";

/**
 * Base tree node schema object.
 */
const baseNodeSchema = z.object({
  /** Label to display for this node */
  label: z.string(),
  /** Whether this node is expanded (default: true in render) */
  expanded: z.boolean().optional(),
});

/**
 * Schema for a tree node with recursive children.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const treeNodeSchema: z.ZodType<any, z.ZodTypeDef, unknown> =
  baseNodeSchema.extend({
    /** Optional children nodes */
    children: z.lazy(() => z.array(treeNodeSchema)).optional(),
  });

/**
 * Tree node type inferred from schema.
 */
export type TreeNode = z.infer<typeof baseNodeSchema> & {
  children?: TreeNode[];
};

/**
 * Style options for tree rendering.
 */
export const treeStyleSchema = z.enum(["ascii", "unicode", "compact"]);

export type TreeStyle = z.infer<typeof treeStyleSchema>;

/**
 * Schema for tree component input.
 */
export const treeInputSchema = z.object({
  /** Root node or array of root nodes */
  root: z.union([treeNodeSchema, z.array(treeNodeSchema)]),
  /** Tree rendering style */
  style: treeStyleSchema.optional().default("unicode"),
  /** Whether to show the root node(s) label */
  showRoot: z.boolean().optional().default(true),
  /** Indentation width per level */
  indent: z.number().int().positive().optional().default(2),
});

/**
 * Input type (before defaults applied).
 */
export type TreeInput = z.input<typeof treeInputSchema>;

/**
 * Input type (after defaults applied).
 */
export type TreeInputWithDefaults = z.output<typeof treeInputSchema>;

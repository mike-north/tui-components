// Export component
export { createTree, TreeComponent } from "./tree.js";

// Export schema and types
export {
  treeInputSchema,
  treeNodeSchema,
  treeStyleSchema,
  type TreeInput,
  type TreeInputWithDefaults,
  type TreeNode,
  type TreeStyle,
} from "./schema.js";

// Export character utilities
export { getTreeChars, type TreeChars } from "./chars.js";

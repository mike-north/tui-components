import type { GraphInputWithDefaults, GraphNode } from "./schema.js";
import type { GraphChars } from "./chars.js";

/**
 * Layout information for a single node.
 */
export interface NodeLayout {
  /** The original node */
  node: GraphNode;
  /** Column index for this node (0-based) */
  column: number;
  /** Graph portion of this row (before label) */
  graphLine: string;
  /** Continuation lines between this node and the next */
  continuationLines: string[];
}

/**
 * Pre-computed layout for the entire graph.
 */
export interface GraphLayout {
  /** Layout for each node */
  nodes: NodeLayout[];
  /** Maximum number of columns used */
  maxColumns: number;
  /** Width of the graph portion (in characters) */
  graphWidth: number;
}

/**
 * Internal state for column tracking during layout computation.
 */
interface ColumnState {
  /** Maps node ID to its assigned column */
  nodeColumns: Map<string, number>;
  /** Which columns are currently occupied by active branches */
  activeColumns: Set<number>;
  /** Maximum column index used so far */
  maxColumn: number;
}

/**
 * Find the first available column (not in use).
 */
function findAvailableColumn(state: ColumnState): number {
  let col = 0;
  while (state.activeColumns.has(col)) {
    col++;
  }
  return col;
}

/**
 * Compute the graph portion for a single row.
 * Uses git-style: * for node, | for active columns
 */
function computeGraphRow(
  nodeColumn: number,
  activeColumns: Set<number>,
  maxCol: number,
  chars: GraphChars,
  isMerge: boolean,
  mergeFromColumns: number[],
  nodeChar: string
): string {
  const parts: string[] = [];

  // For merges, compute the rightmost merge column
  const maxMergeCol = isMerge ? Math.max(...mergeFromColumns, nodeColumn) : -1;

  for (let col = 0; col <= maxCol; col++) {
    if (col === nodeColumn) {
      parts.push(nodeChar);
    } else if (isMerge && mergeFromColumns.includes(col)) {
      // This column has a parent merging in - show corner
      parts.push(chars.cornerDownLeft);
    } else if (activeColumns.has(col)) {
      parts.push(chars.vertical);
    } else {
      parts.push(chars.space);
    }

    // Add spacing between columns
    if (col < maxCol) {
      // If this is a merge and we're between node and a merge source,
      // draw horizontal line instead of space
      if (isMerge && col >= nodeColumn && col < maxMergeCol) {
        parts.push(chars.horizontal);
      } else {
        parts.push(chars.space);
      }
    }
  }

  return parts.join("");
}

/**
 * Compute a simple continuation line showing active columns.
 */
function computeContinuationLine(
  activeColumns: Set<number>,
  maxCol: number,
  chars: GraphChars
): string {
  const parts: string[] = [];
  for (let col = 0; col <= maxCol; col++) {
    if (activeColumns.has(col)) {
      parts.push(chars.vertical);
    } else {
      parts.push(chars.space);
    }
    if (col < maxCol) {
      parts.push(chars.space);
    }
  }
  return parts.join("");
}

/**
 * Compute the layout for a graph.
 *
 * Uses a column-sweep algorithm optimized for newest-first processing order,
 * producing git log --graph style output.
 *
 * @param input - Validated graph input with defaults applied
 * @param chars - Character set to use
 * @returns Computed layout ready for rendering
 */
export function computeGraphLayout(
  input: GraphInputWithDefaults,
  chars: GraphChars
): GraphLayout {
  if (input.nodes.length === 0) {
    return {
      nodes: [],
      maxColumns: 0,
      graphWidth: 0,
    };
  }

  const state: ColumnState = {
    nodeColumns: new Map(),
    activeColumns: new Set(),
    maxColumn: 0,
  };

  // Track children count for each node
  const childrenCount = new Map<string, number>();
  for (const node of input.nodes) {
    for (const parentId of node.parents) {
      childrenCount.set(parentId, (childrenCount.get(parentId) ?? 0) + 1);
    }
  }

  const nodeLayouts: NodeLayout[] = [];

  for (let i = 0; i < input.nodes.length; i++) {
    const node = input.nodes[i];
    if (!node) continue;
    const isLastNode = i === input.nodes.length - 1;

    // Determine column for this node
    let nodeColumn: number;

    // Check if this node was pre-assigned a column (by a child's parent reference)
    const preassigned = state.nodeColumns.get(node.id);
    if (preassigned !== undefined) {
      nodeColumn = preassigned;
    } else if (node.parents.length > 0) {
      // Check if first parent already has a column assigned
      const firstParent = node.parents[0];
      const firstParentCol = firstParent ? state.nodeColumns.get(firstParent) : undefined;
      if (firstParentCol !== undefined) {
        nodeColumn = firstParentCol;
      } else {
        nodeColumn = findAvailableColumn(state);
      }
    } else {
      nodeColumn = findAvailableColumn(state);
    }

    // Record this node's column and mark as active
    state.nodeColumns.set(node.id, nodeColumn);
    state.activeColumns.add(nodeColumn);
    state.maxColumn = Math.max(state.maxColumn, nodeColumn);

    // Pre-assign columns to parents
    const parentColumns: number[] = [];
    for (let p = 0; p < node.parents.length; p++) {
      const parentId = node.parents[p];
      if (!parentId) continue;
      let parentCol = state.nodeColumns.get(parentId);

      if (parentCol === undefined) {
        if (p === 0) {
          parentCol = nodeColumn;
        } else {
          parentCol = findAvailableColumn(state);
        }
        state.nodeColumns.set(parentId, parentCol);
        state.activeColumns.add(parentCol);
        state.maxColumn = Math.max(state.maxColumn, parentCol);
      }
      parentColumns.push(parentCol);
    }

    // Determine if this is a merge (2+ parents)
    const isMerge = node.parents.length >= 2;
    const mergeFromColumns = isMerge
      ? parentColumns.filter(c => c !== nodeColumn)
      : [];

    // Determine the node character (per-node override > global override > default)
    const nodeChar = node.nodeChar ?? input.nodeChar ?? chars.node;

    // Compute the graph line for this row
    const graphLine = computeGraphRow(
      nodeColumn,
      state.activeColumns,
      state.maxColumn,
      chars,
      isMerge,
      mergeFromColumns,
      nodeChar
    );

    // Compute continuation lines
    const continuationLines: string[] = [];
    if (!isLastNode) {
      // Release columns for branches that merge into this node's column
      if (parentColumns.length > 0 && parentColumns[0] !== nodeColumn) {
        state.activeColumns.delete(nodeColumn);
      }

      // Add continuation line if there are active columns
      if (state.activeColumns.size > 0) {
        continuationLines.push(
          computeContinuationLine(state.activeColumns, state.maxColumn, chars)
        );
      }
    }

    nodeLayouts.push({
      node,
      column: nodeColumn,
      graphLine,
      continuationLines,
    });
  }

  // Calculate graph width (each column is 2 chars: symbol + space)
  const graphWidth = state.maxColumn * 2 + 1;

  return {
    nodes: nodeLayouts,
    maxColumns: state.maxColumn + 1,
    graphWidth,
  };
}

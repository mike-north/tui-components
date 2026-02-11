// Export the table component
export { createTable, TableComponent } from "./table.js";

// Export schema types
export {
  tableInputSchema,
  columnSchema,
  alignmentSchema,
  borderStyleSchema,
  headerStyleSchema,
  type TableInput,
  type TableInputWithDefaults,
  type Column,
  type ColumnWithDefaults,
  type Alignment,
  type BorderStyle,
  type HeaderStyle,
} from "./schema.js";

// Export border utilities
export { getBorderChars, type BorderChars } from "./borders.js";

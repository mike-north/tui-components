# Documentation Scripts

This directory contains scripts for generating and maintaining documentation for the TUI components library.

## Scripts

### `render-markdown-preview.ts`

Colorizes markdown-mode TUI output for screenshots and documentation.

**Purpose:**

When TUI components render in "markdown" mode, they produce plain text with backtick-wrapped content. This script applies visual highlighting to show how the output would appear in an AI assistant chat interface.

**Usage:**

```bash
# From stdin
echo 'Some `code` here' | pnpm tsx scripts/docs/render-markdown-preview.ts

# From a file
pnpm tsx scripts/docs/render-markdown-preview.ts --input output.txt

# With help
pnpm tsx scripts/docs/render-markdown-preview.ts --help
```

**Features:**

The script applies colorization to:

- Inline code: Backticked content like `` `code` `` (cyan/bold text, gray backticks)
- Code blocks: Fenced code blocks (green text, gray fence markers)
- Bold text: `**bold**` (bold text, gray asterisks)
- Headers: `# Header` (blue/bold text)
- Lists: Both unordered (`-`, `*`, `+`) and ordered (`1.`, `2.`) with yellow bullets

**Testing:**

```bash
pnpm vitest run scripts/docs/render-markdown-preview.test.ts --config scripts/docs/vitest.config.ts
```

Tests cover positive cases, negative cases (patterns that shouldn't match), edge cases, and error handling.

### `generate-readmes.ts`

Automatically generates README.md files for each visual component package based on their metadata, schema, and examples.

**Usage:**

```bash
pnpm run docs:readme
```

Or directly:

```bash
node --import=tsx/esm scripts/docs/generate-readmes.ts
```

**Prerequisites:**

- All packages must be built first (`pnpm build`)
- The script reads from the compiled `dist/` folders

**What it generates:**

For each visual component package, the script creates a README.md with:

1. **Package title and description** - from component metadata
2. **Features section** - placeholder for hand-editing
3. **Installation instructions** - pnpm add command
4. **Quick Start example** - using the first example from metadata
5. **Examples section** - all examples with:
   - Description
   - Screenshot placeholder (links to `/docs/screenshots/{component}/{example}.gif`)
   - JSON input
6. **Configuration Options table** - auto-generated from Zod schema:
   - Property name
   - Type (extracted from Zod type)
   - Required status
   - Default value (if any)
   - Description (if provided via `.describe()`)
7. **Render Modes section** - explains ANSI vs Markdown modes
8. **API link** - points to generated API docs
9. **License** - UNLICENSED

**Components included:**

- sparkline
- table
- box
- list
- tree
- progress
- gauge
- diff
- keyvalue
- graph
- chart

**Excluded:**

- `core` - needs different README (it's the core library)
- `cli` - needs different README (it's the CLI tool)
- `tui-components` - meta-package

## Architecture

### Schema Extraction

The script uses runtime introspection of Zod schemas to extract field information:

- **Type detection**: Maps Zod types to human-readable strings (e.g., `ZodString` → `"string"`)
- **Optional detection**: Checks `_def.typeName === "ZodOptional"` to determine if a field is required
- **Default values**: Extracts from `ZodDefault._def.defaultValue()`
- **Descriptions**: Reads from schema's `description` property (requires `.describe()` in source)
- **Complex types**: Handles arrays, unions, enums, objects, and literals

### Limitations

1. **JSDoc comments are not preserved**: The script reads from compiled dist files, so TypeScript comments (like `/** Description */`) are not available at runtime. To include descriptions in the generated README, use Zod's `.describe()` method instead:

   ```typescript
   // ❌ Won't appear in generated README
   /** Array of numeric data points to visualize */
   values: z.array(z.number()).min(1),

   // ✓ Will appear in generated README
   values: z.array(z.number()).min(1).describe("Array of numeric data points"),
   ```

2. **Manual Feature section**: The Features section is left as a placeholder for manual editing, as it requires human judgment about what to highlight.

3. **Screenshot placeholders**: The script generates markdown image links, but the actual screenshots must be created separately (see `generate-tapes.ts` and `run-vhs.sh`).

## Testing

Tests are located in `generate-readmes.test.ts` and cover:

- Schema field extraction for various Zod types
- Configuration table generation
- String utilities (kebab-case, PascalCase)
- Edge cases (nested types, optional with defaults, etc.)

Run tests:

```bash
pnpm test scripts/docs/generate-readmes.test.ts
```

## Future Improvements

1. **Extract descriptions from TypeScript source**: Use `ts-morph` or similar to read JSDoc comments from source files
2. **Validate screenshot paths**: Check if screenshot files actually exist
3. **Generate features from examples**: Automatically infer key features from the examples provided
4. **Support nested schemas**: Better handling of complex nested object types
5. **Custom templates per component**: Allow components to specify custom README sections

# Documentation Scripts

This directory contains scripts for generating documentation assets for the TUI components library.

## Scripts

### `docs/generate-tapes.ts`

Generates VHS tape files from component examples defined in the component registry.

**Usage:**

```bash
pnpm docs:generate-tapes
```

**What it does:**

1. Reads the component registry from `@tuicomponents/core`
2. Extracts examples from each visual component's metadata
3. Generates `.tape` files in `/tapes/{component-name}/` directories
4. Each tape file contains VHS commands to render the component example

**Output:**

- Tape files are created in `/tapes/{component-name}/{example-slug}.tape`
- Example slugs are derived from example names (lowercase, spaces to hyphens)
- Screenshots will be generated to `docs/screenshots/{component-name}/{example-slug}.gif` when VHS runs

**Example tape file:**

```tape
# sparkline - Simple ascending values
Output docs/screenshots/sparkline/basic.gif

Set Shell "bash"
Set FontSize 14
Set Width 800
Set Height 300
Set Padding 20

Type "tui render sparkline --json '{"values":[1,2,3,4,5,6,7,8]}'"
Enter
Sleep 1s
```

**Implementation details:**

- Uses tsx for TypeScript execution
- Imports all component packages to register them with the registry
- Properly escapes JSON for shell commands (handles single quotes, special chars)
- Creates directories automatically if they don't exist

### Running Tests

The script includes comprehensive tests for:

- Component registry validation
- JSON escaping for shell commands
- Slugification logic

Run tests with:

```bash
cd scripts
pnpm vitest run generate-tapes.test.ts
```

## Development

### Adding New Components

When adding a new visual component:

1. Add the component package to the `VISUAL_COMPONENTS` array in `generate-tapes.ts`
2. Ensure the component is imported and registered
3. Add examples to the component's metadata
4. Run the script to generate tape files

### File Structure

```
scripts/
├── README.md                      # This file
├── package.json                   # Script dependencies
├── tsconfig.json                  # TypeScript configuration
└── docs/
    ├── generate-tapes.ts          # Main script
    └── generate-tapes.test.ts     # Tests
```

## Requirements

- Node.js >= 18
- pnpm
- tsx (installed as dev dependency)
- All component packages built

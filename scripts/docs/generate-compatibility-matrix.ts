#!/usr/bin/env tsx

/**
 * Generate compatibility matrix documentation from YAML data.
 *
 * This script reads compatibility-matrix.yaml and generates COMPATIBILITY.md
 * with comprehensive documentation about AI assistant and terminal support.
 *
 * Usage:
 *   pnpm docs:compatibility           # Generate/update COMPATIBILITY.md
 *   pnpm docs:compatibility --check   # Check if docs are up to date (for CI)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YAML_FILE = path.join(__dirname, "../../docs/compatibility-matrix.yaml");
const OUTPUT_FILE = path.join(__dirname, "../../docs/COMPATIBILITY.md");

/**
 * Assistant compatibility data structure.
 */
interface AssistantData {
  id: string;
  displayName: string;
  recommendedMode: string;
  markdownOptions?: {
    multilineMode?: string;
  };
  backtickHighlight?: boolean;
  ansiSupport?: string;
  newlineHandling?: string;
  notes?: string;
}

/**
 * Terminal compatibility data structure.
 */
interface TerminalData {
  name: string;
  ansiSupport: string;
  chromatermCompatible: boolean;
  unicodeSupport: string;
}

/**
 * Root compatibility matrix structure.
 */
interface CompatibilityMatrix {
  assistants: AssistantData[];
  terminals: TerminalData[];
}

/**
 * Load and parse the YAML compatibility matrix.
 */
function loadCompatibilityMatrix(): CompatibilityMatrix {
  const yamlContent = fs.readFileSync(YAML_FILE, "utf-8");
  return parseYaml(yamlContent) as CompatibilityMatrix;
}

/**
 * Format a boolean value as a checkmark or X.
 */
function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) return "";
  return value ? "✓" : "✗";
}

/**
 * Format ANSI support level.
 */
function formatAnsiSupport(support: string | undefined): string {
  if (!support || support === "none") return "✗";
  if (support === "truecolor") return "Full";
  if (support === "partial") return "Partial";
  return support;
}

/**
 * Generate the AI assistant compatibility table.
 */
function generateAssistantTable(assistants: AssistantData[]): string {
  const lines: string[] = [];

  lines.push("| Assistant | Best Mode | Backticks | ANSI | Newlines | Notes |");
  lines.push("|-----------|-----------|-----------|------|----------|-------|");

  for (const assistant of assistants) {
    const backticks = formatBoolean(assistant.backtickHighlight);
    const ansi = formatAnsiSupport(assistant.ansiSupport);
    const newlines = assistant.newlineHandling || "";
    const notes = assistant.notes || "";

    lines.push(
      `| ${assistant.displayName} | \`${assistant.recommendedMode}\` | ${backticks} | ${ansi} | ${newlines} | ${notes} |`
    );
  }

  return lines.join("\n");
}

/**
 * Generate the terminal support table.
 */
function generateTerminalTable(terminals: TerminalData[]): string {
  const lines: string[] = [];

  lines.push("| Terminal | ANSI | ChromaTerm | Unicode |");
  lines.push("|----------|------|------------|---------|");

  for (const terminal of terminals) {
    const chromaTerm = formatBoolean(terminal.chromatermCompatible);

    lines.push(
      `| ${terminal.name} | ${terminal.ansiSupport} | ${chromaTerm} | ${terminal.unicodeSupport} |`
    );
  }

  return lines.join("\n");
}

/**
 * Generate detailed recommendations for each assistant.
 */
function generateAssistantRecommendations(assistants: AssistantData[]): string {
  const lines: string[] = [];

  for (const assistant of assistants) {
    lines.push(`### ${assistant.displayName}`);
    lines.push("");
    lines.push(
      `**Recommended mode:** \`${assistant.recommendedMode}\` ${assistant.markdownOptions ? `with \`${JSON.stringify(assistant.markdownOptions)}\`` : ""}`
    );
    lines.push("");

    // Add specific guidance based on the assistant's characteristics
    if (assistant.newlineHandling === "collapsed") {
      lines.push(
        `This assistant collapses newlines, so use \`multilineMode: "inline"\` for markdown mode:`
      );
      lines.push("");
      lines.push("```typescript");
      lines.push("renderer.markdown(component, {");
      lines.push('  multilineMode: "inline"');
      lines.push("});");
      lines.push("```");
      lines.push("");
    } else if (assistant.ansiSupport === "truecolor") {
      lines.push(
        "This assistant has full ANSI truecolor support in the terminal:"
      );
      lines.push("");
      lines.push("```typescript");
      lines.push("renderer.ansi(component);");
      lines.push("```");
      lines.push("");
    } else {
      lines.push("```typescript");
      lines.push(`renderer.${assistant.recommendedMode}(component);`);
      lines.push("```");
      lines.push("");
    }

    if (assistant.notes) {
      lines.push(`**Note:** ${assistant.notes}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generate mode-specific recommendations.
 */
function generateModeRecommendations(): string {
  return `### Markdown Mode

Best for most AI assistants that display output in a chat interface.

**Benefits:**
- Syntax highlighting via triple backticks
- Compact display
- Works with collapsed newlines (GitHub Copilot)

**Usage:**
\`\`\`typescript
import { renderer } from "tui-components";

// Default mode
const output = renderer.markdown(myChart);

// Inline mode for assistants that collapse newlines
const output = renderer.markdown(myChart, {
  multilineMode: "inline"
});
\`\`\`

### ANSI Mode

Best for terminal-based AI assistants and ChromaTerm-compatible terminals.

**Benefits:**
- Full color support (truecolor)
- Rich visual rendering
- Works with terminal pagers

**Usage:**
\`\`\`typescript
import { renderer } from "tui-components";

const output = renderer.ansi(myChart);
console.log(output);
\`\`\`

**With ChromaTerm:**
\`\`\`bash
my-cli render chart | ct
\`\`\`

### Grayscale Mode

Best for assistants without backtick highlighting or limited ANSI support.

**Benefits:**
- Unicode box drawing
- Clear structure without color
- Works in plain text contexts

**Usage:**
\`\`\`typescript
import { renderer } from "tui-components";

const output = renderer.grayscale(myChart);
\`\`\`

### Plain Mode

Minimal ASCII-only rendering for maximum compatibility.

**Benefits:**
- No Unicode or ANSI required
- Works everywhere
- Accessible

**Usage:**
\`\`\`typescript
import { renderer } from "tui-components";

const output = renderer.plain(myChart);
\`\`\``;
}

/**
 * Generate the complete COMPATIBILITY.md content.
 */
function generateMarkdown(matrix: CompatibilityMatrix): string {
  const sections: string[] = [];

  sections.push("# Compatibility Matrix");
  sections.push("");
  sections.push(
    "This document provides comprehensive compatibility information for TUI Components across different AI assistants and terminals."
  );
  sections.push("");
  sections.push("## AI Assistant Compatibility");
  sections.push("");
  sections.push(
    "The following table shows which render mode works best with each AI assistant:"
  );
  sections.push("");
  sections.push(generateAssistantTable(matrix.assistants));
  sections.push("");

  sections.push("### Legend");
  sections.push("");
  sections.push(
    "- **Best Mode**: The recommended render mode for this assistant"
  );
  sections.push(
    "- **Backticks**: Whether the assistant supports syntax highlighting in triple backtick code blocks"
  );
  sections.push(
    "- **ANSI**: Level of ANSI color code support (Full, Partial, or ✗)"
  );
  sections.push(
    "- **Newlines**: How the assistant handles newlines (full, collapsed)"
  );
  sections.push("");

  sections.push("## Terminal Support");
  sections.push("");
  sections.push(
    "Terminal emulator support for ANSI rendering and ChromaTerm color enhancement:"
  );
  sections.push("");
  sections.push(generateTerminalTable(matrix.terminals));
  sections.push("");

  sections.push("### ANSI Support Levels");
  sections.push("");
  sections.push(
    "- **truecolor**: Full 24-bit RGB color support (16.7 million colors)"
  );
  sections.push("- **256color**: 256 color palette support");
  sections.push(
    "- **16color**: Basic 16 color support (8 colors + bright variants)"
  );
  sections.push("");

  sections.push("## Recommendations by Assistant");
  sections.push("");
  sections.push(generateAssistantRecommendations(matrix.assistants));

  sections.push("## Recommendations by Mode");
  sections.push("");
  sections.push(generateModeRecommendations());

  sections.push("");
  sections.push("## Quick Start Examples");
  sections.push("");
  sections.push("### For Claude Code");
  sections.push("");
  sections.push("```typescript");
  sections.push('import { renderer, Chart } from "tui-components";');
  sections.push("");
  sections.push("const chart = new Chart({");
  sections.push('  data: [["Q1", 45], ["Q2", 67], ["Q3", 52], ["Q4", 78]],');
  sections.push("});");
  sections.push("");
  sections.push("// Best for Claude Code");
  sections.push("console.log(renderer.markdown(chart));");
  sections.push("```");
  sections.push("");

  sections.push("### For GitHub Copilot");
  sections.push("");
  sections.push("```typescript");
  sections.push('import { renderer, Chart } from "tui-components";');
  sections.push("");
  sections.push("const chart = new Chart({");
  sections.push('  data: [["Q1", 45], ["Q2", 67], ["Q3", 52], ["Q4", 78]],');
  sections.push("});");
  sections.push("");
  sections.push("// GitHub Copilot collapses newlines, use inline mode");
  sections.push(
    'console.log(renderer.markdown(chart, { multilineMode: "inline" }));'
  );
  sections.push("```");
  sections.push("");

  sections.push("### For Kiro CLI (Terminal)");
  sections.push("");
  sections.push("```typescript");
  sections.push('import { renderer, Chart } from "tui-components";');
  sections.push("");
  sections.push("const chart = new Chart({");
  sections.push('  data: [["Q1", 45], ["Q2", 67], ["Q3", 52], ["Q4", 78]],');
  sections.push("});");
  sections.push("");
  sections.push("// Full ANSI color support");
  sections.push("console.log(renderer.ansi(chart));");
  sections.push("```");
  sections.push("");

  sections.push("## Related Documentation");
  sections.push("");
  sections.push(
    "- [Render Modes](./RENDER_MODES.md) - Detailed render mode documentation"
  );
  sections.push(
    "- [ChromaTerm Guide](./CHROMATERM.md) - Setting up ChromaTerm for color enhancement"
  );
  sections.push(
    "- [Component Examples](../README.md) - Component usage examples"
  );
  sections.push("");

  return sections.join("\n");
}

/**
 * Main entry point.
 */
function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");

  console.log("Generating compatibility matrix documentation...");

  const matrix = loadCompatibilityMatrix();
  const markdown = generateMarkdown(matrix);

  if (checkOnly) {
    // Check mode: compare with existing file
    if (!fs.existsSync(OUTPUT_FILE)) {
      console.error(
        "Error: Documentation file does not exist. Run without --check to generate."
      );
      process.exit(1);
    }

    const existing = fs.readFileSync(OUTPUT_FILE, "utf-8");
    if (existing !== markdown) {
      console.error(
        "Error: Documentation is out of date. Run 'pnpm docs:compatibility' to update."
      );
      process.exit(1);
    }

    console.log("✓ Compatibility documentation is up to date");
  } else {
    // Generate mode: write the file
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`✓ Generated ${path.basename(OUTPUT_FILE)}`);
    console.log(
      `  Assistants: ${matrix.assistants.map((a) => a.displayName).join(", ")}`
    );
    console.log(
      `  Terminals: ${matrix.terminals.map((t) => t.name).join(", ")}`
    );
  }
}

main();

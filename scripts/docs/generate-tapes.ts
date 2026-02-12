#!/usr/bin/env tsx

/**
 * Generate VHS tape files from component examples.
 *
 * This script reads the component registry, extracts examples from each visual component,
 * and generates .tape files that can be used with VHS to create animated GIFs for documentation.
 *
 * Usage:
 *   pnpm tsx scripts/docs/generate-tapes.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { registry } from "@tuicomponents/core";

// Import all components to register them
import "@tuicomponents/box";
import "@tuicomponents/chart";
import "@tuicomponents/diff";
import "@tuicomponents/gauge";
import "@tuicomponents/graph";
import "@tuicomponents/keyvalue";
import "@tuicomponents/list";
import "@tuicomponents/progress";
import "@tuicomponents/sparkline";
import "@tuicomponents/table";
import "@tuicomponents/tree";

/**
 * Visual components that should have tape files generated.
 * These are components that produce visual output suitable for screenshots.
 */
const VISUAL_COMPONENTS = [
  "sparkline",
  "table",
  "box",
  "list",
  "tree",
  "progress",
  "gauge",
  "diff",
  "keyvalue",
  "graph",
  "chart",
] as const;

/**
 * Create a slugified filename from an example name.
 * Converts spaces to hyphens and removes non-alphanumeric characters.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * Escape JSON for use in a shell command.
 *
 * The JSON needs to be properly escaped for bash:
 * - Wrap in single quotes to prevent variable expansion
 * - Escape single quotes within the JSON by ending the quoted string,
 *   adding an escaped single quote, and starting a new quoted string
 *
 * Example: {"foo": "bar's"} becomes '{"foo": "bar'\''s"}'
 */
function escapeJsonForShell(obj: unknown): string {
  const jsonStr = JSON.stringify(obj);
  // Replace single quotes with '\'' (end quote, escaped quote, start quote)
  return `'${jsonStr.replace(/'/g, "'\\''")}'`;
}

/**
 * Generate a VHS tape file content for a component example.
 */
function generateTapeFile(
  componentName: string,
  exampleName: string,
  exampleDescription: string | undefined,
  exampleInput: unknown
): string {
  const slug = slugify(exampleName);
  const title = exampleDescription ?? exampleName;
  const escapedJson = escapeJsonForShell(exampleInput);

  return `# ${componentName} - ${title}
Output docs/screenshots/${componentName}/${slug}.gif

Set Shell "bash"
Set FontSize 14
Set Width 800
Set Height 300
Set Padding 20

Type "tui render ${componentName} --json ${escapedJson}"
Enter
Sleep 1s
`;
}

/**
 * Main execution function.
 */
function main(): void {
  console.log("Generating VHS tape files from component examples...\n");

  const tapesDir = path.join(process.cwd(), "tapes");
  let totalTapesGenerated = 0;

  for (const componentName of VISUAL_COMPONENTS) {
    const component = registry.get(componentName);

    if (!component) {
      console.warn(`⚠️  Component "${componentName}" not found in registry`);
      continue;
    }

    const { examples } = component.metadata;

    if (!examples || examples.length === 0) {
      console.log(`ℹ️  Component "${componentName}" has no examples, skipping`);
      continue;
    }

    // Create component-specific directory
    const componentDir = path.join(tapesDir, componentName);
    fs.mkdirSync(componentDir, { recursive: true });

    console.log(`📦 ${componentName} (${examples.length} examples)`);

    for (const example of examples) {
      const slug = slugify(example.name);
      const tapeFilePath = path.join(componentDir, `${slug}.tape`);

      const tapeContent = generateTapeFile(
        componentName,
        example.name,
        example.description,
        example.input
      );

      fs.writeFileSync(tapeFilePath, tapeContent, "utf-8");
      totalTapesGenerated++;

      console.log(`   ✓ ${slug}.tape`);
    }

    console.log();
  }

  console.log(`✅ Generated ${totalTapesGenerated} tape files in ${tapesDir}`);
}

// Execute if run directly
main();

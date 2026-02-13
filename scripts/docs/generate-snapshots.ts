#!/usr/bin/env tsx

/**
 * Generate snapshots of component output for visual regression testing and documentation.
 *
 * This script reads the component registry, renders each example in both ANSI and markdown modes,
 * saves text snapshots for regression testing, and generates SVG images for documentation.
 *
 * NOTE: Run with FORCE_COLOR=3 to enable color output (done automatically via npm scripts).
 *
 * Usage:
 *   pnpm docs:snapshots          # Check mode - fails if snapshots differ
 *   pnpm docs:snapshots --update # Update mode - regenerates all snapshots
 */

import * as fs from "node:fs";
import * as path from "node:path";
import {
  createRenderContext,
  createTestTheme,
  registry,
} from "@tuicomponents/core";
import ansiToSvg from "ansi-to-svg";

/**
 * High-contrast test theme for visual verification.
 * Uses obviously different colors so we can verify coloring is working.
 */
const testTheme = createTestTheme();

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
 * Visual components that should have snapshots generated.
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
 * Fixed width for snapshot rendering to ensure consistency across environments.
 */
const SNAPSHOT_WIDTH = 80;

/**
 * Create a slugified filename from an example name.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Compare two text files and return whether they differ.
 */
function filesAreDifferent(path1: string, path2: string): boolean {
  if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
    return true;
  }
  const content1 = fs.readFileSync(path1, "utf-8");
  const content2 = fs.readFileSync(path2, "utf-8");
  return content1 !== content2;
}

/**
 * Generate an SVG from ANSI output.
 */
function generateSvg(ansiOutput: string): string {
  // Add trailing spaces to each line to prevent clipping of wide Unicode characters
  // The ansi-to-svg library miscalculates width for block characters (▁▂▃▄▅▆▇█)
  const paddedOutput = ansiOutput
    .split("\n")
    .map((line) => line + "    ") // Add 4 spaces of padding
    .join("\n");

  const svg = ansiToSvg(paddedOutput, {
    // Use a terminal-like font
    fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
    fontSize: 14,
    // Add padding
    paddingTop: 10,
    paddingLeft: 10,
    paddingBottom: 10,
    paddingRight: 10,
    // Use a dark terminal background
    colors: {
      backgroundColor: "#1e1e1e",
    },
  });

  // ansi-to-svg miscalculates width for Unicode block characters
  // Add overflow="visible" to prevent clipping and widen dimensions
  const widthMultiplier = 1.5;
  return svg
    .replace(/<svg /, '<svg overflow="visible" ')
    .replace(/<g /, '<g overflow="visible" ')
    .replace(/viewBox="0, 0, ([\d.]+), ([\d.]+)"/, (_, w, h) => {
      const newWidth = parseFloat(w) * widthMultiplier;
      return `viewBox="0, 0, ${newWidth}, ${h}"`;
    })
    .replace(
      /<rect x="0" y="0" width="([\d.]+)" height="([\d.]+)"/,
      (_, w, h) => {
        const newWidth = parseFloat(w) * widthMultiplier;
        return `<rect x="0" y="0" width="${newWidth}" height="${h}"`;
      }
    );
}

/**
 * Render a component example and save snapshots.
 *
 * @returns Object with success status and any differences found
 */
function processExample(
  componentName: string,
  exampleName: string,
  exampleInput: unknown,
  updateMode: boolean
): { success: boolean; differences: string[] } {
  const component = registry.get(componentName);
  if (!component) {
    throw new Error(`Component "${componentName}" not found in registry`);
  }

  const slug = slugify(exampleName);
  const differences: string[] = [];

  // Setup directories
  const snapshotDir = path.join(
    process.cwd(),
    "docs",
    "snapshots",
    componentName
  );
  const imageDir = path.join(process.cwd(), "docs", "images", componentName);
  ensureDirectory(snapshotDir);
  ensureDirectory(imageDir);

  // Render in ANSI mode
  const ansiContext = createRenderContext({
    width: SNAPSHOT_WIDTH,
    renderMode: "ansi",
    theme: testTheme, // High-contrast theme for visual verification
  });
  const ansiResult = component.render(exampleInput, ansiContext);
  const ansiOutput = ansiResult.output;

  // Render in markdown mode
  const markdownContext = createRenderContext({
    width: SNAPSHOT_WIDTH,
    renderMode: "markdown",
  });
  const markdownResult = component.render(exampleInput, markdownContext);
  const markdownOutput = markdownResult.output;

  // File paths
  const ansiSnapshotPath = path.join(snapshotDir, `${slug}.ansi.txt`);
  const markdownSnapshotPath = path.join(snapshotDir, `${slug}.markdown.txt`);
  const svgImagePath = path.join(imageDir, `${slug}.svg`);

  if (updateMode) {
    // Update mode: write all files
    fs.writeFileSync(ansiSnapshotPath, ansiOutput, "utf-8");
    fs.writeFileSync(markdownSnapshotPath, markdownOutput, "utf-8");

    // Generate SVG from ANSI output
    const svg = generateSvg(ansiOutput);
    fs.writeFileSync(svgImagePath, svg, "utf-8");

    return { success: true, differences: [] };
  } else {
    // Check mode: compare files
    let allMatch = true;

    // Check ANSI snapshot
    if (!fs.existsSync(ansiSnapshotPath)) {
      differences.push(`Missing ANSI snapshot: ${ansiSnapshotPath}`);
      allMatch = false;
    } else {
      const existingAnsi = fs.readFileSync(ansiSnapshotPath, "utf-8");
      if (existingAnsi !== ansiOutput) {
        differences.push(`ANSI snapshot differs: ${ansiSnapshotPath}`);
        allMatch = false;
      }
    }

    // Check markdown snapshot
    if (!fs.existsSync(markdownSnapshotPath)) {
      differences.push(`Missing markdown snapshot: ${markdownSnapshotPath}`);
      allMatch = false;
    } else {
      const existingMarkdown = fs.readFileSync(markdownSnapshotPath, "utf-8");
      if (existingMarkdown !== markdownOutput) {
        differences.push(`Markdown snapshot differs: ${markdownSnapshotPath}`);
        allMatch = false;
      }
    }

    // Check SVG image
    if (!fs.existsSync(svgImagePath)) {
      differences.push(`Missing SVG image: ${svgImagePath}`);
      allMatch = false;
    } else {
      // For SVGs, we'll just check if they exist and are non-empty
      // Full comparison would be too brittle due to potential minor differences
      const existingSvg = fs.readFileSync(svgImagePath, "utf-8");
      if (existingSvg.length === 0) {
        differences.push(`Empty SVG image: ${svgImagePath}`);
        allMatch = false;
      }
    }

    return { success: allMatch, differences };
  }
}

/**
 * Main execution function.
 */
function main(): void {
  const updateMode = process.argv.includes("--update");
  const mode = updateMode ? "UPDATE" : "CHECK";

  console.log(`\n🔍 Generating snapshots in ${mode} mode...\n`);

  let totalExamples = 0;
  let totalDifferences = 0;
  const allDifferences: Array<{
    component: string;
    example: string;
    diffs: string[];
  }> = [];

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

    console.log(`📦 ${componentName} (${examples.length} examples)`);

    for (const example of examples) {
      const slug = slugify(example.name);
      totalExamples++;

      try {
        const result = processExample(
          componentName,
          example.name,
          example.input,
          updateMode
        );

        if (result.success) {
          console.log(`   ✓ ${slug}`);
        } else {
          console.log(
            `   ✗ ${slug} - ${result.differences.length} differences`
          );
          totalDifferences += result.differences.length;
          allDifferences.push({
            component: componentName,
            example: example.name,
            diffs: result.differences,
          });
        }
      } catch (error) {
        console.error(
          `   ✗ ${slug} - Error: ${error instanceof Error ? error.message : String(error)}`
        );
        totalDifferences++;
        allDifferences.push({
          component: componentName,
          example: example.name,
          diffs: [
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          ],
        });
      }
    }

    console.log();
  }

  // Summary
  if (updateMode) {
    console.log(`✅ Updated ${totalExamples} snapshots`);
    process.exit(0);
  } else {
    if (totalDifferences === 0) {
      console.log(`✅ All ${totalExamples} snapshots match`);
      process.exit(0);
    } else {
      console.log(`❌ Found ${totalDifferences} differences in snapshots\n`);

      // Print details of all differences
      console.log("Details:");
      for (const { component, example, diffs } of allDifferences) {
        console.log(`\n  ${component} / ${example}:`);
        for (const diff of diffs) {
          console.log(`    - ${diff}`);
        }
      }

      console.log(`\nRun with --update to regenerate snapshots.`);
      process.exit(1);
    }
  }
}

// Execute if run directly
main();

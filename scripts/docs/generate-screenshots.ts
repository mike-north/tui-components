#!/usr/bin/env tsx

/**
 * Generate terminal screenshots for all component examples.
 *
 * Uses Xterm.js for authentic terminal rendering and Playwright for screenshots.
 * Supports both Docker-based and native Playwright execution.
 *
 * Screenshots are defined in screenshot-scenarios.yaml for easy contribution.
 * Each scenario is validated against the component's Zod input schema.
 *
 * Usage:
 *   pnpm docs:screenshots              # Generate screenshots (auto-detect Docker/native)
 *   pnpm docs:screenshots --docker     # Force Docker execution
 *   pnpm docs:screenshots --native     # Force native Playwright
 *   pnpm docs:screenshots --component sparkline  # Only generate for one component
 *   pnpm docs:screenshots --validate   # Only validate scenarios, don't generate
 */

// Force truecolor support
process.env["FORCE_COLOR"] = "3";

import { execSync, spawnSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import YAML from "yaml";
import { z, ZodError } from "zod";
import {
  createRenderContext,
  createThemeSync,
  registry,
  type TuiComponent,
} from "@tuicomponents/core";
import { renderMarkdownToHtml } from "./markdown-screenshot-renderer.js";
import { generateScenarioComparison } from "./comparison-generator.js";

// Import all visual components to register them
import "@tuicomponents/sparkline";
import "@tuicomponents/box";
import "@tuicomponents/table";
import "@tuicomponents/chart";
import "@tuicomponents/list";
import "@tuicomponents/tree";
import "@tuicomponents/progress";
import "@tuicomponents/gauge";
import "@tuicomponents/diff";
import "@tuicomponents/keyvalue";
import "@tuicomponents/graph";
import "@tuicomponents/callout";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "docs/screenshots");
const SCENARIOS_FILE = path.join(__dirname, "screenshot-scenarios.yaml");
const TMP_DIR = path.join(os.tmpdir(), "tui-screenshots");

// Terminal theme colors
const TERMINAL_THEME = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#e5e5e5",
};

// Background colors for cropping (as RGB)
const DARK_BACKGROUND_RGB = { r: 0x1e, g: 0x1e, b: 0x1e };
const LIGHT_BACKGROUND_RGB = { r: 0xff, g: 0xff, b: 0xff };
const COLOR_TOLERANCE = 5;

interface Scenario {
  name: string;
  description: string;
  width?: number;
  input: unknown;
}

type ScreenshotMode = "ansi" | "markdown" | "grayscale" | "inline";

interface ScenariosFile {
  [component: string]: Scenario[];
}

interface ScreenshotOptions {
  useDocker: boolean;
  componentFilter?: string;
  validateOnly: boolean;
  verbose: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScreenshotOptions {
  const args = process.argv.slice(2);
  let useDocker: boolean | undefined;
  let componentFilter: string | undefined;
  let validateOnly = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--docker") {
      useDocker = true;
    } else if (arg === "--native") {
      useDocker = false;
    } else if (arg === "--component" && args[i + 1]) {
      componentFilter = args[++i];
    } else if (arg === "--validate") {
      validateOnly = true;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    }
  }

  // Auto-detect if not specified
  if (useDocker === undefined) {
    useDocker = !isPlaywrightAvailable();
  }

  return { useDocker, componentFilter, validateOnly, verbose };
}

/**
 * Check if Playwright is available locally
 */
function isPlaywrightAvailable(): boolean {
  try {
    const result = spawnSync("npx", ["playwright", "--version"], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Load and parse scenarios from YAML file
 */
function loadScenarios(): ScenariosFile {
  const content = fs.readFileSync(SCENARIOS_FILE, "utf-8");
  return YAML.parse(content) as ScenariosFile;
}

/**
 * Validate a scenario against the component's input schema
 */
function validateScenario(
  componentName: string,
  scenario: Scenario,
  component: TuiComponent
): { valid: boolean; errors?: string[] } {
  const schema = component.metadata.inputSchema;

  if (!schema) {
    return { valid: true }; // No schema to validate against
  }

  try {
    // Parse the input with the Zod schema
    schema.parse(scenario.input);
    return { valid: true };
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => {
        const path = e.path.join(".");
        return `  ${path ? path + ": " : ""}${e.message}`;
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: [String(err)] };
  }
}

/**
 * Generate HTML for Xterm.js rendering
 */
function generateHtml(ansiContent: string): string {
  const escaped = JSON.stringify(ansiContent);
  const themeJson = JSON.stringify(TERMINAL_THEME);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TUI Terminal Harness</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${TERMINAL_THEME.background}; padding: 12px; display: inline-block; }
    #terminal { display: inline-block; }
    .xterm-viewport { overflow: hidden !important; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
  <script>
    const content = ${escaped};
    const themeColors = ${themeJson};

    const terminal = new Terminal({
      fontFamily: '"Monaco", "Menlo", "Consolas", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.0,
      letterSpacing: 0,
      theme: {
        ...themeColors,
        cursor: themeColors.background,
        cursorAccent: themeColors.background,
      },
      allowTransparency: false,
      cursorBlink: false,
      cursorStyle: 'bar',
      cursorInactiveStyle: 'none',
      disableStdin: true,
      convertEol: true,
    });

    terminal.open(document.getElementById('terminal'));
    terminal.write(content);

    // Resize to fit content after rendering
    setTimeout(() => {
      const buffer = terminal.buffer.active;
      let maxCol = 0;
      let maxRow = 0;

      for (let row = 0; row < buffer.length; row++) {
        const line = buffer.getLine(row);
        if (line) {
          const lineText = line.translateToString(true);
          if (lineText.trim().length > 0) {
            maxRow = row + 1;
            maxCol = Math.max(maxCol, lineText.length);
          }
        }
      }

      terminal.resize(maxCol + 1, maxRow);
      window.TERMINAL_READY = true;
    }, 100);
  </script>
</body>
</html>`;
}

/**
 * Take screenshot using Docker + Playwright
 */
function takeScreenshotDocker(
  htmlPath: string,
  outputPath: string,
  verbose: boolean
): void {
  const inputDir = path.dirname(htmlPath);
  const outputDir = path.dirname(outputPath);
  const outputFile = path.basename(outputPath);

  const dockerCmd = [
    "docker run --rm",
    `-v "${inputDir}:/input"`,
    `-v "${outputDir}:/output"`,
    "mcr.microsoft.com/playwright:v1.58.2-jammy",
    "npx -y playwright screenshot",
    "--wait-for-timeout=500",
    "--full-page",
    `"file:///input/${path.basename(htmlPath)}"`,
    `"/output/${outputFile}"`,
  ].join(" ");

  if (verbose) {
    console.log(`  Docker command: ${dockerCmd}`);
  }

  execSync(dockerCmd, { stdio: verbose ? "inherit" : "pipe" });
}

/**
 * Take screenshot using native Playwright
 */
function takeScreenshotNative(
  htmlPath: string,
  outputPath: string,
  verbose: boolean
): void {
  const playwrightCmd = [
    "npx playwright screenshot",
    "--wait-for-timeout=500",
    "--full-page",
    `"file://${htmlPath}"`,
    `"${outputPath}"`,
  ].join(" ");

  if (verbose) {
    console.log(`  Playwright command: ${playwrightCmd}`);
  }

  execSync(playwrightCmd, { stdio: verbose ? "inherit" : "pipe" });
}

/**
 * Detect background color of an image
 */
async function detectBackgroundColor(
  imagePath: string
): Promise<{ r: number; g: number; b: number }> {
  const image = sharp(imagePath);
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });

  // Sample the top-left pixel to determine background
  const r = data[0];
  const g = data[1];
  const b = data[2];

  return { r, g, b };
}

/**
 * Check if a color matches a background color within tolerance
 */
function isBackgroundColor(
  r: number,
  g: number,
  b: number,
  background: { r: number; g: number; b: number }
): boolean {
  return (
    Math.abs(r - background.r) <= COLOR_TOLERANCE &&
    Math.abs(g - background.g) <= COLOR_TOLERANCE &&
    Math.abs(b - background.b) <= COLOR_TOLERANCE
  );
}

/**
 * Crop image to content bounds
 */
async function cropToContent(imagePath: string, padding = 12): Promise<void> {
  const image = sharp(imagePath);
  const { width, height } = await image.metadata();

  if (!width || !height) {
    throw new Error("Could not get image dimensions");
  }

  // Detect background color
  const backgroundColor = await detectBackgroundColor(imagePath);

  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const isBackground = isBackgroundColor(r, g, b, backgroundColor);

      if (!isBackground) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  const croppedPath = imagePath.replace(".png", "-cropped.png");
  await sharp(imagePath)
    .extract({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight,
    })
    .toFile(croppedPath);

  fs.renameSync(croppedPath, imagePath);
}

/**
 * Render a component and return the output for the specified mode
 */
function renderComponent(
  component: TuiComponent,
  input: unknown,
  mode: ScreenshotMode,
  width = 80
): string {
  // For "inline" mode, use markdown with multilineMode: "inline"
  const renderMode = mode === "inline" ? "markdown" : mode;
  const markdownOptions =
    mode === "inline" ? { multilineMode: "inline" as const } : undefined;

  const context = createRenderContext({
    width,
    renderMode,
    theme: createThemeSync(),
    markdownOptions,
  });

  const result = component.render(input, context);
  return result.output;
}

/**
 * Determine which modes a component supports for inline rendering
 */
function supportsInlineMode(component: TuiComponent): boolean {
  // Components that support single-line rendering can use inline mode
  // For now, we'll check if "sparkline" or similar single-line components
  const singleLineComponents = ["sparkline", "gauge", "progress"];
  return singleLineComponents.includes(component.metadata.name);
}

/**
 * Get the screenshot filename for a given mode
 */
function getScreenshotFilename(
  scenarioName: string,
  mode: ScreenshotMode
): string {
  if (mode === "ansi") {
    return `${scenarioName}.png`;
  }
  return `${scenarioName}-${mode}.png`;
}

/**
 * Generate screenshot for a single scenario and mode
 */
async function generateScreenshotForMode(
  componentName: string,
  component: TuiComponent,
  scenario: Scenario,
  mode: ScreenshotMode,
  options: ScreenshotOptions
): Promise<boolean> {
  const componentDir = path.join(SCREENSHOTS_DIR, componentName);
  fs.mkdirSync(componentDir, { recursive: true });

  const tmpComponentDir = path.join(TMP_DIR, componentName);
  fs.mkdirSync(tmpComponentDir, { recursive: true });

  try {
    // Render the component
    const width = scenario.width ?? 80;
    const output = renderComponent(component, scenario.input, mode, width);

    // Generate HTML based on mode
    let html: string;
    if (mode === "markdown" || mode === "inline" || mode === "grayscale") {
      // Use markdown renderer for non-ANSI modes
      html = renderMarkdownToHtml(output);
    } else {
      // Use ANSI terminal renderer for ANSI mode
      html = generateHtml(output);
    }

    const htmlPath = path.join(
      tmpComponentDir,
      `${scenario.name}-${mode}.html`
    );
    fs.writeFileSync(htmlPath, html);

    // Take screenshot
    const filename = getScreenshotFilename(scenario.name, mode);
    const outputPath = path.join(componentDir, filename);

    if (options.useDocker) {
      takeScreenshotDocker(htmlPath, outputPath, options.verbose);
    } else {
      takeScreenshotNative(htmlPath, outputPath, options.verbose);
    }

    // Crop to content
    await cropToContent(outputPath);

    return true;
  } catch (err) {
    console.error(`    Error: ${err}`);
    return false;
  }
}

/**
 * Generate screenshots for a single scenario (all modes)
 */
async function generateScreenshot(
  componentName: string,
  component: TuiComponent,
  scenario: Scenario,
  options: ScreenshotOptions
): Promise<boolean> {
  // Determine which modes to generate
  const modes: ScreenshotMode[] = ["ansi", "markdown", "grayscale"];

  // Add inline mode if component supports single-line rendering
  if (supportsInlineMode(component)) {
    modes.push("inline");
  }

  let allSucceeded = true;

  // Generate individual mode screenshots
  for (const mode of modes) {
    const success = await generateScreenshotForMode(
      componentName,
      component,
      scenario,
      mode,
      options
    );
    if (!success) {
      allSucceeded = false;
    }
  }

  // Generate comparison image if all individual screenshots succeeded
  if (allSucceeded) {
    try {
      const modeConfigs = modes.map((mode) => {
        if (mode === "ansi") {
          return { suffix: "", label: "ANSI" };
        } else if (mode === "inline") {
          return { suffix: "-inline", label: "Inline" };
        } else {
          return {
            suffix: `-${mode}`,
            label: mode.charAt(0).toUpperCase() + mode.slice(1),
          };
        }
      });

      await generateScenarioComparison(
        componentName,
        scenario.name,
        SCREENSHOTS_DIR,
        modeConfigs
      );
    } catch (err) {
      console.error(`    Failed to generate comparison: ${err}`);
      allSucceeded = false;
    }
  }

  return allSucceeded;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  console.log("TUI Component Screenshot Generator");
  console.log("===================================");

  if (options.validateOnly) {
    console.log("Mode: Validation only");
  } else {
    console.log(`Mode: ${options.useDocker ? "Docker" : "Native Playwright"}`);
  }

  if (options.componentFilter) {
    console.log(`Filter: ${options.componentFilter}`);
  }
  console.log();

  // Load scenarios
  console.log(`Loading scenarios from ${path.basename(SCENARIOS_FILE)}...`);
  const scenarios = loadScenarios();
  console.log();

  // Validate and optionally generate
  let totalScenarios = 0;
  let validScenarios = 0;
  let generatedCount = 0;
  const errors: string[] = [];

  // Ensure directories exist
  if (!options.validateOnly) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  for (const [componentName, componentScenarios] of Object.entries(scenarios)) {
    // Skip if filter is set and doesn't match
    if (options.componentFilter && componentName !== options.componentFilter) {
      continue;
    }

    // Get the component from registry
    const component = registry.get(componentName);
    if (!component) {
      errors.push(`Component '${componentName}' not found in registry`);
      continue;
    }

    console.log(`${componentName} (${componentScenarios.length} scenarios)`);

    for (const scenario of componentScenarios) {
      totalScenarios++;
      const prefix = `  ${scenario.name}`;

      // Validate against schema
      const validation = validateScenario(componentName, scenario, component);

      if (!validation.valid) {
        console.log(`${prefix} ❌ Invalid`);
        for (const err of validation.errors || []) {
          console.log(`    ${err}`);
        }
        errors.push(
          `${componentName}/${scenario.name}: Schema validation failed`
        );
        continue;
      }

      validScenarios++;

      if (options.validateOnly) {
        console.log(`${prefix} ✓`);
        continue;
      }

      // Generate screenshot
      process.stdout.write(`${prefix}...`);
      const success = await generateScreenshot(
        componentName,
        component,
        scenario,
        options
      );

      if (success) {
        generatedCount++;
        console.log(" ✓");
      } else {
        console.log(" ❌");
      }
    }
  }

  // Summary
  console.log();
  console.log("Summary");
  console.log("-------");
  console.log(`Total scenarios: ${totalScenarios}`);
  console.log(`Valid scenarios: ${validScenarios}`);

  if (!options.validateOnly) {
    console.log(`Generated: ${generatedCount}`);
    console.log(`Output: ${SCREENSHOTS_DIR}`);
  }

  if (errors.length > 0) {
    console.log();
    console.log(`Errors (${errors.length}):`);
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

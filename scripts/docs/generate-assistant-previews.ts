#!/usr/bin/env tsx

/**
 * Generate preview images showing how TUI components render
 * in different AI coding assistants.
 *
 * Creates:
 * - Individual assistant previews
 * - Comparison grid images
 *
 * Usage:
 *   pnpm docs:assistant-previews
 *   pnpm docs:assistant-previews --component sparkline
 *   pnpm docs:assistant-previews --assistant claude-code
 *   pnpm docs:assistant-previews --grid  # Generate comparison grids only
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
import {
  createRenderContext,
  createThemeSync,
  registry,
  type TuiComponent,
} from "@tuicomponents/core";
import {
  simulateRendering,
  getConfig,
  getAssistantIds,
} from "@tuicomponents/assistant-simulator";
import {
  getAssistantTheme,
  getAllAssistantThemes,
  type AssistantTheme,
} from "./assistant-themes.js";

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
const PREVIEWS_DIR = path.join(ROOT_DIR, "docs/assistant-previews");
const SCENARIOS_FILE = path.join(__dirname, "screenshot-scenarios.yaml");
const TMP_DIR = path.join(os.tmpdir(), "tui-assistant-previews");

interface Scenario {
  name: string;
  description: string;
  width?: number;
  input: unknown;
}

interface ScenariosFile {
  [component: string]: Scenario[];
}

interface PreviewOptions {
  useDocker: boolean;
  componentFilter?: string;
  assistantFilter?: string;
  gridOnly: boolean;
  verbose: boolean;
}

/**
 * Parse command line arguments.
 */
function parseArgs(): PreviewOptions {
  const args = process.argv.slice(2);
  let useDocker: boolean | undefined;
  let componentFilter: string | undefined;
  let assistantFilter: string | undefined;
  let gridOnly = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--docker") {
      useDocker = true;
    } else if (arg === "--native") {
      useDocker = false;
    } else if (arg === "--component" && args[i + 1]) {
      componentFilter = args[++i];
    } else if (arg === "--assistant" && args[i + 1]) {
      assistantFilter = args[++i];
    } else if (arg === "--grid") {
      gridOnly = true;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    }
  }

  if (useDocker === undefined) {
    useDocker = !isPlaywrightAvailable();
  }

  return { useDocker, componentFilter, assistantFilter, gridOnly, verbose };
}

/**
 * Check if Playwright is available locally.
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
 * Load scenarios from YAML file.
 */
function loadScenarios(): ScenariosFile {
  const content = fs.readFileSync(SCENARIOS_FILE, "utf-8");
  return YAML.parse(content) as ScenariosFile;
}

/**
 * Generate HTML for assistant-themed preview.
 */
function generatePreviewHtml(
  content: string,
  theme: AssistantTheme,
  _context: "command" | "chat"
): string {
  const escaped = JSON.stringify(content);
  const terminalTheme = JSON.stringify(theme.terminal);

  const borderRadius = theme.chrome.borderStyle === "rounded" ? "8px" : "0";
  const headerHtml = `
    <div class="header">
      ${theme.chrome.icon ? `<span class="icon">${theme.chrome.icon}</span>` : ""}
      <span class="title">${theme.chrome.headerText}</span>
    </div>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${theme.displayName} Preview</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a;
      padding: 20px;
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      border: 1px solid ${theme.chrome.borderColor};
      border-radius: ${borderRadius};
      overflow: hidden;
      display: inline-block;
    }
    .header {
      background: ${theme.terminal.background};
      border-bottom: 1px solid ${theme.chrome.borderColor};
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon { font-size: 16px; }
    .title {
      color: ${theme.chrome.headerColor};
      font-weight: 600;
      font-size: 13px;
    }
    #terminal {
      display: inline-block;
      padding: 12px;
    }
    .xterm-viewport { overflow: hidden !important; }
  </style>
</head>
<body>
  <div class="container">
    ${headerHtml}
    <div id="terminal"></div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
  <script>
    const content = ${escaped};
    const themeColors = ${terminalTheme};

    const terminal = new Terminal({
      fontFamily: '"Monaco", "Menlo", "Consolas", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.0,
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

      terminal.resize(Math.max(maxCol + 1, 40), maxRow);
      window.TERMINAL_READY = true;
    }, 100);
  </script>
</body>
</html>`;
}

/**
 * Take screenshot using Docker.
 */
function takeScreenshotDocker(
  htmlPath: string,
  outputPath: string,
  verbose: boolean
): void {
  const inputDir = path.dirname(htmlPath);
  const outputDir = path.dirname(outputPath);
  const outputFile = path.basename(outputPath);

  fs.mkdirSync(outputDir, { recursive: true });

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
 * Take screenshot using native Playwright.
 */
function takeScreenshotNative(
  htmlPath: string,
  outputPath: string,
  verbose: boolean
): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

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
 * Render component and get ANSI output.
 */
function renderComponent(
  component: TuiComponent,
  input: unknown,
  width = 80
): string {
  const context = createRenderContext({
    width,
    renderMode: "ansi",
    theme: createThemeSync(),
  });

  return component.render(input, context).output;
}

/**
 * Generate preview for a single assistant.
 */
async function generateAssistantPreview(
  componentName: string,
  scenario: Scenario,
  assistantId: string,
  rawOutput: string,
  options: PreviewOptions
): Promise<boolean> {
  const assistantConfig = getConfig(assistantId);
  const theme = getAssistantTheme(assistantId);
  const simulatedOutput = simulateRendering(rawOutput, assistantConfig, "chat");

  const outputDir = path.join(PREVIEWS_DIR, componentName, scenario.name);
  const tmpDir = path.join(TMP_DIR, componentName, scenario.name);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    const html = generatePreviewHtml(simulatedOutput.rendered, theme, "chat");
    const htmlPath = path.join(tmpDir, `${assistantId}.html`);
    fs.writeFileSync(htmlPath, html);

    const outputPath = path.join(outputDir, `${assistantId}.png`);

    if (options.useDocker) {
      takeScreenshotDocker(htmlPath, outputPath, options.verbose);
    } else {
      takeScreenshotNative(htmlPath, outputPath, options.verbose);
    }

    return true;
  } catch (err) {
    if (options.verbose) {
      console.error(`    Error for ${assistantId}: ${err}`);
    }
    return false;
  }
}

/**
 * Generate comparison grid image.
 */
async function generateComparisonGrid(
  componentName: string,
  scenario: Scenario,
  _options: PreviewOptions
): Promise<boolean> {
  const outputDir = path.join(PREVIEWS_DIR, componentName, scenario.name);
  const gridPath = path.join(outputDir, "comparison-grid.png");

  const assistantIds = getAssistantIds();
  const images: { path: string; id: string }[] = [];

  for (const id of assistantIds) {
    const imgPath = path.join(outputDir, `${id}.png`);
    if (fs.existsSync(imgPath)) {
      images.push({ path: imgPath, id });
    }
  }

  if (images.length < 2) {
    return false;
  }

  try {
    // Load all images and get their dimensions
    const loadedImages = await Promise.all(
      images.map(async (img) => {
        const metadata = await sharp(img.path).metadata();
        return {
          ...img,
          width: metadata.width || 400,
          height: metadata.height || 200,
        };
      })
    );

    // Calculate grid layout (2 columns)
    const cols = 2;
    const padding = 20;
    const maxWidth = Math.max(...loadedImages.map((i) => i.width));
    const rowHeights: number[] = [];

    for (let i = 0; i < loadedImages.length; i += cols) {
      const rowImages = loadedImages.slice(i, i + cols);
      rowHeights.push(Math.max(...rowImages.map((img) => img.height)));
    }

    const totalWidth = maxWidth * cols + padding * (cols + 1);
    const totalHeight =
      rowHeights.reduce((a, b) => a + b, 0) + padding * (rowHeights.length + 1);

    // Create composite
    const composites: sharp.OverlayOptions[] = [];
    let y = padding;

    for (let row = 0; row < Math.ceil(loadedImages.length / cols); row++) {
      let x = padding;
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (idx < loadedImages.length) {
          composites.push({
            input: loadedImages[idx].path,
            left: x,
            top: y,
          });
        }
        x += maxWidth + padding;
      }
      y += rowHeights[row] + padding;
    }

    await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 10, g: 10, b: 10, alpha: 1 },
      },
    })
      .composite(composites)
      .png()
      .toFile(gridPath);

    return true;
  } catch (err) {
    console.error(`  Error creating grid: ${err}`);
    return false;
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  const options = parseArgs();

  console.log("AI Assistant Preview Generator");
  console.log("==============================");
  console.log(`Mode: ${options.useDocker ? "Docker" : "Native Playwright"}`);

  if (options.componentFilter) {
    console.log(`Component filter: ${options.componentFilter}`);
  }
  if (options.assistantFilter) {
    console.log(`Assistant filter: ${options.assistantFilter}`);
  }
  if (options.gridOnly) {
    console.log("Grid only mode");
  }
  console.log();

  const scenarios = loadScenarios();
  const assistantIds = options.assistantFilter
    ? [options.assistantFilter]
    : getAssistantIds();

  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  let totalPreviews = 0;
  let generatedPreviews = 0;
  let generatedGrids = 0;

  for (const [componentName, componentScenarios] of Object.entries(scenarios)) {
    if (options.componentFilter && componentName !== options.componentFilter) {
      continue;
    }

    const component = registry.get(componentName);
    if (!component) {
      console.log(`⚠️  Component '${componentName}' not found, skipping`);
      continue;
    }

    console.log(`${componentName}`);

    for (const scenario of componentScenarios) {
      console.log(`  ${scenario.name}`);

      const rawOutput = renderComponent(
        component,
        scenario.input,
        scenario.width ?? 80
      );

      if (!options.gridOnly) {
        for (const assistantId of assistantIds) {
          totalPreviews++;
          process.stdout.write(`    ${assistantId}...`);

          const success = await generateAssistantPreview(
            componentName,
            scenario,
            assistantId,
            rawOutput,
            options
          );

          if (success) {
            generatedPreviews++;
            console.log(" ✓");
          } else {
            console.log(" ❌");
          }
        }
      }

      // Generate comparison grid
      process.stdout.write(`    comparison-grid...`);
      const gridSuccess = await generateComparisonGrid(
        componentName,
        scenario,
        options
      );
      if (gridSuccess) {
        generatedGrids++;
        console.log(" ✓");
      } else {
        console.log(" ⚠️ (not enough images)");
      }
    }
  }

  console.log();
  console.log("Summary");
  console.log("-------");
  console.log(`Previews generated: ${generatedPreviews}/${totalPreviews}`);
  console.log(`Comparison grids: ${generatedGrids}`);
  console.log(`Output: ${PREVIEWS_DIR}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

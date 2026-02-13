#!/usr/bin/env tsx

/**
 * Prototype: Test Xterm.js + Playwright screenshot approach
 *
 * This script renders the stacked-vertical chart example and captures
 * a screenshot using Xterm.js for authentic terminal rendering.
 * Playwright runs in Docker.
 */

// Force truecolor support
process.env["FORCE_COLOR"] = "3";

import { execSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  createRenderContext,
  createTestTheme,
  registry,
} from "@tuicomponents/core";
import "@tuicomponents/chart";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Background color in the terminal theme (as RGB values)
const BACKGROUND_COLOR = { r: 0x1e, g: 0x1e, b: 0x1e };
const COLOR_TOLERANCE = 5; // Allow slight color variations

/**
 * Crop the image to remove excess background padding.
 * Finds the bounding box of non-background content and crops with padding.
 */
async function cropToContent(imagePath: string, padding = 12): Promise<void> {
  const image = sharp(imagePath);
  const { width, height } = await image.metadata();

  if (!width || !height) {
    throw new Error("Could not get image dimensions");
  }

  // Get raw pixel data
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  // Find bounding box of non-background pixels
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

      // Check if pixel differs from background
      const isBackground =
        Math.abs(r - BACKGROUND_COLOR.r) <= COLOR_TOLERANCE &&
        Math.abs(g - BACKGROUND_COLOR.g) <= COLOR_TOLERANCE &&
        Math.abs(b - BACKGROUND_COLOR.b) <= COLOR_TOLERANCE;

      if (!isBackground) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Add padding and clamp to image bounds
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  console.log(`Cropping from ${width}x${height} to ${cropWidth}x${cropHeight}`);

  // Crop and save
  await sharp(imagePath)
    .extract({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight,
    })
    .toFile(imagePath.replace(".png", "-cropped.png"));

  // Replace original with cropped version
  fs.renameSync(imagePath.replace(".png", "-cropped.png"), imagePath);
}

function generateHtml(ansiContent: string): string {
  // Escape the content for embedding in JavaScript
  const escaped = JSON.stringify(ansiContent);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TUI Terminal Harness</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1e1e1e; padding: 12px; display: inline-block; }
    #terminal { display: inline-block; }
    .xterm-viewport { overflow: hidden !important; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
  <script>
    const content = ${escaped};

    const terminal = new Terminal({
      fontFamily: '"Monaco", "Menlo", "Consolas", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.0,
      letterSpacing: 0,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#1e1e1e',
        cursorAccent: '#1e1e1e',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
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

async function main() {
  console.log("Rendering stacked-vertical chart...");

  // Get the chart component
  const chart = registry.get("chart");
  if (!chart) {
    throw new Error("Chart component not found");
  }

  // Find the stacked-vertical example
  const example = chart.metadata.examples?.find(
    (e) => e.name === "stacked-vertical"
  );
  if (!example) {
    throw new Error("stacked-vertical example not found");
  }

  // Render with test theme for colors
  const context = createRenderContext({
    width: 80,
    renderMode: "ansi",
    theme: createTestTheme(),
  });

  const result = chart.render(example.input, context);
  console.log("Chart rendered successfully");

  // Generate HTML with embedded content
  const html = generateHtml(result.output);

  // Write HTML to /tmp directory (will be mounted into Docker)
  const tmpDir = "/tmp/tui-xterm-test";
  fs.mkdirSync(tmpDir, { recursive: true });

  const htmlPath = path.join(tmpDir, "terminal.html");
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML saved to: ${htmlPath}`);

  // Output directory
  const outputDir = path.join(__dirname, "../../docs/screenshots");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "test-xterm-stacked-vertical.png");

  // Run Playwright in Docker to take screenshot
  console.log("Running Playwright in Docker...");

  const dockerCmd = [
    "docker run --rm",
    `-v "${tmpDir}:/input"`,
    `-v "${outputDir}:/output"`,
    "mcr.microsoft.com/playwright:v1.58.2-jammy",
    "npx -y playwright screenshot",
    "--wait-for-timeout=1000", // Wait for xterm.js to render
    "--full-page", // Capture just the content, not full viewport
    '"file:///input/terminal.html"',
    '"/output/test-xterm-stacked-vertical.png"',
  ].join(" ");

  console.log(`Executing: ${dockerCmd}`);

  try {
    execSync(dockerCmd, { stdio: "inherit" });
    console.log(`\nScreenshot saved to: ${outputPath}`);
  } catch (err) {
    console.error("Docker command failed:", err);
    throw err;
  }

  // Crop the image to remove excess background
  console.log("\nCropping image to content...");
  await cropToContent(outputPath);
  console.log(`Cropped screenshot saved to: ${outputPath}`);

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

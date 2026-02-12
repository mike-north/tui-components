#!/usr/bin/env tsx

/**
 * Test PNG screenshot generation for sparkline component.
 */

import { firefox } from "playwright";
import Convert from "ansi-to-html";
import * as fs from "node:fs";
import * as path from "node:path";

// Import component
import { createRenderContext, createTestTheme } from "@tuicomponents/core";
import "@tuicomponents/sparkline";
import { registry } from "@tuicomponents/core";

const convert = new Convert({
  fg: "#D3D3D3",
  bg: "#1e1e1e",
  newline: true,
});

async function main() {
  // Render sparkline
  const component = registry.get("sparkline");
  if (!component) throw new Error("Sparkline not found");

  const context = createRenderContext({
    width: 80,
    renderMode: "ansi",
    theme: createTestTheme(),
  });

  const result = component.render(
    { values: [1, 2, 3, 4, 5, 6, 7, 8] },
    context
  );
  const ansiOutput = result.output;

  console.log("ANSI output:");
  console.log(ansiOutput);
  console.log();

  // Convert to HTML
  const html = convert.toHtml(ansiOutput);
  console.log("HTML output:");
  console.log(html);
  console.log();

  // Create full HTML page
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #1e1e1e;
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 16px;
      line-height: 1.4;
    }
    pre {
      margin: 0;
      color: #D3D3D3;
      white-space: pre;
    }
  </style>
</head>
<body>
  <pre>${html}</pre>
</body>
</html>
`;

  // Screenshot with Playwright (using Firefox)
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(fullHtml);

  // Get the pre element's bounding box for tight screenshot
  const preElement = await page.$("pre");
  if (!preElement) throw new Error("Pre element not found");

  const boundingBox = await preElement.boundingBox();
  if (!boundingBox) throw new Error("Could not get bounding box");

  // Add padding around the content
  const padding = 20;
  const outputPath = path.join(
    process.cwd(),
    "docs/images/sparkline/test-basic.png"
  );

  await page.screenshot({
    path: outputPath,
    clip: {
      x: Math.max(0, boundingBox.x - padding),
      y: Math.max(0, boundingBox.y - padding),
      width: boundingBox.width + padding * 2,
      height: boundingBox.height + padding * 2,
    },
  });

  await browser.close();

  console.log(`Screenshot saved to: ${outputPath}`);
}

main().catch(console.error);

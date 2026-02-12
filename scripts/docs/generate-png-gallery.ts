#!/usr/bin/env tsx

/**
 * Generate PNG screenshots for all component examples and create an HTML gallery.
 */

// Force truecolor support for ANSI rendering (required when not in a TTY)
process.env["FORCE_COLOR"] = "3";

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import Convert from "ansi-to-html";
import {
  createRenderContext,
  createTestTheme,
  registry,
} from "@tuicomponents/core";

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

const convert = new Convert({
  fg: "#D3D3D3",
  bg: "#1e1e1e",
  newline: true,
});

const testTheme = createTestTheme();

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

const SNAPSHOT_WIDTH = 80;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\\w-]/g, "");
}

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

interface RenderedExample {
  componentName: string;
  exampleName: string;
  slug: string;
  html: string;
  pngPath: string;
}

function renderExample(
  componentName: string,
  exampleName: string,
  exampleInput: unknown
): RenderedExample {
  const component = registry.get(componentName);
  if (!component) {
    throw new Error(`Component "${componentName}" not found`);
  }

  const context = createRenderContext({
    width: SNAPSHOT_WIDTH,
    renderMode: "ansi",
    theme: testTheme,
  });

  const result = component.render(exampleInput, context);
  // Add trailing spaces to each line to prevent full block (█) clipping
  const paddedOutput = result.output
    .split("\n")
    .map((line) => line + "  ")
    .join("\n");
  const html = convert.toHtml(paddedOutput);
  const slug = slugify(exampleName);

  return {
    componentName,
    exampleName,
    slug,
    html,
    pngPath: `pngs/${componentName}/${slug}.png`,
  };
}

function generateHtmlPage(examples: RenderedExample[]): string {
  const exampleDivs = examples
    .map(
      (ex, index) => `
    <div class="example" id="example-${index}">
      <h3>${ex.componentName} / ${ex.exampleName}</h3>
      <div class="render-container">
        <pre>${ex.html}</pre>
      </div>
    </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TUI Components Gallery</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #2d2d2d;
      color: #fff;
      padding: 20px;
      margin: 0;
    }
    h1 {
      color: #fff;
      border-bottom: 2px solid #444;
      padding-bottom: 10px;
    }
    h2 {
      color: #aaa;
      margin-top: 40px;
    }
    h3 {
      color: #888;
      font-size: 14px;
      margin: 10px 0 5px 0;
    }
    .example {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .render-container {
      background: #1e1e1e;
      padding: 15px;
      padding-right: 25px; /* Extra padding for full block character */
      border-radius: 8px;
      display: inline-block;
      min-width: 200px;
      overflow: visible;
    }
    pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      line-height: 0.95;
      color: #D3D3D3;
      white-space: pre;
      letter-spacing: -0.02em;
      overflow: visible;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }
  </style>
</head>
<body>
  <h1>TUI Components Visual Gallery</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>Total examples: ${examples.length}</p>

  <div class="grid">
    ${exampleDivs}
  </div>
</body>
</html>`;
}

function generatePngIndexHtml(examples: RenderedExample[]): string {
  // Group by component
  const grouped = new Map<string, RenderedExample[]>();
  for (const ex of examples) {
    const list = grouped.get(ex.componentName) || [];
    list.push(ex);
    grouped.set(ex.componentName, list);
  }

  let content = "";
  for (const [componentName, exList] of grouped) {
    content += `<h2>${componentName}</h2>\n<div class="component-grid">\n`;
    for (const ex of exList) {
      content += `
      <div class="example">
        <h3>${ex.exampleName}</h3>
        <img src="${ex.pngPath}" alt="${ex.componentName} - ${ex.exampleName}">
      </div>`;
    }
    content += `</div>\n`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TUI Components PNG Gallery</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: #fff;
      padding: 20px;
      margin: 0;
    }
    h1 { color: #fff; border-bottom: 2px solid #444; padding-bottom: 10px; }
    h2 { color: #aaa; margin-top: 40px; border-bottom: 1px solid #333; padding-bottom: 5px; }
    h3 { color: #888; font-size: 12px; margin: 5px 0; }
    .component-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 10px;
    }
    .example {
      background: #2d2d2d;
      padding: 10px;
      border-radius: 8px;
    }
    img {
      max-width: 100%;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>TUI Components PNG Gallery</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>Total examples: ${examples.length}</p>
  ${content}
</body>
</html>`;
}

async function main() {
  console.log("Generating component gallery...\n");

  const galleryDir = path.join(process.cwd(), "docs", "gallery");
  const pngDir = path.join(galleryDir, "pngs");
  ensureDirectory(galleryDir);

  const allExamples: RenderedExample[] = [];

  // Render all examples
  for (const componentName of VISUAL_COMPONENTS) {
    const component = registry.get(componentName);
    if (!component) {
      console.warn(`Component "${componentName}" not found`);
      continue;
    }

    const { examples } = component.metadata;
    if (!examples || examples.length === 0) {
      console.log(`${componentName}: no examples`);
      continue;
    }

    console.log(`${componentName}: ${examples.length} examples`);
    ensureDirectory(path.join(pngDir, componentName));

    for (const example of examples) {
      try {
        const rendered = renderExample(
          componentName,
          example.name,
          example.input
        );
        allExamples.push(rendered);
      } catch (error) {
        console.error(`  Error rendering ${example.name}:`, error);
      }
    }
  }

  console.log(`\nTotal examples: ${allExamples.length}`);

  // Generate the HTML gallery (for direct viewing)
  const htmlGallery = generateHtmlPage(allExamples);
  const htmlGalleryPath = path.join(galleryDir, "gallery.html");
  fs.writeFileSync(htmlGalleryPath, htmlGallery);
  console.log(`\nHTML gallery: ${htmlGalleryPath}`);

  // Generate individual HTML files for PNG screenshots
  const tmpDir = "/tmp/tui-gallery";
  ensureDirectory(tmpDir);

  for (let i = 0; i < allExamples.length; i++) {
    const ex = allExamples[i];
    const singleHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 15px;
      background: #1e1e1e;
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.3;
    }
    pre {
      margin: 0;
      color: #D3D3D3;
      white-space: pre;
      letter-spacing: -0.02em;
    }
  </style>
</head>
<body>
  <pre>${ex.html}</pre>
</body>
</html>`;
    fs.writeFileSync(path.join(tmpDir, `${i}.html`), singleHtml);
  }

  // Generate shell script to create PNGs via Docker
  const dockerScript = `#!/bin/bash
set -e

GALLERY_DIR="${galleryDir}"
TMP_DIR="${tmpDir}"
PNG_DIR="${pngDir}"

echo "Generating ${allExamples.length} PNG screenshots..."

${allExamples
  .map((ex, i) => {
    const outDir = path.join(pngDir, ex.componentName);
    return `
# ${ex.componentName}/${ex.exampleName}
docker run --rm -v "$TMP_DIR:/input" -v "${outDir}:/output" \\
  mcr.microsoft.com/playwright:v1.58.2-jammy \\
  npx -y playwright screenshot --viewport-size="800,600" --full-page \\
  "file:///input/${i}.html" "/output/${ex.slug}.png" 2>/dev/null
echo "  ✓ ${ex.componentName}/${ex.slug}"`;
  })
  .join("\n")}

echo ""
echo "Done! Generated ${allExamples.length} PNGs"
`;

  const dockerScriptPath = path.join(galleryDir, "generate-pngs.sh");
  fs.writeFileSync(dockerScriptPath, dockerScript);
  fs.chmodSync(dockerScriptPath, "755");
  console.log(`Docker script: ${dockerScriptPath}`);

  // Generate PNG index HTML
  const pngIndexHtml = generatePngIndexHtml(allExamples);
  fs.writeFileSync(path.join(galleryDir, "index.html"), pngIndexHtml);
  console.log(`PNG index: ${path.join(galleryDir, "index.html")}`);

  console.log(`
Next steps:
1. View HTML gallery directly: open ${htmlGalleryPath}
2. Or generate PNGs: ${dockerScriptPath}
   Then view: open ${path.join(galleryDir, "index.html")}
`);
}

main().catch(console.error);

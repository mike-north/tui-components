/**
 * Screenshot Comparison Generator
 *
 * Creates side-by-side comparison images showing different render modes
 * for TUI components. Uses sharp for image composition.
 *
 * Features:
 * - Combines multiple screenshots into a single comparison image
 * - Adds mode labels above each screenshot
 * - Configurable horizontal layout
 * - Automatic sizing and alignment
 */

import sharp from "sharp";
import * as fs from "node:fs";

/**
 * Layout configuration for comparison images
 */
export interface ComparisonLayout {
  /** Horizontal spacing between images in pixels */
  spacing: number;
  /** Vertical padding for labels in pixels */
  labelHeight: number;
  /** Overall padding around the composite in pixels */
  padding: number;
  /** Font size for labels in pixels */
  fontSize: number;
}

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT: ComparisonLayout = {
  spacing: 20,
  labelHeight: 30,
  padding: 20,
  fontSize: 16,
};

/**
 * A single screenshot with its mode label
 */
export interface ScreenshotInput {
  /** Path to the screenshot image file */
  path: string;
  /** Label to display above the image (e.g., "ANSI", "Markdown") */
  label: string;
}

/**
 * Escape XML special characters for SVG
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Create an SVG text label
 *
 * Generates an SVG element containing styled text for the mode label.
 * The SVG will be rendered as an image and composited with the screenshots.
 */
function createLabelSvg(
  text: string,
  width: number,
  height: number,
  fontSize: number
): string {
  const escapedText = escapeXml(text);
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>
      <text
        x="${width / 2}"
        y="${height / 2 + fontSize / 3}"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="#333333"
        text-anchor="middle">
        ${escapedText}
      </text>
    </svg>
  `;
}

/**
 * Load and measure a screenshot image
 */
async function loadScreenshot(
  path: string
): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (!fs.existsSync(path)) {
    throw new Error(`Screenshot not found: ${path}`);
  }

  const image = sharp(path);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions: ${path}`);
  }

  const buffer = await image.toBuffer();

  return {
    buffer,
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * Generate a side-by-side comparison image
 *
 * Combines multiple screenshot images horizontally with labels above each.
 * All images are aligned at the top, and the output dimensions are calculated
 * automatically based on the input images.
 *
 * @param screenshots - Array of screenshot inputs with paths and labels
 * @param outputPath - Where to save the generated comparison image
 * @param layout - Optional layout configuration (uses defaults if not provided)
 *
 * @example
 * ```typescript
 * await generateComparison(
 *   [
 *     { path: "chart.png", label: "ANSI" },
 *     { path: "chart-markdown.png", label: "Markdown" },
 *     { path: "chart-grayscale.png", label: "Grayscale" },
 *   ],
 *   "chart-comparison.png"
 * );
 * ```
 */
export async function generateComparison(
  screenshots: ScreenshotInput[],
  outputPath: string,
  layout: Partial<ComparisonLayout> = {}
): Promise<void> {
  if (screenshots.length === 0) {
    throw new Error("At least one screenshot is required");
  }

  // Merge with defaults
  const config: ComparisonLayout = { ...DEFAULT_LAYOUT, ...layout };

  // Load all screenshots
  const images = await Promise.all(
    screenshots.map((s) => loadScreenshot(s.path))
  );

  // Calculate dimensions
  const maxHeight = Math.max(...images.map((img) => img.height));
  const totalWidth =
    images.reduce((sum, img) => sum + img.width, 0) +
    config.spacing * (images.length - 1);

  const canvasWidth = totalWidth + config.padding * 2;
  const canvasHeight =
    maxHeight + config.labelHeight + config.padding * 2 + config.spacing;

  // Create white canvas
  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });

  // Prepare composite operations
  const composites: Array<{
    input: Buffer;
    top: number;
    left: number;
  }> = [];

  let currentX = config.padding;

  for (let i = 0; i < screenshots.length; i++) {
    const screenshot = screenshots[i];
    const image = images[i];

    // Generate label SVG
    const labelSvg = createLabelSvg(
      screenshot.label,
      image.width,
      config.labelHeight,
      config.fontSize
    );
    const labelBuffer = await sharp(Buffer.from(labelSvg)).png().toBuffer();

    // Add label
    composites.push({
      input: labelBuffer,
      top: config.padding,
      left: currentX,
    });

    // Add screenshot
    composites.push({
      input: image.buffer,
      top: config.padding + config.labelHeight + config.spacing,
      left: currentX,
    });

    currentX += image.width + config.spacing;
  }

  // Composite all elements
  await canvas.composite(composites).png().toFile(outputPath);
}

/**
 * Generate comparison for a specific scenario
 *
 * Helper function that generates a comparison image for a scenario given
 * the component name and scenario name. Automatically constructs file paths
 * based on standard naming conventions.
 *
 * @param componentName - Name of the component (e.g., "chart")
 * @param scenarioName - Name of the scenario (e.g., "basic")
 * @param screenshotsDir - Base directory containing screenshots
 * @param modes - Array of mode suffixes (empty string for default ANSI)
 *
 * @example
 * ```typescript
 * await generateScenarioComparison(
 *   "chart",
 *   "basic",
 *   "docs/screenshots",
 *   ["", "-markdown", "-grayscale"]
 * );
 * // Generates: docs/screenshots/chart/basic-comparison.png
 * ```
 */
export async function generateScenarioComparison(
  componentName: string,
  scenarioName: string,
  screenshotsDir: string,
  modes: Array<{ suffix: string; label: string }>
): Promise<void> {
  const componentDir = `${screenshotsDir}/${componentName}`;

  const screenshots: ScreenshotInput[] = modes.map((mode) => ({
    path: `${componentDir}/${scenarioName}${mode.suffix}.png`,
    label: mode.label,
  }));

  const outputPath = `${componentDir}/${scenarioName}-comparison.png`;

  await generateComparison(screenshots, outputPath);
}

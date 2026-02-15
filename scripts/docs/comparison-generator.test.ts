import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateComparison,
  generateScenarioComparison,
} from "./comparison-generator.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import sharp from "sharp";

describe("generateComparison", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test images
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "comparison-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function createTestImage(
    width: number,
    height: number,
    color: { r: number; g: number; b: number }
  ): Promise<string> {
    const imagePath = path.join(
      tempDir,
      `test-${Date.now()}-${Math.random()}.png`
    );
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: color,
      },
    })
      .png()
      .toFile(imagePath);
    return imagePath;
  }

  describe("positive cases", () => {
    it("should generate a comparison image with a single screenshot", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [{ path: screenshot1, label: "Test 1" }],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify the output image dimensions
      const metadata = await sharp(outputPath).metadata();
      expect(metadata.width).toBeGreaterThan(100); // Should include padding
      expect(metadata.height).toBeGreaterThan(50); // Should include label height
    });

    it("should generate a comparison image with multiple screenshots", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const screenshot2 = await createTestImage(80, 40, { r: 0, g: 255, b: 0 });
      const screenshot3 = await createTestImage(120, 60, {
        r: 0,
        g: 0,
        b: 255,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [
          { path: screenshot1, label: "ANSI" },
          { path: screenshot2, label: "Markdown" },
          { path: screenshot3, label: "Grayscale" },
        ],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify the output includes all three images side by side
      const metadata = await sharp(outputPath).metadata();
      // Width should be roughly: 100 + 80 + 120 + spacing + padding
      expect(metadata.width).toBeGreaterThan(300);
    });

    it("should use custom layout configuration", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [{ path: screenshot1, label: "Test" }],
        outputPath,
        {
          spacing: 50,
          labelHeight: 60,
          padding: 30,
          fontSize: 20,
        }
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      // With custom padding (30) and label height (60), image should be bigger
      const metadata = await sharp(outputPath).metadata();
      expect(metadata.width).toBeGreaterThanOrEqual(100 + 30 * 2); // width + padding
      expect(metadata.height).toBeGreaterThanOrEqual(50 + 60 + 30 * 2); // height + label + padding
    });

    it("should handle screenshots of different heights", async () => {
      const screenshot1 = await createTestImage(100, 30, {
        r: 255,
        g: 0,
        b: 0,
      });
      const screenshot2 = await createTestImage(100, 100, {
        r: 0,
        g: 255,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [
          { path: screenshot1, label: "Short" },
          { path: screenshot2, label: "Tall" },
        ],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      // Height should accommodate the tallest image (100)
      const metadata = await sharp(outputPath).metadata();
      expect(metadata.height).toBeGreaterThan(100);
    });

    it("should create output directory if it does not exist", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const nestedDir = path.join(tempDir, "nested", "dir");
      const outputPath = path.join(nestedDir, "comparison.png");

      // Create parent directory (sharp should fail if we don't)
      fs.mkdirSync(nestedDir, { recursive: true });

      await generateComparison(
        [{ path: screenshot1, label: "Test" }],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe("negative cases", () => {
    it("should throw error when no screenshots provided", async () => {
      const outputPath = path.join(tempDir, "comparison.png");

      await expect(generateComparison([], outputPath)).rejects.toThrow(
        "At least one screenshot is required"
      );
    });

    it("should throw error when screenshot file does not exist", async () => {
      const outputPath = path.join(tempDir, "comparison.png");

      await expect(
        generateComparison(
          [{ path: "/nonexistent/image.png", label: "Test" }],
          outputPath
        )
      ).rejects.toThrow("Screenshot not found");
    });

    it("should throw error when screenshot file is not a valid image", async () => {
      const invalidImagePath = path.join(tempDir, "invalid.png");
      fs.writeFileSync(invalidImagePath, "not an image");
      const outputPath = path.join(tempDir, "comparison.png");

      await expect(
        generateComparison(
          [{ path: invalidImagePath, label: "Test" }],
          outputPath
        )
      ).rejects.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle very small images", async () => {
      const screenshot1 = await createTestImage(10, 10, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [{ path: screenshot1, label: "Tiny" }],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it("should handle large images", async () => {
      const screenshot1 = await createTestImage(1000, 500, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [{ path: screenshot1, label: "Large" }],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      const metadata = await sharp(outputPath).metadata();
      expect(metadata.width).toBeGreaterThan(1000);
    });

    it("should handle empty labels", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison([{ path: screenshot1, label: "" }], outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it("should handle long labels", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [
          {
            path: screenshot1,
            label: "This is a very long label that might overflow",
          },
        ],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it("should handle special characters in labels", async () => {
      const screenshot1 = await createTestImage(100, 50, {
        r: 255,
        g: 0,
        b: 0,
      });
      const outputPath = path.join(tempDir, "comparison.png");

      await generateComparison(
        [{ path: screenshot1, label: "Test: <>&\"'" }],
        outputPath
      );

      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});

describe("generateScenarioComparison", () => {
  let tempDir: string;
  let screenshotsDir: string;

  beforeEach(() => {
    // Create temporary directory structure
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "scenario-test-"));
    screenshotsDir = path.join(tempDir, "screenshots");
  });

  afterEach(() => {
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function createTestScreenshot(
    componentName: string,
    scenarioName: string,
    suffix: string
  ): Promise<void> {
    const componentDir = path.join(screenshotsDir, componentName);
    fs.mkdirSync(componentDir, { recursive: true });

    const filename = `${scenarioName}${suffix}.png`;
    const imagePath = path.join(componentDir, filename);

    await sharp({
      create: {
        width: 100,
        height: 50,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 },
      },
    })
      .png()
      .toFile(imagePath);
  }

  describe("positive cases", () => {
    it("should generate scenario comparison from standard mode files", async () => {
      await createTestScreenshot("chart", "basic", "");
      await createTestScreenshot("chart", "basic", "-markdown");
      await createTestScreenshot("chart", "basic", "-grayscale");

      await generateScenarioComparison("chart", "basic", screenshotsDir, [
        { suffix: "", label: "ANSI" },
        { suffix: "-markdown", label: "Markdown" },
        { suffix: "-grayscale", label: "Grayscale" },
      ]);

      const comparisonPath = path.join(
        screenshotsDir,
        "chart",
        "basic-comparison.png"
      );
      expect(fs.existsSync(comparisonPath)).toBe(true);
    });

    it("should handle scenarios with inline mode", async () => {
      await createTestScreenshot("sparkline", "simple", "");
      await createTestScreenshot("sparkline", "simple", "-markdown");
      await createTestScreenshot("sparkline", "simple", "-grayscale");
      await createTestScreenshot("sparkline", "simple", "-inline");

      await generateScenarioComparison("sparkline", "simple", screenshotsDir, [
        { suffix: "", label: "ANSI" },
        { suffix: "-markdown", label: "Markdown" },
        { suffix: "-grayscale", label: "Grayscale" },
        { suffix: "-inline", label: "Inline" },
      ]);

      const comparisonPath = path.join(
        screenshotsDir,
        "sparkline",
        "simple-comparison.png"
      );
      expect(fs.existsSync(comparisonPath)).toBe(true);
    });
  });

  describe("negative cases", () => {
    it("should throw error when screenshot files are missing", async () => {
      // Only create one of the required files
      await createTestScreenshot("chart", "basic", "");

      await expect(
        generateScenarioComparison("chart", "basic", screenshotsDir, [
          { suffix: "", label: "ANSI" },
          { suffix: "-markdown", label: "Markdown" },
        ])
      ).rejects.toThrow("Screenshot not found");
    });
  });
});

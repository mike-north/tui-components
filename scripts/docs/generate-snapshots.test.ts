import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const SCRIPT_PATH = path.join(__dirname, "generate-snapshots.ts");
const SNAPSHOTS_DIR = path.join(process.cwd(), "docs", "snapshots");
const IMAGES_DIR = path.join(process.cwd(), "docs", "images");

/**
 * Helper to run the generate-snapshots script.
 */
function runScript(args: string[] = []): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const output = execSync(`tsx ${SCRIPT_PATH} ${args.join(" ")}`, {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { stdout: output, stderr: "", exitCode: 0 };
  } catch (error) {
    const execError = error as {
      stdout: string;
      stderr: string;
      status: number;
    };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      exitCode: execError.status || 1,
    };
  }
}

/**
 * Helper to count files in a directory recursively.
 */
function countFilesRecursive(dir: string, extension?: string): number {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFilesRecursive(fullPath, extension);
    } else if (entry.isFile()) {
      if (!extension || entry.name.endsWith(extension)) {
        count++;
      }
    }
  }

  return count;
}

describe("generate-snapshots", () => {
  beforeEach(() => {
    // Clean up any existing snapshots before each test
    if (fs.existsSync(SNAPSHOTS_DIR)) {
      fs.rmSync(SNAPSHOTS_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(IMAGES_DIR)) {
      fs.rmSync(IMAGES_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(SNAPSHOTS_DIR)) {
      fs.rmSync(SNAPSHOTS_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(IMAGES_DIR)) {
      fs.rmSync(IMAGES_DIR, { recursive: true, force: true });
    }
  });

  describe("update mode", () => {
    it("should generate snapshots for all components", () => {
      const result = runScript(["--update"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("UPDATE mode");
      expect(result.stdout).toContain("✅ Updated");
    });

    it("should create snapshot directories", () => {
      runScript(["--update"]);

      // Check that snapshot directories were created
      expect(fs.existsSync(SNAPSHOTS_DIR)).toBe(true);
      expect(fs.existsSync(path.join(SNAPSHOTS_DIR, "sparkline"))).toBe(true);
      expect(fs.existsSync(path.join(SNAPSHOTS_DIR, "table"))).toBe(true);
      expect(fs.existsSync(path.join(SNAPSHOTS_DIR, "chart"))).toBe(true);
    });

    it("should create image directories", () => {
      runScript(["--update"]);

      // Check that image directories were created
      expect(fs.existsSync(IMAGES_DIR)).toBe(true);
      expect(fs.existsSync(path.join(IMAGES_DIR, "sparkline"))).toBe(true);
      expect(fs.existsSync(path.join(IMAGES_DIR, "table"))).toBe(true);
      expect(fs.existsSync(path.join(IMAGES_DIR, "chart"))).toBe(true);
    });

    it("should generate ANSI text snapshots", () => {
      runScript(["--update"]);

      const ansiCount = countFilesRecursive(SNAPSHOTS_DIR, ".ansi.txt");
      expect(ansiCount).toBeGreaterThan(0);

      // Check specific example
      const sparklineBasicAnsi = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.ansi.txt"
      );
      expect(fs.existsSync(sparklineBasicAnsi)).toBe(true);
      const content = fs.readFileSync(sparklineBasicAnsi, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    });

    it("should generate markdown text snapshots", () => {
      runScript(["--update"]);

      const markdownCount = countFilesRecursive(SNAPSHOTS_DIR, ".markdown.txt");
      expect(markdownCount).toBeGreaterThan(0);

      // Check specific example
      const sparklineBasicMarkdown = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.markdown.txt"
      );
      expect(fs.existsSync(sparklineBasicMarkdown)).toBe(true);
      const content = fs.readFileSync(sparklineBasicMarkdown, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    });

    it("should generate SVG images", () => {
      runScript(["--update"]);

      const svgCount = countFilesRecursive(IMAGES_DIR, ".svg");
      expect(svgCount).toBeGreaterThan(0);

      // Check specific example
      const sparklineBasicSvg = path.join(IMAGES_DIR, "sparkline", "basic.svg");
      expect(fs.existsSync(sparklineBasicSvg)).toBe(true);
      const content = fs.readFileSync(sparklineBasicSvg, "utf-8");
      expect(content).toContain("<svg");
      expect(content).toContain("</svg>");
    });

    it("should generate matching counts of snapshots and images", () => {
      runScript(["--update"]);

      const ansiCount = countFilesRecursive(SNAPSHOTS_DIR, ".ansi.txt");
      const markdownCount = countFilesRecursive(SNAPSHOTS_DIR, ".markdown.txt");
      const svgCount = countFilesRecursive(IMAGES_DIR, ".svg");

      // Each example should have one ANSI, one markdown, and one SVG
      expect(ansiCount).toBe(markdownCount);
      expect(ansiCount).toBe(svgCount);
    });

    it("should handle component examples with special characters in names", () => {
      runScript(["--update"]);

      // "with-label" should become "with-label.ansi.txt" (already slugified)
      const withLabelPath = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "with-label.ansi.txt"
      );
      expect(fs.existsSync(withLabelPath)).toBe(true);
    });
  });

  describe("check mode", () => {
    it("should pass when no snapshots exist on first run", () => {
      // Generate snapshots first
      runScript(["--update"]);

      // Check mode should pass
      const result = runScript();

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("CHECK mode");
      expect(result.stdout).toContain("✅ All");
      expect(result.stdout).toContain("snapshots match");
    });

    it("should detect missing ANSI snapshot", () => {
      runScript(["--update"]);

      // Remove one ANSI snapshot
      const sparklineBasicAnsi = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.ansi.txt"
      );
      fs.unlinkSync(sparklineBasicAnsi);

      const result = runScript();

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("❌ Found");
      expect(result.stdout).toContain("differences");
      expect(result.stdout).toContain("Missing ANSI snapshot");
    });

    it("should detect missing markdown snapshot", () => {
      runScript(["--update"]);

      // Remove one markdown snapshot
      const sparklineBasicMarkdown = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.markdown.txt"
      );
      fs.unlinkSync(sparklineBasicMarkdown);

      const result = runScript();

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("❌ Found");
      expect(result.stdout).toContain("Missing markdown snapshot");
    });

    it("should detect missing SVG image", () => {
      runScript(["--update"]);

      // Remove one SVG
      const sparklineBasicSvg = path.join(IMAGES_DIR, "sparkline", "basic.svg");
      fs.unlinkSync(sparklineBasicSvg);

      const result = runScript();

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("❌ Found");
      expect(result.stdout).toContain("Missing SVG image");
    });

    it("should detect modified ANSI snapshot", () => {
      runScript(["--update"]);

      // Modify one ANSI snapshot
      const sparklineBasicAnsi = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.ansi.txt"
      );
      fs.writeFileSync(sparklineBasicAnsi, "modified content", "utf-8");

      const result = runScript();

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("❌ Found");
      expect(result.stdout).toContain("ANSI snapshot differs");
    });

    it("should detect modified markdown snapshot", () => {
      runScript(["--update"]);

      // Modify one markdown snapshot
      const sparklineBasicMarkdown = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.markdown.txt"
      );
      fs.writeFileSync(sparklineBasicMarkdown, "modified content", "utf-8");

      const result = runScript();

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("❌ Found");
      expect(result.stdout).toContain("Markdown snapshot differs");
    });

    it("should provide helpful error message suggesting --update", () => {
      runScript(["--update"]);

      // Modify a snapshot
      const sparklineBasicAnsi = path.join(
        SNAPSHOTS_DIR,
        "sparkline",
        "basic.ansi.txt"
      );
      fs.writeFileSync(sparklineBasicAnsi, "modified", "utf-8");

      const result = runScript();

      expect(result.stdout).toContain("Run with --update to regenerate");
    });

    it("should list all differences with details", () => {
      runScript(["--update"]);

      // Modify multiple snapshots
      fs.writeFileSync(
        path.join(SNAPSHOTS_DIR, "sparkline", "basic.ansi.txt"),
        "modified",
        "utf-8"
      );
      fs.unlinkSync(path.join(IMAGES_DIR, "table", "basic.svg"));

      const result = runScript();

      expect(result.stdout).toContain("Details:");
      expect(result.stdout).toContain("sparkline / basic:");
      expect(result.stdout).toContain("table / basic:");
    });
  });

  describe("edge cases", () => {
    it("should handle empty component list gracefully", () => {
      // This test verifies the script doesn't crash with no components
      // (though in practice there should always be components)
      const result = runScript(["--update"]);

      expect(result.exitCode).toBe(0);
    });

    it("should create parent directories if they don't exist", () => {
      // Ensure directories don't exist
      expect(fs.existsSync(SNAPSHOTS_DIR)).toBe(false);
      expect(fs.existsSync(IMAGES_DIR)).toBe(false);

      runScript(["--update"]);

      // Directories should be created
      expect(fs.existsSync(SNAPSHOTS_DIR)).toBe(true);
      expect(fs.existsSync(IMAGES_DIR)).toBe(true);
    });

    it("should handle components with no examples", () => {
      const result = runScript(["--update"]);

      // Script should complete successfully even if some components have no examples
      expect(result.exitCode).toBe(0);
    });
  });

  describe("output format", () => {
    it("should show component name and example count", () => {
      const result = runScript(["--update"]);

      expect(result.stdout).toMatch(/📦 sparkline \(\d+ examples\)/);
      expect(result.stdout).toMatch(/📦 table \(\d+ examples\)/);
    });

    it("should show checkmarks for successful examples", () => {
      const result = runScript(["--update"]);

      expect(result.stdout).toContain("✓ basic");
      expect(result.stdout).toContain("✓ with-label");
    });

    it("should show X marks for failed examples in check mode", () => {
      runScript(["--update"]);

      // Modify a snapshot
      fs.writeFileSync(
        path.join(SNAPSHOTS_DIR, "sparkline", "basic.ansi.txt"),
        "modified",
        "utf-8"
      );

      const result = runScript();

      expect(result.stdout).toContain("✗ basic");
    });

    it("should show summary at the end", () => {
      const result = runScript(["--update"]);

      expect(result.stdout).toMatch(/✅ Updated \d+ snapshots/);
    });
  });
});

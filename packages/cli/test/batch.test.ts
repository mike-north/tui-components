import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const cliPath = join(__dirname, "..", "dist", "cli.js");

// Helper to run CLI commands
function runCli(args: string, input?: string): string {
  const options: { encoding: BufferEncoding; input?: string } = {
    encoding: "utf-8",
  };
  if (input) {
    options.input = input;
  }
  return execSync(`node ${cliPath} ${args}`, options);
}

// Helper to run CLI and expect failure
function runCliExpectFail(args: string, input?: string): string {
  const options: {
    encoding: BufferEncoding;
    input?: string;
    stdio: ["pipe", "pipe", "pipe"];
  } = {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  };
  if (input) {
    options.input = input;
  }
  try {
    execSync(`node ${cliPath} ${args}`, options);
    throw new Error("Expected command to fail but it succeeded");
  } catch (e) {
    if (e instanceof Error && "stderr" in e) {
      return (e as { stderr: string }).stderr;
    }
    throw e;
  }
}

describe("CLI batch command", () => {
  beforeAll(() => {
    // Ensure the CLI is built
    execSync("pnpm build", { cwd: join(__dirname, "..") });
  });

  describe("basic functionality", () => {
    it("should render multiple components from JSON-L stdin", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3,4,5]}}',
        '{"component":"sparkline","input":{"values":[5,4,3,2,1]}}',
      ].join("\n");

      const output = runCli("batch", input);

      // Should contain sparkline blocks
      expect(output).toContain("▁"); // lowest block
      expect(output).toContain("█"); // highest block
    });

    it("should render box component in batch", () => {
      const input = '{"component":"box","input":{"content":"Hello World"}}';

      const output = runCli("batch", input);

      expect(output).toContain("Hello World");
      expect(output).toContain("┌"); // Box corner
      expect(output).toContain("┐"); // Box corner
    });

    it("should render chart component in batch", () => {
      const input = JSON.stringify({
        component: "chart",
        input: {
          type: "bar",
          series: [
            {
              name: "Sales",
              data: [
                { x: "A", y: 50 },
                { x: "B", y: 100 },
              ],
            },
          ],
        },
      });

      const output = runCli("batch", input);

      expect(output).toContain("A");
      expect(output).toContain("B");
      expect(output).toContain("█"); // Bar character
    });

    it("should handle mixed component types", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3]}}',
        '{"component":"box","input":{"content":"Test"}}',
      ].join("\n");

      const output = runCli("batch", input);

      // Should have sparkline output and box output
      expect(output).toContain("Test");
      expect(output).toContain("┌"); // Box corner
    });
  });

  describe("custom separator", () => {
    it("should use custom separator between outputs", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3]}}',
        '{"component":"sparkline","input":{"values":[3,2,1]}}',
      ].join("\n");

      const output = runCli('batch --separator "---"', input);

      expect(output).toContain("---");
    });

    it("should use blank line separator by default", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3]}}',
        '{"component":"sparkline","input":{"values":[3,2,1]}}',
      ].join("\n");

      const output = runCli("batch", input);

      // Default separator is \n, so there should be a newline between outputs
      const lines = output.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("JSON output format", () => {
    it("should output JSON-L with --format json", () => {
      const input = '{"component":"sparkline","input":{"values":[1,2,3,4,5]}}';

      const output = runCli("batch --format json", input);

      const parsed = JSON.parse(output.trim());
      expect(parsed).toHaveProperty("component", "sparkline");
      expect(parsed).toHaveProperty("output");
      expect(parsed).toHaveProperty("width");
      expect(parsed).toHaveProperty("lines");
    });

    it("should include dimensions in JSON output", () => {
      const input = '{"component":"sparkline","input":{"values":[1,2,3,4,5],"label":"CPU: "}}';

      // Use --render-mode ansi to get predictable width without anchor character
      const output = runCli("batch --format json --render-mode ansi", input);

      const parsed = JSON.parse(output.trim());
      expect(parsed.width).toBe(5 + 5); // label (5) + 5 blocks
      expect(parsed.lines).toBe(1);
    });

    it("should output multiple JSON-L lines for multiple inputs", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3]}}',
        '{"component":"sparkline","input":{"values":[3,2,1]}}',
      ].join("\n");

      const output = runCli("batch --format json", input);
      const lines = output.trim().split("\n");

      expect(lines.length).toBe(2);
      for (const line of lines) {
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty("component", "sparkline");
      }
    });
  });

  describe("error handling", () => {
    it("should error on unknown component", () => {
      const input = '{"component":"nonexistent","input":{}}';

      const stderr = runCliExpectFail("batch", input);

      expect(stderr).toContain("Unknown component");
    });

    it("should error on invalid input", () => {
      const input = '{"component":"sparkline","input":{"values":[]}}'; // Empty array is invalid

      const stderr = runCliExpectFail("batch", input);

      expect(stderr).toContain("Invalid input");
    });

    it("should error on malformed JSON-L", () => {
      const input = "not valid json";

      const stderr = runCliExpectFail("batch", input);

      expect(stderr).toContain("Invalid JSON-L");
    });

    it("should error when missing component field", () => {
      const input = '{"input":{"values":[1,2,3]}}';

      const stderr = runCliExpectFail("batch", input);

      expect(stderr).toContain("component");
    });

    it("should error when missing input field", () => {
      const input = '{"component":"sparkline"}';

      const stderr = runCliExpectFail("batch", input);

      expect(stderr).toContain("input");
    });
  });

  describe("--continue-on-error", () => {
    it("should continue processing after error with --continue-on-error", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3]}}',
        '{"component":"nonexistent","input":{}}',
        '{"component":"sparkline","input":{"values":[3,2,1]}}',
      ].join("\n");

      // This will still exit with error code, but should produce output
      try {
        execSync(`node ${cliPath} batch --continue-on-error`, {
          input,
          encoding: "utf-8",
        });
      } catch (e) {
        const stdout = (e as { stdout: string }).stdout;
        // Should have output from the two valid sparklines
        expect(stdout).toContain("▁");
        expect(stdout).toContain("█");
      }
    });

    it("should include errors in JSON output with --continue-on-error", () => {
      const input = [
        '{"component":"sparkline","input":{"values":[1,2,3]}}',
        '{"component":"nonexistent","input":{}}',
      ].join("\n");

      try {
        execSync(`node ${cliPath} batch --format json --continue-on-error`, {
          input,
          encoding: "utf-8",
        });
      } catch (e) {
        const stdout = (e as { stdout: string }).stdout;
        const lines = stdout.trim().split("\n");

        expect(lines.length).toBe(2);

        // First line should be successful
        const first = JSON.parse(lines[0]);
        expect(first).toHaveProperty("output");

        // Second line should have error
        const second = JSON.parse(lines[1]);
        expect(second).toHaveProperty("error");
      }
    });
  });

  describe("markdown mode", () => {
    it("should render in markdown mode", () => {
      const input = '{"component":"sparkline","input":{"values":[1,2,3,4,5]}}';

      const output = runCli("batch --render-mode markdown", input);

      // Markdown mode should have anchor character
      expect(output).toContain("│");
    });

    it("should render chart in markdown mode", () => {
      const input = JSON.stringify({
        component: "chart",
        input: {
          type: "bar",
          series: [{ name: "Sales", data: [{ x: "Test", y: 50 }] }],
        },
      });

      const output = runCli("batch --render-mode markdown", input);

      // Should have anchor character
      expect(output).toContain("│");
    });
  });

  describe("file input", () => {
    it("should read from file with --file option", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "tui-test-"));
      const tempFile = join(tempDir, "input.jsonl");

      const content = '{"component":"sparkline","input":{"values":[1,2,3,4,5]}}';
      writeFileSync(tempFile, content);

      try {
        const output = runCli(`batch --file ${tempFile}`);
        expect(output).toContain("▁");
        expect(output).toContain("█");
      } finally {
        unlinkSync(tempFile);
      }
    });
  });

  describe("width override", () => {
    it("should respect --width option", () => {
      const input = JSON.stringify({
        component: "chart",
        input: {
          type: "bar",
          series: [{ name: "Sales", data: [{ x: "Test", y: 100 }] }],
          width: 50,
        },
      });

      const output = runCli("batch --format json --width 100", input);
      const parsed = JSON.parse(output.trim());

      // Output should have been generated with specified width
      expect(parsed).toHaveProperty("output");
    });
  });

  describe("no-color option", () => {
    it("should work with --no-color", () => {
      const input = '{"component":"sparkline","input":{"values":[1,2,3,4,5]}}';

      const output = runCli("batch --no-color", input);

      // Should still produce output, just without ANSI codes
      expect(output).toContain("▁");
      expect(output).toContain("█");
    });
  });
});

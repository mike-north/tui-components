import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const scriptPath = join(__dirname, "render-markdown-preview.ts");

/**
 * Helper to run the script with input
 */
function runScript(input: string, args: string[] = []): string {
  const tmpFile = join(tmpdir(), `test-input-${Date.now()}.txt`);
  writeFileSync(tmpFile, input);
  try {
    return execSync(
      `pnpm tsx ${scriptPath} --input ${tmpFile} ${args.join(" ")}`,
      {
        encoding: "utf-8",
      }
    );
  } finally {
    unlinkSync(tmpFile);
  }
}

/**
 * Helper to run the script with a file
 */
function runScriptWithFile(content: string): string {
  const tmpFile = join(tmpdir(), `test-${Date.now()}.txt`);
  writeFileSync(tmpFile, content);
  try {
    return execSync(`pnpm tsx ${scriptPath} --input ${tmpFile}`, {
      encoding: "utf-8",
    });
  } finally {
    unlinkSync(tmpFile);
  }
}

/**
 * Strip ANSI codes for testing (we're testing structure, not exact colors)
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

describe("render-markdown-preview", () => {
  describe("inline code", () => {
    it("should colorize backticked content", () => {
      const input = "Some `code` here";
      const output = runScript(input);

      // Output should contain the text (may have ANSI codes)
      expect(output).toContain("Some");
      expect(output).toContain("code");
      expect(output).toContain("here");

      // Stripped version should match input (backticks preserved in output)
      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
    });

    it("should handle multiple inline code segments", () => {
      const input = "Use `foo` and `bar` together";
      const output = runScript(input);

      expect(output).toContain("foo");
      expect(output).toContain("bar");

      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
    });

    it("should not colorize code with newlines", () => {
      const input = "This `has\nnewline` won't match";
      const output = runScript(input);

      // Should not match the backticked content (it has newline)
      // So output should preserve the backticks as-is
      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
      expect(output).toContain("`has");
      expect(output).toContain("newline`");
    });
  });

  describe("code blocks", () => {
    it("should colorize code blocks", () => {
      const input = "```\nconst x = 1;\n```";
      const output = runScript(input);

      expect(output).toContain("const x = 1;");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should colorize code blocks with language", () => {
      const input = "```typescript\nconst x: number = 1;\n```";
      const output = runScript(input);

      expect(output).toContain("typescript");
      expect(output).toContain("const x: number = 1;");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should handle multiline code blocks", () => {
      const input =
        "```javascript\nfunction hello() {\n  return 'world';\n}\n```";
      const output = runScript(input);

      expect(output).toContain("function hello()");
      expect(output).toContain("return 'world'");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should not interfere with inline code", () => {
      const input = "Use `foo` in:\n```\nconst foo = 1;\n```";
      const output = runScript(input);

      expect(output).toContain("foo");
      expect(output).toContain("const foo = 1;");
      expect(stripAnsi(output).trim()).toBe(input);
    });
  });

  describe("bold text", () => {
    it("should colorize bold text", () => {
      const input = "This is **bold** text";
      const output = runScript(input);

      expect(output).toContain("bold");

      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
    });

    it("should handle multiple bold segments", () => {
      const input = "**First** and **second** bold";
      const output = runScript(input);

      expect(output).toContain("First");
      expect(output).toContain("second");

      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
    });

    it("should not colorize bold with newlines", () => {
      const input = "**Has\nnewline** won't match";
      const output = runScript(input);

      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
      expect(output).toContain("**Has");
      expect(output).toContain("newline**");
    });
  });

  describe("headers", () => {
    it("should colorize h1 headers", () => {
      const input = "# Header 1";
      const output = runScript(input);

      expect(output).toContain("Header 1");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should colorize h2 headers", () => {
      const input = "## Header 2";
      const output = runScript(input);

      expect(output).toContain("Header 2");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should colorize all header levels", () => {
      const input = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
      const output = runScript(input);

      expect(output).toContain("H1");
      expect(output).toContain("H2");
      expect(output).toContain("H3");
      expect(stripAnsi(output).trim()).toBe(input);
    });
  });

  describe("lists", () => {
    it("should colorize unordered lists with dash", () => {
      const input = "- First item\n- Second item";
      const output = runScript(input);

      expect(output).toContain("First item");
      expect(output).toContain("Second item");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should colorize unordered lists with asterisk", () => {
      const input = "* First item\n* Second item";
      const output = runScript(input);

      expect(output).toContain("First item");
      expect(output).toContain("Second item");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should colorize unordered lists with plus", () => {
      const input = "+ First item\n+ Second item";
      const output = runScript(input);

      expect(output).toContain("First item");
      expect(output).toContain("Second item");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should colorize ordered lists", () => {
      const input = "1. First item\n2. Second item";
      const output = runScript(input);

      expect(output).toContain("First item");
      expect(output).toContain("Second item");
      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should handle indented lists", () => {
      const input = "- First\n  - Nested\n    - Deep nested";
      const output = runScript(input);

      expect(output).toContain("First");
      expect(output).toContain("Nested");
      expect(output).toContain("Deep nested");
      expect(stripAnsi(output).trim()).toBe(input);
    });
  });

  describe("complex markdown", () => {
    it("should handle mixed markdown elements", () => {
      const input = [
        "# Title",
        "",
        "Some **bold** text with `code`.",
        "",
        "## Section",
        "",
        "- Item with `inline code`",
        "- Item with **bold**",
        "",
        "```typescript",
        "const x = 1;",
        "```",
      ].join("\n");

      const output = runScript(input);

      expect(output).toContain("Title");
      expect(output).toContain("bold");
      expect(output).toContain("code");
      expect(output).toContain("Section");
      expect(output).toContain("const x = 1;");
      expect(stripAnsi(output).trim()).toBe(input);
    });
  });

  describe("file input", () => {
    it("should read from file with --input flag", () => {
      const input = "Some `code` here";
      const output = runScriptWithFile(input);

      expect(output).toContain("code");

      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
    });

    it("should handle complex content from file", () => {
      const input = "# Title\n\n**Bold** and `code`";
      const output = runScriptWithFile(input);

      expect(output).toContain("Title");
      expect(output).toContain("Bold");
      expect(output).toContain("code");

      const stripped = stripAnsi(output).trim();
      expect(stripped).toBe(input);
    });
  });

  describe("edge cases", () => {
    it("should handle empty input", () => {
      const input = "";
      const output = runScript(input);

      expect(stripAnsi(output).trim()).toBe("");
    });

    it("should handle plain text without markdown", () => {
      const input = "Just plain text";
      const output = runScript(input);

      expect(stripAnsi(output).trim()).toBe(input);
    });

    it("should handle text with only whitespace", () => {
      const input = "   \n\n   ";
      const output = runScript(input);

      expect(stripAnsi(output).trim()).toBe("");
    });

    it("should preserve multiple newlines", () => {
      const input = "Line 1\n\n\nLine 2";
      const output = runScript(input);

      expect(output).toContain("Line 1");
      expect(output).toContain("Line 2");
      // Should have multiple newlines preserved
      expect(output).toMatch(/Line 1\n\n/);
    });
  });

  describe("error handling", () => {
    it("should handle missing file gracefully", () => {
      const command = `pnpm tsx ${scriptPath} --input /nonexistent/file.txt 2>&1`;
      try {
        const output = execSync(command, { encoding: "utf-8" });
        expect(output).toContain("Error reading file");
      } catch (error) {
        // Command exits with error code
        const err = error as { stderr: Buffer; stdout: Buffer };
        const output = err.stdout.toString() + err.stderr.toString();
        expect(output).toContain("Error reading file");
      }
    });
  });

  describe("help", () => {
    it("should show help with --help flag", () => {
      const output = execSync(`pnpm tsx ${scriptPath} --help`, {
        encoding: "utf-8",
      });

      expect(output).toContain("Usage:");
      expect(output).toContain("Options:");
      expect(output).toContain("Examples:");
    });

    it("should show help with -h flag", () => {
      const output = execSync(`pnpm tsx ${scriptPath} -h`, {
        encoding: "utf-8",
      });

      expect(output).toContain("Usage:");
    });
  });
});

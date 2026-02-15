import { describe, it, expect } from "vitest";
import { simulateRendering } from "../src/simulator.js";
import {
  claudeCodeConfig,
  githubCopilotConfig,
  clineConfig,
  codexConfig,
} from "../src/configs/index.js";

describe("simulateRendering", () => {
  describe("Claude Code", () => {
    it("should strip ANSI codes in command context", () => {
      const input = "\x1b[31mError\x1b[0m";
      const result = simulateRendering(input, claudeCodeConfig, "command");

      expect(result.rendered).toBe("Error");
      expect(result.metadata.assistantId).toBe("claude-code");
      expect(result.metadata.context).toBe("command");
      expect(result.metadata.transformsApplied).toContain("stripAnsi");
    });

    it("should truncate command output to 3 lines", () => {
      const input = "line1\nline2\nline3\nline4\nline5";
      const result = simulateRendering(input, claudeCodeConfig, "command");

      expect(result.rendered).toBe("line1\nline2\nline3\n... (2 more lines)");
      expect(result.metadata.wasTruncated).toBe(true);
      expect(result.metadata.originalLineCount).toBe(5);
      expect(result.metadata.transformsApplied).toContain("truncateLines(3)");
    });

    it("should not truncate chat output", () => {
      const input = "line1\nline2\nline3\nline4\nline5";
      const result = simulateRendering(input, claudeCodeConfig, "chat");

      expect(result.rendered).toBe(input);
      expect(result.metadata.wasTruncated).toBe(false);
      expect(result.metadata.transformsApplied).not.toContain(
        expect.stringContaining("truncateLines")
      );
    });

    it("should not truncate when line count is within limit", () => {
      const input = "line1\nline2";
      const result = simulateRendering(input, claudeCodeConfig, "command");

      expect(result.rendered).toBe("line1\nline2");
      expect(result.metadata.wasTruncated).toBe(false);
    });
  });

  describe("GitHub Copilot", () => {
    it("should collapse newlines in command context", () => {
      const input = "line1\n\nline2\nline3";
      const result = simulateRendering(input, githubCopilotConfig, "command");

      expect(result.rendered).toBe("line1 line2 line3");
      expect(result.metadata.transformsApplied).toContain("collapseNewlines");
    });

    it("should strip ANSI and collapse newlines", () => {
      const input = "\x1b[31mRed\x1b[0m\n\n\x1b[32mGreen\x1b[0m";
      const result = simulateRendering(input, githubCopilotConfig, "command");

      expect(result.rendered).toBe("Red Green");
      expect(result.metadata.transformsApplied).toContain("stripAnsi");
      expect(result.metadata.transformsApplied).toContain("collapseNewlines");
    });

    it("should collapse newlines in chat context too", () => {
      const input = "a\nb\nc";
      const result = simulateRendering(input, githubCopilotConfig, "chat");

      expect(result.rendered).toBe("a b c");
    });
  });

  describe("Cline", () => {
    it("should strip backticks", () => {
      const input = "`code` example";
      const result = simulateRendering(input, clineConfig, "command");

      expect(result.rendered).toBe("code example");
      expect(result.metadata.transformsApplied).toContain("stripBackticks");
    });

    it("should strip ANSI and backticks", () => {
      const input = "\x1b[31m`error`\x1b[0m";
      const result = simulateRendering(input, clineConfig, "command");

      expect(result.rendered).toBe("error");
      expect(result.metadata.transformsApplied).toContain("stripAnsi");
      expect(result.metadata.transformsApplied).toContain("stripBackticks");
    });

    it("should not strip bold markers", () => {
      const input = "**bold** text";
      const result = simulateRendering(input, clineConfig, "command");

      expect(result.rendered).toBe("**bold** text");
      expect(result.metadata.transformsApplied).not.toContain("stripBoldMarkers");
    });
  });

  describe("Codex", () => {
    it("should preserve ANSI codes", () => {
      const input = "\x1b[31mRed\x1b[0m text";
      const result = simulateRendering(input, codexConfig, "command");

      expect(result.rendered).toBe(input);
      expect(result.metadata.transformsApplied).not.toContain("stripAnsi");
    });

    it("should preserve newlines", () => {
      const input = "line1\nline2\nline3";
      const result = simulateRendering(input, codexConfig, "command");

      expect(result.rendered).toBe(input);
      expect(result.metadata.transformsApplied).not.toContain("collapseNewlines");
    });
  });

  describe("additional transforms", () => {
    it("should apply additional transforms after built-in ones", () => {
      const input = "\x1b[31mRed\x1b[0m";
      const toUpper = (s: string) => s.toUpperCase();

      const result = simulateRendering(input, claudeCodeConfig, "command", {
        additionalTransforms: [toUpper],
      });

      expect(result.rendered).toBe("RED");
      expect(result.metadata.transformsApplied).toContain("stripAnsi");
      expect(result.metadata.transformsApplied).toContain("custom");
    });

    it("should apply multiple additional transforms", () => {
      const input = "test";
      const toUpper = (s: string) => s.toUpperCase();
      const addPrefix = (s: string) => `PREFIX: ${s}`;

      const result = simulateRendering(input, claudeCodeConfig, "chat", {
        additionalTransforms: [toUpper, addPrefix],
      });

      expect(result.rendered).toBe("PREFIX: TEST");
      expect(result.metadata.transformsApplied.filter((t) => t === "custom")).toHaveLength(2);
    });

    it("should work with no additional transforms", () => {
      const input = "\x1b[31mRed\x1b[0m";
      const result = simulateRendering(input, claudeCodeConfig, "command", {});

      expect(result.rendered).toBe("Red");
    });
  });

  describe("metadata", () => {
    it("should include correct assistant ID", () => {
      const result = simulateRendering("test", claudeCodeConfig, "command");
      expect(result.metadata.assistantId).toBe("claude-code");
    });

    it("should include correct context", () => {
      const result = simulateRendering("test", claudeCodeConfig, "chat");
      expect(result.metadata.context).toBe("chat");
    });

    it("should count original lines correctly", () => {
      const input = "line1\nline2\nline3";
      const result = simulateRendering(input, claudeCodeConfig, "command");
      expect(result.metadata.originalLineCount).toBe(3);
    });

    it("should track all applied transforms", () => {
      const input = "\x1b[31mRed\x1b[0m\nLine2\nLine3\nLine4";
      const result = simulateRendering(input, claudeCodeConfig, "command");

      expect(result.metadata.transformsApplied).toEqual([
        "stripAnsi",
        "truncateLines(3)",
      ]);
    });

    it("should indicate truncation correctly", () => {
      const shortInput = "line1\nline2";
      const longInput = "line1\nline2\nline3\nline4";

      const notTruncated = simulateRendering(
        shortInput,
        claudeCodeConfig,
        "command"
      );
      const truncated = simulateRendering(
        longInput,
        claudeCodeConfig,
        "command"
      );

      expect(notTruncated.metadata.wasTruncated).toBe(false);
      expect(truncated.metadata.wasTruncated).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = simulateRendering("", claudeCodeConfig, "command");

      expect(result.rendered).toBe("");
      expect(result.metadata.originalLineCount).toBe(1);
      expect(result.metadata.wasTruncated).toBe(false);
    });

    it("should handle single line input", () => {
      const result = simulateRendering("single line", claudeCodeConfig, "command");

      expect(result.rendered).toBe("single line");
      expect(result.metadata.originalLineCount).toBe(1);
    });

    it("should handle input with only ANSI codes", () => {
      const input = "\x1b[31m\x1b[0m";
      const result = simulateRendering(input, claudeCodeConfig, "command");

      expect(result.rendered).toBe("");
    });

    it("should handle complex mixed content", () => {
      const input =
        "\x1b[31m**Error**\x1b[0m\n`code`\nLine 3\nLine 4\nLine 5";
      const result = simulateRendering(input, claudeCodeConfig, "command");

      expect(result.rendered).toBe(
        "**Error**\n`code`\nLine 3\n... (2 more lines)"
      );
      expect(result.metadata.wasTruncated).toBe(true);
    });
  });
});
